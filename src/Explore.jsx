import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Explore.css';
import AuthForm from './components/AuthForm';
import builderScreenshot from './assets/builder-screenshot.png';

const Explore = () => {
  const [showSignupPopup, setShowSignupPopup] = useState(false);
  const navigate = useNavigate();

  const handleSignupClick = () => {
    setShowSignupPopup(true);
  };

  const handleClosePopup = () => {
    setShowSignupPopup(false);
  };

  const handleGetStarted = (e) => {
    e.preventDefault();
    setShowSignupPopup(false);
    navigate('/dashboard');
  };

  return (
    <div className="explore-container">
      {/* Navigation Buttons */}
      <Link to="/" className="nav-text">
        Back to Home ↗
      </Link>
      <button className="signup-button" onClick={handleSignupClick}>
        Sign Up
      </button>
      
      <div className="explore-content">
        <h1 className="explore-heading">Discover how CloLabs makes automation human.</h1>
        <p className="explore-description">Design emotion-aware workflows powered by adaptive AI — no code, no limits.</p>
      </div>

      {/* How CloLabs Works Section */}
      <div className="steps-section">
        <div className="steps-container">
          <div className="step-card" data-step="1">
            <div className="step-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3 className="step-title">Connect your apps</h3>
            <p className="step-description">Link your tools with one click.</p>
          </div>
          
          <div className="step-card" data-step="2">
            <div className="step-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="18" cy="5" r="3" stroke="currentColor" strokeWidth="2"/>
                <circle cx="6" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
                <circle cx="18" cy="19" r="3" stroke="currentColor" strokeWidth="2"/>
                <path d="M8.59 13.51l6.83 3.98" stroke="currentColor" strokeWidth="2"/>
                <path d="M15.41 6.51l-6.82 3.98" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </div>
            <h3 className="step-title">Design workflows</h3>
            <p className="step-description">Build logic visually in the CloLabs Builder.</p>
          </div>
          
          <div className="step-card" data-step="3">
            <div className="step-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" stroke="currentColor" strokeWidth="2"/>
                <polyline points="7.5,4.21 12,6.81 16.5,4.21" stroke="currentColor" strokeWidth="2"/>
                <polyline points="7.5,19.79 7.5,14.6 3,12" stroke="currentColor" strokeWidth="2"/>
                <polyline points="21,12 16.5,14.6 16.5,19.79" stroke="currentColor" strokeWidth="2"/>
                <polyline points="3.27,6.96 12,12.01 20.73,6.96" stroke="currentColor" strokeWidth="2"/>
                <line x1="12" y1="22.08" x2="12" y2="12" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </div>
            <h3 className="step-title">Add AI</h3>
            <p className="step-description">Automate human-like reasoning and emotion-aware triggers.</p>
          </div>
          
          <div className="step-card" data-step="4">
            <div className="step-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3 className="step-title">Deploy & scale</h3>
            <p className="step-description">Launch across teams or personal tasks.</p>
          </div>
        </div>
      </div>

      {/* Integrations Gallery Section */}
      <div className="integrations-section">
        <div className="integrations-header">
          <h2 className="integrations-title">Connect Everything You Use</h2>
          <p className="integrations-subtitle">Seamlessly integrate with your favorite tools and platforms</p>
        </div>
        
        <div className="integrations-grid">
          <div className="integration-card" data-description="Send messages and notifications">
            <div className="integration-logo">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
                <path d="M5.042 15.165a2.528 2.528 0 0 0-2.52 2.523A2.528 2.528 0 0 0 5.042 20.21h13.916a2.528 2.528 0 0 0 2.52-2.522 2.528 2.528 0 0 0-2.52-2.523H5.042zm6.958-4.165a2.528 2.528 0 0 0-2.52 2.523A2.528 2.528 0 0 0 12 16.045a2.528 2.528 0 0 0 2.52-2.522A2.528 2.528 0 0 0 12 11.001zM5.042 6.837a2.528 2.528 0 0 0-2.52 2.523A2.528 2.528 0 0 0 5.042 11.883h13.916a2.528 2.528 0 0 0 2.52-2.523 2.528 2.528 0 0 0-2.52-2.523H5.042z"/>
              </svg>
            </div>
            <span className="integration-name">Slack</span>
            <div className="integration-description">Send messages and notifications</div>
          </div>

          <div className="integration-card" data-description="Sync documents and databases">
            <div className="integration-logo">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
                <path d="M4.459 4.208c0-.458.372-.833.831-.833h13.42c.459 0 .831.375.831.833v15.584c0 .458-.372.833-.831.833H5.29c-.459 0-.831-.375-.831-.833V4.208z"/>
                <path d="M7.167 7.5h9.666v1.25H7.167V7.5zm0 2.5h9.666v1.25H7.167V10zm0 2.5h6.25v1.25H7.167V12.5z" fill="var(--bg-color, #000)"/>
              </svg>
            </div>
            <span className="integration-name">Notion</span>
            <div className="integration-description">Sync documents and databases</div>
          </div>

          <div className="integration-card" data-description="Send messages to servers">
            <div className="integration-logo">
              <svg width="40" height="40" viewBox="0 0 127.14 96.36" fill="currentColor">
                <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z"/>
              </svg>
            </div>
            <span className="integration-name">Discord</span>
            <div className="integration-description">Send messages to servers</div>
          </div>

          <div className="integration-card" data-description="Manage database operations">
            <div className="integration-logo">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
                <path d="M21.362 9.354H12.75v2.062h8.612c-.002.993-.037 1.989-.1 2.986-.067 1.093-.157 2.19-.267 3.284-.25 2.508-.635 4.984-1.13 7.45a.847.847 0 0 1-.107.34c-.07.125-.217.198-.369.199l-6.376.002-6.376-.002a.736.736 0 0 1-.369-.199.847.847 0 0 1-.107-.34c-.495-2.466-.88-4.942-1.13-7.45-.11-1.093-.2-2.191-.267-3.284-.063-.997-.098-1.993-.1-2.986h8.612V9.354H2.638c-.006 1.002.028 2.008.1 3.016.077 1.11.171 2.224.283 3.334.255 2.544.647 5.058 1.153 7.565.09.435.362.824.75 1.077.388.253.85.405 1.31.405h12.732c.46 0 .922-.152 1.31-.405.388-.253.66-.642.75-1.077.506-2.507.898-5.021 1.153-7.565.112-1.11.206-2.224.283-3.334.072-1.008.106-2.014.1-3.016zM12 7.2c2.26 0 4.09-1.83 4.09-4.09S14.26-.99 12-.99s-4.09 1.83-4.09 4.09S9.74 7.2 12 7.2z"/>
              </svg>
            </div>
            <span className="integration-name">Supabase</span>
            <div className="integration-description">Manage database operations</div>
          </div>

          <div className="integration-card" data-description="Organize and automate data">
            <div className="integration-logo">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm4.95 11.392L12 15.284l-4.95-3.892V7.608h9.9v3.784z"/>
                <path d="M7.05 7.608v3.784L12 7.5l4.95 3.892V7.608z" fill="var(--bg-color, #000)"/>
              </svg>
            </div>
            <span className="integration-name">Airtable</span>
            <div className="integration-description">Organize and automate data</div>
          </div>

          <div className="integration-card" data-description="Send and receive emails">
            <div className="integration-logo">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-.904.732-1.636 1.636-1.636h3.819l6.545 4.91 6.545-4.91h3.819A1.636 1.636 0 0 1 24 5.457z"/>
              </svg>
            </div>
            <span className="integration-name">Gmail</span>
            <div className="integration-description">Send and receive emails</div>
          </div>

          <div className="integration-card" data-description="Create and share spreadsheets">
            <div className="integration-logo">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.556 1.444H1.444A1.444 1.444 0 0 0 0 2.889v18.222A1.444 1.444 0 0 0 1.444 22.556h21.112A1.444 1.444 0 0 0 24 21.111V2.889A1.444 1.444 0 0 0 22.556 1.444zM10.667 20.667H3.556V13.333h7.111v7.334zm0-9.223H3.556V3.556h7.111v7.888zm9.777 9.223h-7.111V13.333h7.111v7.334zm0-9.223h-7.111V3.556h7.111v7.888z"/>
              </svg>
            </div>
            <span className="integration-name">Google Sheets</span>
            <div className="integration-description">Create and share spreadsheets</div>
          </div>

          <div className="integration-card" data-description="Collaborate on code repositories">
            <div className="integration-logo">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
            </div>
            <span className="integration-name">GitHub</span>
            <div className="integration-description">Collaborate on code repositories</div>
          </div>
        </div>
        
        <div className="integrations-footer">
          <button className="see-all-integrations-btn">
            See All Integrations →
          </button>
        </div>
      </div>

      {/* Builder Preview Section */}
      <div className="builder-preview-section">
        <div className="builder-content">
          <h2 className="builder-title">Visual workflow builder designed for creativity.</h2>
          <div className="builder-text">
            <p className="builder-subtitle">Drag, drop, and connect — build automation that feels alive.</p>
            <button className="builder-cta-btn">
              Try the Builder
            </button>
          </div>
          
          <div className="builder-visuals">
            <div className="builder-screenshot">
              <img src={builderScreenshot} alt="CloLabs Workflow Builder" className="screenshot-image" />
            </div>
          </div>
        </div>
      </div>

      {/* Video Demo Section */}
      <div className="video-demo-section">
        <div className="video-container">
          <div className="video-placeholder">
            <div className="placeholder-icon">
              <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                <polygon points="5,3 19,12 5,21"/>
              </svg>
            </div>
            <span className="placeholder-text">Interactive Demo Video</span>
          </div>
        </div>
      </div>

      {/* Why CloLabs Section - No Container */}
      <h2 className="why-clolabs-title">Why CloLabs</h2>
      <p className="why-clolabs-subtitle">Built for the future of intelligent automation.</p>
      
      <div className="why-clolabs-grid">
        <div className="why-clolabs-card">
          <div className="feature-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </div>
          <h3 className="feature-title">Emotion-Aware Logic</h3>
          <p className="feature-description">Automations that respond with empathy, not just efficiency.</p>
        </div>

        <div className="why-clolabs-card">
          <div className="feature-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
          <h3 className="feature-title">Adaptive Agents</h3>
          <p className="feature-description">AI that learns and evolves with your habits and workflow patterns.</p>
        </div>

        <div className="why-clolabs-card">
          <div className="feature-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <h3 className="feature-title">Collaborative Mode</h3>
          <p className="feature-description">Work together and co-build intelligent automations with your team.</p>
        </div>

        <div className="why-clolabs-card">
          <div className="feature-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/>
            </svg>
          </div>
          <h3 className="feature-title">Visual Debugging</h3>
          <p className="feature-description">See your automation logic unfold clearly with real-time insights.</p>
        </div>
      </div>

      <h2 className="cta-heading">Ready to build your first AI-powered workflow?</h2>
      <div className="cta-buttons">
        <button className="cta-primary-btn" onClick={handleSignupClick}>
          Start Now
        </button>
        <a href="https://tally.so/r/3q0oJg" target="_blank" rel="noopener noreferrer" className="cta-secondary-btn">
          Join the Waitlist
        </a>
      </div>

      <div className="footer-clolabs-text">CloLabs</div>

      {/* Signup Popup */}

      {/* Signup Popup */}
      {showSignupPopup && (
        <div className="popup-overlay" onClick={handleClosePopup}>
          <div className="popup-card" onClick={(e) => e.stopPropagation()}>
            <button className="close-button" onClick={handleClosePopup}>×</button>
            <h2 className="popup-title">Join CloLabs</h2>
            <p className="popup-subtitle">Start automating your workflow today</p>
            
            <AuthForm onSuccess={() => setShowSignupPopup(false)} />
          </div>
        </div>
      )}
    </div>
  );
};

export default Explore;