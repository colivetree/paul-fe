import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';
const WS_BASE_URL = API_BASE_URL.replace(/^http/, 'ws');

console.log('API_BASE_URL:', API_BASE_URL);
console.log('WS_BASE_URL:', WS_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
});

export const uploadTemplate = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  try {
    console.log('Sending request to:', `${API_BASE_URL}/upload-template`);
    const response = await api.post('/upload-template', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    console.log('Response received:', response);
    return response.data;
  } catch (error) {
    console.error('Error uploading template:', error);
    if (error.response) {
      console.error('Error response:', error.response);  // Add this line
      throw new Error(error.response.data.detail || 'Server error');
    } else if (error.request) {
      console.error('Error request:', error.request);  // Add this line
      throw new Error('No response received from server');
    } else {
      throw new Error('Error setting up the request');
    }
  }
};

export const uploadAncillaryDocs = async (files, templateId) => {
  const formData = new FormData();
  formData.append('template_id', templateId);
  files.forEach((file) => formData.append('files', file));
  try {
    const response = await api.post('/upload-ancillary-docs', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error uploading ancillary documents:', error);
    throw error;
  }
};

export const uploadGuideProposals = async (files, templateId) => {
  const formData = new FormData();
  formData.append('template_id', templateId);
  files.forEach((file) => formData.append('files', file));
  try {
    const response = await api.post('/upload-guide-proposals', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error uploading guide proposals:', error);
    throw error;
  }
};

export const generateProposal = (templateId, oneOffInfo, pitch, onSectionGenerated, onComplete, onError) => {
  let socket;
  let heartbeatInterval;

  const connect = () => {
    socket = new WebSocket(`${WS_BASE_URL}/ws/generate-proposal`);

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
  };

  connect();

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
    const response = await api.get(`/get-template/${templateId}`);
    return response.data;
  } catch (error) {
    console.error('Error getting template:', error);
    if (error.response && error.response.status === 404) {
      throw new Error(`Template with ID ${templateId} not found`);
    }
    throw error;
  }
};

export const submitOneOffInfo = async (templateId, oneOffInfo) => {
  try {
    const response = await api.post(`/submit-one-off-info/${templateId}`, { oneOffInfo });
    return response.data;
  } catch (error) {
    console.error('Error submitting one-off information:', error);
    throw error;
  }
};

export const getOneOffInfo = async (templateId) => {
  try {
    const response = await api.get(`/get-one-off-info/${templateId}`);
    return response.data.one_off_info;
  } catch (error) {
    console.error('Error getting one-off information:', error);
    throw error;
  }
};

export const getProposals = async () => {
  try {
    const response = await api.get('/list-proposals');
    console.log("API response for listProposals:", response.data); // Add this line for debugging
    return response.data.proposals || [];
  } catch (error) {
    console.error('Error fetching proposals:', error);
    throw error;
  }
};

export const listDocuments = async (templateId) => {
  try {
    const response = await api.get(`/list-documents/${templateId}`);
    return response.data;
  } catch (error) {
    console.error('Error listing documents:', error);
    throw error;
  }
};

export const reviewProposal = async (templateId, proposal) => {
  try {
    const response = await api.post(`/review-proposal/${templateId}`, { sections: proposal });
    return response.data.review;
  } catch (error) {
    console.error('Error reviewing proposal:', error);
    throw error;
  }
};

export const getProposal = async (proposalId) => {
  try {
    const response = await api.get(`/get-proposal/${proposalId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching proposal:', error);
    throw error;
  }
};

export const planProposal = (templateId, pitch, oneOffInfo, onPrePlanGenerated, onPlanGenerated, onComplete, onError) => {
  const socket = new WebSocket(`${WS_BASE_URL}/ws/plan-proposal/${templateId}`);

  socket.onopen = () => {
    console.log('WebSocket connection opened for planning');
    // Send initial data
    socket.send(JSON.stringify({ pitch, oneOffInfo }));
  };

  socket.onmessage = (event) => {
    const message = JSON.parse(event.data);
    console.log('Received message:', message);

    if (message.type === 'pre_plan') {
      onPrePlanGenerated(message.data);
    } else if (message.type === 'plan') {
      onPlanGenerated(message.data);
    } else if (message.type === 'complete') {
      onComplete(message.pre_plan, message.plan);
    } else if (message.type === 'error') {
      onError(message.message);
    }
  };

  socket.onerror = (error) => {
    console.error('WebSocket error:', error);
    onError('WebSocket error: ' + error.message);
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
};

export const getProposalPrePlan = async (templateId) => {
  try {
    const response = await api.get(`/get-proposal-pre-plan/${templateId}`);
    console.log('Pre-plan response:', response.data);
    return response.data.pre_plan;
  } catch (error) {
    console.error('Error fetching proposal pre-plan:', error);
    throw error;
  }
};

export const getProposalPlan = async (templateId) => {
  try {
    const response = await api.get(`/get-proposal-plan/${templateId}`);
    console.log('Plan response:', response.data);
    return response.data.plan;
  } catch (error) {
    console.error('Error fetching proposal plan:', error);
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

export const submitPitch = async (templateId, pitch) => {
  try {
    const response = await api.post(`/submit-pitch/${templateId}`, { pitch });
    return response.data;
  } catch (error) {
    console.error('Error submitting pitch:', error);
    throw error;
  }
};