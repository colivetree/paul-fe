import React from 'react';
import { Button, Typography, Box, Paper } from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { Edit as EditIcon, AutoFixHigh as AutoFixHighIcon } from '@mui/icons-material';
import TemplateUpload from './TemplateUpload';
import OneOffInfoForm from './OneOffInfoForm';

const TemplateSection = ({ 
  template, 
  handleEditTemplate, 
  handleImproveTemplate, 
  handleTemplateUpload,
  isTemplateLoading,
  isTemplateImproving,
  selectedProposal,
  handleOneOffInfoSubmit,
  generatedProposal
}) => {
  return (
    <>
      <Paper elevation={3} sx={{ p: 2 }}>
        {template ? (
          <>
            <Typography variant="h6" gutterBottom>Current Template</Typography>
            <Box sx={{ mb: 2 }}>
              {template.sections?.length > 0 ? (
                template.sections.map((section, index) => (
                  <Box key={index} sx={{ mb: 1 }}>
                    <Typography variant="subtitle1">{section.name}</Typography>
                    <Typography variant="body2">{section.instructions}</Typography>
                  </Box>
                ))
              ) : (
                <Typography color="text.secondary">
                  No sections defined. Edit template or use AI to improve it.
                </Typography>
              )}
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <LoadingButton 
                loading={isTemplateLoading}
                variant="contained" 
                color="primary" 
                onClick={handleEditTemplate}
                startIcon={<EditIcon />}
              >
                Edit Template
              </LoadingButton>
              <LoadingButton
                loading={isTemplateImproving}
                variant="contained"
                color="secondary"
                onClick={handleImproveTemplate}
                disabled={!selectedProposal?.pitch}
                startIcon={<AutoFixHighIcon />}
              >
                Improve with AI
              </LoadingButton>
              <TemplateUpload 
                onUploadSuccess={handleTemplateUpload} 
                buttonProps={{ 
                  variant: "outlined",
                  disabled: isTemplateLoading || isTemplateImproving 
                }}
              />
            </Box>
          </>
        ) : (
          <TemplateUpload onUploadSuccess={handleTemplateUpload} />
        )}
      </Paper>

      {template && (
        <Box sx={{ mt: 2 }}>
          <OneOffInfoForm
            proposalId={selectedProposal.proposal_id}
            onSubmit={handleOneOffInfoSubmit}
            existingOneOffInfo={generatedProposal?.one_off_info}
          />
        </Box>
      )}
    </>
  );
};

export default TemplateSection; 