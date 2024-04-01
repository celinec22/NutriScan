import React, { useState } from 'react';
import { StyleSheet, TextInput, View, ScrollView, Image, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from 'react-native';

// Define an interface for the product object
interface Product {
  product_name: string;
  image_url: string; // Add the image URL property
  // Add more properties if needed
}

const SearchResultCard: React.FC<{ product: Product }> = ({ product }) => {
  // Function to calculate the nutrient score
  const calculateNutrientScore = (product: Product): string => {
    // Calculate the nutrient score based on product properties
    // Return a string representing the score ('good', 'excellent', 'bad', 'poor')
    // Example calculation logic:
    // If the product has low sugar, low sodium, and high fiber, return 'excellent'
    // If the product has moderate sugar, moderate sodium, and some fiber, return 'good'
    // If the product has high sugar, high sodium, and low fiber, return 'bad'
    // If the product has very high sugar, very high sodium, and no fiber, return 'poor'
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
  );
};

export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const colorScheme = useColorScheme(); // Get the current color scheme

  // Function to handle search
  const handleSearch = async (text: string) => {
    setSearchQuery(text);
    if (text.length > 0) {
      try {
        const response = await fetch(
          `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${text}&page_size=10&json=true`
        );
        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }
        const data = await response.json();
        setSearchResults(data.products);
      } catch (error) {
        console.error('Error fetching search results:', error);
        setSearchResults([]);
      }
    } else {
      setSearchResults([]);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Search</Text>
      <View style={[styles.searchBox, {backgroundColor: colorScheme === 'dark' ? '#333333' : 'white'}]}>
        <Ionicons name="search" size={20} color="grey" />
        <TextInput
          style={[styles.input, { color: colorScheme === 'dark' ? 'white' : 'black' }]}
          onChangeText={handleSearch}
          value={searchQuery}
          placeholder="Search for any product"
        />
      </View>
      {searchResults.length > 0 && (
        <ScrollView style={styles.resultsContainer}>
          {searchResults.map((product, index) => (
            <SearchResultCard key={index} product={product} />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

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
