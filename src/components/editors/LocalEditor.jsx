import React, { useRef, useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  DialogActions,
  ToggleButton,
  ToggleButtonGroup,
  Input
} from '@mui/material';
import { optimizeImage } from '../../services/imageOptimizer';

const LocalEditor = ({ image, onEdit, onClose }) => {
  const canvasRef = useRef(null);
  const [ctx, setCtx] = useState(null);
  const [isCanvasReady, setIsCanvasReady] = useState(false);
  const [editMode, setEditMode] = useState('image'); // 'image', 'filter', 'text'
  const [overlays, setOverlays] = useState([]);
  const [selectedOverlay, setSelectedOverlay] = useState(null);
  const [isMovingOverlay, setIsMovingOverlay] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    setCtx(context);

    const loadImage = async () => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      
      await new Promise((resolve, reject) => {
        img.onload = () => {
          canvas.width = img.width;
          canvas.height = img.height;
          context.drawImage(img, 0, 0);
          setIsCanvasReady(true);
          resolve();
        };
        img.onerror = reject;
        img.src = image.imageUrl;
      });
    };

    loadImage();
  }, [image]);

  const handleEditModeChange = (event, newMode) => {
    if (newMode !== null) {
      if (newMode !== 'image') {
        setSelectedOverlay(null);
      }
      setEditMode(newMode);
    }
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          // Calcular escala inicial para ajustar la imagen al canvas
          const canvasWidth = canvasRef.current.width;
          const canvasHeight = canvasRef.current.height;
          const scaleX = (canvasWidth * 0.5) / img.width;
          const scaleY = (canvasHeight * 0.5) / img.height;
          const initialScale = Math.min(scaleX, scaleY);

          const newOverlay = {
            id: Date.now(),
            image: img,
            position: {
              x: (canvasWidth - (img.width * initialScale)) / 2,
              y: (canvasHeight - (img.height * initialScale)) / 2
            },
            size: { 
              width: img.width * initialScale,
              height: img.height * initialScale 
            },
            scale: initialScale,
            rotation: 0
          };
          setOverlays(prev => [...prev, newOverlay]);
          setSelectedOverlay(newOverlay.id);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    try {
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvasRef.current.width;
      tempCanvas.height = canvasRef.current.height;
      const tempCtx = tempCanvas.getContext('2d');

      // Dibujar la imagen base con filtros aplicados
      tempCtx.drawImage(canvasRef.current, 0, 0);

      // Dibujar todas las superposiciones
      overlays.forEach(overlay => {
        tempCtx.drawImage(
          overlay.image,
          overlay.position.x,
          overlay.position.y,
          overlay.size.width,
          overlay.size.height
        );
      });

      // Convertir a blob
      const blob = await new Promise(resolve => tempCanvas.toBlob(resolve));
      
      // Optimizar la imagen
      const optimizedBlob = await optimizeImage(blob, {
        maxWidth: 1920,
        quality: 0.8,
        format: 'webp'
      });

      const url = URL.createObjectURL(optimizedBlob);

      await onEdit({
        imageUrl: url,
        prompt: 'local-edit'
      });

      onClose();
    } catch (error) {
      console.error('Error saving changes:', error);
    }
  };

  const applyFilter = (filterType) => {
    const canvas = canvasRef.current;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    switch (filterType) {
      case 'grayscale':
        for (let i = 0; i < data.length; i += 4) {
          const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
          data[i] = avg;
          data[i + 1] = avg;
          data[i + 2] = avg;
        }
        break;
      // Añadir más filtros aquí
    }

    ctx.putImageData(imageData, 0, 0);
  };

  const handleOverlayMouseDown = (e, overlayId) => {
    if (editMode !== 'image') return;
    e.stopPropagation();
    
    const overlay = overlays.find(o => o.id === overlayId);
    if (!overlay) return;

    setSelectedOverlay(overlayId);
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Detectar si estamos en los controles de transformación
    const margin = 20;
    const isRight = x > rect.width - margin;
    const isBottom = y > rect.height - margin;
    const isRotate = x < margin && y < margin;
    
    if (isRight && isBottom) {
      setIsResizing(true);
    } else if (isRotate) {
      setIsRotating(true);
    } else {
      setIsDragging(true);
    }
    
    setStartPos({ x: e.clientX, y: e.clientY });
  };

  const handleOverlayMouseMove = (e) => {
    if (!selectedOverlay || (!isDragging && !isResizing && !isRotating)) return;

    const dx = e.clientX - startPos.x;
    const dy = e.clientY - startPos.y;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    setOverlays(prev => prev.map(overlay => {
      if (overlay.id !== selectedOverlay) return overlay;
      
      if (isResizing) {
        const newScale = overlay.scale * (1 + dx * 0.01);
        return {
          ...overlay,
          scale: Math.max(0.1, newScale),
          size: {
            width: overlay.image.width * newScale,
            height: overlay.image.height * newScale
          }
        };
      } else if (isRotating) {
        const center = {
          x: overlay.position.x + overlay.size.width / 2,
          y: overlay.position.y + overlay.size.height / 2
        };
        const angle = Math.atan2(e.clientY - center.y, e.clientX - center.x);
        return {
          ...overlay,
          rotation: angle * (180 / Math.PI)
        };
      } else {
        return {
          ...overlay,
          position: {
            x: overlay.position.x + dx * scaleX,
            y: overlay.position.y + dy * scaleY
          }
        };
      }
    }));
    
    setStartPos({ x: e.clientX, y: e.clientY });
  };

  const handleOverlayMouseUp = () => {
    setIsMovingOverlay(false);
    setIsResizing(false);
    setIsRotating(false);
    setIsDragging(false);
  };

  const deleteOverlay = (overlayId) => {
    setOverlays(prev => prev.filter(o => o.id !== overlayId));
    if (selectedOverlay === overlayId) {
      setSelectedOverlay(null);
    }
  };

  return (
    <>
      <Box className="editor-tools" sx={{ mb: 2 }}>
        <ToggleButtonGroup
          value={editMode}
          exclusive
          onChange={handleEditModeChange}
          aria-label="edit mode"
        >
          <ToggleButton value="image">
            Add Image
          </ToggleButton>
          <ToggleButton value="filter">
            Filters
          </ToggleButton>
          <ToggleButton value="text">
            Add Text
          </ToggleButton>
        </ToggleButtonGroup>

        {editMode === 'image' && (
          <Box sx={{ ml: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
            <Input
              type="file"
              onChange={handleImageUpload}
              sx={{ display: 'block' }}
            />
          </Box>
        )}

        {editMode === 'filter' && (
          <Box sx={{ ml: 2 }}>
            <Button onClick={() => applyFilter('grayscale')}>
              Grayscale
            </Button>
          </Box>
        )}
      </Box>
      
      <div className="canvas-container">
        <canvas
          ref={canvasRef}
          className={`editor-canvas ${isCanvasReady ? 'ready' : ''}`}
        />
        {overlays.map(overlay => (
          <div 
            key={overlay.id}
            className={`overlay-preview ${selectedOverlay === overlay.id ? 'selected' : ''}`}
            style={{
              left: `${(overlay.position.x / canvasRef.current?.width || 1) * 100}%`,
              top: `${(overlay.position.y / canvasRef.current?.height || 1) * 100}%`,
              width: `${(overlay.size.width / canvasRef.current?.width || 1) * 100}%`,
              height: `${(overlay.size.height / canvasRef.current?.height || 1) * 100}%`,
              transform: `rotate(${overlay.rotation || 0}deg)`
            }}
            onMouseDown={(e) => handleOverlayMouseDown(e, overlay.id)}
            onMouseMove={handleOverlayMouseMove}
            onMouseUp={handleOverlayMouseUp}
            onMouseLeave={handleOverlayMouseUp}
          >
            <img 
              src={overlay.image.src} 
              alt="overlay"
              style={{ 
                width: '100%', 
                height: '100%', 
                objectFit: 'contain',
                pointerEvents: 'none'
              }}
              draggable={false}
            />
            <div className="overlay-controls">
              <div className="rotate-handle" />
              <div className="resize-handle" />
            </div>
            <button 
              className="overlay-delete"
              onClick={(e) => {
                e.stopPropagation();
                deleteOverlay(overlay.id);
              }}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <DialogActions>
        <Button onClick={onClose}>
          Cancel
        </Button>
        <Button 
          onClick={handleSave}
          color="primary"
        >
          Save Changes
        </Button>
      </DialogActions>
    </>
  );
};

export default LocalEditor; 