import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { extractTemplateVariables, instantiateTemplate } from '../lib/templateUtils';
import './TemplatePreviewModal.css';

/**
 * TemplatePreviewModal Component
 * Displays template details, collects variable values, and dispatches workflow creation event
 */
function TemplatePreviewModal({ template, onClose }) {
  const [variables, setVariables] = useState({});
  const [variableNames, setVariableNames] = useState([]);
  const [isInserting, setIsInserting] = useState(false);

  // Extract variables from template on mount
  useEffect(() => {
    if (template) {
      const extracted = extractTemplateVariables(template);
      setVariableNames(extracted);
      
      // Initialize with empty values
      const initialValues = {};
      extracted.forEach(varName => {
        initialValues[varName] = '';
      });
      setVariables(initialValues);
    }
  }, [template]);

  const handleVariableChange = (varName, value) => {
    setVariables(prev => ({
      ...prev,
      [varName]: value
    }));
  };

  const handleInsert = () => {
    if (!template) return;

    setIsInserting(true);

    try {
      // Instantiate the template with variable values
      const instantiated = instantiateTemplate(template, variables);

      // Dispatch custom event for Builder to listen to
      const event = new CustomEvent('clolabs-create-sample', {
        detail: {
          workflow: instantiated,
          template: template,
          variables: variables
        }
      });

      window.dispatchEvent(event);

      // Close modal after short delay
      setTimeout(() => {
        setIsInserting(false);
        onClose();
      }, 300);
    } catch (error) {
      console.error('Failed to instantiate template:', error);
      setIsInserting(false);
      alert('Failed to insert template. Please try again.');
    }
  };

  const canInsert = () => {
    // Check if all variables have values
    return variableNames.every(varName => {
      const value = variables[varName];
      return value && value.trim().length > 0;
    });
  };

  if (!template) return null;

  return (
    <div className="template-modal-overlay" onClick={onClose}>
      <div className="template-modal" onClick={(e) => e.stopPropagation()}>
        <div className="template-modal-header">
          <div>
            <h2 className="template-modal-title">{template.name || 'Template Preview'}</h2>
            {template.description && (
              <p className="template-modal-description">{template.description}</p>
            )}
          </div>
          <button className="template-modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="template-modal-content">
          {/* Template Info */}
          <div className="template-info-section">
            <div className="template-stat">
              <span className="template-stat-label">Nodes</span>
              <span className="template-stat-value">{template.nodes?.length || 0}</span>
            </div>
            <div className="template-stat">
              <span className="template-stat-label">Connections</span>
              <span className="template-stat-value">{template.connections?.length || 0}</span>
            </div>
            {template.category && (
              <div className="template-stat">
                <span className="template-stat-label">Category</span>
                <span className="template-stat-value">{template.category}</span>
              </div>
            )}
          </div>

          {/* Variables Section */}
          {variableNames.length > 0 ? (
            <div className="template-variables-section">
              <h3 className="template-section-title">Configure Variables</h3>
              <p className="template-section-description">
                Fill in the following variables to customize your workflow
              </p>
              
              <div className="template-variables-list">
                {variableNames.map(varName => (
                  <div key={varName} className="template-variable-item">
                    <label className="template-variable-label">
                      {varName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </label>
                    <input
                      type="text"
                      className="template-variable-input"
                      placeholder={`Enter ${varName}...`}
                      value={variables[varName] || ''}
                      onChange={(e) => handleVariableChange(varName, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="template-no-variables">
              <p>This template has no configurable variables. Click Insert to add it to your workflow.</p>
            </div>
          )}

          {/* Tags */}
          {template.tags && template.tags.length > 0 && (
            <div className="template-tags-section">
              <h3 className="template-section-title">Tags</h3>
              <div className="template-tags">
                {template.tags.map((tag, index) => (
                  <span key={index} className="template-tag">{tag}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="template-modal-footer">
          <button className="template-modal-cancel" onClick={onClose}>
            Cancel
          </button>
          <button 
            className="template-modal-insert" 
            onClick={handleInsert}
            disabled={variableNames.length > 0 && !canInsert() || isInserting}
          >
            {isInserting ? 'Inserting...' : 'Insert Template'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default TemplatePreviewModal;
