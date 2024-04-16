import React, { useState, useEffect } from "react";
import { View, ScrollView, Text, Button, TouchableOpacity, StyleSheet, Modal, Image } from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  visible: boolean;
  scannedData: { type: string; data: string } | null;
  onClose: () => void;
}


function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

const AccordionItem = ({ title, content }: { title: string; content: string }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={styles.accordionContainer}>
      <TouchableOpacity style={styles.accordionHeader} onPress={() => setExpanded(!expanded)}>
        <View style={styles.sectionHeader}>
          <Text style={styles.accordionTitle}>{capitalize(title)} </Text>

        </View>
        <Ionicons name={expanded ? 'chevron-up-outline' : 'chevron-down-outline'} size={20} color="#276749" />
      </TouchableOpacity>
      {expanded && (
        <View style={styles.accordionContent}>
                    <Text style={styles.accordionServing}>{content}</Text>
          {/* Additional content if needed */}
        </View>
      )}
    </View>
  );
};

const IngredientsSection = ({ ingredients }: { ingredients: string }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={styles.accordionContainer}>
      <TouchableOpacity style={styles.accordionHeader} onPress={() => setExpanded(!expanded)}>
        <Text style={styles.accordionTitle}>Ingredients</Text>
        <Ionicons name={expanded ? 'chevron-up-outline' : 'chevron-down-outline'} size={20} color="#276749" />
      </TouchableOpacity>
      {expanded && (
        <ScrollView style={styles.accordionContent}>
          <Text style={styles.accordionServing}>{ingredients}</Text>
        </ScrollView>
      )}
    </View>
  );
};

 


const SectionHeader = ({ title }: { title: string }) => {
  return (
    <Text style={styles.sectionHeader}>{title}</Text>
  );
 };
 
export const getFavoritesList = async (): Promise<string[] | null> => {
  try {
    const favs = await AsyncStorage.getItem('favsList');
    if (favs) {
      return JSON.parse(favs);
    } else {
      return [];
    }
  } catch (error) {
    console.error('Error loading favorites list:', error);
    return null;
  }
};

const BarcodeModal: React.FC<Props> = ({ visible, scannedData, onClose }) => {
  const [productData, setProductData] = useState<{
    title: string;
    image: string;
    brand: string;
    ingredients: string;
    additives: string;
    nutrientData: Record<string, { serving: number; level: string }>;
  } | null>(null);

  const [category, setCategory] = useState<string>(''); // Declare category state variable
  const [isFavorite, setIsFavorite] = useState<boolean>(false); // State variable for favorite status
  const [favsList, setFavsList] = useState<string[]>([]); // State variable for favorites list
  const [positives, setPositives] = useState<string[]>([]);
  const [negatives, setNegatives] = useState<string[]>([]);

  useEffect(() => {
    if (scannedData) {
      fetchProductData(scannedData.data);
      // Load favorite status from AsyncStorage
      loadFavoriteStatus(scannedData.data);
    }
  }, [scannedData]);

  useEffect(() => {
    // Load favorites list from AsyncStorage
    loadFavoritesList();
  }, []);

  const loadFavoritesList = async () => {
  try {
    const favs = await AsyncStorage.getItem('favsList');
    if (favs) {
      const favsList = JSON.parse(favs);
      setFavsList(favsList);
      console.log('Favorites List:', favsList); // Log the favorites list
    }
  } catch (error) {
    console.error('Error loading favorites list:', error);
  }
};

  const saveFavoritesList = async (list: string[]) => {
    try {
      await AsyncStorage.setItem('favsList', JSON.stringify(list));
    } catch (error) {
      console.error('Error saving favorites list:', error);
    }
  };

  const loadFavoriteStatus = async (barcode: string) => {
    try {
      const favoriteStatus = await AsyncStorage.getItem(`favorite_${barcode}`);
      setIsFavorite(favoriteStatus === 'true');
    } catch (error) {
      console.error('Error loading favorite status:', error);
    }
  };
  
  const handleFavoriteToggle = async () => {
    const updatedFavsList = [...favsList];
    if (isFavorite) {
      // Remove barcode from favorites list
      const index = updatedFavsList.indexOf(scannedData?.data || '');
      if (index !== -1) {
        updatedFavsList.splice(index, 1);
        setFavsList(updatedFavsList);
        saveFavoritesList(updatedFavsList);
      }
    } else {
      // Add barcode to favorites list
      if (!updatedFavsList.includes(scannedData?.data || '')) {
        updatedFavsList.push(scannedData?.data || '');
        setFavsList(updatedFavsList);
        saveFavoritesList(updatedFavsList);
        
      }
      console.log('Favorites List:', updatedFavsList);
    }
    setIsFavorite(!isFavorite); // Toggle favorite status
    if (scannedData) {
      // Save favorite status to AsyncStorage
      try {
        await AsyncStorage.setItem(`favorite_${scannedData.data}`, (!isFavorite).toString());
      } catch (error) {
        console.error('Error saving favorite status:', error);
      }
    }
  };

  const fetchProductData = async (barcode: string) => {
    try {
      const response = await fetch(
        `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`
      );
      const data = await response.json();
      if (data.product) {
        const newPositives: string[] = [];
        const newNegatives: string[] = [];
 
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
        Object.entries(nutrientData).forEach(([nutrient, { level }]) => {
          // Check if the nutrient is 'proteins' and handle it separately
          if (nutrient === 'proteins') {
            switch (level) {
              case 'low':
                newNegatives.push(`${nutrient}`); // Consider low protein as negative
                break;
              case 'high':
                newPositives.push(`${nutrient}`); // Consider high protein as positive
                break;
              default:
                break; // Do nothing if the protein level is normal or unknown
            }
          } else {
            // Handle all other nutrients
            switch (level) {
              case 'low':
                newPositives.push(`${nutrient}`); // For other nutrients, low might be positive
                break;
              case 'high':
                newNegatives.push(`${nutrient}`); // For other nutrients, high might be negative
                break;
              default:
                break; // Do nothing if the level is normal or unknown
            }
          }
        });
      
     
        // Set state
        setPositives(newPositives);
        setNegatives(newNegatives);
 

        const score = calculateScore(nutrientData, additives);
        const catagory = categorizeScore(score);
        setCategory(catagory); // Set the category state variable

        setProductData({ title, image, brand, ingredients: ingredientNames, additives: additiveNames, nutrientData });
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
              <ScrollView>
              
         
          <View>
      
          <AccordionItem
          title="Ingredients"
            content={productData.ingredients}
            />
          </View>
   
          <SectionHeader title="Positives" />
           <View>
           {positives.map((positive, index) => (
                  <AccordionItem
                    key={`positive-${index}`}
                    title={positive}
                    content={positive.includes('energy-kcal') ?
                    `The FDA considers ${productData.nutrientData[positive].serving} cals per serving to be too high per set standards` :
                    `The FDA considers ${productData.nutrientData[positive].serving} grams per serving to be too high per set standards`}
                      />
                 
                ))}
                
                 
          </View>
 
              
        <SectionHeader title="Negatives" />
        <View>
        {negatives.map((negative, index) => (
                  <AccordionItem
                    key={`negative-${index}`}
                    title={negative}
                    content={negative.includes('energy-kcal') ?
               `The FDA considers ${productData.nutrientData[negative].serving} cals per serving to be too high per set standards` :
               `The FDA considers ${productData.nutrientData[negative].serving} grams per serving to be too high per set standards`}
                 />
                ))}

        </View>
        <View>
          <AccordionItem
          title="Additives"
            content={productData.additives}
            />
            
          </View>
         
      </ScrollView>
     
 
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
    minWidth: 350,
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
  sectionHeader: {
    fontWeight: 'bold',
    paddingVertical: 10,
    paddingHorizontal: 10,
    fontSize: 18,
    color: '#2e78b7', // blue for section headers
  },
  accordionContainer: {
    flex: 1,
    padding: 10,
   
  },
  accordionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 5, // reduced padding when closed
    borderBottomWidth: 1,
    borderColor: '#cccccc',
    backgroundColor: 'white',
  },
  accordionTitle: {
    fontWeight: 'bold',
    color: 'black',
    fontSize: 13, 
    minWidth: 250,
  },
  accordionContent: {
    padding: 15,
    backgroundColor: '#f0f0f0', // Light background for content
    borderBottomWidth: 0, // Removing the bottom border from the content
    
  },
  favoriteButton: {
    backgroundColor: "green",
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  favoriteButtonActive: {
    backgroundColor: "#ccc",
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
  accordionServing: {
    marginRight: 10, // ensures spacing between the text and icon
    color: 'black', // ensures the text is visible
  },
 });
 
 
 export default BarcodeModal;
 
 

