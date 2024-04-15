import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, Text, TouchableOpacity, Image, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getFavoritesList } from '@/components/foodmodal'; // Import the getFavoritesList function
import calculateScoreWithCategory from '@/components/NutriScore'; // Import the function to calculate the nutrient score

// Updated Product interface to include a nutrient_grade property
interface Product {
  product_name: string;
  image_url: string;
  code: string;
  nutrient_grade: string;
}

// Component for displaying each favorite product
const ProductInterface: React.FC<{ product: Product; nutrientScore: string; onPress: () => void }> = ({ product, nutrientScore, onPress }) => {
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

  // Return the UI for displaying a favorite product
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

const FavoritesScreen = () => {
  const [favoriteProducts, setFavoriteProducts] = useState<Product[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadFavorites(); // Load favorites when the component mounts
  }, []);

  const loadFavorites = async () => {
    try {
      setRefreshing(true); // Set refreshing state to true
      const favorites = await getFavoritesList();
      if (favorites) {
        const products: Product[] = [];
        // Iterate over each barcode in the favorites list
        for (const barcode of favorites) {
          // Fetch product details from Open Food Facts API
          try {
            const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
            if (!response.ok) {
              throw new Error('Failed to fetch product details');
            }
            const productData = await response.json();
            // Extract product details from API response
            const product_name = productData.product.product_name || 'Unknown';
            const image_url = productData.product.image_url || ''; // Image URL from API
            const nutrient_grade = productData.product.nutrition_grades || 'Unknown';
            // Create Product object and add it to the products array
            products.push({
              product_name,
              image_url,
              code: barcode,
              nutrient_grade,
            });
          } catch (error) {
            console.error(`Error fetching product details for barcode ${barcode}:`, error);
            // If error occurs, add a placeholder product with the barcode
            products.push({
              product_name: `Product ${barcode}`,
              image_url: '',
              code: barcode,
              nutrient_grade: 'Unknown',
            });
          }
        }
        // Set the state with fetched products
        setFavoriteProducts(products);
      } else {
        console.log('Failed to load favorites list');
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setRefreshing(false); // Set refreshing state to false
    }
  };

  const handleOpenModal = (product: Product) => {
    // Open modal for the selected product
    console.log('Open modal for product:', product);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Favorites</Text>
      <ScrollView
        style={styles.resultsContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadFavorites} />}
      >
        {favoriteProducts.map((product, index) => (
          <ProductInterface
            key={index}
            product={product}
            nutrientScore={product.nutrient_grade}
            onPress={() => handleOpenModal(product)}
          />
        ))}
      </ScrollView>
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

export default FavoritesScreen;
