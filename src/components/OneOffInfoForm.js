import React, { useState, useEffect } from 'react';
import { getTemplate, submitOneOffInfo, getOneOffInfo } from '../services/api';
import { TextField, Button, Typography, Box, Grid, Paper } from '@mui/material';

const OneOffInfoForm = ({ templateId, proposalId, onSubmit }) => {
  const [template, setTemplate] = useState(null);
  const [oneOffInfo, setOneOffInfo] = useState({});
  const [status, setStatus] = useState('');

  useEffect(() => {
    const fetchTemplateAndOneOffInfo = async () => {
      if (templateId && proposalId) {
        try {
          const [fetchedTemplate, fetchedOneOffInfo] = await Promise.all([
            getTemplate(templateId),
            getOneOffInfo(proposalId)
          ]);
          setTemplate(fetchedTemplate);
          setOneOffInfo(fetchedOneOffInfo);
        } catch (error) {
          console.error('Error fetching template or one-off info:', error);
          setStatus('Error fetching template or one-off info');
        }
      }
    };

    fetchTemplateAndOneOffInfo();
  }, [templateId]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setOneOffInfo(prevInfo => ({
      ...prevInfo,
      [name]: value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      await submitOneOffInfo(templateId, oneOffInfo);
      setStatus('One-off information submitted successfully');
      onSubmit(oneOffInfo);
    } catch (error) {
      console.error('Error submitting one-off information:', error);
      setStatus(`Error: ${error.message}`);
    }
  };

  if (!template) {
    return <Typography>Loading...</Typography>;
  }

  return (
    <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
      <Typography variant="h6" gutterBottom>One-off Information</Typography>
      <form onSubmit={handleSubmit}>
        <Grid container spacing={2}>
          {template.one_off_info.map(field => (
            <Grid item xs={12} key={field.name}>
              <TextField
                fullWidth
                id={field.name}
                name={field.name}
                label={field.name}
                value={oneOffInfo[field.name] || ''}
                onChange={handleInputChange}
                placeholder={field.description}
                variant="outlined"
              />
            </Grid>
          ))}
          <Grid item xs={12}>
            <Box mt={2}>
              <Button type="submit" variant="contained" color="primary">
                Submit One-off Information
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
