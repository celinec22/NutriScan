
import React, { useState, useEffect } from "react";
import { View, Text, Button, StyleSheet, Modal, Image } from "react-native";

interface Props {
  visible: boolean;
  scannedData: { type: string; data: string } | null;
  onClose: () => void;
}

const BarcodeModal: React.FC<Props> = ({ visible, scannedData, onClose }) => {
  const [productData, setProductData] = useState<{
    title: string;
    image: string;
    ingredients: string;
    additives: any[];
    nutrientData: Record<string, { serving: number; level: string }>;
 
  } | null>(null)

  useEffect(() => {
    if (scannedData) {
      fetchProductData(scannedData.data);
    }
  }, [scannedData]);

  const fetchProductData = async (barcode: string) => {
    try {
      const response = await fetch(
        `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`
      );
      const data = await response.json();
      if (data.product) {
        const title = data.product.product_name || "Product Name Not Available";
        const image = data.product.image_url || "";
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
       
        console.log("Product Title:", title);
        console.log("Ingredients:", ingredientNames);
        console.log("Additive Names:", additiveNames);
        console.log("Nutrient Data:", nutrientData);

    
        const score = calculateScore(nutrientData, additives)
        const catagory= categorizeScore(score)
        
        console.log("Score is:" ,score)
        console.log("catagory:" ,catagory)

       
        setProductData({ title, image, ingredients: ingredientNames, additives: additiveDetails, nutrientData });


      } else {
        setProductData(null);
      }
    } catch (error) {
      console.error("Error fetching product data:", error);
      setProductData(null);
    }
  };

  //Sets the threshold for what is considers "high" and "low" per 100g.
  const nutrientThresholds: Record<string, { low: number; high: number }> = {
    "proteins": { low: 5, high: 20 },
    "sodium": { low: 0.1, high: 0.6 }, 
    "energy-kcal": { low: 50, high: 200 },
    "saturated-fat": { low: 1.5, high: 5 },
    "fat" :{ low: 3, high:20},
    "sugars" :{ low: 5, high:20},
  };

  //Calculates where it falls on the scale
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
    // Check if additiveCodes is undefined or empty
      try {
        // Check if additiveCodes is undefined or not an array
        if (containsAdditives==false) {
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




  // Iterate through each nutrient and apply logic based on its level
  Object.entries(nutrientData).forEach(([key, nutrient]) => {
    switch (key) {
      case "proteins":  // Handling proteins specifically
        switch (nutrient.level) {
          case 'low':
            score -= 1;  // Low protein is negative
            break;
          case 'high':
            score += 2;  // High protein is good, more points
            break;
          default:
            break;  // Normal protein doesn't change the score
        }
        break;
      case "sugars":  // Handling sugars
        switch (nutrient.level) {
          case 'low':
            score += 1;  // Low sugar is positive
            break;
          case 'high':
            score -= 2;  // High sugar is worse, subtract more points
            break;
          default:
            break;
        }
        break;
      case "sodium":  // Handling sodium
        switch (nutrient.level) {
          case 'low':
            score += 1;  // Low sodium is positive
            break;
          case 'high':
            score -= 2;  // High sodium is negative
            break;
          default:
            break;
        }
        break;
      case "saturated-fat":  // Handling saturated fat
        switch (nutrient.level) {
          case 'low':
            score += 1;  // Low saturated fat is positive
            break;
          case 'high':
            score -= 2;  // High saturated fat is negative
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
              <Text style={styles.productTitle}>{productData.title}</Text>
              {productData.image ? (
                <Image source={{ uri: productData.image }} style={styles.productImage} />
              ) : (
                <Text>No Image Available</Text>
              )}
            </>
          ) : (
            <Text>Loading...</Text>
          )}
          <Button title="Close Modal" onPress={onClose} />
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
    minHeight: 700, // Set a minimum height for the modal content
  },
  productTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  productImage: {
    width: 200,
    height: 200,
    marginBottom: 10,
  },
});

export default BarcodeModal;