const optimizeImage = async (imageBlob, options = {}) => {
  const { 
    maxWidth = 1920,
    quality = 0.8,
    format = 'webp'
  } = options;

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      
      // Calcular dimensiones manteniendo proporción
      let width = img.width;
      let height = img.height;
      
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      // Convertir a blob con la calidad especificada
      canvas.toBlob(
        (blob) => resolve(blob),
        `image/${format}`,
        quality
      );
    };

    img.src = URL.createObjectURL(imageBlob);
  });
};

export { optimizeImage }; 