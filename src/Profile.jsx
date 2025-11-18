import './Profile.css'
import logo from './assets/17F007DC-F981-4891-AED4-6F81382D4181.PNG'
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import { loadUserProfile, saveUserProfile, uploadAvatar, markProfileSetupComplete } from './lib/profileApi'
import UserAvatar from './components/UserAvatar'

const Profile = () => {
  const [activeSection, setActiveSection] = useState('profile')
  const [isEditing, setIsEditing] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)
  const navigate = useNavigate()
  const { user, signOut } = useAuth()

  const [profileData, setProfileData] = useState({
    name: user?.user_metadata?.full_name || 'John Doe',
    email: user?.email || 'john.doe@example.com',
    phone: '+1 (555) 123-4567',
    company: 'CloLabs Inc.',
    role: 'Automation Engineer',
    bio: 'Passionate about workflow automation and AI integration.',
    avatarUrl: null,
  })

  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    pushNotifications: false,
    weeklyReport: true,
    darkMode: false,
    autoSave: true,
    language: 'English',
    timezone: 'UTC-5 (Eastern Time)',
  })

  useEffect(() => {
    if (user?.id) {
      loadProfile();
    }
  }, [user?.id]);

  const loadProfile = async () => {
    const result = await loadUserProfile(user.id);
    if (result.success && result.data) {
      setProfileData({
        name: result.data.name || user?.user_metadata?.full_name || 'John Doe',
        email: user?.email || 'john.doe@example.com',
        phone: result.data.phone || '+1 (555) 123-4567',
        company: result.data.company || 'CloLabs Inc.',
        role: result.data.role || 'Automation Engineer',
        bio: result.data.bio || 'Passionate about workflow automation and AI integration.',
        avatarUrl: result.data.avatar_url,
      });

      setPreferences({
        emailNotifications: result.data.email_notifications ?? true,
        pushNotifications: result.data.push_notifications ?? false,
        weeklyReport: result.data.weekly_report ?? true,
        darkMode: false,
        autoSave: result.data.auto_save ?? true,
        language: result.data.language || 'English',
        timezone: result.data.timezone || 'UTC-5 (Eastern Time)',
      });
    }
  };

  const handleLogout = async () => {
    await signOut()
    localStorage.removeItem('authToken')
    localStorage.removeItem('user')
    sessionStorage.clear()
    window.location.href = '/'
  }

  const handleInputChange = (field, value) => {
    setProfileData({ ...profileData, [field]: value })
  }

  const handlePreferenceToggle = (field) => {
    setPreferences({ ...preferences, [field]: !preferences[field] })
  }

  const handlePreferenceChange = (field, value) => {
    setPreferences({ ...preferences, [field]: value })
  }

  const handleAvatarClick = () => {
    if (isEditing) {
      fileInputRef.current?.click()
    }
  }

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB')
      return
    }

    setUploading(true)
    const result = await uploadAvatar(user.id, file)
    
    if (result.success) {
      setProfileData({ ...profileData, avatarUrl: result.url })
    } else {
      alert('Failed to upload avatar: ' + result.error)
    }
    
    setUploading(false)
  }

  const handleSaveChanges = async () => {
    setIsEditing(false)
    
    const result = await saveUserProfile(user.id, {
      name: profileData.name,
      phone: profileData.phone,
      company: profileData.company,
      role: profileData.role,
      bio: profileData.bio,
      avatarUrl: profileData.avatarUrl,
      emailNotifications: preferences.emailNotifications,
      pushNotifications: preferences.pushNotifications,
      weeklyReport: preferences.weeklyReport,
      autoSave: preferences.autoSave,
      language: preferences.language,
      timezone: preferences.timezone
    })
    
    if (result.success) {
      console.log('Profile saved successfully')
      // Mark profile setup as complete if this is first save
      await markProfileSetupComplete(user.id)
    } else {
      console.error('Error saving profile:', result.error)
      alert('Failed to save profile: ' + result.error)
    }
  }

  return (
    <div className="profile-container">
      <svg width="0" height="0" style={{position: 'absolute'}}>
        <defs>
          <linearGradient id="nav-icon-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0d2b45"/>
            <stop offset="50%" stopColor="#203c5b"/>
            <stop offset="100%" stopColor="#2b1d3b"/>
          </linearGradient>
        </defs>
      </svg>
      
      <aside className="profile-sidebar">
        <div className="sidebar-logo" style={{display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '0px'}}>
          <img src={logo} alt="CloLabs" className="logo-image" style={{display: 'block', marginRight: '-10px'}} />
          <span className="profile-logo-text" style={{display: 'block', marginLeft: '0px'}}>CloLabs</span>
        </div>
        
        <nav className="sidebar-nav">
          <a 
            href="#" 
            className={`nav-item ${activeSection === 'dashboard' ? 'active' : ''}`}
            onClick={(e) => { e.preventDefault(); navigate('/dashboard'); }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="url(#nav-icon-gradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            <span>Dashboard</span>
          </a>
          
          <a 
            href="#" 
            className={`nav-item ${activeSection === 'workflows' ? 'active' : ''}`}
            onClick={(e) => { e.preventDefault(); navigate('/dashboard'); }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="url(#nav-icon-gradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.29 7 12 12 20.71 7"/><line x1="12" y1="22" x2="12" y2="12"/>
            </svg>
            <span>Workflows</span>
          </a>
          
          <a 
            href="#" 
            className={`nav-item ${activeSection === 'profile' ? 'active' : ''}`}
            onClick={(e) => { e.preventDefault(); setActiveSection('profile'); }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="url(#nav-icon-gradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
            <span>Profile</span>
          </a>
        </nav>
        
        <div className="sidebar-bottom">
          <a href="#" className="nav-item">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="url(#nav-icon-gradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>
            </svg>
            <span>Settings</span>
          </a>
          <button className="nav-item" onClick={handleLogout} style={{background: 'none', border: 'none', width: '100%', textAlign: 'left'}}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="url(#nav-icon-gradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <main className="profile-main">
        <div className="profile-top-bar">
          <div className="curved-search-container">
            <input type="text" placeholder="Search settings..." className="curved-search-input" />
          </div>
          <div className="top-bar-actions">
            <a href="/pricing" className="upgrade-button">Upgrade</a>
            <button className="action-button">
              <svg xmlns="http://www.w3.org/2000/svg" width="90%" height="90%" viewBox="0 0 24 24" fill="none" stroke="#000000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 4-10 8L2 4"/></svg>
            </button>
            <button className="action-button">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#000000" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a6 6 0 0 0-6 6c0 7-3 9-3 9h18s-3-2-3-9a6 6 0 0 0-6-6z"/><path d="M13 17v1a1 1 0 0 1-1 1h0a1 1 0 0 1-1-1v-1"/></svg>
            </button>
            <UserAvatar 
              name={profileData.name}
              avatarUrl={profileData.avatarUrl}
              size="medium"
              onClick={() => navigate('/profile')}
            />
          </div>
        </div>

        <div className="profile-main-content">
          <div className="profile-header">
            <div className="profile-title-section">
              <h1 className="profile-heading">Profile Settings</h1>
              <p className="profile-tagline">Manage your account and preferences</p>
            </div>
            {!isEditing && (
              <button className="edit-profile-btn" onClick={() => setIsEditing(true)}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
                Edit Profile
              </button>
            )}
          </div>

          <div className="profile-content-wrapper">
            {/* Profile Information Card */}
            <div className="profile-card">
              <div className="profile-card-header">
                <div className="card-header-content">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0d2b45" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                  </svg>
                  <h2 className="card-title">Personal Information</h2>
                </div>
              </div>
              
              <div className="profile-card-body">
                <div className="profile-avatar-section">
                  <UserAvatar 
                    name={profileData.name}
                    avatarUrl={profileData.avatarUrl}
                    size="large"
                    onClick={handleAvatarClick}
                    className={isEditing ? 'editable' : ''}
                  />
                  <input 
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleAvatarChange}
                  />
                  {isEditing && (
                    <button className="change-avatar-btn" onClick={handleAvatarClick} disabled={uploading}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>
                      </svg>
                      {uploading ? 'Uploading...' : 'Change Photo'}
                    </button>
                  )}
                </div>

                <div className="profile-fields">
                  <div className="field-group">
                    <label className="field-label">Full Name</label>
                    {isEditing ? (
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
                    {isEditing ? (
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
                    {isEditing ? (
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
                    {isEditing ? (
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

                  <div className="field-group">
                    <label className="field-label">Bio</label>
                    {isEditing ? (
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
            <div className="profile-card">
              <div className="profile-card-header">
                <div className="card-header-content">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0d2b45" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3"/><path d="M12 1v6m0 6v6m9-9h-6m-6 0H3"/>
                  </svg>
                  <h2 className="card-title">Preferences</h2>
                </div>
              </div>
              
              <div className="profile-card-body">
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
            <div className="profile-card">
              <div className="profile-card-header">
                <div className="card-header-content">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0d2b45" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  <h2 className="card-title">Account Security</h2>
                </div>
              </div>
              
              <div className="profile-card-body">
                <div className="security-item">
                  <div className="security-info">
                    <div className="security-label">Password</div>
                    <div className="security-value">••••••••••••</div>
                  </div>
                  <button className="change-btn">Change Password</button>
                </div>

                <div className="security-item">
                  <div className="security-info">
                    <div className="security-label">Two-Factor Authentication</div>
                    <div className="security-value">Not enabled</div>
                  </div>
                  <button className="enable-btn">Enable 2FA</button>
                </div>

                <div className="security-item">
                  <div className="security-info">
                    <div className="security-label">Active Sessions</div>
                    <div className="security-value">2 devices connected</div>
                  </div>
                  <button className="view-btn">View Sessions</button>
                </div>
              </div>
            </div>
          </div>

          {isEditing && (
            <div className="profile-actions">
              <button className="cancel-btn" onClick={() => setIsEditing(false)}>Cancel</button>
              <button className="save-btn" onClick={handleSaveChanges}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                Save Changes
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default Profile
