interface NutrientScoreColorMap {
    [key: string]: string;
  }
  
  const nutrientScoreColorMap: NutrientScoreColorMap = {
    Excellent: '#5bb450',
    Good: '#ffd700',
    Average: '#ccc',
    Poor: '#ff6347',
    Bad: '#8b0000',
  };
  
  export const getCircleColor = (nutrientScore: string): string => {
    return nutrientScoreColorMap[nutrientScore] || '#ccc'; // Default to grey for unknown score
  };