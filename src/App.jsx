import './App.css'
import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthForm from './components/AuthForm'
import DemoSection from './components/DemoSection'
import { useAuth } from './contexts/AuthContext'
import { supabase } from './lib/supabaseClient'
import { Zap, Workflow, Brain, Link2, CheckCircle, Mail } from 'lucide-react'
import LandingHero from './components/landing/LandingHero'

function App() {
  const [showSignupPopup, setShowSignupPopup] = useState(false)
  const [betaEmail, setBetaEmail] = useState('')
  const [betaSubmitting, setBetaSubmitting] = useState(false)
  const [betaMessage, setBetaMessage] = useState('')
  const navigate = useNavigate()
  const { user, loading } = useAuth()

  const problemSectionRef = useRef(null)
  const solutionSectionRef = useRef(null)
  const featuresSectionRef = useRef(null)
  const betaSectionRef = useRef(null)

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

  // NEW: Handle beta email signup
  const handleBetaSignup = async (e) => {
    e.preventDefault()
    
    if (!betaEmail || !betaEmail.includes('@')) {
      setBetaMessage('Please enter a valid email address')
      return
    }

    setBetaSubmitting(true)
    setBetaMessage('')

    try {
      const { data, error } = await supabase
        .from('beta_users')
        .insert([{ email: betaEmail }])
        .select()

      if (error) {
        if (error.code === '23505') { // Duplicate key
          setBetaMessage('You\'re already on the list! Check your email.')
        } else {
          setBetaMessage('Something went wrong. Please try again.')
        }
      } else {
        setBetaMessage('🎉 You\'re on the list! We\'ll be in touch soon.')
        setBetaEmail('')
      }
    } catch (err) {
      setBetaMessage('Network error. Please try again.')
    } finally {
      setBetaSubmitting(false)
    }
  }

  const scrollToSection = (ref) => {
    if (ref?.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const handleNavSelect = (section) => {
    switch (section) {
      case 'home':
        if (typeof window !== 'undefined') {
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }
        break
      case 'challenge':
        scrollToSection(problemSectionRef)
        break
      case 'fix':
        scrollToSection(solutionSectionRef)
        break
      case 'features':
        scrollToSection(featuresSectionRef)
        break
      case 'action':
        scrollToSection(betaSectionRef)
        break
      case 'pricing':
        navigate('/pricing')
        break
      default:
        break
    }
  }

  return (
    <div className="gradient-background">
      <LandingHero
        onPrimaryAction={handleSignupClick}
        onSecondaryAction={() => navigate('/explore')}
        onNavAction={handleSignupClick}
        onNavSelect={handleNavSelect}
      />
      
      {/* NEW SECTION: Problem / Pain Point */}
      <section
        className="landing-section problem-section"
        aria-labelledby="problem-heading"
        ref={problemSectionRef}
      >
        <div className="section-container problem-layout">
          <div className="problem-content">
            <h2 id="problem-heading" className="section-title">The Automation Gap</h2>
            <p className="section-description">
              Modern teams waste countless hours on repetitive tasks. Existing automation tools are either too complex for non-technical users or too rigid for custom workflows.
            </p>
            <ul className="pain-points" aria-label="Common pain points">
              <li>⏰ Spending 10+ hours/week on manual data entry and task coordination</li>
              <li>🔧 Complex automation tools that require coding knowledge or expensive consultants</li>
            </ul>
          </div>
          <div className="problem-illustration" aria-hidden="true">
            <svg
              className="workflow-illustration"
              viewBox="0 0 320 260"
              fill="none"
              role="presentation"
            >
              <g className="workflow-grid">
                <path d="M20 50 H300" />
                <path d="M20 130 H300" />
                <path d="M20 210 H300" />
                <path d="M60 20 V240" />
                <path d="M160 20 V240" />
                <path d="M260 20 V240" />
              </g>
              <path
                className="workflow-path"
                d="M60 60 C120 60 120 120 160 120 C200 120 200 60 260 60 C280 60 300 80 300 100 C300 150 220 150 220 200 C220 220 240 240 260 240 C280 240 300 220 300 200"
              />
              <g className="workflow-nodes">
                <circle cx="60" cy="60" r="12" />
                <circle cx="160" cy="120" r="12" />
                <circle cx="260" cy="60" r="12" />
                <circle cx="220" cy="200" r="12" />
                <circle cx="300" cy="200" r="12" />
              </g>
              <circle className="workflow-orb" cx="60" cy="60" r="6" />
            </svg>
          </div>
        </div>
      </section>

      {/* NEW SECTION: Solution */}
      <section
        className="landing-section solution-section"
        aria-labelledby="solution-heading"
        ref={solutionSectionRef}
      >
        <div className="section-container solution-layout">
          <div className="solution-content">
            <h2 id="solution-heading" className="section-title">AI-Powered Simplicity</h2>
            <p className="section-description">
              CloLabs combines visual workflow design with intelligent AI assistants. Build sophisticated automations in minutes—no coding required. Our adaptive AI learns your patterns and suggests optimizations, making automation accessible to everyone.
            </p>
          </div>
          <div className="solution-illustration" aria-hidden="true">
            <svg
              className="ai-orbit-illustration"
              viewBox="0 0 320 260"
              fill="none"
              role="presentation"
            >
              <circle className="ai-core-outline" cx="160" cy="130" r="36" />
              <circle className="ai-core" cx="160" cy="130" r="18" />
              <g className="ai-rings">
                <circle className="ai-ring ai-ring-1" cx="160" cy="130" r="80" />
                <circle className="ai-ring ai-ring-2" cx="160" cy="130" r="115" />
              </g>
              <g className="ai-arcs">
                <path d="M60 140 C90 70 230 70 260 140" />
                <path d="M90 210 C120 170 200 170 230 210" />
              </g>
              <g className="ai-spokes">
                <line x1="160" y1="30" x2="160" y2="90" />
                <line x1="80" y1="130" x2="120" y2="130" />
                <line x1="200" y1="130" x2="240" y2="130" />
                <line x1="160" y1="170" x2="160" y2="230" />
              </g>
              <g className="ai-orbit ai-orbit-1">
                <circle className="ai-glider" cx="160" cy="35" r="6" />
              </g>
              <g className="ai-orbit ai-orbit-2">
                <circle className="ai-glider" cx="160" cy="15" r="5" />
              </g>
              <g className="ai-orbit-nodes">
                <circle cx="80" cy="130" r="7" />
                <circle cx="160" cy="230" r="7" />
                <circle cx="240" cy="130" r="7" />
                <circle cx="160" cy="30" r="7" />
              </g>
              <g className="ai-spark-lines">
                <path d="M120 70 L140 80" />
                <path d="M200 70 L220 60" />
                <path d="M110 200 L130 190" />
              </g>
            </svg>
          </div>
        </div>
      </section>

      {/* NEW SECTION: Core Features */}
      <section
        className="landing-section features-section"
        aria-labelledby="features-heading"
        ref={featuresSectionRef}
      >
        <div className="section-container">
          <h2 id="features-heading" className="section-title">Powerful Features, Simple Interface</h2>
          <div className="features-grid" role="list">
            <div className="feature-card" role="listitem">
              <div className="feature-icon" aria-hidden="true">
                <Workflow size={32} />
              </div>
              <h3 className="feature-title">Visual Workflow Builder</h3>
              <p className="feature-description">Drag, drop, and connect nodes to create complex automations visually</p>
            </div>
            
            <div className="feature-card" role="listitem">
              <div className="feature-icon" aria-hidden="true">
                <Brain size={32} />
              </div>
              <h3 className="feature-title">AI Assistant</h3>
              <p className="feature-description">Describe what you want, and our AI builds the workflow for you</p>
            </div>
            
            <div className="feature-card" role="listitem">
              <div className="feature-icon" aria-hidden="true">
                <Link2 size={32} />
              </div>
              <h3 className="feature-title">100+ Integrations</h3>
              <p className="feature-description">Connect Slack, Gmail, Google Drive, and all your favorite tools</p>
            </div>
            
            <div className="feature-card" role="listitem">
              <div className="feature-icon" aria-hidden="true">
                <Zap size={32} />
              </div>
              <h3 className="feature-title">Real-Time Execution</h3>
              <p className="feature-description">Watch your workflows run live with detailed logs and analytics</p>
            </div>
          </div>
        </div>
      </section>

      {/* NEW SECTION: How It Works */}
      <section className="landing-section how-it-works-section" aria-labelledby="how-heading">
        <div className="section-container">
          <h2 id="how-heading" className="section-title">Get Started in 3 Steps</h2>
          <div className="steps-container" role="list">
            <div className="step-card" role="listitem">
              <div className="step-number" aria-hidden="true">1</div>
              <div className="step-icon" aria-hidden="true">
                <Workflow size={24} />
              </div>
              <h3 className="step-title">Create Your Workflow</h3>
              <p className="step-description">Start from a template or build from scratch with our visual editor</p>
            </div>
            
            <div className="step-card" role="listitem">
              <div className="step-number" aria-hidden="true">2</div>
              <div className="step-icon" aria-hidden="true">
                <Link2 size={24} />
              </div>
              <h3 className="step-title">Connect Your Apps</h3>
              <p className="step-description">Link your tools and services with secure, one-click authentication</p>
            </div>
            
            <div className="step-card" role="listitem">
              <div className="step-number" aria-hidden="true">3</div>
              <div className="step-icon" aria-hidden="true">
                <CheckCircle size={24} />
              </div>
              <h3 className="step-title">Deploy & Automate</h3>
              <p className="step-description">Activate your workflow and watch it handle tasks automatically</p>
            </div>
          </div>
        </div>
      </section>

      <DemoSection user={user} navigate={navigate} />

      {/* NEW SECTION: Beta Signup */}
      <section
        className="landing-section beta-signup-section"
        aria-labelledby="beta-heading"
        ref={betaSectionRef}
      >
        <div className="section-container beta-container">
          <h2 id="beta-heading" className="section-title">Join Our Beta Program</h2>
          <p className="section-description">
            Be among the first to experience the future of workflow automation. Limited spots available.
          </p>
          <form className="beta-form" onSubmit={handleBetaSignup} aria-label="Beta signup form">
            <div className="beta-input-wrapper">
              <Mail size={20} className="beta-input-icon" aria-hidden="true" />
              <input
                type="email"
                className="beta-email-input"
                placeholder="Enter your email address"
                value={betaEmail}
                onChange={(e) => setBetaEmail(e.target.value)}
                disabled={betaSubmitting}
                aria-label="Email address"
                aria-required="true"
              />
            </div>
            <button 
              type="submit" 
              className="beta-submit-button"
              disabled={betaSubmitting}
              aria-label={betaSubmitting ? 'Submitting...' : 'Join beta program'}
            >
              {betaSubmitting ? 'Joining...' : 'Join Beta'}
            </button>
          </form>
          {betaMessage && (
            <p className={`beta-message ${betaMessage.includes('🎉') ? 'success' : 'error'}`} role="alert">
              {betaMessage}
            </p>
          )}
        </div>
      </section>
      
      {/* Footer - ENHANCED */}
      <footer className="footer" role="contentinfo">
        <div className="footer-left">
          <span className="footer-brand">CloLabs</span>
          <nav className="footer-nav" aria-label="Footer navigation">
            <Link to="/explore" className="footer-link">Discover</Link>
            <Link to="/pricing" className="footer-link">Pricing</Link>
            <a href="/sitemap.xml" className="footer-link" target="_blank" rel="noopener noreferrer">Sitemap</a>
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
