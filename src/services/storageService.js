const STORAGE_KEY = 'banner_generations';

export const saveGeneration = (imageData) => {
  try {
    const generations = getGenerations();
    const newGeneration = {
      id: Date.now(),
      imageUrl: imageData.imageUrl,
      prompt: imageData.prompt,
      aspectRatio: imageData.aspectRatio,
      createdAt: imageData.createdAt || new Date().toISOString()
    };
    
    generations.unshift(newGeneration);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(generations));
    return newGeneration;
  } catch (error) {
    console.error('Error saving generation:', error);
    throw error;
  }
};

export const getGenerations = () => {
  try {
    const generations = localStorage.getItem(STORAGE_KEY);
    return generations ? JSON.parse(generations) : [];
  } catch (error) {
    console.error('Error getting generations:', error);
    return [];
  }
};

export const deleteGeneration = (id) => {
  try {
    const generations = getGenerations();
    const updatedGenerations = generations.filter(gen => gen.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedGenerations));
  } catch (error) {
    console.error('Error deleting generation:', error);
    throw error;
  }
}; 