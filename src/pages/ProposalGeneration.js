import React, { useState, useEffect } from 'react';
import { 
  Button, TextField, Typography, Box, List, ListItem, ListItemText, Container, Grid, Card, CardContent, 
  Accordion, AccordionSummary, AccordionDetails, Drawer, AppBar, Toolbar, IconButton, Paper
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import AddIcon from '@mui/icons-material/Add';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import OneOffInfoForm from '../components/OneOffInfoForm';
import DocumentUpload from '../components/DocumentUpload';
import TemplateUpload from '../components/TemplateUpload';
import { 
  generateProposal, getProposals, getTemplate, getOneOffInfo, reviewProposal, 
  planProposal, getProposalPrePlan, getProposalPlan, resetProposalPart, uploadAncillaryDocs,
  submitOneOffInfo, submitPitch
} from '../services/api';
import '../styles/Markdown.css';

const drawerWidth = 240;

const ProposalGeneration = () => {
  const [proposals, setProposals] = useState([]);
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [template, setTemplate] = useState(null);
  const [oneOffInfo, setOneOffInfo] = useState({});
  const [pitch, setPitch] = useState('');
  const [prePlan, setPrePlan] = useState(null);
  const [plan, setPlan] = useState(null);
  const [generatedProposal, setGeneratedProposal] = useState(null);
  const [status, setStatus] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);

  const isPrePlanComplete = prePlan && Object.keys(prePlan).length === template?.sections.length;
  const isPlanComplete = plan && Object.keys(plan).length === template?.sections.length;
  const isProposalComplete = generatedProposal && generatedProposal.sections && generatedProposal.sections.length === template?.sections.length;

  useEffect(() => {
    fetchProposals();
  }, []);

  const fetchProposals = async () => {
    try {
      const fetchedProposals = await getProposals();
      console.log("Fetched proposals:", fetchedProposals); // Add this line for debugging
      setProposals(Array.isArray(fetchedProposals) ? fetchedProposals : []);
      setStatus('Proposals fetched successfully');
    } catch (error) {
      console.error('Error fetching proposals:', error);
      setStatus('Error fetching proposals');
      setProposals([]);
    }
  };

  const handleProposalSelect = async (proposal) => {
    setSelectedProposal(proposal);
    try {
      const [fetchedTemplate, fetchedPrePlan, fetchedPlan] = await Promise.all([
        getTemplate(proposal.template_id),
        getProposalPrePlan(proposal.template_id),
        getProposalPlan(proposal.template_id)
      ]);
      setTemplate(fetchedTemplate);
      setPrePlan(fetchedPrePlan);
      setPlan(fetchedPlan);
      setGeneratedProposal(proposal);
    } catch (error) {
      console.error('Error fetching proposal details:', error);
      setStatus('Error fetching proposal details');
    }
  };

  const handleNewProposal = () => {
    setSelectedProposal(null);
    setTemplate(null);
    setPrePlan(null);
    setPlan(null);
    setGeneratedProposal(null);
  };

  const handleTemplateUpload = async (templateId) => {
    try {
      const fetchedTemplate = await getTemplate(templateId);
      setTemplate(fetchedTemplate);
      setSelectedProposal({ template_id: templateId });
    } catch (error) {
      console.error('Error fetching template:', error);
      setStatus('Error fetching template');
    }
  };

  const handleOneOffInfoSubmit = async (info) => {
    setOneOffInfo(info);
    try {
      await submitOneOffInfo(selectedProposal.template_id, info);
      setStatus('One-off information submitted successfully');
    } catch (error) {
      console.error('Error submitting one-off information:', error);
      setStatus('Error submitting one-off information');
    }
  };

  const handlePitchSubmit = async () => {
    try {
      await submitPitch(selectedProposal.template_id, pitch);
      setStatus('Pitch submitted successfully');
    } catch (error) {
      console.error('Error submitting pitch:', error);
      setStatus('Error submitting pitch');
    }
  };

  const handleDocumentUpload = async (files) => {
    try {
      await uploadAncillaryDocs(files, selectedProposal.template_id);
      setStatus('Documents uploaded successfully');
    } catch (error) {
      console.error('Error uploading documents:', error);
      setStatus('Error uploading documents');
    }
  };

  const handlePlanProposal = async () => {
    try {
      setStatus('Planning proposal...');
      const [newPrePlan, newPlan] = await planProposal(selectedProposal.template_id, pitch, oneOffInfo);
      setPrePlan(newPrePlan);
      setPlan(newPlan);
      setStatus('Proposal planned successfully');
    } catch (error) {
      console.error('Error planning proposal:', error);
      setStatus('Error planning proposal');
    }
  };

  const handleGenerateProposal = async () => {
    try {
      setStatus('Generating proposal...');
      const proposal = await generateProposal(selectedProposal.template_id, oneOffInfo, pitch);
      setGeneratedProposal(proposal);
      setStatus('Proposal generated successfully');
    } catch (error) {
      console.error('Error generating proposal:', error);
      setStatus('Error generating proposal');
    }
  };

  const handleReviewProposal = async () => {
    try {
      setStatus('Reviewing proposal...');
      const reviewedProposal = await reviewProposal(selectedProposal.template_id);
      setGeneratedProposal(reviewedProposal);
      setStatus('Proposal reviewed successfully');
    } catch (error) {
      console.error('Error reviewing proposal:', error);
      setStatus('Error reviewing proposal');
    }
  };

  const handleResetPart = async (part) => {
    try {
      setStatus(`Resetting ${part}...`);
      await resetProposalPart(selectedProposal.template_id, part);
      if (part === 'pre-plan') setPrePlan(null);
      if (part === 'plan') setPlan(null);
      if (part === 'proposal') setGeneratedProposal(null);
      setStatus(`${part} reset successfully`);
    } catch (error) {
      console.error(`Error resetting ${part}:`, error);
      setStatus(`Error resetting ${part}`);
    }
  };

  const renderPrePlan = (prePlan) => {
    if (!prePlan) return null;
    return (
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">Pre-Plan</Typography>
          <Button onClick={(e) => { e.stopPropagation(); handleResetPart('pre-plan'); }} disabled={!prePlan}>Reset Pre-Plan</Button>
        </AccordionSummary>
        <AccordionDetails>
          {Object.entries(prePlan).map(([sectionName, sectionData]) => (
            <Accordion key={sectionName}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>{sectionName}</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="subtitle1">Content Highlights:</Typography>
                <List>
                  {sectionData.content_highlights.map((item, index) => (
                    <ListItem key={index}>
                      <ListItemText primary={item} />
                    </ListItem>
                  ))}
                </List>
                <Typography variant="subtitle1">Proposal Prep Notes:</Typography>
                <List>
                  {sectionData.proposal_prep_notes.map((item, index) => (
                    <ListItem key={index}>
                      <ListItemText primary={item} />
                    </ListItem>
                  ))}
                </List>
                <Typography variant="subtitle1">Tone & Style Notes:</Typography>
                <List>
                  {sectionData.tone_style_notes.map((item, index) => (
                    <ListItem key={index}>
                      <ListItemText primary={item} />
                    </ListItem>
                  ))}
                </List>
              </AccordionDetails>
            </Accordion>
          ))}
        </AccordionDetails>
      </Accordion>
    );
  };

  const renderPlan = (plan) => {
    if (!plan) return null;
    return (
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">Plan</Typography>
          <Button onClick={(e) => { e.stopPropagation(); handleResetPart('plan'); }} disabled={!plan}>Reset Plan</Button>
        </AccordionSummary>
        <AccordionDetails>
          {Object.entries(plan).map(([sectionName, sectionItems]) => (
            <Accordion key={sectionName}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>{sectionName}</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <List>
                  {sectionItems.map((item, index) => (
                    <ListItem key={index}>
                      <ListItemText primary={item} />
                    </ListItem>
                  ))}
                </List>
              </AccordionDetails>
            </Accordion>
          ))}
        </AccordionDetails>
      </Accordion>
    );
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={() => setDrawerOpen(!drawerOpen)}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div">
            PAUL - Proposal Automation Library by Nomad River
          </Typography>
        </Toolbar>
      </AppBar>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto' }}>
          <List>
            <ListItem button onClick={() => setSelectedProposal(null)}>
              <ListItemText primary="Create New Proposal" />
              <AddIcon />
            </ListItem>
            {proposals.map((proposal) => (
              <ListItem button key={proposal.proposal_id} onClick={() => handleProposalSelect(proposal)}>
                <ListItemText 
                  primary={`Proposal ${proposal.proposal_id}`}
                  secondary={`Template ID: ${proposal.template_id}`}
                />
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar />
        {!selectedProposal ? (
          <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
            <TemplateUpload onUploadSuccess={handleTemplateUpload} />
          </Paper>
        ) : (
          <>
            <Typography variant="h5" gutterBottom>
              Proposal {selectedProposal.proposal_id}
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <OneOffInfoForm templateId={selectedProposal.template_id} onSubmit={handleOneOffInfoSubmit} />
              </Grid>
              <Grid item xs={12} md={6}>
                <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
                  <Typography variant="h6" gutterBottom>Pitch</Typography>
                  <TextField
                    fullWidth
                    label="Pitch"
                    value={pitch}
                    onChange={(e) => setPitch(e.target.value)}
                    multiline
                    rows={4}
                    margin="normal"
                    variant="outlined"
                  />
                  <Box mt={2}>
                    <Button variant="contained" color="primary" onClick={handlePitchSubmit}>
                      Submit Pitch
                    </Button>
                  </Box>
                </Paper>
              </Grid>
              <Grid item xs={12}>
                <DocumentUpload templateId={selectedProposal.template_id} onUpload={handleDocumentUpload} />
              </Grid>
            </Grid>
            {prePlan && renderPrePlan(prePlan)}
            {plan && renderPlan(plan)}
            {generatedProposal && generatedProposal.sections && (
              <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
                <Typography variant="h6" gutterBottom>Generated Proposal</Typography>
                <Button onClick={() => handleResetPart('proposal')} disabled={!generatedProposal}>Reset Proposal</Button>
                {generatedProposal.sections.map((section) => (
                  <Accordion key={section.name}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography>{section.name}</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{section.content}</ReactMarkdown>
                    </AccordionDetails>
                  </Accordion>
                ))}
              </Paper>
            )}
            <Box mt={4}>
              {!isPrePlanComplete && (
                <Button variant="contained" color="primary" onClick={handlePlanProposal} disabled={!template} sx={{ mr: 1 }}>
                  {prePlan ? 'Continue Planning' : 'Plan Proposal'}
                </Button>
              )}
              {isPrePlanComplete && !isProposalComplete && (
                <Button variant="contained" color="primary" onClick={handleGenerateProposal} disabled={!plan} sx={{ mr: 1 }}>
                  {generatedProposal ? 'Continue Generating' : 'Generate Proposal'}
                </Button>
              )}
              {isProposalComplete && (
                <Button variant="contained" color="secondary" onClick={handleReviewProposal} sx={{ mr: 1 }}>
                  Review Proposal
                </Button>
              )}
            </Box>
          </>
        )}
        <Typography variant="body1" style={{ marginTop: '20px' }}>
          {status}
        </Typography>
      </Box>
    </Box>
  );
};

export default ProposalGeneration;
