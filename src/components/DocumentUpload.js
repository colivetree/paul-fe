import React, { useState, useEffect } from 'react';
import { uploadAncillaryDocs, uploadGuideProposals, listDocuments } from '../services/api';
import { Button, Typography, List, ListItem, ListItemText, Paper, Box, Link, ListItemIcon, Grid, Divider } from '@mui/material';
import { CheckCircleOutline, WorkHistoryOutlined, ErrorOutline, PendingActions } from '@mui/icons-material';
import GoogleDocsImport from './google/GoogleDocsImport';
import { GoogleAuthProvider } from './google/GoogleAuthProvider';

const DocumentUpload = ({ templateId }) => {
  const [ancillaryDocs, setAncillaryDocs] = useState([]);
  const [guideProposals, setGuideProposals] = useState([]);
  const [uploadStatus, setUploadStatus] = useState('');
  const [existingDocs, setExistingDocs] = useState({
    ancillary_documents: [],
    guide_proposals: []
  });

  useEffect(() => {
    const fetchExistingDocuments = async () => {
      if (!templateId) return;
      
      try {
        const response = await listDocuments(templateId);
        console.log('Document list response:', response);

        // Get the documents array from the response
        const documents = response.documents || [];
        
        // Split documents by type
        setExistingDocs({
          ancillary_documents: documents.filter(doc => doc.document_type === 'ancillary'),
          guide_proposals: documents.filter(doc => doc.document_type === 'guide_proposals')
        });
      } catch (error) {
        console.error('Error fetching existing documents:', error);
        setUploadStatus('Error fetching existing documents');
      }
    };

    fetchExistingDocuments();
  }, [templateId]);

  const handleAncillaryDocsChange = (event) => {
    setAncillaryDocs(Array.from(event.target.files));
  };

  const handleUpload = async () => {
    if (!templateId) {
      setUploadStatus('No template ID provided');
      return;
    }

    setUploadStatus('Uploading...');
    try {
      let uploadResponse;
      if (ancillaryDocs.length > 0) {
        uploadResponse = await uploadAncillaryDocs(ancillaryDocs, templateId);
        console.log('Ancillary docs response:', uploadResponse);
      }
      if (guideProposals.length > 0) {
        uploadResponse = await uploadGuideProposals(guideProposals, templateId);
        console.log('Guide proposals response:', uploadResponse);
      }
      setUploadStatus('Documents uploaded successfully');
      
      // Refresh document list
      const response = await listDocuments(templateId);
      console.log('Document list response:', response);

      // Handle nested documents structure
      const documentsList = response?.documents?.documents || [];
      
      setExistingDocs({
        ancillary_documents: documentsList.filter(doc => doc && doc.document_type === 'ancillary') || [],
        guide_proposals: documentsList.filter(doc => doc && doc.document_type === 'guide_proposals') || []
      });

      // Clear file inputs
      setAncillaryDocs([]);
      setGuideProposals([]);
    } catch (error) {
      console.error('Error uploading documents:', error);
      setUploadStatus(`Error: ${error.message}`);
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'completed':
        return <CheckCircleOutline color="success" />;
      case 'processing':
        return <WorkHistoryOutlined size={20} />;
      case 'failed':
        return <ErrorOutline color="error" />;
      default:
        return <PendingActions />;
    }
  };

  // Handle Google Docs import completion
  const handleImportComplete = async (response) => {
    if (response && response.success) {
      setUploadStatus('Document imported successfully from Google Docs');
      
      // Refresh document list
      const listResponse = await listDocuments(templateId);
      
      // Update the document list
      const documentsList = listResponse?.documents || [];
      
      setExistingDocs({
        ancillary_documents: documentsList.filter(doc => doc.document_type === 'ancillary') || [],
        guide_proposals: documentsList.filter(doc => doc.document_type === 'guide_proposals') || []
      });
    }
  };

  return (
    <GoogleAuthProvider>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>Reference Documents</Typography>
        
        <Box mb={2}>
          <Typography variant="subtitle1" gutterBottom>Ancillary Documents:</Typography>
          <List>
            {existingDocs.ancillary_documents.length > 0 ? (
              existingDocs.ancillary_documents.map((doc) => (
                <ListItem key={doc.id}>
                  <ListItemIcon>
                    {getStatusIcon(doc.processing_status)}
                  </ListItemIcon>
                  <ListItemText 
                    primary={doc.name}
                    secondary={doc.processing_status}
                  />
                  {doc.file_path && (
                    <Link 
                      href={`${process.env.REACT_APP_API_BASE_URL}/${doc.file_path}`}
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      Download
                    </Link>
                  )}
                </ListItem>
              ))
            ) : (
              <ListItem>
                <ListItemText primary="No ancillary documents uploaded" />
              </ListItem>
            )}
          </List>
          
          <Grid container spacing={2} alignItems="center">
            <Grid item>
              <Typography variant="body2">Add Files from Your Computer:</Typography>
              <input 
                type="file" 
                multiple 
                onChange={handleAncillaryDocsChange}
                style={{ marginBottom: '8px' }} 
              />
            </Grid>
            <Grid item>
              <Typography variant="body2">Or Import from Google Docs:</Typography>
              <GoogleDocsImport 
                templateId={templateId} 
                documentType="ancillary" 
                onImportComplete={handleImportComplete}
              />
            </Grid>
          </Grid>
        </Box>
        
        <Divider sx={{ my: 2 }} />
        
        <Box mb={2}>
          <Typography variant="subtitle1" gutterBottom>Background & Research Guides:</Typography>
          <List>
            {existingDocs.guide_proposals.length > 0 ? (
              existingDocs.guide_proposals.map((doc) => (
                <ListItem key={doc.id}>
                  <ListItemIcon>
                    {getStatusIcon(doc.processing_status)}
                  </ListItemIcon>
                  <ListItemText 
                    primary={doc.name}
                    secondary={doc.processing_status}
                  />
                  {doc.file_path && (
                    <Link 
                      href={`${process.env.REACT_APP_API_BASE_URL}/${doc.file_path}`}
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      Download
                    </Link>
                  )}
                </ListItem>
              ))
            ) : (
              <ListItem>
                <ListItemText primary="No guide proposals uploaded" />
              </ListItem>
            )}
          </List>
          
          <Grid container spacing={2} alignItems="center">
            <Grid item>
              <Typography variant="body2">Add Files from Your Computer:</Typography>
              <input 
                type="file" 
                multiple 
                onChange={(e) => setGuideProposals(Array.from(e.target.files))}
                style={{ marginBottom: '8px' }} 
              />
            </Grid>
            <Grid item>
              <Typography variant="body2">Or Import from Google Docs:</Typography>
              <GoogleDocsImport 
                templateId={templateId} 
                documentType="guide_proposals" 
                onImportComplete={handleImportComplete}
              />
            </Grid>
          </Grid>
        </Box>
        
        <Button 
          variant="contained" 
          color="primary" 
          onClick={handleUpload}
          disabled={!templateId || (ancillaryDocs.length === 0 && guideProposals.length === 0)}
        >
          Upload Documents
        </Button>
        <Typography variant="body2" sx={{ mt: 1 }}>{uploadStatus}</Typography>
      </Paper>
    </GoogleAuthProvider>
  );
};

export default DocumentUpload;
