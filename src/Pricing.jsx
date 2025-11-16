import './Pricing.css'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthForm from './components/AuthForm'

function Pricing() {
  const [isAnnual, setIsAnnual] = useState(false)
  const [showSignupPopup, setShowSignupPopup] = useState(false)
  const navigate = useNavigate()

  const handleSignupClick = () => {
    setShowSignupPopup(true)
  }

  const handleClosePopup = () => {
    setShowSignupPopup(false)
  }

  const plans = {
    free: {
      monthly: 0,
      annual: 0
    },
    basic: {
      monthly: 15.99,
      annual: 172.69 // 10% discount (15.99 * 12 * 0.9)
    },
    pro: {
      monthly: 39.99,
      annual: 431.89 // 10% discount (39.99 * 12 * 0.9)
    }
  }

  return (
    <div className="pricing-background">
      {/* Navigation Buttons */}
      <Link to="/explore" className="nav-text">
        Explore CloLabs ↗
      </Link>
      <button className="signup-button" onClick={handleSignupClick}>
        Sign Up
      </button>
      
      <div className="pricing-header">
        <h1 className="pricing-title">Pricing</h1>
        <p className="pricing-subtitle">Choose the perfect plan for your automation needs</p>
        
        <div className="billing-toggle">
          <span className={`toggle-label ${!isAnnual ? 'active' : ''}`}>Monthly</span>
          <div className="toggle-switch" onClick={() => setIsAnnual(!isAnnual)}>
            <div className={`toggle-slider ${isAnnual ? 'annual' : 'monthly'}`}></div>
          </div>
          <span className={`toggle-label ${isAnnual ? 'active' : ''}`}>
            Annual
            <span className="discount-badge">Save 10%</span>
          </span>
        </div>
      </div>
      
      <div className="pricing-cards">
        <div className="pricing-card">
          <h3 className="card-title">Free</h3>
          <div className="card-price">
            <span className="price">${plans.free[isAnnual ? 'annual' : 'monthly']}</span>
            <span className="period">/{isAnnual ? 'year' : 'month'}</span>
          </div>
          <ul className="card-features">
            <li>Basic automation</li>
            <li>100 Tasks</li>
            <li>Community support</li>
            <li>Basic integrations</li>
          </ul>
          <button className="card-button">Get Started</button>
        </div>

        <div className="pricing-card featured">
          <div className="featured-badge">Most Popular</div>
          <h3 className="card-title">Basic</h3>
          <div className="card-price">
            <span className="price">${isAnnual ? plans.basic.annual.toFixed(2) : plans.basic.monthly.toFixed(2)}</span>
            <span className="period">/{isAnnual ? 'year' : 'month'}</span>
            {isAnnual && <div className="savings">Save ${((plans.basic.monthly * 12) - plans.basic.annual).toFixed(2)}/year</div>}
          </div>
          <ul className="card-features">
            <li>Advanced automation</li>
            <li>1000 Tasks</li>
            <li>Priority support</li>
            <li>All integrations</li>
            <li>Custom templates</li>
          </ul>
          <button className="card-button">Start Free Trial</button>
        </div>

        <div className="pricing-card">
          <h3 className="card-title">Pro</h3>
          <div className="card-price">
            <span className="price">${isAnnual ? plans.pro.annual.toFixed(2) : plans.pro.monthly.toFixed(2)}</span>
            <span className="period">/{isAnnual ? 'year' : 'month'}</span>
            {isAnnual && <div className="savings">Save ${((plans.pro.monthly * 12) - plans.pro.annual).toFixed(2)}/year</div>}
          </div>
          <ul className="card-features">
            <li>Enterprise automation</li>
            <li>10,000 Tasks</li>
            <li>24/7 dedicated support</li>
            <li>Custom integrations</li>
            <li>Advanced analytics</li>
            <li>Team collaboration</li>
          </ul>
          <button className="card-button">Contact Sales</button>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="footer">
        <div className="footer-left">
          <span className="footer-brand">CloLabs</span>
          <nav className="footer-nav">
            <Link to="/" className="footer-link">Discover</Link>
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

export default Pricing