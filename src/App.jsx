import './App.css'
import logo from './assets/17F007DC-F981-4891-AED4-6F81382D4181.PNG'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

function App() {
  const [showSignupPopup, setShowSignupPopup] = useState(false)
  const navigate = useNavigate()

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
            <a href="#" className="footer-link">Discover</a>
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
            
            <button className="google-signup-button">
              <span className="google-icon">G</span>
              Continue with Google
            </button>
            
            <div className="divider">
              <span className="divider-text">or</span>
            </div>
            
            <form className="signup-form" onSubmit={handleGetStarted}>
              <input 
                type="text" 
                placeholder="Full Name" 
                className="form-input"
              />
              <input 
                type="email" 
                placeholder="Email Address" 
                className="form-input"
              />
              <input 
                type="password" 
                placeholder="Password" 
                className="form-input"
              />
              <button type="submit" className="submit-button">
                Get Started
              </button>
            </form>
            <p className="popup-footer">
              Already have an account? <a href="#" className="login-link">Sign In</a>
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
