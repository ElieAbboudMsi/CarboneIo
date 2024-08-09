import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [templates, setTemplates] = useState([]);
  const [templateFile, setTemplateFile] = useState(null);
  const [templateName, setTemplateName] = useState('');
  const [templateExtension, setTemplateExtension] = useState('pdf');
  const [renderData, setRenderData] = useState({});
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [renderResult, setRenderResult] = useState(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await axios.get('http://localhost:5000/get-templates');
      setTemplates(response.data.templates);
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onloadend = () => {
      setTemplateFile(reader.result.split(',')[1]);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadTemplate = async () => {
    try {
      const response = await axios.post('http://localhost:5000/add-template', {
        templateName,
        templateExtension,
        templateBase64: templateFile
      });
      alert(response.data.message);
      fetchTemplates();
    } catch (error) {
      console.error('Error uploading template:', error);
    }
  };

  const handleRenderTemplate = async () => {
    try {
      const response = await axios.post(`http://localhost:5000/render-template/${selectedTemplate}`, renderData, {
        responseType: 'json'
      });
      if (response.data.status === 1) {
        setRenderResult(response.data.result);
      }
      alert(response.data.message);
    } catch (error) {
      console.error('Error rendering template:', error);
    }
  };

  const handleDownloadTemplate = async (templateId) => {
    try {
      const response = await axios.get(`http://localhost:5000/download-template/${templateId}`);
      const link = document.createElement('a');
      link.href = `data:application/octet-stream;base64,${response.data.templateContent}`;
      link.download = templateId;
      link.click();
    } catch (error) {
      console.error('Error downloading template:', error);
    }
  };

  const handleDeleteTemplate = async (templateId) => {
    try {
      const response = await axios.delete(`http://localhost:5000/delete-template/${templateId}`);
      alert(response.data.message);
      fetchTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Carbone Template Management</h1>

        <div>
          <h2>Upload Template</h2>
          <input
            type="text"
            placeholder="Template Name"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
          />
          <input
            type="text"
            placeholder="Template Extension (e.g., docx)"
            value={templateExtension}
            onChange={(e) => setTemplateExtension(e.target.value)}
          />
          <input
            type="file"
            onChange={handleFileChange}
          />
          <button onClick={handleUploadTemplate}>Upload Template</button>
        </div>

        <div>
          <h2>Render Template</h2>
          <select onChange={(e) => setSelectedTemplate(e.target.value)}>
            <option value="">Select Template</option>
            {templates.map((template) => (
              <option key={template} value={template}>{template}</option>
            ))}
          </select>
          <textarea
            placeholder='Enter JSON data'
            onChange={(e) => setRenderData(JSON.parse(e.target.value))}
          />
          <button onClick={handleRenderTemplate}>Render Template</button>
          {renderResult && (
            <a
              href={`data:application/pdf;base64,${renderResult}`}
              download="rendered-template.pdf"
            >
              Download Rendered Template
            </a>
          )}
        </div>

        <div>
          <h2>Manage Templates</h2>
          <ul>
            {templates.map((template) => (
              <li key={template}>
                {template}
                <button onClick={() => handleDownloadTemplate(template)}>Download</button>
                <button onClick={() => handleDeleteTemplate(template)}>Delete</button>
              </li>
            ))}
          </ul>
        </div>
      </header>
    </div>
  );
}

export default App;
