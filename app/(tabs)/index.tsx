import React, { useState, useEffect } from 'react';
import { StyleSheet, TextInput, View, ScrollView, Image, useColorScheme, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import calculateScoreWithCategory from '@/components/NutriScore'; // Importing a function to calculate the nutrient score
import BarcodeModal from '@/components/foodmodal'; // Importing a modal component

// Defining the structure of a product
interface Product {
  product_name: string;
  image_url: string;
  code: string;
  nutrient_grade: string;
}

// Component for displaying each search result
const SearchResultCard: React.FC<{ product: Product; onPress: () => void }> = ({ product, onPress }) => {
  // State to hold the nutrient score of the product
  const [nutrientScore, setNutrientScore] = useState<string>('');

  // Function to calculate the nutrient score when the component mounts or when the product changes
  const calculateNutrientScore = async (product: Product) => {
    try {
      // Call the function to calculate the nutrient score
      const score = await calculateScoreWithCategory(product.code);
      // Set the nutrient score in the state
      setNutrientScore(score);
    } catch (error) {
      console.error('Error calculating nutrient score:', error);
      // Set the nutrient score to 'Unknown' in case of an error
      setNutrientScore('Unknown');
    }
  };

  // Effect to trigger the calculation of the nutrient score when the component mounts or when the product changes
  useEffect(() => {
    calculateNutrientScore(product);
  }, [product]);

  // Function to determine the color of the circle based on the nutrient score
  const getCircleColor = (nutrientScore: string): string => {
    switch (nutrientScore) {
      case 'Excellent':
        return '#5bb450'; // Green color for Excellent
      case 'Good':
        return '#ffd700'; // Yellow color for Good
      case 'Average':
        return '#ccc'; // Grey color for Average
      case 'Poor':
        return '#ff6347'; // Red color for Poor
      case 'Bad':
        return '#8b0000'; // Dark red color for Bad
      default:
        return '#ccc'; // Default to grey for unknown score
    }
  };

  // Return the UI for displaying a search result
  return (
    <TouchableOpacity onPress={onPress}>
      <View style={styles.card}>
        <View style={styles.cardContent}>
          <Image source={{ uri: product.image_url }} style={styles.productImage} />
          <View style={styles.infoContainer}>
            <Text style={styles.productTitle}>{product.product_name}</Text>
            <View style={styles.circleContainer}>
              <View style={[styles.circle, { backgroundColor: getCircleColor(nutrientScore) }]} />
              <Text style={styles.nutrientScoreText}>{nutrientScore.toUpperCase()}</Text>
            </View>
          </View>
          <Ionicons name="information-circle" size={24} color="grey" style={styles.infoIcon} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

// Component for the search screen
const SearchScreen = () => {
  // State to hold the search query, search results, selected product, modal visibility, and scanned data
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [scannedData, setScannedData] = useState<{ type: string; data: string } | null>(null);
  const colorScheme = useColorScheme(); // Hook to get the color scheme of the device

  // Function to handle the search query
  // Function to handle the search query
const handleSearch = async (text: string) => {
  const sanitizedText = encodeURIComponent(text.trim()); // Trim and encode the search query

  setSearchQuery(text);
  if (sanitizedText.length > 0) {
    try {
      // Fetching search results from an API based on the sanitized search query
      const response = await fetch(
        `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${sanitizedText}&page_size=10&json=true`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }
      const data = await response.json();
      
      // Mapping over the fetched products and fetching additional data for each product
      const fetchedResults = await Promise.all(data.products.map(async (product: Product) => {
        try {
          // Fetch additional details of each product
          const productResponse = await fetch(`https://world.openfoodfacts.org/api/v0/product/${product.code}.json`);
          if (!productResponse.ok) {
            throw new Error('Failed to fetch product details');
          }
          const productData = await productResponse.json();
          // Extracting nutrient grade from the additional data
          const nutrient_grade = productData.product.nutrition_grades || 'Unknown';
          // Returning the product with nutrient grade
          return { ...product, nutrient_grade };
        } catch (error) {
          console.error(`Error fetching additional details for product ${product.code}:`, error);
          return { ...product, nutrient_grade: 'Unknown' };
        }
      }));
      
      // Filtering search results based on the product name containing the search query
      const filteredResults = fetchedResults.filter((product: Product) =>
        product.product_name.toLowerCase().includes(text.toLowerCase())
      );
      
      // Updating the search results state
      setSearchResults(filteredResults);
    } catch (error) {
      console.error('Error fetching search results:', error);
      setSearchResults([]);
    }
  } else {
    setSearchResults([]);
  }
};

  // Function to handle opening the modal for a selected product
  const handleOpenModal = async (product: Product) => {
    setSelectedProduct(product);
    try {
      // Fetching additional details of the selected product from an API
      const response = await fetch(
        `https://world.openfoodfacts.org/api/v0/product/${product.code}.json`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch product details');
      }
      const data = await response.json();
      setScannedData({ type: 'barcode', data: product.code });
    } catch (error) {
      console.error('Error fetching product details:', error);
      setScannedData(null);
    }
    setModalVisible(true); // Setting the modal visibility to true
  };

  // Function to handle closing the modal
  const handleCloseModal = () => {
    setSelectedProduct(null);
    setModalVisible(false); // Setting the modal visibility to false
  };

  // Return the UI for the search screen
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Search</Text>
      <View style={[styles.searchBox, { backgroundColor: colorScheme === 'dark' ? '#333333' : 'white' }]}>
        <Ionicons name="search" size={20} color="grey" />
        <TextInput
          style={[styles.input, { color: colorScheme === 'dark' ? 'white' : 'black' }]}
          onChangeText={setSearchQuery}
          onSubmitEditing={() => handleSearch(searchQuery)} // Triggering search on submit
          value={searchQuery}
          placeholder="Search for any product"
        />
      </View>
      {searchResults.length > 0 && (
        <ScrollView style={styles.resultsContainer}>
          {searchResults.map((product, index) => (
            <SearchResultCard key={index} product={product} onPress={() => handleOpenModal(product)} />
          ))}
        </ScrollView>
      )}
      {selectedProduct && modalVisible && (
        <BarcodeModal 
          visible={modalVisible}
          scannedData={scannedData}
          onClose={handleCloseModal}
        />
      )}
    </View>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingTop: 30,
  },
  header: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#5bb450',
    padding: 10,
    paddingLeft: 20,
  },
  searchBox: {
    flexDirection: 'row',
    margin: 15,
    padding: 10,
    borderRadius: 25,
    backgroundColor: 'white',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    paddingHorizontal: 10,
    fontSize: 18,
  },
  resultsContainer: {
    marginTop: 20,
  },
  card: {
    padding: 10,
    marginVertical: 5,
    marginHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  productImage: {
    width: 100,
    height: 100,
    marginTop: 10,
    alignSelf: 'center',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#5bb450', 
  },
  cardContent: {
    flexDirection: 'row',
  },
  productInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  productTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
    paddingTop: 10,
  },
  nutrientScoreText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  infoIcon: {
    alignSelf: 'center',
    marginRight: 10,
  },
  circle: {
    width: 15,
    height: 15,
    borderRadius: 10,
  },
  infoContainer: {
    flex: 1,
    flexDirection: 'column',
    marginLeft: 10,
  },
  circleContainer: {
    paddingLeft: 10,
    paddingTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default SearchScreen;