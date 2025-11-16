import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Minimize2, Sparkles, Plus, XCircle } from 'lucide-react';
import { sendChatMessage } from '../lib/openaiApi.js';
import { generateWorkflow } from '../lib/aiAutoBuildApi.js';

/**
 * AI Helper Chat Component
 * Floating chat drawer for AI assistance with workflows
 * Now with intelligent workflow generation!
 */
const AIHelperChat = ({ currentWorkflow = null, onWorkflowGenerated = null }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hi! I\'m your AI workflow assistant. How can I help you today?',
      timestamp: Date.now()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState(null);
  const [isGeneratingWorkflow, setIsGeneratingWorkflow] = useState(false);
  const [generatedWorkflow, setGeneratedWorkflow] = useState(null);
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  
  const MAX_MESSAGE_LENGTH = 2000;

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Sanitize workflow data - only send minimal, safe info
  const getWorkflowContext = () => {
    if (!currentWorkflow || !currentWorkflow.nodes) {
      return null;
    }

    // Only send safe, sanitized workflow structure info
    return {
      nodeCount: currentWorkflow.nodes?.length || 0,
      nodeTypes: currentWorkflow.nodes?.map(n => n.type) || [],
      hasConnections: (currentWorkflow.connections?.length || 0) > 0,
      workflowName: currentWorkflow.name || 'Untitled'
    };
  };

  // Detect if user wants to create a workflow
  const isWorkflowRequest = (text) => {
    const keywords = [
      'create workflow', 'build workflow', 'make workflow', 'generate workflow',
      'create a workflow', 'build a workflow', 'design workflow', 'workflow that',
      'automation for', 'automate', 'create automation'
    ];
    const lowerText = text.toLowerCase();
    return keywords.some(keyword => lowerText.includes(keyword));
  };

  // Generate workflow from user's prompt
  const handleGenerateWorkflow = async (prompt) => {
    setIsGeneratingWorkflow(true);
    setError(null);

    try {
      console.log('[AIHelperChat] Generating workflow from prompt:', prompt);
      
      const result = await generateWorkflow(prompt, {
        model: 'gpt-4-turbo-preview'
      });

      if (result && result.workflow) {
        setGeneratedWorkflow(result.workflow);
        
        // Add success message with action button
        const successMessage = {
          role: 'assistant',
          content: `I've generated a workflow for you! It has ${result.workflow.nodes?.length || 0} nodes. Would you like me to add it to your canvas?`,
          timestamp: Date.now(),
          hasWorkflowAction: true,
          workflowData: result.workflow
        };
        
        setMessages(prev => [...prev, successMessage]);
        console.log('[AIHelperChat] Workflow generated successfully');
      } else {
        throw new Error('No workflow data received');
      }
    } catch (err) {
      console.error('[AIHelperChat] Workflow generation failed:', err);
      
      const errorMessage = {
        role: 'assistant',
        content: `Sorry, I couldn't generate the workflow. ${err.message || 'Please try rephrasing your request.'}`,
        timestamp: Date.now(),
        isError: true
      };
      
      setMessages(prev => [...prev, errorMessage]);
      setError(err.message);
    } finally {
      setIsGeneratingWorkflow(false);
    }
  };

  const handleSend = async () => {
    const trimmedText = inputText.trim();
    
    if (!trimmedText || isTyping) {
      return;
    }

    if (trimmedText.length > MAX_MESSAGE_LENGTH) {
      setError(`Message too long. Maximum ${MAX_MESSAGE_LENGTH} characters.`);
      return;
    }

    setError(null);

    // Add user message
    const userMessage = {
      role: 'user',
      content: trimmedText,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');

    // Check if this is a workflow creation request
    if (isWorkflowRequest(trimmedText)) {
      await handleGenerateWorkflow(trimmedText);
      return;
    }
    setIsTyping(true);

    try {
      // Prepare messages for API
      const apiMessages = messages
        .slice(-10) // Only send last 10 messages for context
        .concat([userMessage])
        .map(msg => ({
          role: msg.role,
          content: msg.content
        }));

      // Add workflow context if available (sanitized)
      const workflowContext = getWorkflowContext();
      if (workflowContext) {
        apiMessages[0] = {
          role: 'system',
          content: `You are a helpful workflow automation assistant. Current workflow context: ${JSON.stringify(workflowContext)}. Help the user build and optimize their workflow. Keep responses concise and actionable.`
        };
      }

      console.log('[AIHelperChat] Sending request with', apiMessages.length, 'messages');

      // Call OpenAI via edge function
      const result = await sendChatMessage(apiMessages, {
        model: 'gpt-3.5-turbo',
        temperature: 0.7,
        max_tokens: 500
      });

      if (result.error) {
        throw new Error(result.error);
      }

      const aiResponse = result.data.choices[0].message.content;

      // Add AI response
      const assistantMessage = {
        role: 'assistant',
        content: aiResponse,
        timestamp: Date.now(),
        tokensUsed: result.data.usage?.total_tokens || 0
      };

      setMessages(prev => [...prev, assistantMessage]);

    } catch (err) {
      console.error('[AIHelperChat] Error:', err);
      
      // Add error message
      const errorMessage = {
        role: 'assistant',
        content: `Sorry, I encountered an error: ${err.message || 'Failed to get response'}. Please try again.`,
        timestamp: Date.now(),
        isError: true
      };
      
      setMessages(prev => [...prev, errorMessage]);
      setError(err.message || 'Failed to send message');
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        role: 'assistant',
        content: 'Chat cleared. How can I help you?',
        timestamp: Date.now()
      }
    ]);
    setError(null);
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="ai-chat-fab"
          title="AI Assistant"
        >
          <MessageCircle size={24} />
        </button>
      )}

      {/* Chat Drawer */}
      {isOpen && (
        <div className="ai-chat-drawer">
          {/* Header */}
          <div className="ai-chat-header">
            <div className="ai-chat-header-content">
              <MessageCircle size={20} />
              <div>
                <div className="ai-chat-title">AI Assistant</div>
                <div className="ai-chat-subtitle">Workflow Help</div>
              </div>
            </div>
            <div className="ai-chat-header-actions">
              <button
                onClick={() => setIsOpen(false)}
                className="ai-chat-close-btn"
                title="Close"
              >
                <XCircle size={22} strokeWidth={2} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="ai-chat-messages">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`ai-chat-message ${msg.role === 'user' ? 'user' : 'assistant'} ${msg.isError ? 'error' : ''}`}
              >
                <div className="ai-chat-message-content">
                  {msg.content}
                </div>
                
                {/* Add to Canvas Button */}
                {msg.hasWorkflowAction && msg.workflowData && (
                  <button
                    onClick={() => {
                      if (onWorkflowGenerated) {
                        onWorkflowGenerated(msg.workflowData);
                        setMessages(prev => [...prev, {
                          role: 'assistant',
                          content: '✅ Workflow added to your canvas!',
                          timestamp: Date.now()
                        }]);
                      }
                    }}
                    className="ai-chat-workflow-btn"
                  >
                    <Plus size={16} />
                    Add to Canvas
                  </button>
                )}
                
                <div className="ai-chat-message-time">
                  {formatTime(msg.timestamp)}
                  {msg.tokensUsed && (
                    <span className="ai-chat-tokens"> · {msg.tokensUsed} tokens</span>
                  )}
                </div>
              </div>
            ))}

            {/* Workflow Generation Indicator */}
            {isGeneratingWorkflow && (
              <div className="ai-chat-message assistant typing">
                <div className="ai-chat-message-content">
                  <Sparkles size={16} style={{ display: 'inline', marginRight: '8px' }} />
                  Generating workflow...
                </div>
              </div>
            )}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="ai-chat-message assistant typing">
                <div className="ai-chat-message-content">
                  <div className="ai-chat-typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Error Display */}
          {error && (
            <div className="ai-chat-error">
              ⚠️ {error}
            </div>
          )}

          {/* Input */}
          <div className="ai-chat-input-container">
            <textarea
              ref={inputRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about workflows..."
              className="ai-chat-input"
              rows={1}
              maxLength={MAX_MESSAGE_LENGTH}
              disabled={isTyping}
            />
            <button
              onClick={handleSend}
              disabled={!inputText.trim() || isTyping}
              className="ai-chat-send-btn"
              title="Send message"
            >
              <Send size={24} />
            </button>
          </div>

          {/* Character Counter */}
          {inputText.length > MAX_MESSAGE_LENGTH * 0.8 && (
            <div className="ai-chat-char-count">
              {inputText.length} / {MAX_MESSAGE_LENGTH}
            </div>
          )}
        </div>
      )}

      {/* Styles */}
      <style>{`
        /* Floating Action Button */
        .ai-chat-fab {
          position: fixed;
          bottom: 24px;
          right: 24px;
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: linear-gradient(to right, #0d2b45, #203c5b, #2b1d3b);
          color: white;
          border: none;
          box-shadow: 0 4px 12px rgba(13, 43, 69, 0.3);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
          z-index: 1000;
        }

        .ai-chat-fab:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 16px rgba(13, 43, 69, 0.4);
        }

        /* Chat Drawer */
        .ai-chat-drawer {
          position: fixed;
          bottom: 24px;
          right: 24px;
          width: 380px;
          height: 600px;
          max-height: calc(100vh - 100px);
          background: white;
          border-radius: 16px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
          display: flex;
          flex-direction: column;
          z-index: 1000;
          overflow: hidden;
        }

        /* Header */
        .ai-chat-header {
          padding: 16px;
          background: linear-gradient(to right, #0d2b45, #203c5b, #2b1d3b);
          color: white;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-shrink: 0;
        }

        .ai-chat-header-content {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .ai-chat-title {
          font-size: 16px;
          font-weight: 600;
        }

        .ai-chat-subtitle {
          font-size: 12px;
          opacity: 0.9;
        }

        .ai-chat-header-actions {
          display: flex;
          gap: 8px;
        }

        .ai-chat-close-btn {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.2);
          border: none;
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .ai-chat-close-btn:hover {
          background: rgba(255, 255, 255, 0.35);
          transform: rotate(90deg);
        }

        /* Messages Area */
        .ai-chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          background: #f8f9fa;
        }

        .ai-chat-messages::-webkit-scrollbar {
          width: 6px;
        }

        .ai-chat-messages::-webkit-scrollbar-track {
          background: transparent;
        }

        .ai-chat-messages::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 3px;
        }

        /* Message Bubbles */
        .ai-chat-message {
          max-width: 85%;
          animation: slideIn 0.3s ease;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .ai-chat-message.user {
          align-self: flex-end;
        }

        .ai-chat-message.assistant {
          align-self: flex-start;
        }

        .ai-chat-message-content {
          padding: 12px 16px;
          border-radius: 12px;
          font-size: 14px;
          line-height: 1.5;
          word-wrap: break-word;
        }

        .ai-chat-message.user .ai-chat-message-content {
          background: linear-gradient(to right, #0d2b45, #203c5b, #2b1d3b);
          color: white;
          border-bottom-right-radius: 4px;
        }

        .ai-chat-message.assistant .ai-chat-message-content {
          background: white;
          color: #1f2937;
          border: 1px solid #e5e7eb;
          border-bottom-left-radius: 4px;
        }

        .ai-chat-message.error .ai-chat-message-content {
          background: #fee2e2;
          color: #dc2626;
          border-color: #fca5a5;
        }

        .ai-chat-message-time {
          font-size: 11px;
          color: #6b7280;
          margin-top: 4px;
          padding: 0 4px;
        }

        .ai-chat-message.user .ai-chat-message-time {
          text-align: right;
        }

        .ai-chat-tokens {
          opacity: 0.7;
        }

        /* Typing Indicator */
        .ai-chat-message.typing .ai-chat-message-content {
          padding: 16px 20px;
        }

        .ai-chat-typing-dots {
          display: flex;
          gap: 4px;
          align-items: center;
        }

        .ai-chat-typing-dots span {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #9ca3af;
          animation: typing 1.4s infinite;
        }

        .ai-chat-typing-dots span:nth-child(2) {
          animation-delay: 0.2s;
        }

        .ai-chat-typing-dots span:nth-child(3) {
          animation-delay: 0.4s;
        }

        @keyframes typing {
          0%, 60%, 100% {
            transform: translateY(0);
            opacity: 0.7;
          }
          30% {
            transform: translateY(-10px);
            opacity: 1;
          }
        }

        /* Error Display */
        .ai-chat-error {
          padding: 12px;
          background: #fee2e2;
          color: #dc2626;
          font-size: 13px;
          border-top: 1px solid #fca5a5;
          flex-shrink: 0;
        }

        /* Input Container */
        .ai-chat-input-container {
          padding: 16px;
          background: white;
          border-top: 1px solid #e5e7eb;
          display: flex;
          gap: 12px;
          align-items: flex-end;
          flex-shrink: 0;
        }

        .ai-chat-input {
          flex: 1;
          padding: 12px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 14px;
          font-family: inherit;
          resize: none;
          max-height: 120px;
          overflow-y: auto;
          transition: border-color 0.2s;
          color: #000000;
          background: white;
        }

        .ai-chat-input::placeholder {
          color: #9ca3af;
        }

        .ai-chat-input:focus {
          outline: none;
          border-color: #667eea;
        }

        .ai-chat-input:disabled {
          background: #f3f4f6;
          cursor: not-allowed;
        }

        .ai-chat-send-btn {
          width: 52px;
          height: 52px;
          min-width: 52px;
          min-height: 52px;
          border-radius: 10px;
          background: linear-gradient(to right, #0d2b45, #203c5b, #2b1d3b);
          color: white;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          flex-shrink: 0;
          box-shadow: 0 3px 10px rgba(13, 43, 69, 0.3);
        }

        .ai-chat-send-btn svg {
          width: 24px;
          height: 24px;
        }

        .ai-chat-send-btn:hover:not(:disabled) {
          background: linear-gradient(to right, #1a3a5a, #2b4d6f, #3a2750);
          transform: scale(1.05);
          box-shadow: 0 5px 15px rgba(13, 43, 69, 0.4);
        }

        .ai-chat-send-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          background: #e5e7eb;
          color: #9ca3af;
          box-shadow: none;
        }

        /* Workflow Action Button */
        .ai-chat-workflow-btn {
          margin-top: 12px;
          padding: 10px 16px;
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s;
          box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
        }

        .ai-chat-workflow-btn:hover {
          background: linear-gradient(135deg, #059669, #047857);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
        }

        .ai-chat-workflow-btn svg {
          width: 16px;
          height: 16px;
        }

        /* Character Counter */
        .ai-chat-char-count {
          padding: 0 16px 12px;
          font-size: 11px;
          color: #6b7280;
          text-align: right;
          background: white;
        }

        /* Responsive */
        @media (max-width: 480px) {
          .ai-chat-drawer {
            width: calc(100vw - 32px);
            height: calc(100vh - 100px);
            right: 16px;
            bottom: 16px;
          }

          .ai-chat-fab {
            width: 48px;
            height: 48px;
            right: 16px;
            bottom: 16px;
          }
        }
      `}</style>
    </>
  );
};

export default AIHelperChat;
