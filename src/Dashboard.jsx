import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Dashboard.css';
import logo from './assets/17F007DC-F981-4891-AED4-6F81382D4181.PNG';

const Dashboard = () => {
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const [chatOpen, setChatOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarExpanded(!sidebarExpanded);
  };

  const handleSectionClick = (section) => {
    setActiveSection(section);
  };

  const toggleChat = () => {
    setChatOpen(!chatOpen);
  };

  return (
    <div className="dashboard-container">
      {/* Logo and Brand Text in Upper Left Corner */}
      <img src={logo} alt="CloLabs Logo" className="dashboard-logo" />
      <div className="dashboard-logo-text">Clolabs</div>
      <div className="dashboard-page-title">Dashboard</div>
      
      {/* Right Upper Corner Buttons */}
      <div className="header-actions">
        <Link to="/builder" className="header-action-btn add-btn">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </Link>
        
        <Link to="/pricing" className="header-action-btn upgrade-btn">
          <span>Upgrade</span>
        </Link>
        
        <button className="header-action-btn profile-btn">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
        </button>
      </div>
      
      {/* Glassy Curved Sidebar */}
      <div className={`sidebar ${sidebarExpanded ? 'expanded' : 'collapsed'}`}>
        <div className="sidebar-toggle" onClick={toggleSidebar}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </div>
        
        <div className="sidebar-items">
          <div 
            className={`sidebar-item ${activeSection === 'home' ? 'active' : ''}`}
            onClick={() => handleSectionClick('home')}
          >
            <div className="sidebar-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9,22 9,12 15,12 15,22"/>
              </svg>
            </div>
            <span className="sidebar-text">Home</span>
          </div>
          
          <div 
            className={`sidebar-item ${activeSection === 'workflows' ? 'active' : ''}`}
            onClick={() => handleSectionClick('workflows')}
          >
            <div className="sidebar-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                <polyline points="3.27,6.96 12,12.01 20.73,6.96"/>
                <polyline points="12,22.08 12,12"/>
              </svg>
            </div>
            <span className="sidebar-text">Workflows</span>
          </div>
          
          <div 
            className={`sidebar-item ${activeSection === 'apps' ? 'active' : ''}`}
            onClick={() => handleSectionClick('apps')}
          >
            <div className="sidebar-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <rect x="9" y="9" width="6" height="6"/>
                <path d="M9 1v6M15 1v6M9 17v6M15 17v6M1 9h6M1 15h6M17 9h6M17 15h6"/>
              </svg>
            </div>
            <span className="sidebar-text">Apps</span>
          </div>
          
          <div 
            className={`sidebar-item ${activeSection === 'templates' ? 'active' : ''}`}
            onClick={() => handleSectionClick('templates')}
          >
            <div className="sidebar-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14,2 14,8 20,8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10,9 9,9 8,9"/>
              </svg>
            </div>
            <span className="sidebar-text">Templates</span>
          </div>
        </div>
        
        <div className="sidebar-bottom">
          <div 
            className={`sidebar-item ${activeSection === 'settings' ? 'active' : ''}`}
            onClick={() => handleSectionClick('settings')}
          >
            <div className="sidebar-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            </div>
            <span className="sidebar-text">Settings</span>
          </div>
        </div>
      </div>
      
      {/* Main Content Area */}
      <div className={`main-content ${sidebarExpanded ? 'sidebar-expanded' : 'sidebar-collapsed'}`}>
        
        {/* Home Section */}
        {activeSection === 'home' && (
          <>
            <h1 className="dashboard-main-heading">Start building your automation</h1>
            
            {/* Glassy Prompt Area */}
            <div className="prompt-container">
              <div className="prompt-input-wrapper">
                <textarea 
                  className="prompt-input"
                  placeholder="Describe your automation idea... (e.g., 'Send me a Slack message when I receive an important email')"
                  rows="3"
                />
                <button className="prompt-submit-btn">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="22" y1="2" x2="11" y2="13"/>
                    <polygon points="22,2 15,22 11,13 2,9 22,2"/>
                  </svg>
                </button>
              </div>
            </div>
            
            {/* AI Suggestions */}
            <div className="ai-suggestions">
              <div className="suggestions-grid">
                <div className="suggestion-card">
                  <p className="suggestion-text">Would you like to automate your social posts?</p>
                </div>
                
                <div className="suggestion-card">
                  <p className="suggestion-text">You seem to use forms often — try Form → Sheet integration</p>
                </div>
                
                <div className="suggestion-card">
                  <p className="suggestion-text">Automate email responses when you're out of office</p>
                </div>
                
                <div className="suggestion-card">
                  <p className="suggestion-text">Set up meeting reminders and calendar sync automation</p>
                </div>
              </div>
            </div>

            {/* Analytics Section */}
            <div className="analytics-section">
              <h3 className="analytics-title">Analytics</h3>
              <div className="analytics-grid">
                <div className="analytics-card">
                  <div className="analytics-value">47</div>
                  <div className="analytics-label">Automations Run This Week</div>
                </div>
                
                <div className="analytics-card">
                  <div className="analytics-value">156</div>
                  <div className="analytics-label">Tasks Completed</div>
                </div>
                
                <div className="analytics-card">
                  <div className="analytics-value">12.5h</div>
                  <div className="analytics-label">Time Saved (AI-estimated)</div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Workflows Section */}
        {activeSection === 'workflows' && (
          <div className="section-content">
            <h1 className="section-heading">Workflows</h1>
            <div className="section-grid">
              <div className="section-card">
                <div className="card-icon">⚡</div>
                <div className="card-content">
                  <h4 className="card-title">Email to Slack</h4>
                  <p className="card-description">Auto-forward important emails to your team</p>
                  <span className="card-status active">Active</span>
                </div>
              </div>
              
              <div className="section-card">
                <div className="card-icon">📝</div>
                <div className="card-content">
                  <h4 className="card-title">Form Submissions</h4>
                  <p className="card-description">Process contact form data automatically</p>
                  <span className="card-status active">Active</span>
                </div>
              </div>
              
              <div className="section-card">
                <div className="card-icon">📅</div>
                <div className="card-content">
                  <h4 className="card-title">Calendar Sync</h4>
                  <p className="card-description">Sync events across platforms</p>
                  <span className="card-status paused">Paused</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Apps Section */}
        {activeSection === 'apps' && (
          <div className="section-content">
            <h1 className="section-heading">Connected Apps</h1>
            <div className="section-grid">
              <div className="section-card">
                <div className="card-icon">📧</div>
                <div className="card-content">
                  <h4 className="card-title">Gmail</h4>
                  <p className="card-description">Email automation & triggers</p>
                  <span className="card-status connected">Connected</span>
                </div>
              </div>
              
              <div className="section-card">
                <div className="card-icon">💬</div>
                <div className="card-content">
                  <h4 className="card-title">Slack</h4>
                  <p className="card-description">Team communication hub</p>
                  <span className="card-status connected">Connected</span>
                </div>
              </div>
              
              <div className="section-card">
                <div className="card-icon">📊</div>
                <div className="card-content">
                  <h4 className="card-title">Google Sheets</h4>
                  <p className="card-description">Data collection & analysis</p>
                  <span className="card-status disconnected">Not Connected</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Templates Section */}
        {activeSection === 'templates' && (
          <div className="section-content">
            <h1 className="section-heading">Popular Templates</h1>
            <div className="section-grid">
              <div className="section-card">
                <div className="card-icon">🎯</div>
                <div className="card-content">
                  <h4 className="card-title">Lead Capture</h4>
                  <p className="card-description">Automatically process new leads</p>
                  <span className="card-status template">Use Template</span>
                </div>
              </div>
              
              <div className="section-card">
                <div className="card-icon">📈</div>
                <div className="card-content">
                  <h4 className="card-title">Social Media</h4>
                  <p className="card-description">Schedule and post content</p>
                  <span className="card-status template">Use Template</span>
                </div>
              </div>
              
              <div className="section-card">
                <div className="card-icon">🔔</div>
                <div className="card-content">
                  <h4 className="card-title">Notifications</h4>
                  <p className="card-description">Smart alert management</p>
                  <span className="card-status template">Use Template</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Settings Section */}
        {activeSection === 'settings' && (
          <div className="section-content">
            <h1 className="section-heading">Settings</h1>
            <div className="section-grid">
              <div className="section-card">
                <div className="card-icon">🔐</div>
                <div className="card-content">
                  <h4 className="card-title">Security</h4>
                  <p className="card-description">Manage API keys & permissions</p>
                  <span className="card-status setting">Configure</span>
                </div>
              </div>
              
              <div className="section-card">
                <div className="card-icon">⚙️</div>
                <div className="card-content">
                  <h4 className="card-title">Preferences</h4>
                  <p className="card-description">Customize your experience</p>
                  <span className="card-status setting">Configure</span>
                </div>
              </div>
              
              <div className="section-card">
                <div className="card-icon">💳</div>
                <div className="card-content">
                  <h4 className="card-title">Billing</h4>
                  <p className="card-description">Manage subscription & usage</p>
                  <span className="card-status setting">Configure</span>
                </div>
              </div>
            </div>
          </div>
        )}
        
      </div>

      {/* AI Chat Button - Bottom Right Corner */}
      <button className="ai-chat-btn" onClick={toggleChat}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          <path d="M8 9h8"/>
          <path d="M8 13h6"/>
        </svg>
      </button>

      {/* AI Chat Popup */}
      {chatOpen && (
        <div className="chat-overlay" onClick={toggleChat}>
          <div className="chat-popup" onClick={(e) => e.stopPropagation()}>
            <div className="chat-header">
              <div className="chat-title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Z"/>
                  <path d="M8 12h8"/>
                  <path d="M12 8v8"/>
                </svg>
                <span>AI Assistant</span>
              </div>
              <button className="chat-close-btn" onClick={toggleChat}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            
            <div className="chat-messages">
              <div className="chat-message ai-message">
                <div className="message-avatar">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Z"/>
                    <path d="M8 12h8"/>
                    <path d="M12 8v8"/>
                  </svg>
                </div>
                <div className="message-content">
                  <p>Hello! I'm your AI assistant. How can I help you with your automation workflows today?</p>
                </div>
              </div>
            </div>
            
            <div className="chat-input-area">
              <input 
                type="text" 
                className="chat-input" 
                placeholder="Ask me anything about automations..."
              />
              <button className="chat-send-btn">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="22" y1="2" x2="11" y2="13"/>
                  <polygon points="22,2 15,22 11,13 2,9 22,2"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;