import React, { useState } from 'react';
import { StyleSheet, TextInput, View, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from 'react-native';

// Define an interface for the product object
interface Product {
  product_name: string;
  image_url: string; // Add the image URL property
  // Add more properties if needed
}

// Card Component to display each search result
const SearchResultCard: React.FC<{ product: Product }> = ({ product }) => (
  <View style={styles.card}>
    <View style={styles.cardContent}>
      <Image source={{ uri: product.image_url }} style={styles.productImage} />
      <View style={styles.productInfo}>
        <Text style={styles.productTitle}>{product.product_name}</Text>
        {/* Add more product information here */}
      </View>
    </View>
  </View>
);


export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);

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
      <View style={styles.searchBox}>
        <Ionicons name="search" size={20} color="grey" />
        <TextInput
          style={styles.input}
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
    backgroundColor: 'white',
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
  },

  cardContent: {
    flexDirection: 'row',
  },
  productInfo: {
    flex: 1,
    marginLeft: 10,
    justifyContent: 'center',
  },
  productTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});