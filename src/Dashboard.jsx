import './Dashboard.css'
import logo from './assets/17F007DC-F981-4891-AED4-6F81382D4181.PNG'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import { listUserWorkflows, listTemplates, deleteWorkflowFromSupabase } from './lib/workflowApi'
import { fetchUserIntegrations, createIntegration, deleteIntegration, toggleIntegrationStatus } from './lib/integrationsApi'
import { loadUserProfile, saveUserProfile } from './lib/profileApi'
import { generateWorkflow } from './lib/aiAutoBuildApi'
import { getUserCredits } from './lib/creditsApi'
import TemplatePreviewModal from './components/TemplatePreviewModal'

// Helper function to mask sensitive URL parts
const maskUrl = (url) => {
  if (!url) return ''
  try {
    const urlObj = new URL(url)
    const pathParts = urlObj.pathname.split('/').filter(p => p)
    if (pathParts.length === 0) return url
    
    // Show protocol and host, mask middle parts of path
    const lastPart = pathParts[pathParts.length - 1]
    const maskedPath = pathParts.length > 1 ? '…/' + lastPart : lastPart
    return `${urlObj.protocol}//${urlObj.host}/…/${lastPart.slice(0, 6)}***`
  } catch (e) {
    // If URL parsing fails, mask the middle portion
    if (url.length > 30) {
      return url.slice(0, 20) + '…' + url.slice(-10)
    }
    return url
  }
}

const Dashboard = () => {
  const [showPrompt, setShowPrompt] = useState(false)
  const [promptText, setPromptText] = useState('')
  const [generatingWorkflow, setGeneratingWorkflow] = useState(false)
  const [promptError, setPromptError] = useState('')
  const [activeSection, setActiveSection] = useState('dashboard')
  const [workflows, setWorkflows] = useState([])
  const [loadingWorkflows, setLoadingWorkflows] = useState(false)
  const [templates, setTemplates] = useState([])
  const [loadingTemplates, setLoadingTemplates] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [deleteConfirmModal, setDeleteConfirmModal] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const navigate = useNavigate()
  const { user, signOut } = useAuth()

  // Profile data state
  const [profileData, setProfileData] = useState({
    name: user?.user_metadata?.full_name || 'John Doe',
    email: user?.email || 'john.doe@example.com',
    phone: '+1 (555) 123-4567',
    company: 'CloLabs Inc.',
    role: 'Automation Engineer',
    bio: 'Passionate about workflow automation and AI integration.',
  })

  // Preferences state
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    pushNotifications: false,
    weeklyReport: true,
    autoSave: true,
    language: 'English',
    timezone: 'UTC-5 (Eastern Time)',
  })

  const [integrations, setIntegrations] = useState([])
  const [loadingIntegrations, setLoadingIntegrations] = useState(false)
  const [showIntegrationForm, setShowIntegrationForm] = useState(false)
  const [integrationFormData, setIntegrationFormData] = useState({ name: '', url: '', type: 'webhook', slackWebhookUrl: '' })
  const [submittingIntegration, setSubmittingIntegration] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [integrationError, setIntegrationError] = useState(null)
  const [integrationSuccess, setIntegrationSuccess] = useState('')
  
  // Credits state
  const [credits, setCredits] = useState(null)
  const [loadingCredits, setLoadingCredits] = useState(false)
  const [creditsError, setCreditsError] = useState(null)

  // Load user profile on mount
  useEffect(() => {
    if (user?.id) {
      loadProfile();
      loadCredits();
    }
  }, [user?.id]);

  // Load workflows on initial mount for dashboard stats
  useEffect(() => {
    fetchWorkflows()
  }, [])

  // Load workflows when "Workflows" section is active, or templates when Templates is active
  useEffect(() => {
    if (activeSection === 'workflows') {
      fetchWorkflows()
    } else if (activeSection === 'templates') {
      fetchTemplates()
    } else if (activeSection === 'integrations') {
      loadIntegrations()
    }
  }, [activeSection])

  const loadProfile = async () => {
    const result = await loadUserProfile(user.id);
    if (result.success && result.data) {
      // Update profile data from database
      setProfileData({
        name: result.data.name || user?.user_metadata?.full_name || 'John Doe',
        email: user?.email || 'john.doe@example.com',
        phone: result.data.phone || '+1 (555) 123-4567',
        company: result.data.company || 'CloLabs Inc.',
        role: result.data.role || 'Automation Engineer',
        bio: result.data.bio || 'Passionate about workflow automation and AI integration.'
      });
      
      // Update preferences from database
      setPreferences({
        emailNotifications: result.data.email_notifications ?? true,
        pushNotifications: result.data.push_notifications ?? false,
        weeklyReport: result.data.weekly_report ?? true,
        autoSave: result.data.auto_save ?? true,
        language: result.data.language || 'English',
        timezone: result.data.timezone || 'UTC-5 (Eastern Time)'
      });
    }
  };

  const loadCredits = async () => {
    setLoadingCredits(true);
    setCreditsError(null);
    
    const result = await getUserCredits();
    
    if (result.error) {
      console.error('Error loading credits:', result.error);
      setCreditsError(result.error);
    } else if (result.data) {
      setCredits(result.data);
    }
    
    setLoadingCredits(false);
  };


  const fetchWorkflows = async () => {
    setLoadingWorkflows(true)
    const result = await listUserWorkflows(user?.id)
    if (result.success) {
      setWorkflows(result.data)
    } else {
      console.error('Error fetching workflows:', result.error)
    }
    setLoadingWorkflows(false)
  }

  const fetchTemplates = async () => {
    setLoadingTemplates(true)
    const result = await listTemplates()
    if (result.success) {
      setTemplates(result.data)
    } else {
      console.error('Error fetching templates:', result.error)
    }
    setLoadingTemplates(false)
  }

  const loadIntegrations = async () => {
    setLoadingIntegrations(true)
    setIntegrationError(null)
    const result = await fetchUserIntegrations()
    if (!result.error && result.data) {
      setIntegrations(result.data)
    } else {
      console.error('Error fetching integrations:', result.error)
      setIntegrationError(result.error)
    }
    setLoadingIntegrations(false)
  }

  const handleIntegrationFormChange = (e) => {
    const { name, value } = e.target
    setIntegrationFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleCreateIntegration = async (e) => {
    e.preventDefault()
    setSubmittingIntegration(true)
    setIntegrationError(null)
    setIntegrationSuccess('')

    // Validate Slack webhook URL if type is slack
    if (integrationFormData.type === 'slack') {
      if (!integrationFormData.slackWebhookUrl) {
        setIntegrationError('Slack Webhook URL is required')
        setSubmittingIntegration(false)
        return
      }
      if (!integrationFormData.slackWebhookUrl.startsWith('https://hooks.slack.com/')) {
        setIntegrationError('Invalid Slack Webhook URL. Must start with https://hooks.slack.com/')
        setSubmittingIntegration(false)
        return
      }
    }

    // Validate generic webhook URL
    if (integrationFormData.type === 'webhook') {
      if (!integrationFormData.url) {
        setIntegrationError('Webhook URL is required')
        setSubmittingIntegration(false)
        return
      }
      if (!integrationFormData.url.startsWith('http://') && !integrationFormData.url.startsWith('https://')) {
        setIntegrationError('Invalid Webhook URL. Must start with http:// or https://')
        setSubmittingIntegration(false)
        return
      }
      if (!integrationFormData.name || integrationFormData.name.trim() === '') {
        setIntegrationError('Webhook name is required')
        setSubmittingIntegration(false)
        return
      }
    }

    // Prepare integration data based on type
    let integrationData = {}
    
    if (integrationFormData.type === 'slack') {
      integrationData = {
        name: 'Slack Webhook',
        type: 'slack',
        url: integrationFormData.slackWebhookUrl,
        config: { url: integrationFormData.slackWebhookUrl }
      }
    } else {
      integrationData = {
        name: integrationFormData.name,
        url: integrationFormData.url,
        type: 'webhook',
        config: { url: integrationFormData.url }
      }
    }

    console.log('[Dashboard] Creating integration:', integrationData)
    const result = await createIntegration(integrationData)

    if (!result.error && result.data) {
      const successMsg = integrationFormData.type === 'slack' 
        ? 'Slack Webhook created successfully!' 
        : `Generic Webhook "${integrationFormData.name}" created successfully!`
      console.log('[Dashboard] Integration created:', result.data)
      setIntegrationSuccess(successMsg)
      setIntegrationFormData({ name: '', url: '', type: 'webhook', slackWebhookUrl: '' })
      setShowIntegrationForm(false)
      loadIntegrations()
      setTimeout(() => setIntegrationSuccess(''), 3000)
    } else {
      console.error('[Dashboard] Error creating integration:', result.error)
      setIntegrationError(result.error)
    }

    setSubmittingIntegration(false)
  }

  const handleDeleteIntegration = async (integrationId) => {
    if (!confirm('Are you sure you want to delete this webhook?')) return

    console.log('[Dashboard] Deleting integration:', integrationId)
    const result = await deleteIntegration(integrationId)
    
    if (!result.error) {
      console.log('[Dashboard] Integration deleted successfully')
      setIntegrations(integrations.filter(i => i.id !== integrationId))
      setIntegrationSuccess('Webhook deleted successfully!')
      setTimeout(() => setIntegrationSuccess(''), 3000)
    } else {
      console.error('[Dashboard] Error deleting integration:', result.error)
      setIntegrationError(result.error)
    }
  }

  const handleToggleIntegration = async (integrationId, currentStatus) => {
    console.log('[Dashboard] Toggling integration:', integrationId, 'from', currentStatus, 'to', !currentStatus)
    const result = await toggleIntegrationStatus(integrationId, !currentStatus)
    
    if (!result.error && result.data) {
      console.log('[Dashboard] Integration toggled successfully')
      setIntegrations(integrations.map(i => 
        i.id === integrationId ? { ...i, is_active: !currentStatus } : i
      ))
    } else {
      console.error('[Dashboard] Error toggling integration:', result.error)
      setIntegrationError(result.error)
    }
  }

  const handleOpenWorkflow = (workflowId) => {
    navigate(`/builder?workflow=${workflowId}`)
  }

  const handleTemplateClick = (template) => {
    setSelectedTemplate(template)
  }

  const handleCloseTemplateModal = () => {
    setSelectedTemplate(null)
  }

  const handleDeleteClick = (workflow) => {
    setDeleteConfirmModal(workflow)
  }

  const handleConfirmDelete = async () => {
    if (!deleteConfirmModal) return

    setDeleting(true)
    const result = await deleteWorkflowFromSupabase(deleteConfirmModal.id)
    
    if (result.success) {
      // Remove from local state
      setWorkflows(workflows.filter(w => w.id !== deleteConfirmModal.id))
      setDeleteConfirmModal(null)
    } else {
      alert('Failed to delete workflow: ' + result.error)
    }
    
    setDeleting(false)
  }

  const handleCancelDelete = () => {
    setDeleteConfirmModal(null)
  }

  // Profile handlers
  const handleInputChange = (field, value) => {
    setProfileData({ ...profileData, [field]: value })
  }

  const handlePreferenceToggle = async (field) => {
    const newPreferences = { ...preferences, [field]: !preferences[field] };
    setPreferences(newPreferences);
    
    // Auto-save preferences
    await saveUserProfile(user.id, {
      name: profileData.name,
      phone: profileData.phone,
      company: profileData.company,
      role: profileData.role,
      bio: profileData.bio,
      emailNotifications: newPreferences.emailNotifications,
      pushNotifications: newPreferences.pushNotifications,
      weeklyReport: newPreferences.weeklyReport,
      autoSave: newPreferences.autoSave,
      language: newPreferences.language,
      timezone: newPreferences.timezone
    });
  }

  const handlePreferenceChange = async (field, value) => {
    const newPreferences = { ...preferences, [field]: value };
    setPreferences(newPreferences);
    
    // Auto-save preferences
    await saveUserProfile(user.id, {
      name: profileData.name,
      phone: profileData.phone,
      company: profileData.company,
      role: profileData.role,
      bio: profileData.bio,
      emailNotifications: newPreferences.emailNotifications,
      pushNotifications: newPreferences.pushNotifications,
      weeklyReport: newPreferences.weeklyReport,
      autoSave: newPreferences.autoSave,
      language: newPreferences.language,
      timezone: newPreferences.timezone
    });
  }

  const handleSaveProfile = async () => {
    setIsEditingProfile(false);
    
    const result = await saveUserProfile(user.id, {
      name: profileData.name,
      phone: profileData.phone,
      company: profileData.company,
      role: profileData.role,
      bio: profileData.bio,
      emailNotifications: preferences.emailNotifications,
      pushNotifications: preferences.pushNotifications,
      weeklyReport: preferences.weeklyReport,
      autoSave: preferences.autoSave,
      language: preferences.language,
      timezone: preferences.timezone
    });
    
    if (result.success) {
      console.log('Profile saved successfully');
    } else {
      console.error('Error saving profile:', result.error);
      alert('Failed to save profile: ' + result.error);
    }
  }

  // Calculate workflow statistics
  const getTotalWorkflows = () => {
    return workflows.length
  }

  const getRunningWorkflows = () => {
    // For now, count workflows that have been updated recently (within last 7 days)
    // or have status/is_active field set to true
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    return workflows.filter(w => {
      // Check if workflow has explicit active status
      if (w.status === 'active' || w.status === 'running' || w.is_active === true) {
        return true
      }
      // Otherwise, consider recently updated workflows as potentially running
      if (w.updated_at) {
        const updatedDate = new Date(w.updated_at)
        return updatedDate > sevenDaysAgo
      }
      return false
    }).length
  }

  const getEndedWorkflows = () => {
    // Count workflows with explicit ended/stopped status
    // or workflows not updated in last 7 days
    const runningCount = getRunningWorkflows()
    const totalCount = getTotalWorkflows()
    
    // For workflows with explicit status
    const explicitlyEnded = workflows.filter(w => 
      w.status === 'stopped' || 
      w.status === 'completed' || 
      w.status === 'ended' ||
      w.is_active === false
    ).length
    
    // If we have explicit status data, use it; otherwise calculate as total - running
    if (explicitlyEnded > 0) {
      return explicitlyEnded
    }
    
    return totalCount - runningCount
  }

  // Get workflow activity for the last 7 days (for analytics chart)
  const getWeeklyAnalytics = () => {
    const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const analytics = []

    // Get the last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dayOfWeek = date.getDay() // 0 = Sunday, 1 = Monday, etc.
      const dayLabel = days[dayOfWeek]
      
      // Count workflows created or updated on this day
      const workflowsOnDay = workflows.filter(w => {
        if (!w.created_at && !w.updated_at) return false
        
        const createdDate = w.created_at ? new Date(w.created_at) : null
        const updatedDate = w.updated_at ? new Date(w.updated_at) : null
        
        if (createdDate) createdDate.setHours(0, 0, 0, 0)
        if (updatedDate) updatedDate.setHours(0, 0, 0, 0)
        
        return (
          (createdDate && createdDate.getTime() === date.getTime()) ||
          (updatedDate && updatedDate.getTime() === date.getTime())
        )
      }).length

      // Calculate percentage based on activity
      const maxActivities = 10 // Scale: assume max 10 workflows per day for 100%
      const percentage = Math.min(100, (workflowsOnDay / maxActivities) * 100)
      const displayPercentage = workflowsOnDay > 0 ? Math.max(20, percentage) : 0 // Minimum 20% if activity exists
      
      // Today and past days are "active" (colored), future days are inactive
      const isPastOrToday = date.getTime() <= today.getTime()
      
      analytics.push({
        day: dayLabel,
        percentage: displayPercentage,
        count: workflowsOnDay,
        isActive: isPastOrToday
      })
    }

    return analytics
  }

  const handlePromptSubmit = async () => {
    const trimmedPrompt = promptText.trim();
    
    if (!trimmedPrompt) {
      setPromptError('Please describe the workflow you want to create');
      return;
    }

    if (trimmedPrompt.length < 10) {
      setPromptError('Please provide more details about your workflow');
      return;
    }

    setGeneratingWorkflow(true);
    setPromptError('');

    try {
      console.log('[Dashboard] Generating workflow from prompt:', trimmedPrompt);
      
      // Generate workflow using AI
      const result = await generateWorkflow(trimmedPrompt, {
        model: 'gpt-4-turbo-preview'
      });

      if (result && result.workflow) {
        console.log('[Dashboard] Workflow generated successfully:', result.workflow);
        
        // Navigate to Builder with the generated workflow
        // Pass it as state so Builder can load it
        navigate('/builder', {
          state: {
            generatedWorkflow: result.workflow,
            workflowName: result.workflow.name || 'AI Generated Workflow',
            workflowDescription: result.workflow.description || trimmedPrompt
          }
        });
        
        // Clean up
        setShowPrompt(false);
        setPromptText('');
      } else {
        throw new Error('No workflow data received');
      }
    } catch (error) {
      console.error('[Dashboard] Workflow generation failed:', error);
      setPromptError(error.message || 'Failed to generate workflow. Please try again.');
    } finally {
      setGeneratingWorkflow(false);
    }
  }

  const handleLogout = async () => {
    if (!showLogoutConfirm) {
      // First click - show confirmation
      setShowLogoutConfirm(true);
      return;
    }
    
    // Second click - actually logout
    // Sign out from Supabase
    await signOut()
    
    // Clear any stored authentication data
    localStorage.removeItem('authToken')
    localStorage.removeItem('user')
    sessionStorage.clear()
    
    // Redirect to landing page
    window.location.href = '/'
  }

  // Reset logout confirmation after 3 seconds
  useEffect(() => {
    if (showLogoutConfirm) {
      const timer = setTimeout(() => {
        setShowLogoutConfirm(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showLogoutConfirm]);

  return (
    <div className="dashboard-container">
      <svg width="0" height="0" style={{position: 'absolute'}}>
        <defs>
          <linearGradient id="nav-icon-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0d2b45"/>
            <stop offset="50%" stopColor="#203c5b"/>
            <stop offset="100%" stopColor="#2b1d3b"/>
          </linearGradient>
        </defs>
      </svg>
      <aside className="dashboard-sidebar">
        <div className="sidebar-logo" style={{display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '0px'}}>
          <img src={logo} alt="CloLabs" className="logo-image" style={{display: 'block', marginRight: '-10px'}} />
          <span className="dashboard-logo-text" style={{display: 'block', marginLeft: '-8px'}}>CloLabs</span>
        </div>
        <nav className="sidebar-nav">
          <a 
            href="#" 
            className={`nav-item ${activeSection === 'dashboard' ? 'active' : ''}`}
            onClick={(e) => { e.preventDefault(); setActiveSection('dashboard'); }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="url(#nav-icon-gradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            <span>Dashboard</span>
          </a>
          <a 
            href="#" 
            className={`nav-item ${activeSection === 'workflows' ? 'active' : ''}`}
            onClick={(e) => { e.preventDefault(); setActiveSection('workflows'); }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="url(#nav-icon-gradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.29 7 12 12 20.71 7"/><line x1="12" y1="22" x2="12" y2="12"/>
            </svg>
            <span>Workflows</span>
          </a>
          <a 
            href="#" 
            className={`nav-item ${activeSection === 'apps' ? 'active' : ''}`}
            onClick={(e) => { e.preventDefault(); setActiveSection('apps'); }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="url(#nav-icon-gradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
            </svg>
            <span>Apps</span>
          </a>
          <a 
            href="#" 
            className={`nav-item ${activeSection === 'templates' ? 'active' : ''}`}
            onClick={(e) => { e.preventDefault(); setActiveSection('templates'); }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="url(#nav-icon-gradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
            </svg>
            <span>Templates</span>
          </a>
          <a 
            href="#" 
            className={`nav-item ${activeSection === 'integrations' ? 'active' : ''}`}
            onClick={(e) => { e.preventDefault(); setActiveSection('integrations'); }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="url(#nav-icon-gradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
            </svg>
            <span>Integrations</span>
          </a>
        </nav>
        <div className="sidebar-bottom">
          <a 
            href="#" 
            className={`nav-item ${activeSection === 'settings' ? 'active' : ''}`}
            onClick={(e) => { e.preventDefault(); setActiveSection('settings'); }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="url(#nav-icon-gradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>
            </svg>
            <span>Settings</span>
          </a>
          <button className="nav-item" onClick={handleLogout} style={{background: 'none', border: 'none', width: '100%', textAlign: 'left'}}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="url(#nav-icon-gradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            <span>{showLogoutConfirm ? 'Click again to confirm' : 'Logout'}</span>
          </button>
        </div>
      </aside>
      <main className="dashboard-main">
        <div className="dashboard-top-bar">
          <div className="curved-search-container">
            <input type="text" placeholder="Search..." className="curved-search-input" />
          </div>
          <div className="top-bar-actions">
            <a 
              href="https://mail.google.com/mail/?view=cm&fs=1&to=clolabs.ai@gmail.com&su=Feedback%20for%20CloLabs&body=Hi%20CloLabs%20Team,%0A%0A" 
              target="_blank" 
              rel="noopener noreferrer"
              className="feedback-button"
            >
              Feedback
            </a>
            <a href="/pricing" className="upgrade-button">Upgrade</a>
            <button className="action-button">
              <svg xmlns="http://www.w3.org/2000/svg" width="90%" height="90%" viewBox="0 0 24 24" fill="none" stroke="#000000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 4-10 8L2 4"/></svg>
            </button>
            <button className="action-button">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#000000" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a6 6 0 0 0-6 6c0 7-3 9-3 9h18s-3-2-3-9a6 6 0 0 0-6-6z"/><path d="M13 17v1a1 1 0 0 1-1 1h0a1 1 0 0 1-1-1v-1"/></svg>
            </button>
            <div className="profile-button" onClick={() => setActiveSection('settings')} style={{cursor: 'pointer'}}>
              <img src="/src/assets/female.jpg" alt="Profile" className="profile-image" />
            </div>
          </div>
        </div>
        <div className="dashboard-main-content">
          {activeSection === 'dashboard' && (
            <>
              <div className="dashboard-header">
                <div className="dashboard-title-section">
                  <h1 className="dashboard-heading">Dashboard</h1>
                  <p className="dashboard-tagline">Automate smarter, manage easier, and flow faster</p>
                </div>
                <a href="/builder" className="create-workflow-btn">+ Create Workflow</a>
              </div>
              <div className="dashboard-layout">
                <div className="dashboard-stats">
                  <div className="stat-box" onClick={() => setShowPrompt(true)}>
                    <div className="box-text">Create a workflow</div>
                    <div className="box-text">using</div>
                    <div className="box-text-highlight">AI</div>
                  </div>
                  <div className="stat-box">
                    <h3 className="stat-box-title">Total Workflows</h3>
                    <div className="stat-box-number">{getTotalWorkflows().toString().padStart(2, '0')}</div>
                  </div>
                  <div className="stat-box">
                    <h3 className="stat-box-title">Running Workflows</h3>
                    <div className="stat-box-number">{getRunningWorkflows().toString().padStart(2, '0')}</div>
                  </div>
                  <div className="stat-box">
                    <h3 className="stat-box-title">Ended Workflows</h3>
                    <div className="stat-box-number">{getEndedWorkflows().toString().padStart(2, '0')}</div>
                  </div>
                </div>
                <div className="large-box">
                  <h3 className="analytics-title">Workflow Analytics</h3>
                  <div className="analytics-chart">
                    {getWeeklyAnalytics().map((dayData, index) => (
                      <div 
                        key={index}
                        className={`chart-bar ${dayData.isActive ? 'active' : ''}`}
                        data-day={dayData.day}
                        data-percentage={`${Math.round(dayData.percentage)}%`}
                        style={{
                          height: `${dayData.percentage}%`,
                          opacity: dayData.isActive ? '1' : '0.3'
                        }}
                      >
                        <div className="bar-label-hover">
                          {dayData.count > 0 
                            ? `${dayData.count} workflow${dayData.count !== 1 ? 's' : ''}`
                            : '0%'
                          }
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="side-box">
                  <h3 className="analytics-title">Credits Left</h3>
                  <div className="credits-display">
                    {loadingCredits ? (
                      <div className="credits-number">Loading...</div>
                    ) : creditsError ? (
                      <div className="credits-number" style={{ fontSize: '14px', color: '#ff6b6b' }}>
                        Error loading credits
                      </div>
                    ) : credits ? (
                      <>
                        <div className="credits-number">
                          {credits.credits_remaining}/{credits.total_credits}
                        </div>
                        <div className="credits-label">Remaining Credits</div>
                      </>
                    ) : (
                      <div className="credits-number">--/--</div>
                    )}
                  </div>
                </div>
                <div className="fourth-box">
                  <h3 className="analytics-title">Start with a template</h3>
                </div>
                <div className="second-large-box">
                  <h3 className="analytics-title">Watch the tutorial</h3>
                  <div className="video-placeholder">
                  </div>
                </div>
                <div className="third-box">
                  <h3 className="analytics-title">Apps</h3>
                </div>
              </div>
            </>
          )}

          {activeSection === 'workflows' && (
            <>
              <div className="dashboard-header">
                <div className="dashboard-title-section">
                  <h1 className="dashboard-heading">My Workflows</h1>
                  <p className="dashboard-tagline">Manage and organize your automation workflows</p>
                </div>
                <a href="/builder" className="create-workflow-btn">+ Create Workflow</a>
              </div>
              <div className="workflows-list">
                {loadingWorkflows ? (
                  <div className="loading-state">Loading workflows...</div>
                ) : workflows.length === 0 ? (
                  <div className="empty-workflows-state">
                    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5">
                      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                      <polyline points="3.29 7 12 12 20.71 7"/>
                      <line x1="12" y1="22" x2="12" y2="12"/>
                    </svg>
                    <h3>No workflows yet</h3>
                    <p>Create your first workflow to get started</p>
                    <a href="/builder" className="create-workflow-btn" style={{marginTop: '16px'}}>+ Create Workflow</a>
                  </div>
                ) : (
                  <table className="workflows-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Nodes</th>
                        <th>Last Updated</th>
                        <th>Created</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {workflows.map(workflow => (
                        <tr key={workflow.id}>
                          <td className="workflow-name">{workflow.name}</td>
                          <td>{workflow.nodes?.length || 0}</td>
                          <td>{new Date(workflow.updated_at).toLocaleDateString()}</td>
                          <td>{new Date(workflow.created_at).toLocaleDateString()}</td>
                          <td>
                            <div className="workflow-actions">
                              <button 
                                className="open-workflow-btn"
                                onClick={() => handleOpenWorkflow(workflow.id)}
                              >
                                Open
                              </button>
                              <button 
                                className="delete-workflow-btn"
                                onClick={() => handleDeleteClick(workflow)}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}

          {activeSection === 'apps' && (
            <>
              <div className="dashboard-header">
                <div className="dashboard-title-section">
                  <h1 className="dashboard-heading">Apps</h1>
                  <p className="dashboard-tagline">Manage your connected applications</p>
                </div>
              </div>
              <div className="coming-soon-state">
                <h3>Coming Soon</h3>
                <p>Apps management will be available soon</p>
              </div>
            </>
          )}

          {activeSection === 'templates' && (
            <>
              <div className="dashboard-header">
                <div className="dashboard-title-section">
                  <h1 className="dashboard-heading">Templates</h1>
                  <p className="dashboard-tagline">Start with pre-built workflow templates</p>
                </div>
              </div>
              <div className="dashboard-content">
                {loadingTemplates ? (
                  <div className="loading-state">
                    <p>Loading templates...</p>
                  </div>
                ) : templates.length === 0 ? (
                  <div className="empty-workflows-state">
                    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                      <line x1="16" y1="13" x2="8" y2="13"/>
                      <line x1="16" y1="17" x2="8" y2="17"/>
                      <polyline points="10 9 9 9 8 9"/>
                    </svg>
                    <h3>No templates available</h3>
                    <p>Check back later for pre-built workflow templates</p>
                  </div>
                ) : (
                  <div className="templates-grid">
                    {templates.map(template => (
                      <div 
                        key={template.id} 
                        className="template-card"
                        onClick={() => handleTemplateClick(template)}
                      >
                        <div className="template-card-header">
                          <h3 className="template-card-title">{template.name}</h3>
                          {template.category && (
                            <span className="template-category-badge">{template.category}</span>
                          )}
                        </div>
                        <p className="template-card-description">{template.description}</p>
                        <div className="template-card-stats">
                          <div className="template-stat-item">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="10"/>
                              <circle cx="12" cy="12" r="3"/>
                            </svg>
                            <span>{template.nodes?.length || 0} nodes</span>
                          </div>
                          <div className="template-stat-item">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                            </svg>
                            <span>{template.connections?.length || 0} connections</span>
                          </div>
                        </div>
                        {template.tags && template.tags.length > 0 && (
                          <div className="template-card-tags">
                            {template.tags.slice(0, 3).map((tag, idx) => (
                              <span key={idx} className="template-tag-small">{tag}</span>
                            ))}
                            {template.tags.length > 3 && (
                              <span className="template-tag-small">+{template.tags.length - 3}</span>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {activeSection === 'settings' && (
            <>
              <div className="dashboard-header">
                <div className="dashboard-title-section">
                  <h1 className="dashboard-heading">Settings</h1>
                  <p className="dashboard-tagline">Manage your account and preferences</p>
                </div>
                {!isEditingProfile && (
                  <button className="create-workflow-btn" onClick={() => setIsEditingProfile(true)}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                    Edit Profile
                  </button>
                )}
              </div>
              <div className="dashboard-content">
                <div className="settings-grid">
                  {/* Profile Information Card */}
                  <div className="settings-card">
                    <div className="settings-card-header">
                      <div className="settings-card-title-wrapper">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0d2b45" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                        </svg>
                        <h2 className="settings-card-title">Personal Information</h2>
                      </div>
                    </div>
                    <div className="settings-card-body">
                      <div className="profile-avatar-section">
                        <div className="large-profile-avatar">
                          <img src="/src/assets/female.jpg" alt="Profile" className="avatar-img" />
                        </div>
                        {isEditingProfile && (
                          <button className="change-avatar-btn">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>
                            </svg>
                            Change Photo
                          </button>
                        )}
                      </div>
                      <div className="profile-fields">
                        <div className="field-group">
                          <label className="field-label">Full Name</label>
                          {isEditingProfile ? (
                            <input 
                              type="text" 
                              className="field-input" 
                              value={profileData.name}
                              onChange={(e) => handleInputChange('name', e.target.value)}
                            />
                          ) : (
                            <div className="field-value">{profileData.name}</div>
                          )}
                        </div>
                        <div className="field-group">
                          <label className="field-label">Email Address</label>
                          <div className="field-value">{profileData.email}</div>
                          <span className="field-hint">Email cannot be changed</span>
                        </div>
                        <div className="field-group">
                          <label className="field-label">Phone Number</label>
                          {isEditingProfile ? (
                            <input 
                              type="tel" 
                              className="field-input" 
                              value={profileData.phone}
                              onChange={(e) => handleInputChange('phone', e.target.value)}
                            />
                          ) : (
                            <div className="field-value">{profileData.phone}</div>
                          )}
                        </div>
                        <div className="field-group">
                          <label className="field-label">Company</label>
                          {isEditingProfile ? (
                            <input 
                              type="text" 
                              className="field-input" 
                              value={profileData.company}
                              onChange={(e) => handleInputChange('company', e.target.value)}
                            />
                          ) : (
                            <div className="field-value">{profileData.company}</div>
                          )}
                        </div>
                        <div className="field-group">
                          <label className="field-label">Role</label>
                          {isEditingProfile ? (
                            <input 
                              type="text" 
                              className="field-input" 
                              value={profileData.role}
                              onChange={(e) => handleInputChange('role', e.target.value)}
                            />
                          ) : (
                            <div className="field-value">{profileData.role}</div>
                          )}
                        </div>
                        <div className="field-group field-group-full">
                          <label className="field-label">Bio</label>
                          {isEditingProfile ? (
                            <textarea 
                              className="field-textarea" 
                              value={profileData.bio}
                              onChange={(e) => handleInputChange('bio', e.target.value)}
                              rows="3"
                            />
                          ) : (
                            <div className="field-value">{profileData.bio}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Preferences Card */}
                  <div className="settings-card">
                    <div className="settings-card-header">
                      <div className="settings-card-title-wrapper">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0d2b45" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="3"/><path d="M12 1v6m0 6v6m9-9h-6m-6 0H3"/>
                        </svg>
                        <h2 className="settings-card-title">Preferences</h2>
                      </div>
                    </div>
                    <div className="settings-card-body">
                      <div className="preference-item">
                        <div className="preference-info">
                          <div className="preference-label">Email Notifications</div>
                          <div className="preference-desc">Receive email updates about your workflows</div>
                        </div>
                        <label className="toggle-switch">
                          <input 
                            type="checkbox" 
                            checked={preferences.emailNotifications}
                            onChange={() => handlePreferenceToggle('emailNotifications')}
                          />
                          <span className="toggle-slider"></span>
                        </label>
                      </div>
                      <div className="preference-item">
                        <div className="preference-info">
                          <div className="preference-label">Push Notifications</div>
                          <div className="preference-desc">Get push notifications on your devices</div>
                        </div>
                        <label className="toggle-switch">
                          <input 
                            type="checkbox" 
                            checked={preferences.pushNotifications}
                            onChange={() => handlePreferenceToggle('pushNotifications')}
                          />
                          <span className="toggle-slider"></span>
                        </label>
                      </div>
                      <div className="preference-item">
                        <div className="preference-info">
                          <div className="preference-label">Weekly Report</div>
                          <div className="preference-desc">Receive weekly summary of your automation</div>
                        </div>
                        <label className="toggle-switch">
                          <input 
                            type="checkbox" 
                            checked={preferences.weeklyReport}
                            onChange={() => handlePreferenceToggle('weeklyReport')}
                          />
                          <span className="toggle-slider"></span>
                        </label>
                      </div>
                      <div className="preference-item">
                        <div className="preference-info">
                          <div className="preference-label">Auto-Save</div>
                          <div className="preference-desc">Automatically save workflows as you build</div>
                        </div>
                        <label className="toggle-switch">
                          <input 
                            type="checkbox" 
                            checked={preferences.autoSave}
                            onChange={() => handlePreferenceToggle('autoSave')}
                          />
                          <span className="toggle-slider"></span>
                        </label>
                      </div>
                      <div className="preference-item">
                        <div className="preference-info">
                          <div className="preference-label">Language</div>
                          <div className="preference-desc">Choose your preferred language</div>
                        </div>
                        <select 
                          className="preference-select"
                          value={preferences.language}
                          onChange={(e) => handlePreferenceChange('language', e.target.value)}
                        >
                          <option value="English">English</option>
                          <option value="Spanish">Spanish</option>
                          <option value="French">French</option>
                          <option value="German">German</option>
                        </select>
                      </div>
                      <div className="preference-item">
                        <div className="preference-info">
                          <div className="preference-label">Timezone</div>
                          <div className="preference-desc">Set your local timezone</div>
                        </div>
                        <select 
                          className="preference-select"
                          value={preferences.timezone}
                          onChange={(e) => handlePreferenceChange('timezone', e.target.value)}
                        >
                          <option value="UTC-8 (Pacific Time)">UTC-8 (Pacific Time)</option>
                          <option value="UTC-7 (Mountain Time)">UTC-7 (Mountain Time)</option>
                          <option value="UTC-6 (Central Time)">UTC-6 (Central Time)</option>
                          <option value="UTC-5 (Eastern Time)">UTC-5 (Eastern Time)</option>
                          <option value="UTC+0 (GMT)">UTC+0 (GMT)</option>
                          <option value="UTC+1 (CET)">UTC+1 (CET)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Account Security Card */}
                  <div className="settings-card">
                    <div className="settings-card-header">
                      <div className="settings-card-title-wrapper">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0d2b45" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                        </svg>
                        <h2 className="settings-card-title">Account Security</h2>
                      </div>
                    </div>
                    <div className="settings-card-body">
                      <div className="security-item">
                        <div className="security-info">
                          <div className="security-label">Password</div>
                          <div className="security-value">••••••••••••</div>
                        </div>
                        <button className="security-btn">Change Password</button>
                      </div>
                      <div className="security-item">
                        <div className="security-info">
                          <div className="security-label">Two-Factor Authentication</div>
                          <div className="security-value">Not enabled</div>
                        </div>
                        <button className="security-btn security-btn-green">Enable 2FA</button>
                      </div>
                      <div className="security-item">
                        <div className="security-info">
                          <div className="security-label">Active Sessions</div>
                          <div className="security-value">2 devices connected</div>
                        </div>
                        <button className="security-btn">View Sessions</button>
                      </div>
                    </div>
                  </div>
                </div>

                {isEditingProfile && (
                  <div className="profile-actions">
                    <button className="cancel-btn" onClick={() => setIsEditingProfile(false)}>Cancel</button>
                    <button className="save-btn" onClick={handleSaveProfile}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      Save Changes
                    </button>
                  </div>
                )}
              </div>
            </>
          )}

          {activeSection === 'integrations' && (
            <>
              <div className="dashboard-header">
                <div className="dashboard-title-section">
                  <h1 className="dashboard-heading">Integrations</h1>
                  <p className="dashboard-tagline">Connect your workflows with external services</p>
                </div>
                <button 
                  className="create-workflow-btn" 
                  onClick={() => setShowIntegrationForm(!showIntegrationForm)}
                >
                  {showIntegrationForm ? 'Cancel' : '+ Add Webhook'}
                </button>
              </div>

              {integrationSuccess && (
                <div className="alert alert-success">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                  {integrationSuccess}
                </div>
              )}

              {integrationError && (
                <div className="alert alert-error">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="15" y1="9" x2="9" y2="15"/>
                    <line x1="9" y1="9" x2="15" y2="15"/>
                  </svg>
                  {integrationError}
                </div>
              )}

              {showIntegrationForm && (
                <div className="integration-form-card">
                  <h3 className="form-title">Add New Integration</h3>
                  <form onSubmit={handleCreateIntegration}>
                    <div className="form-group">
                      <label htmlFor="integrationType">Integration Type</label>
                      <select
                        id="integrationType"
                        name="type"
                        value={integrationFormData.type}
                        onChange={handleIntegrationFormChange}
                        className="config-select"
                        style={{width: '100%', padding: '12px 16px', background: 'white', border: '1px solid #d1d5db', borderRadius: '10px', fontSize: '14px', color: '#1f2937'}}
                      >
                        <option value="webhook">Generic Webhook</option>
                        <option value="slack">Slack Webhook</option>
                      </select>
                    </div>

                    {integrationFormData.type === 'webhook' && (
                      <>
                        <div className="form-group">
                          <label htmlFor="name">Webhook Name</label>
                          <input
                            type="text"
                            id="name"
                            name="name"
                            value={integrationFormData.name}
                            onChange={handleIntegrationFormChange}
                            placeholder="e.g., My Custom Webhook"
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label htmlFor="url">Webhook URL</label>
                          <input
                            type="url"
                            id="url"
                            name="url"
                            value={integrationFormData.url}
                            onChange={handleIntegrationFormChange}
                            placeholder="https://your-webhook-url.com/endpoint"
                            required
                          />
                        </div>
                      </>
                    )}

                    {integrationFormData.type === 'slack' && (
                      <div className="form-group">
                        <label htmlFor="slackWebhookUrl">Slack Incoming Webhook URL</label>
                        <input
                          type="url"
                          id="slackWebhookUrl"
                          name="slackWebhookUrl"
                          value={integrationFormData.slackWebhookUrl}
                          onChange={handleIntegrationFormChange}
                          placeholder="https://hooks.slack.com/services/..."
                          required
                        />
                        <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                          Get your webhook URL from Slack's Incoming Webhooks app
                        </p>
                      </div>
                    )}

                    <button 
                      type="submit" 
                      className="submit-btn"
                      disabled={submittingIntegration}
                    >
                      {submittingIntegration ? 'Creating...' : 'Create Integration'}
                    </button>
                  </form>
                </div>
              )}

              <div className="integrations-list">
                {loadingIntegrations ? (
                  <div className="loading-state">Loading integrations...</div>
                ) : integrations.length === 0 ? (
                  <div className="empty-workflows-state">
                    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5">
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                    </svg>
                    <h3>No webhooks configured</h3>
                    <p>Add your first webhook to start integrating with external services</p>
                    <button 
                      className="create-workflow-btn" 
                      style={{marginTop: '16px'}}
                      onClick={() => setShowIntegrationForm(true)}
                    >
                      + Add Webhook
                    </button>
                  </div>
                ) : (
                  <div className="webhooks-grid">
                    {integrations.map(integration => (
                      <div key={integration.id} className="webhook-card">
                        <div className="webhook-header">
                          <div className="webhook-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                            </svg>
                          </div>
                          <h3 className="webhook-name">{integration.name}</h3>
                        </div>
                        <div className="webhook-url">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                            <polyline points="15 3 21 3 21 9"/>
                            <line x1="10" y1="14" x2="21" y2="3"/>
                          </svg>
                          <span className="webhook-url-text" title={integration.url}>{maskUrl(integration.url)}</span>
                        </div>
                        <div className="webhook-meta">
                          <span className="webhook-type">{integration.type}</span>
                          <span className="webhook-date">
                            {new Date(integration.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="webhook-actions">
                          <label className="toggle-switch">
                            <input
                              type="checkbox"
                              checked={integration.is_active}
                              onChange={() => handleToggleIntegration(integration.id, integration.is_active)}
                            />
                            <span className="toggle-slider"></span>
                          </label>
                          <button
                            className="delete-btn"
                            onClick={() => handleDeleteIntegration(integration.id)}
                            title="Delete webhook"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="3 6 5 6 21 6"/>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                              <line x1="10" y1="11" x2="10" y2="17"/>
                              <line x1="14" y1="11" x2="14" y2="17"/>
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>
      
      {showPrompt && (
        <div className="modal-overlay" onClick={() => !generatingWorkflow && setShowPrompt(false)}>
          <div className="prompt-modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="prompt-title">
              Create Workflow with AI
            </h2>
            <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '16px' }}>
              Describe what you want your workflow to do, and AI will build it for you.
            </p>
            <textarea
              className="prompt-textarea"
              placeholder="Example: 'Send a weekly email report of new contacts from Google Sheets' or 'Process payment webhooks and update customer database'"
              value={promptText}
              onChange={(e) => {
                setPromptText(e.target.value);
                setPromptError('');
              }}
              rows={6}
              disabled={generatingWorkflow}
            />
            
            {/* Error Message */}
            {promptError && (
              <div style={{
                padding: '12px',
                background: '#fee2e2',
                color: '#dc2626',
                borderRadius: '8px',
                fontSize: '14px',
                marginTop: '12px'
              }}>
                ⚠️ {promptError}
              </div>
            )}
            
            {/* Loading Indicator */}
            {generatingWorkflow && (
              <div style={{
                padding: '12px',
                background: '#dbeafe',
                color: '#1e40af',
                borderRadius: '8px',
                fontSize: '14px',
                marginTop: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <div className="spinner" style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid #1e40af',
                  borderTopColor: 'transparent',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}></div>
                Generating workflow with AI...
              </div>
            )}
            
            <div className="prompt-actions">
              <button 
                className="prompt-cancel" 
                onClick={() => setShowPrompt(false)}
                disabled={generatingWorkflow}
              >
                Cancel
              </button>
              <button 
                className="prompt-submit" 
                onClick={handlePromptSubmit}
                disabled={generatingWorkflow || !promptText.trim()}
              >
                {generatingWorkflow ? 'Generating...' : 'Generate Workflow'}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedTemplate && (
        <TemplatePreviewModal 
          template={selectedTemplate} 
          onClose={handleCloseTemplateModal}
        />
      )}

      {deleteConfirmModal && (
        <div className="modal-overlay" onClick={handleCancelDelete}>
          <div className="delete-modal" onClick={(e) => e.stopPropagation()}>
            <div className="delete-modal-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
            </div>
            <h2 className="delete-modal-title">Delete Workflow?</h2>
            <p className="delete-modal-message">
              Are you sure you want to delete "<strong>{deleteConfirmModal.name}</strong>"? 
              This action cannot be undone.
            </p>
            <div className="delete-modal-actions">
              <button 
                className="delete-modal-cancel" 
                onClick={handleCancelDelete}
                disabled={deleting}
              >
                Cancel
              </button>
              <button 
                className="delete-modal-confirm" 
                onClick={handleConfirmDelete}
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Delete Workflow'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard