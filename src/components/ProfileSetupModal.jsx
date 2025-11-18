import { useState } from 'react'
import './ProfileSetupModal.css'

/**
 * ProfileSetupModal - shown to new users after signup
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether modal is visible
 * @param {Function} props.onClose - Close handler
 * @param {Function} props.onRemindLater - Remind me later handler
 * @param {Function} props.onGoToSettings - Navigate to settings handler
 */
export const ProfileSetupModal = ({ isOpen, onClose, onRemindLater, onGoToSettings }) => {
  if (!isOpen) return null

  const handleGoToSettings = () => {
    onClose()
    onGoToSettings()
  }

  const handleRemindLater = () => {
    onRemindLater()
    onClose()
  }

  return (
    <div className="profile-setup-overlay" onClick={onClose}>
      <div className="profile-setup-modal" onClick={(e) => e.stopPropagation()}>
        <div className="profile-setup-icon">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="48" 
            height="48" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
        </div>

        <h2 className="profile-setup-title">Set Up Your Personal Profile</h2>
        <p className="profile-setup-description">
          Complete your profile to personalize your CloLabs experience. 
          Add your photo, name, and preferences to get started.
        </p>

        <div className="profile-setup-features">
          <div className="setup-feature">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            <span>Upload your profile picture</span>
          </div>
          <div className="setup-feature">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            <span>Customize your preferences</span>
          </div>
          <div className="setup-feature">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            <span>Manage account details</span>
          </div>
        </div>

        <div className="profile-setup-actions">
          <button 
            className="setup-btn-secondary"
            onClick={handleRemindLater}
          >
            Remind Me Later
          </button>
          <button 
            className="setup-btn-primary"
            onClick={handleGoToSettings}
          >
            Go to Settings
          </button>
        </div>
      </div>
    </div>
  )
}

export default ProfileSetupModal
