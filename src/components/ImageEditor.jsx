import React, { useRef, useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material';
import './ImageEditor.css';
import { editImage } from '../api/ideogram';

const ImageEditor = ({ image, onEdit, onClose }) => {
  const imageCanvasRef = useRef(null);
  const maskCanvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [editPrompt, setEditPrompt] = useState('');
  const [mask, setMask] = useState(null);
  const [imageCtx, setImageCtx] = useState(null);
  const [maskCtx, setMaskCtx] = useState(null);
  const [isCanvasReady, setIsCanvasReady] = useState(false);
  const [canvasInitialized, setCanvasInitialized] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [drawMode, setDrawMode] = useState('brush');

  // Inicializar los canvas
  useEffect(() => {
    const initCanvas = () => {
      const imageCanvas = imageCanvasRef.current;
      const maskCanvas = maskCanvasRef.current;
      if (!imageCanvas || !maskCanvas) {
        requestAnimationFrame(initCanvas);
        return;
      }

      const imgContext = imageCanvas.getContext('2d');
      const maskContext = maskCanvas.getContext('2d');
      setImageCtx(imgContext);
      setMaskCtx(maskContext);
      setCanvasInitialized(true);
    };

    initCanvas();
  }, []);

  // Cargar la imagen
  useEffect(() => {
    if (!canvasInitialized || !imageCtx || !maskCtx || !image) return;

    const loadImage = async () => {
      try {
        const imageCanvas = imageCanvasRef.current;
        const maskCanvas = maskCanvasRef.current;
        const img = new Image();
        img.crossOrigin = "anonymous";
        
        await new Promise((resolve, reject) => {
          img.onload = () => {
            resolve();
          };
          img.onerror = reject;
          img.src = image.imageUrl;
        });

        imageCanvas.width = img.width;
        imageCanvas.height = img.height;
        maskCanvas.width = img.width;
        maskCanvas.height = img.height;
        
        imageCtx.drawImage(img, 0, 0);
        
        // Inicializar la máscara en blanco (invertido)
        maskCtx.fillStyle = 'white';
        maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);
        setMask(maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height));
        setIsCanvasReady(true);
      } catch (error) {
        console.error('Error loading image:', error);
        setIsCanvasReady(false);
      }
    };

    loadImage();
  }, [canvasInitialized, imageCtx, maskCtx, image]);

  const getScaledCoordinates = (canvas, nativeEvent) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    return {
      x: (nativeEvent.clientX - rect.left) * scaleX,
      y: (nativeEvent.clientY - rect.top) * scaleY
    };
  };

  const startDrawing = (e) => {
    if (!maskCtx || !isCanvasReady) return;
    
    const canvas = maskCanvasRef.current;
    const { x, y } = getScaledCoordinates(canvas, e);
    
    setIsDrawing(true);
    setStartPos({ x, y });

    if (drawMode === 'brush') {
      maskCtx.beginPath();
      maskCtx.moveTo(x, y);
    }
  };

  const draw = (e) => {
    if (!isDrawing || !maskCtx || !isCanvasReady) return;
    
    const canvas = maskCanvasRef.current;
    const { x, y } = getScaledCoordinates(canvas, e);
    
    if (drawMode === 'brush') {
      maskCtx.lineWidth = 20;
      maskCtx.lineCap = 'round';
      maskCtx.strokeStyle = 'black';
      maskCtx.lineTo(x, y);
      maskCtx.stroke();
    } else {
      const imageData = mask || maskCtx.getImageData(0, 0, canvas.width, canvas.height);
      maskCtx.putImageData(imageData, 0, 0);
      
      maskCtx.fillStyle = 'black';
      const width = x - startPos.x;
      const height = y - startPos.y;
      maskCtx.fillRect(startPos.x, startPos.y, width, height);
    }
  };

  const stopDrawing = () => {
    if (!maskCtx || !isCanvasReady) return;
    setIsDrawing(false);
    const maskCanvas = maskCanvasRef.current;
    setMask(maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height));
  };

  const handleClear = () => {
    if (!maskCtx || !isCanvasReady) return;
    const maskCanvas = maskCanvasRef.current;
    maskCtx.fillStyle = 'white';
    maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);
    setMask(maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height));
  };

  const handleEdit = async () => {
    if (!editPrompt.trim() || !isCanvasReady) return;

    try {
      // Obtener la máscara como blob
      const maskBlob = await new Promise(resolve => {
        maskCanvasRef.current.toBlob(resolve, 'image/png');
      });

      // Descargar la máscara para verificación
      const link = document.createElement('a');
      link.download = 'mask.png';
      link.href = maskCanvasRef.current.toDataURL('image/png');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      const result = await editImage({
        originalImage: image.imageUrl,
        mask: maskBlob,
        prompt: editPrompt
      });

      if (result.data && result.data.length > 0) {
        await onEdit({
          imageUrl: result.data[0].url,
          prompt: editPrompt
        });
      }

      onClose();
    } catch (error) {
      console.error('Error during image edit:', error);
    }
  };

  const handleDrawModeChange = (event, newMode) => {
    if (newMode !== null) {
      setDrawMode(newMode);
    }
  };

  return (
    <Dialog open={true} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Edit Image</DialogTitle>
      <DialogContent>
        <Box className="image-editor">
          <Box className="editor-tools" sx={{ mb: 2 }}>
            <ToggleButtonGroup
              value={drawMode}
              exclusive
              onChange={handleDrawModeChange}
              aria-label="drawing mode"
            >
              <ToggleButton value="brush" aria-label="brush mode">
                Brush
              </ToggleButton>
              <ToggleButton value="rectangle" aria-label="rectangle mode">
                Rectangle
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
          
          <div className="canvas-container">
            <canvas
              ref={imageCanvasRef}
              className={`editor-canvas original ${isCanvasReady ? 'ready' : ''}`}
            />
            <canvas
              ref={maskCanvasRef}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              className={`editor-canvas mask ${isCanvasReady ? 'ready' : ''}`}
            />
          </div>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Edit Prompt"
              value={editPrompt}
              onChange={(e) => setEditPrompt(e.target.value)}
              multiline
              rows={2}
              placeholder="Describe the changes you want to make..."
              disabled={!isCanvasReady}
            />
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button 
          onClick={handleClear} 
          color="secondary"
          disabled={!isCanvasReady}
        >
          Clear Mask
        </Button>
        <Button onClick={onClose}>
          Cancel
        </Button>
        <Button 
          onClick={handleEdit} 
          color="primary" 
          disabled={!editPrompt.trim() || !isCanvasReady}
        >
          Apply Edit
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ImageEditor; 