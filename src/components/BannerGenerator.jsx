import { useState } from 'react';
import { 
  Box, 
  TextField, 
  Button, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem,
  Grid
} from '@mui/material';
import ImageUploader from './ImageUploader';
import GeneratedImages from './GeneratedImages';

const ASPECT_RATIOS = {
  'ASPECT_1_1': '1:1',
  'ASPECT_16_9': '16:9',
  'ASPECT_10_16': '10:16',
};

function BannerGenerator() {
  const [formData, setFormData] = useState({
    prompt: '',
    negativePrompt: '',
    aspectRatio: 'ASPECT_1_1',
    numImages: 1,
    colorPalette: '',
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState([]);
  const [uploadedAssets, setUploadedAssets] = useState([]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('YOUR_API_ENDPOINT', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image_request: {
            prompt: formData.prompt,
            aspect_ratio: formData.aspectRatio,
            model: 'V_2',
            num_images: formData.numImages,
            magic_prompt_option: 'AUTO'
          }
        })
      });
      
      const data = await response.json();
      setGeneratedImages(prev => [...prev, ...data.data]);
    } catch (error) {
      console.error('Error generating images:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Box>
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Prompt"
            value={formData.prompt}
            onChange={(e) => setFormData({...formData, prompt: e.target.value})}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Aspect Ratio</InputLabel>
            <Select
              value={formData.aspectRatio}
              onChange={(e) => setFormData({...formData, aspectRatio: e.target.value})}
            >
              {Object.entries(ASPECT_RATIOS).map(([key, value]) => (
                <MenuItem key={key} value={key}>{value}</MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <TextField
            fullWidth
            label="Negative Prompt"
            value={formData.negativePrompt}
            onChange={(e) => setFormData({...formData, negativePrompt: e.target.value})}
            sx={{ mb: 2 }}
          />
          
          <TextField
            fullWidth
            label="Color Palette"
            value={formData.colorPalette}
            onChange={(e) => setFormData({...formData, colorPalette: e.target.value})}
            sx={{ mb: 2 }}
          />
        </Grid>
        
        <Grid item xs={12}>
          <ImageUploader onUpload={setUploadedAssets} />
        </Grid>
        
        <Grid item xs={12}>
          <Button 
            variant="contained" 
            onClick={handleGenerate}
            disabled={isGenerating}
            fullWidth
          >
            {isGenerating ? 'Generating...' : 'Generate'}
          </Button>
        </Grid>
        
        <Grid item xs={12}>
          <GeneratedImages 
            images={generatedImages} 
            isLoading={isGenerating} 
          />
        </Grid>
      </Grid>
    </Box>
  );
}

export default BannerGenerator; 