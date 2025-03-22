import axios from 'axios';

// Debug environment variables early
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('REACT_APP_API_BASE_URL:', process.env.REACT_APP_API_BASE_URL);
console.log('window.RUNTIME_CONFIG:', window.RUNTIME_CONFIG);

// Use runtime config if available, otherwise fall back to determining from location
const getBaseUrl = () => {
  // Use runtime config values if available (set during build)
  if (window.RUNTIME_CONFIG && window.RUNTIME_CONFIG.API_BASE_URL) {
    console.log('Using API_BASE_URL from runtime config:', window.RUNTIME_CONFIG.API_BASE_URL);
    return window.RUNTIME_CONFIG.API_BASE_URL;
  }
  
  // If we're running locally, use relative URLs
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    console.log('Using relative API_BASE_URL for localhost');
    return '/api';
  }
  
  // In production, use the provided env var or fallback to production URL
  const envUrl = process.env.REACT_APP_API_BASE_URL || 'https://paul-service.nomadriver.co';
  console.log('Using API_BASE_URL from env var:', envUrl);
  return envUrl;
};

// Use runtime config for WebSocket if available, otherwise derive from API URL
const getWsBaseUrl = () => {
  if (window.RUNTIME_CONFIG && window.RUNTIME_CONFIG.WS_BASE_URL) {
    console.log('Using WS_BASE_URL from runtime config:', window.RUNTIME_CONFIG.WS_BASE_URL);
    return window.RUNTIME_CONFIG.WS_BASE_URL;
  }
  
  // Derive from API URL
  const baseUrl = getBaseUrl();
  const wsUrl = baseUrl.replace(/^http/, 'ws').replace(/^https/, 'wss');
  console.log('Derived WS_BASE_URL:', wsUrl);
  return wsUrl;
};

const API_BASE_URL = getBaseUrl();
const WS_BASE_URL = getWsBaseUrl();

// Final URL information
console.log('Final API_BASE_URL:', API_BASE_URL);
console.log('Final WS_BASE_URL:', WS_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  }
});

const createWebSocketConnection = (url, handlers) => {
  const socket = new WebSocket(url);
  
  socket.onerror = (error) => {
    console.error('WebSocket error:', error);
    if (handlers.onError) {
      handlers.onError('WebSocket connection error');
    }
  };

  socket.onclose = (event) => {
    console.log('WebSocket closed:', event);
    if (!event.wasClean && handlers.onError) {
      handlers.onError('WebSocket connection closed unexpectedly');
    }
  };

  return socket;
};

export const uploadTemplate = async (file, templateId) => {
  const formData = new FormData();
  formData.append('file', file);
  try {
    console.log('Sending request to:', `${API_BASE_URL}/templates/${templateId}/upload-template`);
    const response = await api.post(`/templates/${templateId}/upload-template`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    console.log('Response received:', response);
    return response.data;
  } catch (error) {
    console.error('Error uploading template:', error);
    if (error.response) {
      console.error('Error response:', error.response);
      throw new Error(error.response.data.detail || 'Server error');
    } else if (error.request) {
      console.error('Error request:', error.request);
      throw new Error('No response received from server');
    } else {
      throw new Error('Error setting up the request');
    }
  }
};

export const uploadAncillaryDocs = async (files, templateId) => {
  try {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    
    const response = await api.post(
      `/templates/${templateId}/documents/ancillary`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error uploading ancillary documents:', error);
    throw error;
  }
};

export const uploadGuideProposals = async (files, templateId) => {
  try {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    
    const response = await api.post(
      `/templates/${templateId}/documents/guide-proposals`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error uploading guide proposals:', error);
    throw error;
  }
};

export const generateProposal = (templateId, oneOffInfo, pitch, onSectionGenerated, onComplete, onError) => {
  const wsUrl = `${WS_BASE_URL}/ws/generate-proposal`;
  const socket = createWebSocketConnection(wsUrl, { onError });
  let heartbeatInterval;

  socket.onopen = () => {
    console.log('WebSocket connection opened');
    const data = JSON.stringify({
      template_id: templateId,
      one_off_info: oneOffInfo,
      pitch: pitch
    });
    console.log('Sending data:', data);
    socket.send(data);
  };

  socket.onmessage = (event) => {
    const message = JSON.parse(event.data);
    console.log('Received message:', message);

    if (message.type === 'section') {
      onSectionGenerated(message.data);
    } else if (message.type === 'complete') {
      onComplete(message.data);
    } else if (message.type === 'error') {
      onError(message.message);
    } else if (message.type === 'heartbeat') {
      console.log('Received heartbeat:', message.count);
    }
  };

  socket.onerror = (error) => {
    console.error('WebSocket error:', error);
    onError('WebSocket error: ' + (error.message || 'Unknown error'));
    clearInterval(heartbeatInterval);
  };

  socket.onclose = (event) => {
    console.log('WebSocket connection closed:', event.code, event.reason);
    clearInterval(heartbeatInterval);
    if (!event.wasClean) {
      onError('WebSocket connection closed unexpectedly');
    }
  };

  return {
    stop: () => {
      console.log('Stopping proposal generation');
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'stop' }));
        socket.close();
      }
      clearInterval(heartbeatInterval);
    }
  };
};

export const saveTemplate = async (template) => {
  try {
    const response = await api.post('/save-template', template);
    return response.data;
  } catch (error) {
    console.error('Error saving template:', error);
    throw error;
  }
};

export const getTemplate = async (templateId) => {
  try {
    const response = await api.get(`/templates/${templateId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching template:', error);
    throw error;
  }
};

export const submitOneOffInfo = async (proposalId, oneOffInfo) => {
  try {
    const response = await api.put(`/proposals/${proposalId}`, { one_off_info: oneOffInfo });
    return response.data;
  } catch (error) {
    console.error('Error submitting one-off information:', error);
    throw error;
  }
};

export const getOneOffInfo = async (proposalId) => {
  try {
    const response = await api.get(`/get-one-off-info/${proposalId}`);
    return response.data.one_off_info;
  } catch (error) {
    console.error('Error getting one-off information:', error);
    throw error;
  }
};

export const getProposals = async () => {
  try {
    console.log('Fetching proposals...');
    const response = await api.get('/list-proposals');
    console.log('Raw response:', response.data);
    
    // The response has a 'proposals' object with proposal IDs as keys
    const proposalsObj = response.data.proposals || {};
    
    // Convert the object to an array
    const proposalsArray = Object.keys(proposalsObj).map(id => ({
      ...proposalsObj[id],
      proposal_id: parseInt(id)  // Ensure proposal_id is set from the key
    }));
    
    console.log('Processed proposals array:', proposalsArray);
    return proposalsArray;
  } catch (error) {
    console.error('Error fetching proposals:', error);
    throw error;
  }
};

export const listDocuments = async (templateId) => {
  try {
    const response = await api.get(`/templates/${templateId}/documents`);
    return response.data;
  } catch (error) {
    console.error('Error listing documents:', error);
    throw error;
  }
};

export const reviewProposal = async (proposalId, proposal) => {
  try {
    const response = await api.post(`/review-proposal/${proposalId}`, { sections: proposal });
    return response.data.review;
  } catch (error) {
    console.error('Error reviewing proposal:', error);
    throw error;
  }
};

export const getProposal = async (proposalId) => {
  try {
    console.log('Fetching proposal:', proposalId);
    const response = await api.get(`/proposals/${proposalId}`);
    console.log('Proposal response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching proposal:', error);
    throw error;
  }
};

export const planProposal = (templateId, pitch, oneOffInfo, onPrePlanGenerated, onPlanGenerated, onComplete, onError) => {
  const wsUrl = `${WS_BASE_URL}/ws/plan-proposal/${templateId}`;
  console.log('Attempting to connect to WebSocket:', wsUrl);
  
  try {
    const socket = new WebSocket(wsUrl);
    
    socket.onopen = () => {
      console.log('WebSocket connection opened for planning');
      try {
        const data = JSON.stringify({ pitch, oneOffInfo });
        console.log('Sending data:', data);
        socket.send(data);
      } catch (error) {
        console.error('Error sending data:', error);
        onError('Error sending data to server');
      }
    };

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log('Received message:', message);

        switch(message.type) {
          case 'pre_plan':
            onPrePlanGenerated(message.data);
            break;
          case 'plan':
            onPlanGenerated(message.data);
            break;
          case 'complete':
            onComplete(message.pre_plan, message.plan);
            break;
          case 'error':
            onError(message.message);
            break;
          default:
            console.log('Unknown message type:', message.type);
        }
      } catch (error) {
        console.error('Error parsing message:', error);
        onError('Error parsing server message');
      }
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      onError(`WebSocket error: ${error.message || 'Unknown error'}`);
    };

    socket.onclose = (event) => {
      console.log('WebSocket connection closed:', event.code, event.reason);
      if (!event.wasClean) {
        onError('WebSocket connection closed unexpectedly');
      }
    };

    return {
      stop: () => {
        if (socket.readyState === WebSocket.OPEN) {
          socket.close();
        }
      }
    };
  } catch (error) {
    console.error('Error creating WebSocket:', error);
    onError(`Error creating WebSocket: ${error.message}`);
    return { stop: () => {} };
  }
};

export const getProposalPrePlan = async (proposalId) => {
  try {
    console.log('Fetching pre-plan:', proposalId);
    const response = await api.get(`/proposals/${proposalId}/pre-plan`);
    console.log('Pre-plan response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching pre-plan:', error);
    throw error;
  }
};

export const getProposalPlan = async (proposalId) => {
  try {
    console.log('Fetching plan:', proposalId);
    const response = await api.get(`/proposals/${proposalId}/plan`);
    console.log('Plan response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching plan:', error);
    throw error;
  }
};

export const resetProposalPart = async (templateId, part) => {
  try {
    const response = await api.post(`/reset-proposal-part/${templateId}`, { part });
    return response.data;
  } catch (error) {
    console.error(`Error resetting ${part}:`, error);
    throw error;
  }
};

export const submitPitch = async (proposalId, pitch) => {
  try {
    const response = await api.post(`/proposals/${proposalId}/pitch`, { pitch });
    return response.data;
  } catch (error) {
    console.error('Error submitting pitch:', error);
    throw error;
  }
};

export const getTemplates = async () => {
  try {
    const response = await api.get('/list-templates');
    return response.data.templates;
  } catch (error) {
    console.error('Error fetching templates:', error);
    throw error;
  }
};

export const createProposal = async (templateId = null, name = null) => {
  try {
    const response = await api.post('/proposals', { 
      template_id: templateId,
      name: name 
    });
    return response.data;
  } catch (error) {
    console.error('Error creating proposal:', error);
    throw error;
  }
};

export const updatePrePlan = async (proposalId, sectionName, content) => {
  try {
    const response = await api.post(`/update-pre-plan/${proposalId}`, {
      section_name: sectionName,
      content: content
    });
    return response.data;
  } catch (error) {
    console.error('Error updating pre-plan:', error);
    throw error;
  }
};

export const updatePlan = async (proposalId, sectionName, content) => {
  try {
    const response = await api.post(`/update-plan/${proposalId}`, {
      section_name: sectionName,
      content: content
    });
    return response.data;
  } catch (error) {
    console.error('Error updating plan:', error);
    throw error;
  }
};

export const updateProposalSection = async (proposalId, sectionName, content) => {
  try {
    const response = await api.post(`/update-proposal-section/${proposalId}`, {
      section_name: sectionName,
      content: content
    });
    return response.data;
  } catch (error) {
    console.error('Error updating proposal section:', error);
    throw error;
  }
};

export const improveTemplate = async (templateId, pitch, name) => {
  try {
    const response = await api.post(`/templates/${templateId}/improve`, {
      pitch,
      name
    });
    return response.data;
  } catch (error) {
    console.error('Error improving template:', error);
    throw error;
  }
};

export const generateTemplate = async (pitch, documentIds) => {
  try {
    const response = await api.post('/templates/generate', {
      pitch,
      document_ids: documentIds
    });
    return response.data;
  } catch (error) {
    console.error('Error generating template:', error);
    throw error;
  }
};

export const createNewProposal = async () => {
  try {
    // Create proposal (which includes template creation)
    const proposalResponse = await api.post('/proposals');
    const proposal = proposalResponse.data;
    
    return {
      proposal: proposal,
      template: await getTemplate(proposal.template_id)  // Get the template that was created
    };
  } catch (error) {
    console.error('Error creating new proposal:', error);
    throw error;
  }
};

export const updateProposalName = async (proposalId, name) => {
  try {
    const response = await api.put(`/proposals/${proposalId}/name`, { name });
    return response.data;
  } catch (error) {
    console.error('Error updating proposal name:', error);
    throw error;
  }
};

export const updateTemplate = async (templateId, template) => {
  try {
    console.log('API updateTemplate called with:', {
      templateId,
      template
    });
    const response = await api.put(`/templates/${templateId}`, template);
    console.log('API updateTemplate response:', response.data);
    return response.data;
  } catch (error) {
    console.error('API updateTemplate error:', error);
    throw error;
  }
};

export const deleteProposal = async (proposalId) => {
  try {
    const response = await api.delete(`/proposals/${proposalId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting proposal:', error);
    throw error;
  }
};

export const improvePitch = async (proposalId, pitch) => {
  try {
    const response = await api.post(`/proposals/${proposalId}/improve-pitch`, { pitch });
    return response.data.improved_pitch;
  } catch (error) {
    console.error('Error improving pitch:', error);
    throw error;
  }
};
