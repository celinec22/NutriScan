import React, { useState, useEffect } from 'react';
import { StyleSheet, TextInput, View, ScrollView, Image, useColorScheme, TouchableOpacity, Text, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BarcodeModal from '@/components/foodmodal';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define an interface for the product object
interface Product {
  product_name: string;
  image_url: string;
  code: string; // A unique identifier for the product
}

// Component for rendering each search result card
const SearchResultCard: React.FC<{ product: Product; onPress: () => void }> = ({ product, onPress }) => {
  // Function to calculate the nutrient score
  const calculateNutrientScore = (product: Product): string => {
    return 'poor'; // Placeholder return value
  };

  const nutrientScore = calculateNutrientScore(product);
  const colorScheme = useColorScheme(); // Get the current color scheme

  // Function to determine circle color based on nutrient score
  const getCircleColor = (nutrientScore: string): string => {
    switch (nutrientScore) {
      case 'excellent':
        return '#5bb450'; // Green for excellent
      case 'good':
        return '#ffd700'; // Yellow for good
      case 'poor':
        return '#ff6347'; // Red for poor
      case 'bad':
        return '#8b0000'; // Dark red for bad
      default:
        return '#ccc'; // Default color
    }
  };

  return (
    <TouchableOpacity onPress={onPress}>
      <View style={[styles.card, { 
        backgroundColor: colorScheme === 'dark' ? '#333333' : 'white',
        borderColor: colorScheme === 'dark' ? '#555555' : '#ccc', // Adjust border color based on color scheme
      }]}>
        <View style={styles.cardContent}>
          {/* Image */}
          <Image source={{ uri: product.image_url }} style={styles.productImage} />
          {/* Info Container */}
          <View style={styles.infoContainer}>
            {/* Title */}
            <Text style={[styles.productTitle, { color: colorScheme === 'dark' ? 'white' : 'black' }]}>{product.product_name}</Text>
            {/* Circle and Nutrient Score Container */}
            <View style={styles.circleContainer}>
              <View style={[styles.circle, { backgroundColor: getCircleColor(nutrientScore) }]} />
              <Text style={[styles.nutrientScoreText, { color: colorScheme === 'dark' ? 'grey' : 'black' }]}>{nutrientScore.toUpperCase()}</Text>
            </View>
          </View>
          {/* Icon */}
          <Ionicons name="information-circle" size={24} color="grey" style={styles.infoIcon} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null); // State to track selected product
  const [modalVisible, setModalVisible] = useState<boolean>(false); // State to control the visibility of the modal
  const [scannedData, setScannedData] = useState<{ type: string; data: string } | null>(null); // State to hold the scanned data
  const colorScheme = useColorScheme(); // Get the current color scheme

  // Function to handle search
  const handleSearch = async (text: string) => {
    setSearchQuery(text);
    if (text.length > 0) {
      try {
        // Fetch search results from the Open Food Facts API
        const response = await fetch(
          `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${text}&page_size=10&json=true`
        );
        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }
        const data = await response.json();
        setSearchResults(data.products); // Update search results state
      } catch (error) {
        console.error('Error fetching search results:', error);
        setSearchResults([]); // Reset search results state in case of error
      }
    } else {
      setSearchResults([]); // Reset search results state if search query is empty
    }
  };

  // Function to handle opening the modal
  const handleOpenModal = async (product: Product) => {
    setSelectedProduct(product); // Set selected product
    try {
      // Fetch detailed product information from the Open Food Facts API using the product code
      const response = await fetch(
        `https://world.openfoodfacts.org/api/v0/product/${product.code}.json`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch product details');
      }
      const data = await response.json();
      setScannedData({ type: 'barcode', data: product.code }); // Set scanned data to barcode
    } catch (error) {
      console.error('Error fetching product details:', error);
      setScannedData(null); // Reset scanned data if there's an error
    }
    setModalVisible(true); // Open the modal
  };
  
  // Function to save favorites to AsyncStorage
  const saveFavorites = async (newFavorites: Product[]) => {
    try {
      await AsyncStorage.setItem('userFavorites', JSON.stringify(newFavorites));
    } catch (error) {
      console.error('Error saving favorites:', error);
      }
    };
  
    // Function to handle adding a favorite
    const handleAddFavorite = async (product: Product) => {
      if (!product) {
        Alert.alert('Error', 'No product selected.');
        return;
      }
  
      // Load current favorites from AsyncStorage
      let currentFavorites: Product[] = [];
      try {
        const storedFavorites = await AsyncStorage.getItem('userFavorites');
        if (storedFavorites !== null) {
          currentFavorites = JSON.parse(storedFavorites);
        }
      } catch (error) {
        console.error('Error loading favorites:', error);
      }
  
      // Check if the scanned food item is already a favorite
      if (currentFavorites.some((fav) => fav.code === product.code)) {
        Alert.alert('Info', 'This food item is already in favorites.');
        return;
      }
  
      // Add the scanned food item to favorites and save to AsyncStorage
      const newFavorites = [...currentFavorites, product];
      await saveFavorites(newFavorites);
      Alert.alert('Success', `${product.product_name} added to favorites.`);
    };
  
  
    // Function to simulate scanning a food item
    const scanFoodItem = () => {
      // For demonstration purposes, return a hardcoded product
      return {
        product_name: 'Scanned Food Item',
        image_url: 'https://via.placeholder.com/150', // Placeholder image URL
        code: '1234567890', // Placeholder code
      };
    };
  // Function to close the modal
  const handleCloseModal = () => {
    setSelectedProduct(null);
    setModalVisible(false); // Close the modal
  };

  return (
    <View style={styles.container}>
      {/* Search header */}
      <Text style={styles.header}>Search</Text>
      {/* Search input */}
      <View style={[styles.searchBox, {backgroundColor: colorScheme === 'dark' ? '#333333' : 'white'}]}>
        <Ionicons name="search" size={20} color="grey" />
        <TextInput
          style={[styles.input, { color: colorScheme === 'dark' ? 'white' : 'black' }]}
          onChangeText={handleSearch}
          value={searchQuery}
          placeholder="Search for any product"
        />
      </View>
      {/* Render search results */}
      {searchResults.length > 0 && (
        <ScrollView style={styles.resultsContainer}>
          {searchResults.map((product, index) => (
            <SearchResultCard key={index} product={product} onPress={() => handleOpenModal(product)} />
          ))}
        </ScrollView>
      )}
      {/* Render barcode modal if a product is selected */}
      {selectedProduct && modalVisible && (
        <BarcodeModal 
          visible={modalVisible}
          scannedData={scannedData}
          onClose={handleCloseModal}
        />
      )}
    </View>
  );
}

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
