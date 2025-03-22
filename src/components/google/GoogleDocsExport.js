import React, { useState } from 'react';
import { 
  Button,
  Typography,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Link,
  Box
} from '@mui/material';
import { Google as GoogleIcon } from '@mui/icons-material';
import { useGoogleAuth } from './GoogleAuthProvider';
import { exportToGoogleDocs } from '../../services/googleApi';
import GoogleAuthButton from './GoogleAuthButton';

/**
 * GoogleDocsExport - A component to export proposals to Google Docs
 */
const GoogleDocsExport = ({ proposalId, proposalTitle }) => {
  const { isConnected, userId, loading: authLoading } = useGoogleAuth();
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [documentUrl, setDocumentUrl] = useState(null);
  const [open, setOpen] = useState(false);

  // Export the proposal to Google Docs
  const handleExport = async () => {
    if (!proposalId || !userId) return;
    
    try {
      setExporting(true);
      setError(null);
      setSuccess(false);
      setDocumentUrl(null);
      
      const response = await exportToGoogleDocs(userId, proposalId);
      
      setSuccess(true);
      setDocumentUrl(response.url);
      setOpen(true);
    } catch (err) {
      console.error('Error exporting to Google Docs:', err);
      setError('Failed to export proposal to Google Docs');
    } finally {
      setExporting(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <>
      {isConnected ? (
        <Button
          variant="outlined"
          color="primary"
          startIcon={exporting ? <CircularProgress size={20} /> : <GoogleIcon />}
          onClick={handleExport}
          disabled={exporting || authLoading || !proposalId}
        >
          {exporting ? 'Exporting...' : 'Export to Google Docs'}
        </Button>
      ) : (
        <Box mb={2}>
          <Typography variant="body2" gutterBottom>
            Connect to Google to export proposals
          </Typography>
          <GoogleAuthButton size="small" />
        </Box>
      )}
      
      {error && (
        <Typography variant="body2" color="error" sx={{ mt: 1 }}>
          {error}
        </Typography>
      )}
      
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Export Complete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Your proposal "{proposalTitle || `Proposal ${proposalId}`}" has been successfully exported to Google Docs.
          </DialogContentText>
          <Box mt={2}>
            <Link href={documentUrl} target="_blank" rel="noopener noreferrer">
              Open in Google Docs
            </Link>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="primary" autoFocus>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default GoogleDocsExport; 