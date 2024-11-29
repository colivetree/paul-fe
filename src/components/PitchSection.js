import React from 'react';
import { TextField, Button, Typography, Box, Paper } from '@mui/material';

const PitchSection = ({ pitch, setPitch, handlePitchSubmit, handleImproveWithAI }) => {
  return (
    <Paper elevation={3} sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>Pitch</Typography>
      <TextField
        fullWidth
        label="Pitch"
        value={pitch}
        onChange={(e) => setPitch(e.target.value)}
        multiline
        minRows={4}
        maxRows={12}
        margin="normal"
        variant="outlined"
      />
      <Box sx={{ mt: 2 }}>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={handlePitchSubmit}
          sx={{ mr: 1 }}
        >
          Submit Pitch
        </Button>
        <Button 
          variant="outlined" 
          color="secondary" 
          onClick={handleImproveWithAI}
        >
          Improve with AI
        </Button>
      </Box>
    </Paper>
  );
};

export default PitchSection; 