import React, { useState, useEffect } from 'react';
import { TextField, Button, Typography, Box, Grid, Paper, IconButton } from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';

const OneOffInfoForm = ({ proposalId, onSubmit, existingOneOffInfo }) => {
  const [oneOffInfo, setOneOffInfo] = useState(existingOneOffInfo || {});
  const [status, setStatus] = useState('');
  const [newField, setNewField] = useState({ key: '', value: '' });

  useEffect(() => {
    console.log('Existing one-off info:', existingOneOffInfo);
    setOneOffInfo(existingOneOffInfo || {});
  }, [existingOneOffInfo]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setOneOffInfo(prevInfo => ({
      ...prevInfo,
      [name]: value
    }));
  };

  const handleNewFieldChange = (field) => (event) => {
    setNewField(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const handleAddField = () => {
    if (newField.key && newField.value) {
      setOneOffInfo(prev => ({
        ...prev,
        [newField.key]: newField.value
      }));
      setNewField({ key: '', value: '' }); // Reset new field inputs
    }
  };

  const handleDeleteField = (key) => {
    setOneOffInfo(prev => {
      const updated = { ...prev };
      delete updated[key];
      return updated;
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      await onSubmit(oneOffInfo);
      setStatus('One-off information submitted successfully');
    } catch (error) {
      console.error('Error submitting one-off information:', error);
      setStatus(`Error: ${error.message}`);
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
      <Typography variant="h6" gutterBottom>One-off Information</Typography>
      <form onSubmit={handleSubmit}>
        <Grid container spacing={2}>
          {/* Existing Fields */}
          {Object.entries(oneOffInfo).map(([key, value]) => (
            <Grid item xs={12} key={key} sx={{ display: 'flex', gap: 1 }}>
              <TextField
                sx={{ flexGrow: 1 }}
                name={key}
                label={key}
                value={value}
                onChange={handleInputChange}
                variant="outlined"
              />
              <IconButton 
                color="error" 
                onClick={() => handleDeleteField(key)}
                sx={{ alignSelf: 'center' }}
              >
                <DeleteIcon />
              </IconButton>
            </Grid>
          ))}

          {/* New Field Input */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <TextField
                sx={{ flexGrow: 1 }}
                label="New Field Name"
                value={newField.key}
                onChange={handleNewFieldChange('key')}
                variant="outlined"
              />
              <TextField
                sx={{ flexGrow: 1 }}
                label="New Field Value"
                value={newField.value}
                onChange={handleNewFieldChange('value')}
                variant="outlined"
              />
              <IconButton 
                color="primary" 
                onClick={handleAddField}
                disabled={!newField.key || !newField.value}
                sx={{ alignSelf: 'center' }}
              >
                <AddIcon />
              </IconButton>
            </Box>
          </Grid>

          <Grid item xs={12}>
            <Box mt={2}>
              <Button type="submit" variant="contained" color="primary">
                Update One-off Information
              </Button>
            </Box>
          </Grid>
        </Grid>
      </form>
      {status && (
        <Box mt={2}>
          <Typography color={status.includes('Error') ? 'error' : 'success'}>
            {status}
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default OneOffInfoForm;
