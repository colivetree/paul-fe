import React, { useState } from 'react';
import { Button, Typography } from '@mui/material';
import { uploadTemplate } from '../services/api';

const TemplateUpload = ({ onUploadSuccess, templateId }) => {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('');

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) {
      setStatus('Please select a file');
      return;
    }

    try {
      setStatus('Uploading...');
      const response = await uploadTemplate(file, templateId);
      setStatus('Template uploaded successfully');
      onUploadSuccess(response.template_id);
    } catch (error) {
      console.error('Error uploading template:', error);
      setStatus('Error uploading template');
    }
  };

  return (
    <div>
      <Typography variant="h6">Upload New Template</Typography>
      <input type="file" onChange={handleFileChange} />
      <Button variant="contained" color="primary" onClick={handleUpload}>
        Upload Template
      </Button>
      <Typography>{status}</Typography>
    </div>
  );
};

export default TemplateUpload;
