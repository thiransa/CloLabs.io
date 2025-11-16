import './App.css'
import logo from './assets/17F007DC-F981-4891-AED4-6F81382D4181.PNG'
import slackLogo from './assets/slack.png'
import gptLogo from './assets/gpt.png'
import calendarLogo from './assets/calender.png'
import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthForm from './components/AuthForm'
import { useAuth } from './contexts/AuthContext'
import gmailLogo from './assets/gmail.png'
import mailchimpLogo from './assets/mailchimp.png'
import driveLogo from './assets/drive.png'

function App() {
  const [showSignupPopup, setShowSignupPopup] = useState(false)
  const navigate = useNavigate()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard')
    }
  }, [user, loading, navigate])

  const handleSignupClick = () => {
    setShowSignupPopup(true)
  }

  const handleClosePopup = () => {
    setShowSignupPopup(false)
  }

  const handleGetStarted = (e) => {
    e.preventDefault()
    setShowSignupPopup(false)
    navigate('/dashboard')
  }

  return (
    <div className="gradient-background">
      {/* Decorative Rings */}
      <div className="decorative-rings">
        <div className="ring ring-1" style={{borderWidth: '2px', borderStyle: 'solid', borderColor: 'rgba(128, 128, 128, 0.25)', outline: 'none', boxShadow: 'none'}}></div>
        <div className="ring ring-2" style={{borderWidth: '2px', borderStyle: 'solid', borderColor: 'rgba(128, 128, 128, 0.23)', outline: 'none', boxShadow: 'none'}}>
          <div className="ring-icon ring-icon-image slack-icon">
            <img src={slackLogo} alt="Slack logo" />
          </div>
        </div>
        <div className="ring ring-3" style={{borderWidth: '2px', borderStyle: 'solid', borderColor: 'rgba(128, 128, 128, 0.21)', outline: 'none', boxShadow: 'none'}}>
          <div className="ring-icon ring-icon-image gmail-icon">
            <img src={gmailLogo} alt="Gmail logo" />
          </div>
        </div>
        <div className="ring ring-4" style={{borderWidth: '2px', borderStyle: 'solid', borderColor: 'rgba(128, 128, 128, 0.19)', outline: 'none', boxShadow: 'none'}}>
          <div className="ring-icon ring-icon-image gpt-icon">
            <img src={gptLogo} alt="ChatGPT logo" />
          </div>
        </div>
        <div className="ring ring-5" style={{borderWidth: '2px', borderStyle: 'solid', borderColor: 'rgba(128, 128, 128, 0.17)', outline: 'none', boxShadow: 'none'}}>
          <div className="ring-icon ring-icon-image calendar-icon">
            <img src={calendarLogo} alt="Calendar logo" />
          </div>
          <div className="ring-icon ring-icon-image mailchimp-icon">
            <img src={mailchimpLogo} alt="Mailchimp logo" />
          </div>
          <div className="ring-icon ring-icon-image drive-icon">
            <img src={driveLogo} alt="Google Drive logo" />
          </div>
        </div>
      </div>
      
      <img src={logo} alt="CloLabs Logo" className="logo" />
      <div className="logo-text">Clolabs</div>
      <div className="start-your-text">Start Your</div>
      <div className="ai-text">AI</div>
      <div className="automation-text">Automation Here</div>
      <div className="description-text">Create, connect, and automate your daily tasks in just a few clicks with CloLabs</div>
      <button className="start-automating-button" onClick={handleSignupClick}>
        Start Automating
      </button>
      <Link to="/explore" className="nav-text">
        Explore CloLabs ↗
      </Link>
      <button className="signup-button" onClick={handleSignupClick}>
        Sign Up
      </button>
      
      {/* Footer */}
      <footer className="footer">
        <div className="footer-left">
          <span className="footer-brand">CloLabs</span>
          <nav className="footer-nav">
            <Link to="/explore" className="footer-link">Discover</Link>
            <Link to="/pricing" className="footer-link">Pricing</Link>
            <a href="#" className="footer-link">Help</a>
          </nav>
        </div>
        <div className="footer-right">
          <div className="footer-legal">
            <a href="#" className="footer-link">Terms</a>
            <a href="#" className="footer-link">Privacy</a>
            <a href="#" className="footer-link">Security</a>
          </div>
          <div className="footer-copyright">
            © 2025 CloLabs. All rights reserved.
          </div>
        </div>
      </footer>
      
      {/* Signup Popup */}
      {showSignupPopup && (
        <div className="popup-overlay" onClick={handleClosePopup}>
          <div className="popup-card" onClick={(e) => e.stopPropagation()}>
            <button className="close-button" onClick={handleClosePopup}>×</button>
            <h2 className="popup-title">Join CloLabs</h2>
            <p className="popup-subtitle">Start your AI automation journey today</p>
            
            <AuthForm onSuccess={() => setShowSignupPopup(false)} />
          </div>
        </div>
      )}
    </div>
  )
}

export default App
