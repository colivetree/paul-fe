import React, { useState, useEffect } from 'react';
import { uploadAncillaryDocs, uploadGuideProposals, listDocuments } from '../services/api';
import { Button, Typography, List, ListItem, ListItemText, Paper, Box, Link } from '@mui/material';

const DocumentUpload = ({ templateId }) => {
  const [ancillaryDocs, setAncillaryDocs] = useState([]);
  const [guideProposals, setGuideProposals] = useState([]);
  const [uploadStatus, setUploadStatus] = useState('');
  const [existingDocs, setExistingDocs] = useState({ ancillary_documents: [], guide_proposals: [] });

  useEffect(() => {
    if (templateId) {
      fetchExistingDocuments();
    }
  }, [templateId]);

  const fetchExistingDocuments = async () => {
    try {
      const docs = await listDocuments(templateId);
      setExistingDocs(docs);
    } catch (error) {
      console.error('Error fetching existing documents:', error);
      setUploadStatus('Error fetching existing documents');
    }
  };

  const handleAncillaryDocsChange = (event) => {
    setAncillaryDocs(Array.from(event.target.files));
  };

  const handleGuideProposalsChange = (event) => {
    setGuideProposals(Array.from(event.target.files));
  };

  const handleUpload = async () => {
    if (!templateId) {
      setUploadStatus('No template ID provided');
      return;
    }

    setUploadStatus('Uploading...');
    try {
      if (ancillaryDocs.length > 0) {
        await uploadAncillaryDocs(ancillaryDocs, templateId);
      }
      if (guideProposals.length > 0) {
        await uploadGuideProposals(guideProposals, templateId);
      }
      setUploadStatus('Documents uploaded successfully');
      fetchExistingDocuments();  // Refresh the list of documents
    } catch (error) {
      console.error('Error uploading documents:', error);
      setUploadStatus(`Error: ${error.message}`);
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
      <Typography variant="h6" gutterBottom>Document Upload</Typography>
      <Box mb={2}>
        <Typography variant="subtitle1">Existing Documents:</Typography>
        <List>
          <ListItem>
            <ListItemText primary="Ancillary Documents" />
          </ListItem>
          {existingDocs.ancillary_documents.map((doc, index) => (
            <ListItem key={index}>
              <Link href={`${process.env.REACT_APP_API_BASE_URL}/uploads/${templateId}/ancillary/${doc.name}`} target="_blank" rel="noopener noreferrer">
                {doc.name}
              </Link>
            </ListItem>
          ))}
          <ListItem>
            <ListItemText primary="Guide Proposals" />
          </ListItem>
          {existingDocs.guide_proposals.map((doc, index) => (
            <ListItem key={index}>
              <Link href={`${process.env.REACT_APP_API_BASE_URL}/uploads/${templateId}/guide_proposals/${doc.name}`} target="_blank" rel="noopener noreferrer">
                {doc.name}
              </Link>
            </ListItem>
          ))}
        </List>
      </Box>
      <Box mb={2}>
        <Typography variant="subtitle1">Upload New Documents:</Typography>
        <input type="file" multiple onChange={handleAncillaryDocsChange} style={{ marginBottom: '8px' }} />
        <Typography variant="body2">Ancillary Documents</Typography>
        <input type="file" multiple onChange={handleGuideProposalsChange} style={{ marginBottom: '8px' }} />
        <Typography variant="body2">Guide Proposals</Typography>
      </Box>
      <Button variant="contained" color="primary" onClick={handleUpload}>
        Upload Documents
      </Button>
      <Typography variant="body2" sx={{ mt: 1 }}>{uploadStatus}</Typography>
    </Paper>
  );
};

export default DocumentUpload;
