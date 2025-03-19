import React, { useState } from 'react';
import { 
  Box, 
  Dialog,
  DialogTitle,
  DialogContent,
  Tabs,
  Tab
} from '@mui/material';
import IAEditor from './editors/IAEditor';
import LocalEditor from './editors/LocalEditor';
import './ImageEditor.css';

const ImageEditor = ({ image, onEdit, onClose }) => {
  const [editorMode, setEditorMode] = useState('edit'); // 'edit' o 'ia'

  const handleModeChange = (event, newMode) => {
    setEditorMode(newMode);
  };

  return (
    <Dialog open={true} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Image Editor</DialogTitle>
      <DialogContent>
        <Box className="image-editor">
          <Tabs
            value={editorMode}
            onChange={handleModeChange}
            aria-label="editor mode"
            sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab value="edit" label="Edit" />
            <Tab value="ia" label="AI Generation" />
          </Tabs>

          {editorMode === 'edit' ? (
            <LocalEditor 
              image={image}
              onEdit={onEdit}
              onClose={onClose}
            />
          ) : (
            <IAEditor 
              image={image}
              onEdit={onEdit}
              onClose={onClose}
            />
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default ImageEditor; 