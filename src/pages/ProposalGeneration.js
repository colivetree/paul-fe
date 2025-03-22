import React, { useState, useEffect } from 'react';
import { 
  Button, TextField, Typography, Box, List, ListItem, ListItemText, Container, Grid, Card, CardContent, 
  Accordion, AccordionSummary, AccordionDetails, Drawer, AppBar, Toolbar, IconButton, Paper, Tabs, Tab,
  Dialog, DialogTitle, DialogContent, DialogActions, DialogContentText
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
  submitOneOffInfo, submitPitch, createProposal, getProposal, updatePrePlan, updatePlan, updateProposalSection,
  createNewProposal, updateProposalName, updateTemplate, improveTemplate, deleteProposal, improvePitch
} from '../services/api';
import '../styles/Markdown.css';
import { Edit as EditIcon, Save as SaveIcon, Delete as DeleteIcon } from '@mui/icons-material';
import TabPanel from '../components/TabPanel';
import { LoadingButton } from '@mui/lab';
import { AutoFixHigh as AutoFixHighIcon } from '@mui/icons-material';
import PitchSection from '../components/PitchSection';
import TemplateSection from '../components/TemplateSection';

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
  const [tabValue, setTabValue] = useState(0);
  const [editingName, setEditingName] = useState(false);
  const [proposalName, setProposalName] = useState('');
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [isTemplateLoading, setIsTemplateLoading] = useState(false);
  const [isTemplateImproving, setIsTemplateImproving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

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
      console.log('Selected proposal:', proposal);
      const [fetchedTemplate, fetchedPrePlan, fetchedPlan, fetchedProposal] = await Promise.all([
        getTemplate(proposal.template_id),
        getProposalPrePlan(proposal.proposal_id),
        getProposalPlan(proposal.proposal_id),
        getProposal(proposal.proposal_id)
      ]);
      console.log('Setting state with:', {
        template: fetchedTemplate,
        prePlan: fetchedPrePlan,
        plan: fetchedPlan,
        proposal: fetchedProposal
      });
      
      // Set states with a callback to verify
      setTemplate(prev => {
        console.log('Setting template:', fetchedTemplate);
        return fetchedTemplate;
      });
      setPrePlan(prev => {
        console.log('Setting prePlan:', fetchedPrePlan);
        return fetchedPrePlan;
      });
      setPlan(prev => {
        console.log('Setting plan:', fetchedPlan);
        return fetchedPlan;
      });
      setGeneratedProposal(prev => {
        console.log('Setting generatedProposal:', fetchedProposal);
        return fetchedProposal;
      });
      setPitch(fetchedProposal.pitch || '');
      setOneOffInfo(fetchedProposal.one_off_info || {});
      
      // Switch to proposal tab after loading
      setTabValue(3);
    } catch (error) {
      console.error('Error fetching proposal details:', error);
      setStatus('Error fetching proposal details');
    }
  };

  const handleNewProposal = async () => {
    try {
      setStatus('Creating new proposal...');
      const result = await createNewProposal();
      
      // Set initial states
      setSelectedProposal(result.proposal);
      setTemplate(result.template);
      setPrePlan(null);
      setPlan(null);
      setGeneratedProposal(null);
      setPitch('');
      setOneOffInfo({});
      setTabValue(0); // Switch to template tab
      setStatus('New proposal created successfully');
      
      // Refresh proposals list
      await fetchProposals();
    } catch (error) {
      console.error('Error creating new proposal:', error);
      setStatus('Error creating new proposal');
    }
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
            setGeneratedProposal((prev) => {
              const updatedSections = Array.isArray(prev) ? [...prev, message.data] : [message.data];
              return { ...prev, sections: updatedSections };
            });
            setStatus(`Generated section: ${message.data.name}`);
            break;
          case 'complete':
            setGeneratedProposal(message.data);
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
      await resetProposalPart(selectedProposal.proposal_id, part);
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

  const handleNameEdit = () => {
    setProposalName(selectedProposal.name);
    setEditingName(true);
  };

  const handleNameSave = async () => {
    try {
      const updatedProposal = await updateProposalName(selectedProposal.proposal_id, proposalName);
      setSelectedProposal(updatedProposal);
      setEditingName(false);
      setStatus('Proposal name updated successfully');
    } catch (error) {
      setStatus('Error updating proposal name');
    }
  };

  const handleEditTemplate = () => {
    if (!template) {
      setStatus('No template to edit');
      return;
    }
    const templateCopy = {
      ...JSON.parse(JSON.stringify(template))
    };
    console.log('Editing template:', templateCopy);
    setEditingTemplate(templateCopy);
    setTemplateDialogOpen(true);
  };

  const handleSaveTemplate = async (templateToSave) => {
    // Use the passed template or fall back to editingTemplate
    const templateData = templateToSave || editingTemplate;
    
    if (!templateData?.sections) {
      console.log('Invalid template structure:', templateData);
      setStatus('Invalid template structure');
      return;
    }

    setIsTemplateLoading(true);
    try {
      console.log('Attempting to save template:', {
        templateId: template.id,
        templateData: templateData,
        sections: templateData.sections
      });
      const updatedTemplate = await updateTemplate(template.id, templateData);
      console.log('Received updated template:', updatedTemplate);
      setTemplate(updatedTemplate);
      setTemplateDialogOpen(false);
      setStatus('Template updated successfully');
    } catch (error) {
      console.error('Error in handleSaveTemplate:', error);
      setStatus(`Error updating template: ${error.message}`);
    } finally {
      setIsTemplateLoading(false);
    }
  };

  const handleImproveTemplate = async () => {
    if (!selectedProposal?.pitch) {
      setStatus('Please add a pitch before improving the template');
      return;
    }

    setIsTemplateImproving(true);
    try {
      setStatus('Improving template with AI...');
      const improvedTemplate = await improveTemplate(
        template.id,
        selectedProposal.pitch,
        selectedProposal.name
      );
      setTemplate(improvedTemplate);
      setStatus('Template improved successfully');
    } catch (error) {
      setStatus(`Error improving template: ${error.message}`);
    } finally {
      setIsTemplateImproving(false);
    }
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteProposal(selectedProposal.proposal_id);
      setDeleteDialogOpen(false);
      setSelectedProposal(null);
      await fetchProposals(); // Refresh the list
      setStatus('Proposal deleted successfully');
    } catch (error) {
      setStatus('Error deleting proposal');
    }
  };

  const renderResearchPlan = (researchPlan, expandedSection, handleChange, proposalId, setPrePlan, setStatus) => {
    console.log('Rendering research plan:', researchPlan);
    
    return (
      <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
        <Accordion expanded={expandedSection === 'researchPlan'} onChange={handleChange('researchPlan')}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">Research Plan</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ mb: 2 }}>
              <Button variant="outlined" color="secondary" onClick={() => handleResetPart('pre-plan')}>
                Reset Research Plan
              </Button>
            </Box>
            {Object.entries(researchPlan).map(([sectionName, sectionData]) => (
              <Accordion key={sectionName}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography>{sectionName}</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Box sx={{ width: '100%', maxWidth: '100%', overflowX: 'auto' }}>
                    {Object.entries(sectionData).map(([key, items]) => (
                      <div key={key}>
                        <Typography variant="subtitle1">{key}:</Typography>
                        <List>
                          {Array.isArray(items) && items.map((item, index) => (
                            <ListItem key={index}>
                              <ListItemText primary={item} />
                            </ListItem>
                          ))}
                        </List>
                      </div>
                    ))}
                    {renderEditableSection('pre-plan', sectionName, sectionData)}
                  </Box>
                </AccordionDetails>
              </Accordion>
            ))}
          </AccordionDetails>
        </Accordion>
      </Paper>
    );
  };

  const renderPlan = (plan, expandedSection, handleChange, proposalId, setPlan, setStatus) => {
    console.log('Rendering plan:', plan);
    
    return (
      <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
        <Accordion expanded={expandedSection === 'plan'} onChange={handleChange('plan')}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">Plan</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ mb: 2 }}>
              <Button variant="outlined" color="secondary" onClick={() => handleResetPart('plan')}>
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
                      {Array.isArray(planItems) && planItems.map((item, index) => (
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

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const TemplateEditDialog = () => {
    // Local state for editing - initialized when dialog opens
    const [localSections, setLocalSections] = useState([]);

    // Initialize local state when dialog opens
    useEffect(() => {
      if (templateDialogOpen && editingTemplate?.sections) {
        console.log('Initializing localSections with:', editingTemplate.sections);
        setLocalSections(editingTemplate.sections.map(section => ({ ...section })));
      }
    }, [templateDialogOpen, editingTemplate]);

    const handleSectionChange = (index, field, value) => {
      console.log('Section change:', { index, field, value });
      setLocalSections(prev => {
        const updated = [...prev];
        updated[index] = { ...updated[index], [field]: value };
        console.log('Updated localSections:', updated);
        return updated;
      });
    };

    const handleAddSection = () => {
      setLocalSections(prev => [
        ...prev,
        { name: '', content_type: 'text', instructions: '', constraints: {} }
      ]);
    };

    const handleDeleteSection = (index) => {
      setLocalSections(prev => prev.filter((_, i) => i !== index));
    };

    const handleSave = () => {
      console.log('Save clicked, current state:', {
        localSections,
        editingTemplate
      });

      // Create the updated template object
      const updatedTemplate = {
        ...editingTemplate,
        sections: localSections
      };
      
      console.log('About to save template:', updatedTemplate);
      
      // Update the state and save in one go
      setEditingTemplate(updatedTemplate);
      
      // Pass the updated template directly to handleSaveTemplate
      // instead of relying on the state update
      handleSaveTemplate(updatedTemplate);
    };

    return (
      <Dialog 
        open={templateDialogOpen} 
        onClose={() => !isTemplateLoading && setTemplateDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Edit Template Structure</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle1" gutterBottom>Sections</Typography>
            <List>
              {localSections.map((section, index) => (
                <ListItem key={index}>
                  <Box sx={{ width: '100%' }}>
                    <TextField
                      fullWidth
                      label="Section Name"
                      value={section.name || ''}
                      onChange={(e) => handleSectionChange(index, 'name', e.target.value)}
                      error={!section.name}
                      helperText={!section.name && "Section name is required"}
                      sx={{ mb: 1 }}
                    />
                    <TextField
                      fullWidth
                      label="Instructions"
                      value={section.instructions || ''}
                      onChange={(e) => handleSectionChange(index, 'instructions', e.target.value)}
                      multiline
                      rows={2}
                    />
                  </Box>
                  <IconButton 
                    onClick={() => handleDeleteSection(index)}
                    disabled={isTemplateLoading}
                  >
                    <DeleteIcon />
                  </IconButton>
                </ListItem>
              ))}
              <ListItem>
                <Button
                  startIcon={<AddIcon />}
                  onClick={handleAddSection}
                  disabled={isTemplateLoading}
                >
                  Add Section
                </Button>
              </ListItem>
            </List>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setTemplateDialogOpen(false)}
            disabled={isTemplateLoading}
          >
            Cancel
          </Button>
          <LoadingButton 
            loading={isTemplateLoading}
            onClick={handleSave}
            variant="contained"
            disabled={!localSections.every(section => section.name)}
          >
            Save
          </LoadingButton>
        </DialogActions>
      </Dialog>
    );
  };

  const handleImproveWithAI = async () => {
    try {
      setStatus('Improving pitch with AI...');
      const improvedPitch = await improvePitch(selectedProposal.proposal_id, pitch);
      setPitch(improvedPitch);
      setStatus('Pitch improved successfully. Review and submit if you like the changes.');
    } catch (error) {
      console.error('Error improving pitch:', error);
      setStatus('Error improving pitch');
    }
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
            <ListItem onClick={handleNewProposal} sx={{ cursor: 'pointer' }}>
              <ListItemText primary="Create New Proposal" />
              <AddIcon />
            </ListItem>
            {console.log('Rendering proposals:', proposals)}
            {Array.isArray(proposals) && proposals.length > 0 ? (
              proposals.map((proposal) => {
                console.log('Rendering proposal:', proposal);
                return (
                  <ListItem 
                    key={proposal.proposal_id} 
                    onClick={() => handleProposalSelect(proposal)}
                    selected={selectedProposal?.proposal_id === proposal.proposal_id}
                    sx={{ cursor: 'pointer' }}
                  >
                    <ListItemText 
                      primary={proposal.name}
                      secondary={`Template ID: ${proposal.template_id || 'None'}`}
                    />
                  </ListItem>
                );
              })
            ) : (
              <ListItem>
                <ListItemText primary="No proposals found" />
              </ListItem>
            )}
          </List>
        </Box>
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar />
        {selectedProposal && (
          <>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              mb: 3 
            }}>
              <Box>
                {editingName ? (
                  <TextField
                    value={proposalName}
                    onChange={(e) => setProposalName(e.target.value)}
                    InputProps={{
                      endAdornment: (
                        <Button onClick={handleNameSave}>Save</Button>
                      ),
                    }}
                  />
                ) : (
                  <Box 
                    onClick={handleNameEdit}
                    sx={{ 
                      cursor: 'pointer',
                      '&:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.04)'
                      },
                      display: 'flex',
                      alignItems: 'center',
                      p: 1,
                      borderRadius: 1
                    }}
                  >
                    <Typography variant="h5" component="div">
                      {selectedProposal.name}
                    </Typography>
                    <EditIcon sx={{ ml: 1, fontSize: '0.8em' }} />
                  </Box>
                )}
              </Box>

              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={handleDeleteClick}
              >
                Delete Proposal
              </Button>
            </Box>

            <Tabs value={tabValue} onChange={handleTabChange}>
              <Tab label="Pitch" />
              <Tab label="Template" />
              <Tab label="Documents" />
              <Tab label="Proposal" />
            </Tabs>

            <TabPanel value={tabValue} index={1}>
              <TemplateSection 
                template={template}
                handleEditTemplate={handleEditTemplate}
                handleImproveTemplate={handleImproveTemplate}
                handleTemplateUpload={handleTemplateUpload}
                isTemplateLoading={isTemplateLoading}
                isTemplateImproving={isTemplateImproving}
                selectedProposal={selectedProposal}
                handleOneOffInfoSubmit={handleOneOffInfoSubmit}
                generatedProposal={generatedProposal}
              />
            </TabPanel>

            <TabPanel value={tabValue} index={0}>
              <PitchSection 
                pitch={pitch}
                setPitch={setPitch}
                handlePitchSubmit={handlePitchSubmit}
                handleImproveWithAI={handleImproveWithAI}
              />
            </TabPanel>

            <TabPanel value={tabValue} index={2}>
              <DocumentUpload 
                templateId={selectedProposal.template_id} 
                proposalId={selectedProposal.proposal_id}
              />
            </TabPanel>

            <TabPanel value={tabValue} index={3}>
              {console.log('Rendering proposal tab with:', { prePlan, plan, generatedProposal })}
              
              {/* Research Plan Section */}
              {prePlan ? (
                <>
                  {console.log('Rendering research plan with:', prePlan)}
                  {renderResearchPlan(prePlan, expandedSection, handleChange, selectedProposal.proposal_id, setPrePlan, setStatus)}
                </>
              ) : (
                <Typography>No research plan available</Typography>
              )}

              {/* Plan Section */}
              {plan ? (
                <>
                  {console.log('Rendering plan with:', plan)}
                  {renderPlan(plan, expandedSection, handleChange, selectedProposal.proposal_id, setPlan, setStatus)}
                </>
              ) : (
                <Typography>No plan available</Typography>
              )}

              {/* Generated Proposal Section */}
              {generatedProposal && generatedProposal.sections && (
                <>
                  {console.log('Rendering generated proposal with:', generatedProposal)}
                  <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
                    <Typography variant="h6" gutterBottom>Generated Proposal</Typography>
                    <Button 
                      variant="outlined" 
                      color="secondary" 
                      onClick={() => handleResetPart('proposal')} 
                      disabled={!generatedProposal}
                      sx={{ mb: 2 }}
                    >
                      Reset Proposal
                    </Button>
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
                </>
              )}

              {/* Action Buttons */}
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

              {/* Review Section */}
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
            </TabPanel>
          </>
        )}
        <Typography variant="body1" sx={{ mt: 2 }}>
          {status}
        </Typography>
        <TemplateEditDialog />
        <Dialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
        >
          <DialogTitle>Delete Proposal</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to delete this proposal? This action cannot be undone.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleDeleteConfirm} color="error" autoFocus>
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
};

export default ProposalGeneration;