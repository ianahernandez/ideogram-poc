import { Grid, Skeleton, Box, Card, CardMedia } from '@mui/material';

function GeneratedImages({ images, isLoading }) {
  if (isLoading) {
    return (
      <Grid container spacing={2}>
        {[1, 2].map((skeleton) => (
          <Grid item xs={12} sm={6} key={skeleton}>
            <Skeleton 
              variant="rectangular" 
              width="100%" 
              height={300} 
            />
          </Grid>
        ))}
      </Grid>
    );
  }

  return (
    <Grid container spacing={2}>
      {images.map((image, index) => (
        <Grid item xs={12} sm={6} key={index}>
          <Card>
            <CardMedia
              component="img"
              image={image.url}
              alt={`Generated image ${index + 1}`}
              sx={{ height: 300, objectFit: 'contain' }}
            />
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}

export default GeneratedImages; 