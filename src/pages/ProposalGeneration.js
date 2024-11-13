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
  submitOneOffInfo, submitPitch, createProposal, getProposal, updatePrePlan, updatePlan, updateProposalSection
} from '../services/api';
import '../styles/Markdown.css';
import { Edit as EditIcon, Save as SaveIcon } from '@mui/icons-material';

const drawerWidth = 240;

const globalStyles = {
  '& pre': {
    maxWidth: '100%',
    overflowX: 'auto',
    whiteSpace: 'pre-wrap',
    wordWrap: 'break-word'
  },
  '& .MuiAccordionDetails-root': {
    maxWidth: '100%',
    padding: '16px'
  }
};

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
  const [expandedSection, setExpandedSection] = useState(null);
  const [generatingProposal, setGeneratingProposal] = useState(false);
  const [isPrePlanComplete, setIsPrePlanComplete] = useState(false);
  const [isPlanComplete, setIsPlanComplete] = useState(false);
  const [isProposalComplete, setIsProposalComplete] = useState(false);
  const [proposalReview, setProposalReview] = useState(null);
  const [editingSection, setEditingSection] = useState(null);
  const [editingContent, setEditingContent] = useState('');

  const handleChange = (panel) => (event, isExpanded) => {
    setExpandedSection(isExpanded ? panel : null);
  };

  useEffect(() => {
    fetchProposals();
  }, []);

  useEffect(() => {
    checkPrePlanComplete();
  }, [prePlan, template]);

  useEffect(() => {
    checkPlanComplete();
  }, [plan, template]);

  useEffect(() => {
    checkProposalComplete();
  }, [generatedProposal, template]);

  const checkPrePlanComplete = () => {
    if (!prePlan || !template) return;
    
    // Parse prePlan if it's a string
    const parsedPrePlan = typeof prePlan === 'string' ? JSON.parse(prePlan) : prePlan;
    
    // Count the top-level keys in the parsed pre-plan object
    const prePlanSections = Object.keys(parsedPrePlan).length;
    const templateSections = template.sections.length;
    
    console.log("Pre-plan sections:", prePlanSections);
    console.log("Template sections:", templateSections);
    console.log("Pre-plan structure:", JSON.stringify(parsedPrePlan, null, 2));
    
    setIsPrePlanComplete(prePlanSections === templateSections);
  };

  const checkPlanComplete = () => {
    if (!plan || !template) return;
    const planSections = Object.keys(plan).length;
    const templateSections = template.sections.length;
    console.log("Plan sections:", planSections);
    console.log("Template sections:", templateSections);
    setIsPlanComplete(planSections === templateSections);
  };

  const checkProposalComplete = () => {
    if (!generatedProposal || !template) return;
    if (!generatedProposal.sections) return;
    const proposalSections = generatedProposal.sections.length;
    const templateSections = template.sections.length;
    console.log("Proposal sections:", proposalSections);
    console.log("Template sections:", templateSections);
    setIsProposalComplete(proposalSections === templateSections);
  };

  const fetchProposals = async () => {
    try {
      const fetchedProposals = await getProposals();
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
      const [fetchedTemplate, fetchedPrePlan, fetchedPlan, fetchedProposal] = await Promise.all([
        getTemplate(proposal.template_id),
        getProposalPrePlan(proposal.proposal_id),
        getProposalPlan(proposal.proposal_id),
        getProposal(proposal.proposal_id)
      ]);
      console.log('Fetched Template:', fetchedTemplate);
      console.log('Fetched Pre-Plan:', fetchedPrePlan);
      console.log('Fetched Plan:', fetchedPlan);
      console.log('Fetched Proposal:', fetchedProposal);
      setTemplate(fetchedTemplate);
      setPrePlan(fetchedPrePlan);
      setPlan(fetchedPlan);
      setGeneratedProposal(fetchedProposal);
      setPitch(fetchedProposal.pitch || '');
      setOneOffInfo(fetchedProposal.one_off_info || {});
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
      const newProposal = await createProposal(templateId); // Add this line      
      
      const [fetchedTemplate, fetchedPrePlan, fetchedPlan, fetchedProposal] = await Promise.all([
        getTemplate(newProposal.template_id),
        getProposalPrePlan(newProposal.proposal_id),
        getProposalPlan(newProposal.proposal_id),
        getProposal(newProposal.proposal_id)
      ]);
      console.log('Fetched Template:', fetchedTemplate);
      console.log('Fetched Pre-Plan:', fetchedPrePlan);
      console.log('Fetched Plan:', fetchedPlan);
      setTemplate(fetchedTemplate);
      setPrePlan(fetchedPrePlan);
      setPlan(fetchedPlan);
      setGeneratedProposal(fetchedProposal);
      setPitch(fetchedProposal.pitch || '');
      setOneOffInfo(fetchedProposal.one_off_info || {});
      setStatus('New proposal created successfully');
    } catch (error) {
      console.error('Error creating new proposal:', error);
      setStatus('Error creating new proposal');
    }
  };

  const handleOneOffInfoSubmit = async (info) => {
    setOneOffInfo(info);
    try {
      await submitOneOffInfo(selectedProposal.proposal_id, info);
      setStatus('One-off information submitted successfully');
    } catch (error) {
      console.error('Error submitting one-off information:', error);
      setStatus('Error submitting one-off information');
    }
  };

  const handlePitchSubmit = async () => {
    try {
      await submitPitch(selectedProposal.proposal_id, pitch);
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
      const planningResult = await new Promise((resolve, reject) => {
        planProposal(
          selectedProposal.proposal_id,
          pitch,
          oneOffInfo,
          (prePlan) => setPrePlan(prePlan),
          (plan) => setPlan(plan),
          (prePlan, plan) => resolve({ prePlan, plan }),
          (error) => reject(error)
        );
      });
      setPrePlan(planningResult.prePlan);
      setPlan(planningResult.plan);
      setStatus('Proposal planned successfully');
    } catch (error) {
      console.error('Error planning proposal:', error);
      setStatus('Error planning proposal');
    }
  };

  const handleGenerateProposal = async () => {
    if (!selectedProposal) return;
    setGeneratingProposal(true);
    setStatus('Generating proposal...');
    try {
      console.log('Attempting to open WebSocket connection...');
      const socket = new WebSocket(`${process.env.REACT_APP_API_BASE_URL}/ws/generate-proposal`);
  
      socket.onopen = () => {
        console.log('WebSocket connection opened for proposal generation');
        console.log('Sending proposal data:', JSON.stringify({
          proposal_id: selectedProposal.proposal_id
        }));
        socket.send(JSON.stringify({
          proposal_id: selectedProposal.proposal_id
        }));
      };
  
      socket.onmessage = (event) => {
        const message = JSON.parse(event.data);
        console.log('Received message:', message);
  
        switch (message.type) {
          case 'section':
            setGeneratedProposal((prev) => [...(prev || []), message.data]);
            setStatus(`Generated section: ${message.data.name}`);
            break;
          case 'complete':
            setGeneratedProposal(message.data.sections);
            setStatus('Proposal generation completed');
            setGeneratingProposal(false);
            break;
          case 'error':
            setStatus(`Error: ${message.message}`);
            setGeneratingProposal(false);
            break;
          case 'heartbeat':
            console.log(`Received heartbeat: ${message.count}`);
            break;
          default:
            console.log('Received unknown message type:', message.type);
        }
      };
  
      socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        setStatus('Error generating proposal');
        setGeneratingProposal(false);
      };
  
      socket.onclose = (event) => {
        console.log('WebSocket connection closed:', event.code, event.reason);
        if (!event.wasClean) {
          setStatus('WebSocket connection closed unexpectedly');
        }
        setGeneratingProposal(false);
      };
  
    } catch (error) {
      console.error('Error generating proposal:', error);
      setStatus('Error generating proposal');
      setGeneratingProposal(false);
    }
  };  

  const handleReviewProposal = async () => {
    try {
      setStatus('Reviewing proposal...');
      console.log('Generated Proposal:', generatedProposal);
      const review = await reviewProposal(generatedProposal.proposal_id, generatedProposal);
      setProposalReview(review);
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

  const handleStartEdit = (sectionType, sectionName, content) => {
    setEditingSection({ type: sectionType, name: sectionName });
    setEditingContent(JSON.stringify(content, null, 2));
  };

  const handleSaveEdit = async () => {
    try {
      setStatus('Saving changes...');
      
      // Parse content if needed
      let parsedContent = editingContent;
      if (editingSection.type !== 'proposal') {
        try {
          parsedContent = JSON.parse(editingContent);
        } catch (error) {
          setStatus('Error: Invalid JSON format');
          return;
        }
      }

      // Save based on section type
      if (editingSection.type === 'pre-plan') {
        await updatePrePlan(selectedProposal.proposal_id, editingSection.name, parsedContent);
      } else if (editingSection.type === 'plan') {
        await updatePlan(selectedProposal.proposal_id, editingSection.name, parsedContent);
      } else if (editingSection.type === 'proposal') {
        await updateProposalSection(selectedProposal.proposal_id, editingSection.name, parsedContent);
      }

      // Refresh the proposal data
      const updatedProposal = await getProposal(selectedProposal.proposal_id);
      setPrePlan(updatedProposal.pre_plan);
      setPlan(updatedProposal.plan);
      setGeneratedProposal(updatedProposal);

      // Clear edit mode
      setEditingSection(null);
      setEditingContent('');
      setStatus('Changes saved successfully');
    } catch (error) {
      setStatus(`Error saving changes: ${error.message}`);
    }
  };

  const renderResearchPlan = (researchPlan, expandedSection, handleChange, proposalId, setPrePlan, setStatus) => {
    let parsedPlan;
    try {
      parsedPlan = typeof researchPlan === 'string' ? JSON.parse(researchPlan) : researchPlan;
    } catch (error) {
      console.error('Error parsing research plan:', error);
      return (
        <Paper elevation={3} sx={{ p: 2, mb: 2, bgcolor: '#ffebee' }}>
          <Typography color="error" variant="h6" gutterBottom>Error: Invalid Research Plan Data</Typography>
          <Typography>
            Unable to parse the research plan data. Please check the data format.
          </Typography>
        </Paper>
      );
    }

    if (!parsedPlan || typeof parsedPlan !== 'object') {
      console.error('Invalid research plan data:', parsedPlan);
      return (
        <Paper elevation={3} sx={{ p: 2, mb: 2, bgcolor: '#ffebee' }}>
          <Typography color="error" variant="h6" gutterBottom>Error: Invalid Research Plan Data</Typography>
          <Typography>
            The research plan data is not in the expected format.
          </Typography>
        </Paper>
      );
    }

    const handleReset = async () => {
      try {
        setStatus('Resetting research plan...');
        await resetProposalPart(proposalId, 'pre_plan');
        setPrePlan(null);
        setStatus('Research plan reset successfully');
      } catch (error) {
        console.error('Error resetting research plan:', error);
        setStatus('Error resetting research plan');
      }
    };

    return (
      <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
        <Accordion expanded={expandedSection === 'researchPlan'} onChange={handleChange('researchPlan')}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">Research Plan</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ mb: 2 }}>
              <Button variant="outlined" color="secondary" onClick={handleReset}>
                Reset Research Plan
              </Button>
            </Box>
            {Object.entries(parsedPlan).map(([sectionName, sectionData]) => {
              const contentHighlights = sectionData?.content_highlights || [];
              const prepNotes = sectionData?.proposal_prep_notes || [];
              const styleNotes = sectionData?.tone_style_notes || [];

              return (
                <Accordion key={sectionName}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>{sectionName}</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Box sx={{ width: '100%', maxWidth: '100%', overflowX: 'auto' }}>
                      <Typography variant="subtitle1">Content Highlights:</Typography>
                      <List>
                        {contentHighlights.map((item, index) => (
                          <ListItem key={index}>
                            <ListItemText primary={item} />
                          </ListItem>
                        ))}
                      </List>
                      <Typography variant="subtitle1">Proposal Prep Notes:</Typography>
                      <List>
                        {prepNotes.map((item, index) => (
                          <ListItem key={index}>
                            <ListItemText primary={item} />
                          </ListItem>
                        ))}
                      </List>
                      <Typography variant="subtitle1">Tone & Style Notes:</Typography>
                      <List>
                        {styleNotes.map((item, index) => (
                          <ListItem key={index}>
                            <ListItemText primary={item} />
                          </ListItem>
                        ))}
                      </List>
                      {renderEditableSection('pre-plan', sectionName, sectionData)}
                    </Box>
                  </AccordionDetails>
                </Accordion>
              );
            })}
          </AccordionDetails>
        </Accordion>
      </Paper>
    );
  };

  const renderPlan = (plan, expandedSection, handleChange, proposalId, setPlan, setStatus) => {
    const handleReset = async () => {
      try {
        setStatus('Resetting plan...');
        await resetProposalPart(proposalId, 'plan');
        setPlan(null);
        setStatus('Plan reset successfully');
      } catch (error) {
        console.error('Error resetting plan:', error);
        setStatus('Error resetting plan');
      }
    };

    if (!plan || typeof plan !== 'object') {
      console.error('Invalid plan data:', plan);
      return (
        <Paper elevation={3} sx={{ p: 2, mb: 2, bgcolor: '#ffebee' }}>
          <Typography color="error" variant="h6" gutterBottom>Error: Invalid Plan Data</Typography>
          <Typography>
            The plan data is not in the expected format.
          </Typography>
        </Paper>
      );
    }

    return (
      <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
        <Accordion expanded={expandedSection === 'plan'} onChange={handleChange('plan')}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">Plan</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ mb: 2 }}>
              <Button variant="outlined" color="secondary" onClick={handleReset}>
                Reset Plan
              </Button>
            </Box>
            {Object.entries(plan).map(([sectionName, planItems]) => (
              <Accordion key={sectionName}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography>{sectionName}</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Box sx={{ width: '100%', maxWidth: '100%', overflowX: 'auto' }}>
                    <List>
                      {planItems.map((item, index) => (
                        <ListItem key={index}>
                          <ListItemText primary={item} />
                        </ListItem>
                      ))}
                    </List>
                    {renderEditableSection('plan', sectionName, planItems)}
                  </Box>
                </AccordionDetails>
              </Accordion>
            ))}
          </AccordionDetails>
        </Accordion>
      </Paper>
    );
  };

  const renderEditableSection = (sectionType, sectionName, content) => {
    const isEditing = editingSection?.type === sectionType && editingSection?.name === sectionName;

    return (
      <Box sx={{ 
        position: 'relative', 
        width: '100%', 
        maxWidth: '100%', 
        overflowX: 'auto',
        mt: 2,
        pr: 6
      }}>
        {isEditing ? (
          <Box sx={{ position: 'relative' }}>
            <TextField
              fullWidth
              multiline
              rows={10}
              value={editingContent}
              onChange={(e) => setEditingContent(e.target.value)}
              sx={{ mb: 2 }}
            />
            <IconButton 
              onClick={handleSaveEdit}
              sx={{ 
                position: 'absolute',
                top: 0,
                right: 0,
                zIndex: 2,
                bgcolor: 'background.paper',
                '&:hover': {
                  bgcolor: 'action.hover'
                }
              }}
            >
              <SaveIcon />
            </IconButton>
          </Box>
        ) : (
          <Box sx={{ 
            position: 'relative', 
            width: '100%',
            minHeight: '40px'
          }}>
            <IconButton 
              onClick={() => handleStartEdit(sectionType, sectionName, content)}
              sx={{ 
                position: 'absolute',
                top: 0,
                right: 0,
                zIndex: 2,
                bgcolor: 'background.paper',
                '&:hover': {
                  bgcolor: 'action.hover'
                }
              }}
            >
              <EditIcon />
            </IconButton>
          </Box>
        )}
      </Box>
    );
  };

  return (
    <Box sx={{ display: 'flex', ...globalStyles }}>
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
          <Box sx={{ display: 'flex', flexDirection: 'row', gap: 3, alignItems: 'flex-end' }}>
            <Typography variant="h6" noWrap component="div">
              PAUL by Nomad River
            </Typography>
            <Typography variant="subtitle1" component="div">
              Proposal Automation Library
            </Typography>
          </Box>
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
            <ListItem button onClick={handleNewProposal}>
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
                <OneOffInfoForm templateId={selectedProposal.template_id} proposalId={selectedProposal.proposal_id} onSubmit={handleOneOffInfoSubmit} />
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
                <DocumentUpload templateId={selectedProposal.template_id} />
              </Grid>
            </Grid>
            {prePlan && renderResearchPlan(prePlan, expandedSection, handleChange, selectedProposal.proposal_id, setPrePlan, setStatus)}
            {plan && renderPlan(plan, expandedSection, handleChange, selectedProposal.proposal_id, setPlan, setStatus)}
            {generatedProposal && generatedProposal.sections && (
              <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
                <Typography variant="h6" gutterBottom>Generated Proposal</Typography>
                <Button variant="outlined" color="secondary" onClick={() => handleResetPart('proposal')} disabled={!generatedProposal}>Reset Proposal</Button>
                {generatedProposal.sections.map((section) => (
                  <Accordion key={section.name}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography>{section.name}</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Box sx={{ width: '100%', maxWidth: '100%', overflowX: 'auto' }}>
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{section.content}</ReactMarkdown>
                        {renderEditableSection('proposal', section.name, section.content)}
                      </Box>
                    </AccordionDetails>
                  </Accordion>
                ))}
              </Paper>
            )}
            <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
              {!isPrePlanComplete && (
                <Button 
                  variant="contained" 
                  color="primary" 
                  onClick={handlePlanProposal}
                  disabled={!template}
                >
                  {prePlan ? 'Continue Planning' : 'Plan Proposal'}
                </Button>
              )}
              
              {isPrePlanComplete && !isPlanComplete && (
                <Button 
                  variant="contained" 
                  color="primary" 
                  onClick={handlePlanProposal}
                  disabled={!template}
                >
                  Continue Planning
                </Button>
              )}
              
              {isPlanComplete && !isProposalComplete && (
                <Button 
                  variant="contained" 
                  color="primary" 
                  onClick={handleGenerateProposal}
                  disabled={!plan}
                >
                  {generatedProposal ? 'Continue Generating' : 'Generate Proposal'}
                </Button>
              )}
              
              {isProposalComplete && (
                <Button 
                  variant="contained" 
                  color="secondary" 
                  onClick={handleReviewProposal}
                >
                  Review Proposal
                </Button>
              )}
            </Box>
            {proposalReview && (
  <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
    <Typography variant="h6" gutterBottom>Proposal Review</Typography>
    <Typography variant="subtitle1" gutterBottom>Overall Assessment</Typography>
    <Typography paragraph>{proposalReview.overall_assessment}</Typography>
    
    <Typography variant="subtitle1" gutterBottom>Criteria Assessment</Typography>
    {proposalReview.criteria_addressed.map((criterion, index) => (
      <Accordion key={index}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>{criterion.criterion}</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body2" gutterBottom><strong>Assessment:</strong></Typography>
          <Typography paragraph>{criterion.assessment}</Typography>
          <Typography variant="body2" gutterBottom><strong>Suggestions:</strong></Typography>
          <Typography>{criterion.suggestions}</Typography>
        </AccordionDetails>
      </Accordion>
    ))}
    
    {proposalReview.missing_elements.length > 0 && (
      <>
        <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>Missing Elements</Typography>
        {proposalReview.missing_elements.map((element, index) => (
          <Accordion key={index}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography>{element.element}</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography>{element.suggestion}</Typography>
            </AccordionDetails>
          </Accordion>
        ))}
      </>
    )}
    
    {proposalReview.general_improvements.length > 0 && (
      <>
        <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>General Improvements</Typography>
        <ul>
          {proposalReview.general_improvements.map((improvement, index) => (
            <li key={index}><Typography>{improvement}</Typography></li>
          ))}
        </ul>
      </>
    )}
  </Paper>
)}
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