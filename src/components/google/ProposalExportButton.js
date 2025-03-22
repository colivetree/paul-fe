import React from 'react';
import { Box, Typography } from '@mui/material';
import { GoogleAuthProvider } from './GoogleAuthProvider';
import GoogleDocsExport from './GoogleDocsExport';

/**
 * ProposalExportButton - A component for exporting proposals to Google Docs
 */
const ProposalExportButton = ({ proposalId, proposalTitle }) => {
  return (
    <GoogleAuthProvider>
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2" gutterBottom>Export Options:</Typography>
        <GoogleDocsExport 
          proposalId={proposalId} 
          proposalTitle={proposalTitle} 
        />
      </Box>
    </GoogleAuthProvider>
  );
};

export default ProposalExportButton; 