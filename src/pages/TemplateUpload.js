import React, { useState } from 'react';
import { uploadTemplate } from '../services/api';

const TemplateUpload = () => {
  const [file, setFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');
  const [originalTemplate, setOriginalTemplate] = useState(null);
  const [enrichedTemplate, setEnrichedTemplate] = useState(null);
  const [aiResponse, setAiResponse] = useState('');
  const [templateId, setTemplateId] = useState(null);

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) {
      setUploadStatus('Please select a file');
      return;
    }

    try {
      setUploadStatus('Uploading...');
      const response = await uploadTemplate(file);
      setUploadStatus('Template uploaded, processed, and enriched successfully');
      setOriginalTemplate(response.original_template);
      setEnrichedTemplate(response.enriched_template);
      setTemplateId(response.template_id);
    } catch (error) {
      console.error('Error in handleUpload:', error);
      setUploadStatus(`Error: ${error.message}`);
    }
  };

  const renderTemplate = (template, title) => (
    <div>
      <h2>{title}</h2>
      <h3>Sections:</h3>
      <ul>
        {template.sections.map((section, index) => (
          <li key={index}>
            <strong>{section.name}</strong>
            <ul>
              <li>Content Type: {section.content_type}</li>
              <li>Instructions: {section.instructions}</li>
              <li>Constraints: {JSON.stringify(section.constraints)}</li>
            </ul>
          </li>
        ))}
      </ul>
      <h3>One-off Information:</h3>
      <ul>
        {template.one_off_info.map((field, index) => (
          <li key={index}>
            <strong>{field.name}</strong>
            <ul>
              <li>Content Type: {field.content_type}</li>
              <li>Description: {field.description}</li>
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <div>
      <h1>Template Upload</h1>
      <input type="file" accept=".docx" onChange={handleFileChange} />
      <button onClick={handleUpload}>Upload Template</button>
      <p>{uploadStatus}</p>
      {templateId && (
        <div>
          <h2>Template ID: {templateId}</h2>
          <p>Please save this ID to use when filling in one-off information later.</p>
        </div>
      )}
      {originalTemplate && renderTemplate(originalTemplate, "Original Processed Template")}
      {enrichedTemplate && renderTemplate(enrichedTemplate, "AI-Enriched Template")}
      {aiResponse && (
        <div>
          <h2>Raw AI Response</h2>
          <pre>{aiResponse}</pre>
        </div>
      )}
    </div>
  );
};

export default TemplateUpload;