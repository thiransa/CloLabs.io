import React, { useState } from 'react';
import { Save, Play, AlertCircle, CheckCircle2, Loader } from 'lucide-react';
import { sendChatMessage } from '../lib/openaiApi.js';
import '../Builder.css';

/**
 * GPT Node Editor Component
 * Allows configuration of GPT/AI processing nodes with test functionality
 * 
 * @param {Object} node - The node being edited
 * @param {Function} onSave - Callback when configuration is saved
 * @param {Function} onClose - Callback to close the editor
 */
const GPTNodeEditor = ({ node, onSave, onClose }) => {
  // Initialize state from node.data.config or defaults
  const [model, setModel] = useState(node.data?.config?.gptModel || 'gpt-4-turbo-preview');
  const [promptTemplate, setPromptTemplate] = useState(node.data?.config?.promptTemplate || '');
  const [maxTokens, setMaxTokens] = useState(node.data?.config?.maxTokens || 1000);
  const [temperature, setTemperature] = useState(node.data?.config?.temperature || 0.7);
  
  // Test state
  const [testExample, setTestExample] = useState(node.data?.config?.testExample || '');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [testError, setTestError] = useState(null);

  // Available GPT models
  const models = [
    { value: 'gpt-4-turbo-preview', label: 'GPT-4 Turbo (Recommended)', description: 'Most capable, balanced cost' },
    { value: 'gpt-4-turbo', label: 'GPT-4 Turbo', description: 'High capability' },
    { value: 'gpt-4', label: 'GPT-4', description: 'Most accurate' },
    { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo', description: 'Fast and economical' }
  ];

  const handleTest = async () => {
    if (!promptTemplate.trim()) {
      setTestError('Please enter a prompt template before testing');
      return;
    }

    if (!testExample.trim()) {
      setTestError('Please enter a test example');
      return;
    }

    setIsTesting(true);
    setTestError(null);
    setTestResult(null);

    try {
      console.log('[GPTNodeEditor] Testing GPT node with model:', model);
      
      // Create test message using the prompt template
      const testMessages = [
        {
          role: 'user',
          content: promptTemplate.replace(/\{input\}/g, testExample)
        }
      ];

      const result = await sendChatMessage(testMessages, {
        model,
        temperature,
        max_tokens: maxTokens
      });

      if (result.error) {
        setTestError(result.error);
      } else {
        const aiResponse = result.data.choices[0].message.content;
        setTestResult({
          response: aiResponse,
          tokensUsed: result.data.usage?.total_tokens || 0,
          model: result.data.model
        });
      }

    } catch (error) {
      console.error('[GPTNodeEditor] Test error:', error);
      setTestError(error.message || 'Failed to test GPT node');
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = () => {
    // Validation
    if (!promptTemplate.trim()) {
      setTestError('Prompt template is required');
      return;
    }

    // Save configuration to node.data.config
    const config = {
      gptModel: model,
      promptTemplate,
      maxTokens: parseInt(maxTokens, 10),
      temperature: parseFloat(temperature),
      testExample
    };

    console.log('[GPTNodeEditor] Saving config:', config);
    onSave(config);
  };

  return (
    <div className="config-panel">
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>
          GPT / AI Processing
        </h3>
        <p style={{ fontSize: '14px', color: '#6b7280' }}>
          Configure AI text processing with OpenAI models
        </p>
      </div>

      {/* Model Selection */}
      <div className="config-item">
        <label className="config-label">
          Model
          <span style={{ fontSize: '12px', fontWeight: '400', color: '#6b7280', marginLeft: '8px' }}>
            (Higher models = better quality)
          </span>
        </label>
        <select 
          className="config-select"
          value={model}
          onChange={(e) => setModel(e.target.value)}
        >
          {models.map(m => (
            <option key={m.value} value={m.value}>
              {m.label} - {m.description}
            </option>
          ))}
        </select>
        <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
          Cost varies by model. GPT-4 Turbo recommended for production.
        </p>
      </div>

      {/* Prompt Template */}
      <div className="config-item">
        <label className="config-label">
          Prompt Template
          <span style={{ fontSize: '12px', fontWeight: '400', color: '#6b7280', marginLeft: '8px' }}>
            (Use {'{input}'} for dynamic data)
          </span>
        </label>
        <textarea 
          className="config-select"
          placeholder="Enter your prompt template here...&#10;&#10;Example:&#10;Analyze the following text and extract key insights:&#10;{input}"
          rows={6}
          style={{ 
            padding: '10px 12px', 
            resize: 'vertical',
            fontFamily: 'ui-monospace, monospace',
            fontSize: '13px',
            lineHeight: '1.5'
          }}
          value={promptTemplate}
          onChange={(e) => setPromptTemplate(e.target.value)}
        />
        <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
          Use <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '3px' }}>{'{input}'}</code> as a placeholder for workflow data
        </p>
      </div>

      {/* Max Tokens */}
      <div className="config-item">
        <label className="config-label">
          Max Tokens
          <span style={{ fontSize: '12px', fontWeight: '400', color: '#6b7280', marginLeft: '8px' }}>
            (Response length limit)
          </span>
        </label>
        <input 
          type="number"
          className="config-select"
          placeholder="1000"
          min="100"
          max="4000"
          step="100"
          value={maxTokens}
          onChange={(e) => setMaxTokens(e.target.value)}
          style={{ padding: '10px 12px' }}
        />
        <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
          Higher values allow longer responses but cost more. Typical: 500-2000
        </p>
      </div>

      {/* Temperature */}
      <div className="config-item">
        <label className="config-label">
          Temperature
          <span style={{ fontSize: '12px', fontWeight: '400', color: '#6b7280', marginLeft: '8px' }}>
            ({temperature} - {temperature < 0.3 ? 'Focused' : temperature < 0.7 ? 'Balanced' : 'Creative'})
          </span>
        </label>
        <input 
          type="range"
          min="0"
          max="2"
          step="0.1"
          value={temperature}
          onChange={(e) => setTemperature(e.target.value)}
          style={{ 
            width: '100%', 
            accentColor: '#0d2b45',
            marginBottom: '8px'
          }}
        />
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          fontSize: '11px', 
          color: '#94a3b8',
          marginTop: '4px'
        }}>
          <span>0.0 (Precise)</span>
          <span>1.0 (Balanced)</span>
          <span>2.0 (Creative)</span>
        </div>
        <p style={{ fontSize: '12px', color: '#64748b', marginTop: '8px' }}>
          Lower = more consistent, Higher = more varied responses
        </p>
      </div>

      {/* Test Section */}
      <div className="config-item" style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #e5e7eb' }}>
        <label className="config-label">
          Test Example
          <span style={{ fontSize: '12px', fontWeight: '400', color: '#6b7280', marginLeft: '8px' }}>
            (Try your prompt before saving)
          </span>
        </label>
        <textarea 
          className="config-select"
          placeholder="Enter sample text to test your prompt..."
          rows={3}
          style={{ padding: '10px 12px', resize: 'vertical' }}
          value={testExample}
          onChange={(e) => setTestExample(e.target.value)}
        />

        <button 
          className="save-test-button"
          onClick={handleTest}
          disabled={isTesting || !promptTemplate.trim() || !testExample.trim()}
          style={{ 
            marginTop: '12px',
            opacity: (isTesting || !promptTemplate.trim() || !testExample.trim()) ? 0.6 : 1,
            cursor: (isTesting || !promptTemplate.trim() || !testExample.trim()) ? 'not-allowed' : 'pointer'
          }}
        >
          {isTesting ? (
            <>
              <Loader size={16} className="spinning" />
              <span>Testing...</span>
            </>
          ) : (
            <>
              <Play size={16} />
              <span>Test Prompt</span>
            </>
          )}
        </button>

        {/* Test Error Display */}
        {testError && (
          <div style={{ 
            marginTop: '12px',
            padding: '12px',
            background: '#fee2e2',
            border: '1px solid #fca5a5',
            borderRadius: '8px',
            fontSize: '13px',
            color: '#dc2626',
            display: 'flex',
            alignItems: 'start',
            gap: '8px'
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong>Test Failed:</strong> {testError}
            </div>
          </div>
        )}

        {/* Test Result Display */}
        {testResult && (
          <div style={{ 
            marginTop: '12px',
            padding: '12px',
            background: '#f0fdf4',
            border: '1px solid #86efac',
            borderRadius: '8px',
            fontSize: '13px',
            color: '#166534'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <CheckCircle2 size={16} />
              <strong>Test Successful</strong>
              <span style={{ marginLeft: 'auto', fontSize: '11px', color: '#65a30d' }}>
                {testResult.tokensUsed} tokens used
              </span>
            </div>
            <div style={{ 
              padding: '10px',
              background: 'white',
              border: '1px solid #d1fae5',
              borderRadius: '6px',
              fontSize: '12px',
              color: '#374151',
              maxHeight: '150px',
              overflowY: 'auto',
              whiteSpace: 'pre-wrap',
              lineHeight: '1.5'
            }}>
              {testResult.response.length > 300 
                ? testResult.response.substring(0, 300) + '...' 
                : testResult.response
              }
            </div>
            <p style={{ fontSize: '11px', color: '#65a30d', marginTop: '8px' }}>
              Model: {testResult.model}
            </p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div style={{ 
        display: 'flex', 
        gap: '12px', 
        marginTop: '24px',
        paddingTop: '24px',
        borderTop: '1px solid #e5e7eb'
      }}>
        <button 
          className="save-test-button"
          onClick={handleSave}
          disabled={!promptTemplate.trim()}
          style={{ 
            flex: 1,
            opacity: !promptTemplate.trim() ? 0.6 : 1,
            cursor: !promptTemplate.trim() ? 'not-allowed' : 'pointer'
          }}
        >
          <Save size={16} />
          <span>Save Configuration</span>
        </button>
      </div>

      {/* Helpful Tips */}
      <div style={{
        marginTop: '16px',
        padding: '12px',
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        fontSize: '12px',
        color: '#64748b'
      }}>
        <strong style={{ color: '#475569', display: 'block', marginBottom: '6px' }}>
          💡 Tips:
        </strong>
        <ul style={{ margin: 0, paddingLeft: '20px', lineHeight: '1.6' }}>
          <li>Use <code style={{ background: '#e2e8f0', padding: '1px 4px', borderRadius: '2px' }}>{'{input}'}</code> to insert dynamic workflow data</li>
          <li>Start with GPT-3.5 Turbo for testing, upgrade to GPT-4 for production</li>
          <li>Lower temperature (0-0.3) for factual tasks, higher (0.8-1.2) for creative tasks</li>
          <li>Test your prompt before saving to ensure it works as expected</li>
        </ul>
      </div>

      {/* Add spinning animation for loading icon */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spinning {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default GPTNodeEditor;
