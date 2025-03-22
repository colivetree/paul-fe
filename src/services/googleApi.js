import api from './api';

/**
 * Get Google authentication URL
 * @param {string} userId - User ID to associate with the auth flow
 * @returns {Promise<Object>} - Auth URL data
 */
export const getGoogleAuthUrl = async (userId) => {
  try {
    const response = await api.get(`/google/auth/url`, {
      params: { user_id: userId }
    });
    return response.data;
  } catch (error) {
    console.error('Error getting Google auth URL:', error);
    throw error;
  }
};

/**
 * Check Google connection status
 * @param {string} userId - User ID to check connection for
 * @returns {Promise<Object>} - Connection status and user info
 */
export const checkGoogleConnection = async (userId) => {
  try {
    const response = await api.post(`/google/auth/check`, {
      user_id: userId
    });
    return response.data;
  } catch (error) {
    console.error('Error checking Google connection:', error);
    throw error;
  }
};

/**
 * Revoke Google token
 * @param {string} userId - User ID to revoke token for
 * @returns {Promise<Object>} - Success status
 */
export const revokeGoogleToken = async (userId) => {
  try {
    const response = await api.post(`/google/auth/revoke`, {
      user_id: userId
    });
    return response.data;
  } catch (error) {
    console.error('Error revoking Google token:', error);
    throw error;
  }
};

/**
 * List user's Google Docs
 * @param {string} userId - User ID to list docs for
 * @returns {Promise<Object>} - List of documents
 */
export const listGoogleDocs = async (userId) => {
  try {
    const response = await api.post(`/google/docs/list`, {
      user_id: userId
    });
    return response.data;
  } catch (error) {
    console.error('Error listing Google Docs:', error);
    throw error;
  }
};

/**
 * Import Google Doc
 * @param {string} userId - User ID
 * @param {string} documentId - Google Doc ID to import
 * @param {number} templateId - Template ID to associate with
 * @param {string} documentType - Type of document (ancillary or guide_proposals)
 * @returns {Promise<Object>} - Imported document info
 */
export const importGoogleDoc = async (userId, documentId, templateId, documentType = 'ancillary') => {
  try {
    const response = await api.post(`/google/docs/import`, {
      user_id: userId,
      document_id: documentId,
      template_id: templateId,
      document_type: documentType
    });
    return response.data;
  } catch (error) {
    console.error('Error importing Google Doc:', error);
    throw error;
  }
};

/**
 * Export proposal to Google Docs
 * @param {string} userId - User ID
 * @param {number} proposalId - Proposal ID to export
 * @returns {Promise<Object>} - Exported document info
 */
export const exportToGoogleDocs = async (userId, proposalId) => {
  try {
    const response = await api.post(`/google/docs/export`, {
      user_id: userId,
      proposal_id: proposalId
    });
    return response.data;
  } catch (error) {
    console.error('Error exporting to Google Docs:', error);
    throw error;
  }
}; 