import React, { useState, useEffect } from 'react';
import { generateImage } from '../api/ideogram';
import { saveGeneration, getGenerations, deleteGeneration } from '../services/storageService';
import { 
  Box, 
  TextField, 
  Button, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem,
  Grid,
  Typography,
  Skeleton
} from '@mui/material';
import './BannerGenerator.css';
import ImageEditor from './ImageEditor';

const ASPECT_RATIOS = {
  'ASPECT_1_1': '1:1',
  'ASPECT_16_9': '16:9',
  'ASPECT_10_16': '10:16',
};

const handleDownload = (imageUrl) => {
  const link = document.createElement('a');
  link.href = imageUrl;
  link.style.display = 'none';
  link.target = '_blank';
  link.download = 'generated_image.png';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const BannerGenerator = () => {
  const [prompt, setPrompt] = useState('');
  const [error, setError] = useState(null);
  const [generations, setGenerations] = useState([]);
  const [formData, setFormData] = useState({
    negativePrompt: '',
    aspectRatio: 'ASPECT_1_1',
    numImages: 1,
    colorPalette: '',
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [editingImage, setEditingImage] = useState(null);

  useEffect(() => {
    setGenerations(getGenerations());
  }, []);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const data = await generateImage({
        prompt: prompt,
        aspect_ratio: formData.aspectRatio
      });
      
      
      if (data.data && data.data.length > 0) {
        const generation = {
          imageUrl: data.data[0].url,
          prompt: prompt,
          aspectRatio: formData.aspectRatio,
          createdAt: new Date().toISOString()
        };
        
        const savedGeneration = saveGeneration(generation);
        setGenerations(prev => [savedGeneration, ...prev]);
      }
      
    } catch (error) {
      console.error('Error generating images:', error);
      setError('Error generating images. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDelete = (id) => {
    try {
      deleteGeneration(id);
      setGenerations(prev => prev.filter(gen => gen.id !== id));
    } catch (err) {
      console.error('Error deleting generation:', err);
    }
  };

  const handleEditImage = async (editData) => {
    setIsGenerating(true);
    try {
      const generation = {
        imageUrl: editData.imageUrl,
        prompt: `Edit: ${editData.prompt}`,
        aspectRatio: editingImage.aspectRatio,
        createdAt: new Date().toISOString()
      };
      
      const savedGeneration = saveGeneration(generation);
      setGenerations(prev => [savedGeneration, ...prev]);
    } catch (error) {
      console.error('Error editing image:', error);
      setError('Error editing image. Please try again.');
    } finally {
      setIsGenerating(false);
      setEditingImage(null);
    }
  };

  const renderLatestGeneration = () => {
    const latest = generations[0];
    if (!latest) return null;

    return (
      <div className="latest-generation">
        <img src={latest.imageUrl} alt={latest.prompt} />
        <div className="latest-generation-content">
          <div className="latest-generation-header">
            <h3 className="latest-generation-title">Latest Generation</h3>
            <span className="latest-generation-details">
              {new Date(latest.createdAt).toLocaleDateString()}
            </span>
          </div>
          <p className="latest-generation-details">
            <strong>Prompt:</strong> {latest.prompt}
          </p>
          <p className="latest-generation-details">
            <strong>Aspect Ratio:</strong> {ASPECT_RATIOS[latest.aspectRatio]}
          </p>
          <div className="latest-generation-actions">
            <Button 
              variant="contained" 
              color="primary"
              onClick={() => handleDownload(latest.imageUrl)}
            >
              Download
            </Button>
            <Button 
              variant="contained" 
              color="error" 
              onClick={() => handleDelete(latest.id)}
            >
              Delete
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const renderSkeleton = () => (
    <div className="latest-generation">
      <Skeleton variant="rectangular" width="100%" height={300} />
      <div className="latest-generation-content">
        <div className="latest-generation-header">
          <Skeleton variant="text" width={200} height={30} />
          <Skeleton variant="text" width={100} />
        </div>
        <Skeleton variant="text" width="80%" />
        <Skeleton variant="text" width="60%" />
        <div className="latest-generation-actions">
          <Skeleton variant="rectangular" width={100} height={36} />
          <Skeleton variant="rectangular" width={100} height={36} />
        </div>
      </div>
    </div>
  );

  const renderHistoryItem = (gen) => (
    <div key={gen.id} className="generation-item">
      <img src={gen.imageUrl} alt={gen.prompt} />
      <div className="generation-item-content">
        <p className="generation-item-prompt">{gen.prompt}</p>
        <p className="generation-item-details">
          Aspect Ratio: {ASPECT_RATIOS[gen.aspectRatio]}
        </p>
        <p className="generation-item-details">
          {new Date(gen.createdAt).toLocaleDateString()}
        </p>
        <div className="latest-generation-actions">
          <Button 
            variant="outlined" 
            color="primary" 
            onClick={() => handleDownload(gen.imageUrl)}
            fullWidth
            size="small"
            sx={{ mt: 1 }}
          >
            Download
          </Button>
          <Button 
            variant="outlined" 
            color="error" 
            onClick={() => handleDelete(gen.id)}
            fullWidth
            size="small"
            sx={{ mt: 1 }}
          >
            Delete
          </Button>
          <Button 
            variant="outlined" 
            color="primary" 
            onClick={() => setEditingImage(gen)}
            fullWidth
            size="small"
            sx={{ mt: 1 }}
          >
            Edit
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <Box className="banner-generator">
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Prompt"
            value={prompt}
            onChange={(e) => {
              setPrompt(e.target.value);
              setFormData({...formData, prompt: e.target.value});
            }}
            placeholder="Enter your prompt..."
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
          <Button 
            variant="contained" 
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
            fullWidth
          >
            {isGenerating ? 'Generating...' : 'Generate'}
          </Button>
        </Grid>

        {error && <div className="error">{error}</div>}

        <Grid item xs={12}>
          {isGenerating ? renderSkeleton() : renderLatestGeneration()}
        </Grid>

        <Grid item xs={12}>
          <div className="divider" />
          <Typography variant="h6" gutterBottom>
            Generation History
          </Typography>
          <div className="generations-gallery">
            {generations.map(renderHistoryItem)}
          </div>
        </Grid>
      </Grid>

      {editingImage && (
        <ImageEditor
          image={editingImage}
          onEdit={handleEditImage}
          onClose={() => setEditingImage(null)}
        />
      )}
    </Box>
  );
};

export default BannerGenerator;