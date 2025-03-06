import { Container, Box } from '@mui/material';
import BannerGenerator from './components/BannerGenerator';

function App() {
  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <BannerGenerator />
      </Box>
    </Container>
  );
}

export default App; 