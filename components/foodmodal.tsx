import React, { useState, useEffect } from "react";
import { View, ScrollView, Text, Button, TouchableOpacity, StyleSheet, Modal, Image } from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Props {
  visible: boolean;
  scannedData: { type: string; data: string } | null;
  onClose: () => void;
}

const BarcodeModal: React.FC<Props> = ({ visible, scannedData, onClose }) => {
  const [productData, setProductData] = useState<{
    title: string;
    image: string;
    brand: string;
    ingredients: string;
    additives: any[];
    nutrientData: Record<string, { serving: number; level: string }>;
  } | null>(null);

  const [category, setCategory] = useState<string>(''); // Declare category state variable
  const [isFavorite, setIsFavorite] = useState<boolean>(false); // State variable for favorite status

  useEffect(() => {
    if (scannedData) {
      fetchProductData(scannedData.data);
    }
  }, [scannedData]);

  const handleFavoriteToggle = () => {
    setIsFavorite(!isFavorite); // Toggle favorite status
  };

  const fetchProductData = async (barcode: string) => {
    try {
      const response = await fetch(
        `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`
      );
      const data = await response.json();
      if (data.product) {
        const title = data.product.product_name || "Product Name Not Available";
        const image = data.product.image_url || "";
        const brand = data.product.brand_owner || "Brand Not Available";
        const ingredients = data.product.ingredients || [];
        const additives = data.product.additives_tags || [];
        const nutrientData: Record<string, { serving: number; level: string }> = {};

        const additiveDetails = await fetchAdditiveDetails(additives);

        const ingredientNames = ingredients.map((ingredient: any) => ingredient.text).join(", ");
        const additiveNames = additiveDetails.map((additive: any) => additive.name).join(", ");

        Object.keys(nutrientThresholds).forEach(nutrient => {
          const nutrientValueGrams = (data.product.nutriments[`${nutrient}_100g`] || "unknown")
          const nutrientValueServing = (data.product.nutriments[`${nutrient}_serving`] || "unknown")
          
          if (nutrientValueGrams !== "unknown" || nutrientValueServing !== "unknown") {
            const level = calculateNutrientLevel(nutrient, nutrientValueGrams);
            nutrientData[nutrient] = { serving: nutrientValueServing, level };
          }
        });

        const score = calculateScore(nutrientData, additives);
        const catagory = categorizeScore(score);
        setCategory(catagory); // Set the category state variable

        setProductData({ title, image, brand, ingredients: ingredientNames, additives: additiveDetails, nutrientData });
      } else {
        setProductData(null);
      }
    } catch (error) {
      console.error("Error fetching product data:", error);
      setProductData(null);
    }
  };

  const nutrientThresholds: Record<string, { low: number; high: number }> = {
    "proteins": { low: 5, high: 20 },
    "sodium": { low: 0.1, high: 0.6 }, 
    "energy-kcal": { low: 50, high: 200 },
    "saturated-fat": { low: 1.5, high: 5 },
    "fat" :{ low: 3, high:20},
    "sugars" :{ low: 5, high:20},
  };

  const calculateNutrientLevel = (nutrient: string, value: number): string => {
    const thresholds = nutrientThresholds[nutrient];
    if (!thresholds) {
      return "unknown";
    } 

    if (value < thresholds.low) {
      return "low";
    } else if (value > thresholds.high) {
      return "high";
    } else {
      return "normal";
    }
  };

  const fetchAdditiveDetails = async (additiveCodes: string[] = []) => {
    const containsAdditives: boolean = additiveCodes.length > 0;
    try {
      if (!containsAdditives) {
        return [];
      }

      const response = await fetch('http://world.openfoodfacts.org/additives.json');
      const data = await response.json();

      const additiveDetailsMap: { [key: string]: any } = {};
      data.tags.forEach((additive: any) => {
        additiveDetailsMap[additive.id] = {
          name: additive.name,
        };
      });

      const additiveDetails = additiveCodes.map((code) => {
        const additive = additiveDetailsMap[code];
        if (additive) {
          return additive;
        } else {
          return { name: 'Unknown'};
        }
      });

      return additiveDetails;
    } catch (error) {
      console.error('Error fetching additive details:', error);
      return [];
    }
  };

  const calculateScore = (nutrientData: Record<string, { serving: number; level: string }>, additives: any[]): number => {
    let score = 0;

    additives.forEach(additiveCode => {
      const id = additiveCode.replace('en:', '');  
      switch (id) {
        case 'e102': // Tartrazine
        case 'e110': // Sunset Yellow FCF
        case 'e129': // Allura Red AC
        case 'e951': // Aspartame
          score -= 2;
          break;
        case 'e120': // Carmine
        case 'e122': // Azorubine
        case 'e211': // Sodium benzoate
        case 'e220': // Sulfur dioxide
        case 'e250': // Sodium nitrite
        case 'e621': // Monosodium glutamate
          score -= 1;
          break;
        default:
          break;  // Unknown or benign additives don't change the score
      }
    });

    Object.entries(nutrientData).forEach(([key, nutrient]) => {
      switch (key) {
        case "proteins":  // Handling proteins specifically
          switch (nutrient.level) {
            case 'low':
              score -= 1;
              break;
            case 'high':
              score += 2;
              break;
            default:
              break;
          }
          break;
        case "sugars":  // Handling sugars
          switch (nutrient.level) {
            case 'low':
              score += 1;
              break;
            case 'high':
              score -= 2;
              break;
            default:
              break;
          }
          break;
        case "sodium":  // Handling sodium
          switch (nutrient.level) {
            case 'low':
              score += 1;
              break;
            case 'high':
              score -= 2;
              break;
            default:
              break;
          }
          break;
        case "saturated-fat":  // Handling saturated fat
          switch (nutrient.level) {
            case 'low':
              score += 1;
              break;
            case 'high':
              score -= 2;
              break;
            default:
              break;
          }
          break;
        case "energy-kcal":  
          switch (nutrient.level) {
            case 'low':
              score += 1;
              break;
            case 'high':
              score -= 1;
            default:
              break;
          }
          break;
        default:
          break;
      }
    });

    return score;
  };

  const categorizeScore = (score: number): string => {
    if (score >= 10) {
      return 'Excellent';
    } else if (score >= 5) {
      return 'Good';
    } else if (score >= 0) {
      return 'Average';
    } else if (score >= -5) {
      return 'Poor';
    } else {
      return 'Bad';
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          {productData ? (
            <>
              {/* Top Half Container */}
              <View style={styles.topHalfContainer}>
                {/* Product Title */}
                <Text style={styles.productTitle}>{productData.title}</Text>
                {/* Brand Name */}
                <Text style={styles.brandName}>{productData.brand}</Text>
                {/* Product Image */}
                {productData.image ? (
                  <Image source={{ uri: productData.image }} style={styles.productImage} />
                ) : (
                  <Text>No Image Available</Text>
                )}
                {/* Category Text */}
                <Text style={styles.categoryText}>Category: {category}</Text>
              </View>
              <ScrollView>
                {/* Positives Text */}
                <Text style={styles.positivesText}>Positives</Text>
                {/* Positives Container */}
                <View style={styles.positivesContainer}></View>

                {/* Negatives Text */}
                <Text style={styles.negativesText}>Negatives</Text>
                {/* Negatives Container */}
                <View style={styles.negativesContainer}></View>
              </ScrollView>
            </>
          ) : (
            <Text>Loading...</Text>
          )}
          {/* Favorite Button */}
          <TouchableOpacity
            style={[styles.favoriteButton, isFavorite ? styles.favoriteButtonActive : null]}
            onPress={handleFavoriteToggle}
          >
            <Text style={styles.favoriteButtonText}>{isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}</Text>
          </TouchableOpacity>
          {/* Close Modal Button */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Close Modal</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    alignItems: "center",
    minHeight: 700,
  },
  topHalfContainer: {
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    paddingBottom: 10,
  },
  productTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  brandName: {
    fontSize: 12,
    marginBottom: 10,
  },
  productImage: {
    width: 150,
    height: 150,
    marginBottom: 10,
    borderWidth: 2, 
    borderColor: "green", 
    borderRadius: 10, 
  },
  categoryText: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },
  positivesText: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 10,
  },
  positivesContainer: {
    borderWidth: 1,
    borderColor: "green",
    padding: 10,
    minHeight: 100,
    minWidth: 300,
    marginBottom: 20,
  },
  negativesText: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 10,
    marginBottom: 10,
  },
  negativesContainer: {
    borderWidth: 1,
    borderColor: "red",
    padding: 10,
    minHeight: 100,
    minWidth: 300,
    marginBottom: 20,
  },
  favoriteButton: {
    backgroundColor: "green",
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  favoriteButtonActive: {
    backgroundColor: "#ccc", // Change the color when active
  },
  favoriteButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  closeButton: {
    backgroundColor: "#ccc",
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  closeButtonText: {
    color: "white",
    fontWeight: "bold",
  },
});

export default BarcodeModal;
