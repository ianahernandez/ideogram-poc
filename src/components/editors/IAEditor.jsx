import React, { useRef, useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  TextField,
  DialogActions,
  ToggleButton,
  ToggleButtonGroup,
  Slider,
  Typography
} from '@mui/material';
import BrushIcon from '@mui/icons-material/Brush';
import CropSquareIcon from '@mui/icons-material/CropSquare';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import { editImage } from '../../api/ideogram';

const IAEditor = ({ image, onEdit, onClose }) => {
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
  const [tolerance, setTolerance] = useState(30);

  // Inicializar canvas
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

  // Cargar imagen
  useEffect(() => {
    if (!canvasInitialized || !imageCtx || !maskCtx || !image) return;

    const loadImage = async () => {
      try {
        const imageCanvas = imageCanvasRef.current;
        const maskCanvas = maskCanvasRef.current;
        const img = new Image();
        img.crossOrigin = "anonymous";
        
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = image.imageUrl;
        });

        imageCanvas.width = img.width;
        imageCanvas.height = img.height;
        maskCanvas.width = img.width;
        maskCanvas.height = img.height;
        
        imageCtx.drawImage(img, 0, 0);
        
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

  const handleDrawModeChange = (event, newMode) => {
    if (newMode !== null) {
      setDrawMode(newMode);
    }
  };

  const getScaledCoordinates = (e) => {
    const canvas = maskCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  const startDrawing = (e) => {
    e.preventDefault(); // Prevenir comportamiento por defecto
    if (!maskCtx || !isCanvasReady) return;

    const coords = getScaledCoordinates(e);
    setIsDrawing(true);
    setStartPos(coords);

    if (drawMode === 'brush') {
      maskCtx.beginPath();
      maskCtx.moveTo(coords.x, coords.y);
    }
  };

  const draw = (e) => {
    e.preventDefault(); // Prevenir comportamiento por defecto
    if (!isDrawing || !maskCtx || !isCanvasReady) return;

    const coords = getScaledCoordinates(e);
    
    if (drawMode === 'brush') {
      maskCtx.lineWidth = 20;
      maskCtx.lineCap = 'round';
      maskCtx.lineJoin = 'round'; // Añadido para suavizar las esquinas
      maskCtx.strokeStyle = 'black';
      
      // Suavizar el trazo
      maskCtx.beginPath();
      maskCtx.moveTo(startPos.x, startPos.y);
      maskCtx.lineTo(coords.x, coords.y);
      maskCtx.stroke();
      
      // Actualizar la posición inicial para el siguiente trazo
      setStartPos(coords);
    } else {
      const maskCanvas = maskCanvasRef.current;
      const imageData = mask || maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);
      maskCtx.putImageData(imageData, 0, 0);
      
      maskCtx.fillStyle = 'black';
      const width = coords.x - startPos.x;
      const height = coords.y - startPos.y;
      
      // Dibujar el rectángulo desde cualquier dirección
      const x = width < 0 ? coords.x : startPos.x;
      const y = height < 0 ? coords.y : startPos.y;
      maskCtx.fillRect(x, y, Math.abs(width), Math.abs(height));
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
      const maskBlob = await new Promise(resolve => {
        maskCanvasRef.current.toBlob(resolve, 'image/png');
      });

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

  const floodFill = (startX, startY) => {
    if (!maskCtx || !imageCtx) return;

    const imageData = imageCtx.getImageData(0, 0, imageCanvasRef.current.width, imageCanvasRef.current.height);
    const maskData = maskCtx.getImageData(0, 0, maskCanvasRef.current.width, maskCanvasRef.current.height);
    
    const startPos = (startY * imageData.width + startX) * 4;
    const startR = imageData.data[startPos];
    const startG = imageData.data[startPos + 1];
    const startB = imageData.data[startPos + 2];

    const stack = [[startX, startY]];
    const visited = new Set();
    const width = imageData.width;
    const height = imageData.height;

    const isColorSimilar = (x, y) => {
      const pos = (y * width + x) * 4;
      const r = imageData.data[pos];
      const g = imageData.data[pos + 1];
      const b = imageData.data[pos + 2];

      const diff = Math.sqrt(
        Math.pow(r - startR, 2) +
        Math.pow(g - startG, 2) +
        Math.pow(b - startB, 2)
      );

      return diff <= tolerance * 2.55; // Convertir tolerancia de 0-100 a 0-255
    };

    while (stack.length) {
      const [x, y] = stack.pop();
      const key = `${x},${y}`;
      
      if (visited.has(key)) continue;
      if (x < 0 || x >= width || y < 0 || y >= height) continue;
      if (!isColorSimilar(x, y)) continue;

      visited.add(key);
      const pos = (y * width + x) * 4;
      maskData.data[pos] = 0;
      maskData.data[pos + 1] = 0;
      maskData.data[pos + 2] = 0;
      maskData.data[pos + 3] = 255;

      stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
    }

    maskCtx.putImageData(maskData, 0, 0);
    setMask(maskData);
  };

  const handleCanvasClick = (e) => {
    if (drawMode !== 'magic' || !maskCtx || !isCanvasReady) return;
    e.preventDefault();
    const coords = getScaledCoordinates(e);
    floodFill(Math.floor(coords.x), Math.floor(coords.y));
  };

  return (
    <>
      <Box className="editor-tools" sx={{ mb: 2 }}>
        <ToggleButtonGroup
          value={drawMode}
          exclusive
          onChange={handleDrawModeChange}
          aria-label="drawing mode"
        >
          <ToggleButton value="brush">
            <BrushIcon sx={{ mr: 1 }} /> Brush
          </ToggleButton>
          <ToggleButton value="rectangle">
            <CropSquareIcon sx={{ mr: 1 }} /> Rectangle
          </ToggleButton>
          <ToggleButton value="magic">
            <AutoFixHighIcon sx={{ mr: 1 }} /> Magic
          </ToggleButton>
        </ToggleButtonGroup>

        {drawMode === 'magic' && (
          <Box sx={{ ml: 2, width: 200 }}>
            <Typography gutterBottom>
              Tolerance: {tolerance}%
            </Typography>
            <Slider
              value={tolerance}
              onChange={(e, newValue) => setTolerance(newValue)}
              min={1}
              max={100}
              valueLabelDisplay="auto"
            />
          </Box>
        )}
      </Box>
      
      <div className="canvas-container">
        <canvas
          ref={imageCanvasRef}
          className={`editor-canvas original ${isCanvasReady ? 'ready' : ''}`}
        />
        <canvas
          ref={maskCanvasRef}
          onClick={drawMode === 'magic' ? handleCanvasClick : undefined}
          onMouseDown={drawMode !== 'magic' ? startDrawing : undefined}
          onMouseMove={drawMode !== 'magic' ? draw : undefined}
          onMouseUp={drawMode !== 'magic' ? stopDrawing : undefined}
          onMouseLeave={drawMode !== 'magic' ? stopDrawing : undefined}
          className={`editor-canvas mask ${isCanvasReady ? 'ready' : ''} ${drawMode}-mode`}
        />
      </div>

      <Box style={{ marginTop: '20px', width: '100%' }}>
        <TextField
          fullWidth
          label="AI Generation Prompt"
          value={editPrompt}
          onChange={(e) => setEditPrompt(e.target.value)}
          multiline
          rows={4}
          placeholder="Describe the changes you want to make..."
          disabled={!isCanvasReady}
        />
      </Box>

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
          Generate with AI
        </Button>
      </DialogActions>
    </>
  );
};

export default IAEditor; 