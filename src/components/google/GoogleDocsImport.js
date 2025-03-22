import React, { useState, useEffect } from 'react';
import { 
  Button, 
  Typography, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemAvatar, 
  Avatar, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  CircularProgress,
  Box
} from '@mui/material';
import { Description as DocIcon } from '@mui/icons-material';
import { useGoogleAuth } from './GoogleAuthProvider';
import { listGoogleDocs, importGoogleDoc } from '../../services/googleApi';
import GoogleAuthButton from './GoogleAuthButton';

/**
 * GoogleDocsImport - A component to import Google Docs
 */
const GoogleDocsImport = ({ templateId, documentType = 'ancillary', onImportComplete }) => {
  const { isConnected, userId, loading: authLoading } = useGoogleAuth();
  const [documents, setDocuments] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState(null);
  const [open, setOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);

  // Load documents when dialog is opened
  const loadDocuments = async () => {
    if (!isConnected || !userId) return;
    
    try {
      setLoadingDocs(true);
      setError(null);
      
      const response = await listGoogleDocs(userId);
      
      setDocuments(response.documents || []);
    } catch (err) {
      console.error('Error loading Google Docs:', err);
      setError('Failed to load documents from Google Drive');
    } finally {
      setLoadingDocs(false);
    }
  };

  // Open dialog and load documents
  const handleOpen = () => {
    setOpen(true);
    loadDocuments();
  };

  // Close dialog and reset selection
  const handleClose = () => {
    setOpen(false);
    setSelectedDoc(null);
  };

  // Select a document
  const handleSelectDoc = (doc) => {
    setSelectedDoc(doc);
  };

  // Import the selected document
  const handleImport = async () => {
    if (!selectedDoc || !templateId || !userId) return;
    
    try {
      setImporting(true);
      setError(null);
      
      const response = await importGoogleDoc(
        userId, 
        selectedDoc.id, 
        templateId, 
        documentType
      );
      
      // Close dialog and reset selection
      handleClose();
      
      // Call the onImportComplete callback
      if (onImportComplete) {
        onImportComplete(response);
      }
    } catch (err) {
      console.error('Error importing Google Doc:', err);
      setError('Failed to import document from Google Drive');
    } finally {
      setImporting(false);
    }
  };

  return (
    <>
      {isConnected ? (
        <Button 
          variant="outlined" 
          onClick={handleOpen}
          startIcon={<DocIcon />}
          disabled={authLoading}
        >
          Import from Google Docs
        </Button>
      ) : (
        <Box mb={2}>
          <Typography variant="body2" gutterBottom>
            Connect to Google to import documents
          </Typography>
          <GoogleAuthButton size="small" />
        </Box>
      )}
      
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>Import from Google Docs</DialogTitle>
        <DialogContent dividers>
          {loadingDocs ? (
            <Box display="flex" justifyContent="center" py={3}>
              <CircularProgress />
            </Box>
          ) : documents.length === 0 ? (
            <Typography variant="body1">
              No Google Docs found in your account.
            </Typography>
          ) : (
            <List>
              {documents.map((doc) => (
                <ListItem 
                  key={doc.id} 
                  button 
                  selected={selectedDoc && selectedDoc.id === doc.id}
                  onClick={() => handleSelectDoc(doc)}
                >
                  <ListItemAvatar>
                    <Avatar>
                      <DocIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText 
                    primary={doc.name} 
                    secondary={`Last modified: ${new Date(doc.modifiedTime).toLocaleString()}`} 
                  />
                </ListItem>
              ))}
            </List>
          )}
          
          {error && (
            <Typography variant="body2" color="error" sx={{ mt: 2 }}>
              {error}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button 
            onClick={handleImport} 
            color="primary" 
            disabled={!selectedDoc || importing}
            startIcon={importing ? <CircularProgress size={20} /> : null}
          >
            {importing ? 'Importing...' : 'Import Selected Document'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default GoogleDocsImport; 