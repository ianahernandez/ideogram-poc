import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Box, Typography, Paper } from '@mui/material';

function ImageUploader({ onUpload }) {
  const onDrop = useCallback((acceptedFiles) => {
    const newAssets = acceptedFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }));
    onUpload(prev => [...prev, ...newAssets]);
  }, [onUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  return (
    <Paper
      {...getRootProps()}
      sx={{
        p: 3,
        border: '2px dashed #ccc',
        borderRadius: 2,
        cursor: 'pointer',
        backgroundColor: isDragActive ? '#f5f5f5' : 'white'
      }}
    >
      <input {...getInputProps()} />
      <Typography align="center">
        {isDragActive
          ? 'Drop the files here...'
          : 'Drag and drop assets here, or click to select files'}
      </Typography>
    </Paper>
  );
}

export default ImageUploader; 