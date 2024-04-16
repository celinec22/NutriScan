const fetchProductData = async (barcode: string) => {
    try {
        const response = await fetch(
            `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`
        );
        const data = await response.json();
        return data.product || null;
    } catch (error) {
        console.error("Error fetching product data:", error);
        return null;
    }
};

const calculateNutrientLevel = (nutrient: string, value: number): string => {
    const nutrientThresholds: Record<string, { low: number; high: number }> = {
        "proteins": { low: 5, high: 20 },
        "sodium": { low: 0.1, high: 0.6 },
        "energy-kcal": { low: 50, high: 200 },
        "saturated-fat": { low: 1.5, high: 5 },
        "fat": { low: 3, high: 20 },
        "sugars": { low: 5, high: 20 },
    };

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
    try {
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
            return additive ? additive : { name: 'Unknown' };
        });

        return additiveDetails;
    } catch (error) {
        console.error('Error fetching additive details:', error);
        return [];
    }
};
const calculateScoreWithCategory = async (barcode: string): Promise<string> => {
    try {
        // Move the definition of nutrientThresholds to the top-level scope
        const nutrientThresholds: Record<string, { low: number; high: number }> = {
            "proteins": { low: 5, high: 20 },
            "sodium": { low: 0.1, high: 0.6 },
            "energy-kcal": { low: 50, high: 200 },
            "saturated-fat": { low: 1.5, high: 5 },
            "fat": { low: 3, high: 20 },
            "sugars": { low: 5, high: 20 },
        };

        const productData = await fetchProductData(barcode); // Await the result of fetchProductData
        if (!productData) return 'Unknown';

        const nutrientData: Record<string, { serving: number; level: string }> = {};
        const additives = productData.additives_tags || [];

        // Additive thresholds and calculation
        const additiveThresholds: string[] = ['e102', 'e110', 'e129', 'e951', 'e120', 'e122', 'e211', 'e220', 'e250', 'e621'];

        // Object containing scores for each additive
        const additiveScores: Record<string, number> = {
            'e102': -2,
            'e110': -2,
            'e129': -2,
            'e951': -2,
            'e120': -1,
            'e122': -1,
            'e211': -1,
            'e220': -1,
            'e250': -1,
            'e621': -1
        };

        let score = 0; // Initialize score variable

        // Iterate through each additive and calculate its score
        additives.forEach((additiveCode: string) => {
            const id = additiveCode.replace('en:', '');
            if (additiveThresholds.includes(id)) {
                score += additiveScores[id];
            }
        });

        Object.keys(nutrientThresholds).forEach(nutrient => {
            const nutrientValueGrams = (productData.nutriments[`${nutrient}_100g`] || "unknown");
            const nutrientValueServing = (productData.nutriments[`${nutrient}_serving`] || "unknown");

            if (nutrientValueGrams !== "unknown" || nutrientValueServing !== "unknown") {
                const level = calculateNutrientLevel(nutrient, nutrientValueGrams);
                nutrientData[nutrient] = { serving: nutrientValueServing, level };
            }
        });

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

        // Categorize the score
      
        if (score >= 3) {
            return 'Good';
        } else if (score >= 0) {
            return 'Average';
        } else if (score >= -3) {
            return 'Poor';
        } else {
            return 'Bad';
        }
    } catch (error) {
        console.error("Error calculating score:", error);
        return 'Error';
    }
};

export default calculateScoreWithCategory;

