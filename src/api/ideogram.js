import axios from 'axios';

const generateImage = async (prompt) => {
  try {
    const response = await axios.post('https://api.ideogram.ai/generate', {
      image_request: {
        ...prompt,
        model: 'V_2',
        num_images: 1,
        magic_prompt_option: 'AUTO'
      }
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Api-Key': `${process.env.REACT_APP_IDEOGRAM_API_KEY}`
      }
    });
    
    const data = response.data; 
    
    if (data.data && data.data.length > 0) {
      return data.data;
    } else {
      throw new Error('No image data received from Ideogram API');
    }
  } catch (error) { 
    console.error('Error generating image:', error);
    throw error;
  }
};

const editImage = async (editData) => {
  try {
    const form = new FormData();
    
    // Convertir la URL de la imagen original a Blob
    const imageResponse = await fetch(editData.originalImage, {
      mode: 'cors',
      credentials: 'omit'
    });
    const imageBlob = await imageResponse.blob();
    
    // La máscara ya viene como Blob
    form.append('image_file', imageBlob);
    form.append('mask', editData.mask); // Ahora editData.mask es un Blob
    form.append('prompt', editData.prompt);
    form.append('model', 'V_2');
    form.append('magic_prompt_option', 'OFF');
    form.append('num_images', '1');

    const response = await fetch('https://api.ideogram.ai/edit', {
      method: 'POST',
      headers: {
        'Api-Key': process.env.REACT_APP_IDEOGRAM_API_KEY
      },
      body: form
    });

    if (!response.ok) {
      throw new Error('Failed to edit image');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error editing image:', error);
    throw error;
  }
};

const remixImage = async (imageUrl, prompt, aspectRatio = 'ASPECT_1_1', imageWeight = 50) => {
  try {
    const form = new FormData();
    
    // Convertir la URL de la imagen a Blob
    const imageResponse = await fetch(imageUrl, {
      mode: 'cors',
      credentials: 'omit'
    });
    const imageBlob = await imageResponse.blob();
    
    // Crear el objeto de configuración de la imagen
    const imageRequest = {
      prompt: prompt,
      aspect_ratio: aspectRatio,
      image_weight: imageWeight,
      magic_prompt_option: 'OFF',
      model: 'V_2'
    };

    // Añadir los parámetros al FormData
    form.append('image_request', JSON.stringify(imageRequest));
    form.append('image_file', imageBlob);

    const response = await fetch('https://api.ideogram.ai/remix', {
      method: 'POST',
      headers: {
        'Api-Key': process.env.REACT_APP_IDEOGRAM_API_KEY
      },
      body: form
    });

    if (!response.ok) {
      throw new Error('Failed to remix image');
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error remixing image:', error);
    throw error;
  }
};

export { generateImage, editImage, remixImage }; 