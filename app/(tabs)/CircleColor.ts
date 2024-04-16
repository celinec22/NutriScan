interface NutrientScoreColorMap {
    [key: string]: string;
  }
  
  const nutrientScoreColorMap: NutrientScoreColorMap = {
    Good: '#44ce1b',
    Average: '#bbdb44',
    Poor: '#f2a134',
    Bad: '#e51f1f',
  };
  
  export const getCircleColor = (nutrientScore: string): string => {
    return nutrientScoreColorMap[nutrientScore] || '#ccc'; // Default to grey for unknown score
  };