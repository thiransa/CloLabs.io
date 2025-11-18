import { useState } from 'react'
import './UserAvatar.css'

/**
 * Get initials from a name
 * @param {string} name - Full name
 * @returns {string} - Initials (max 2 characters)
 */
const getInitials = (name) => {
  if (!name) return '??'
  
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase()
  }
  
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

/**
 * Generate a consistent color based on name
 * @param {string} name 
 * @returns {string} - Hex color
 */
const getAvatarColor = (name) => {
  if (!name) return '#0d2b45'
  
  const colors = [
    '#0d2b45', // Navy
    '#203c5b', // Deep teal
    '#2b1d3b', // Purple
    '#1e3a5f', // Blue
    '#2d4a5e', // Steel blue
    '#3a2d4a', // Dark purple
    '#1a4d2e', // Forest green
    '#4a2d2d', // Burgundy
  ]
  
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  
  return colors[Math.abs(hash) % colors.length]
}

/**
 * UserAvatar component - displays user avatar or initials
 * @param {Object} props
 * @param {string} props.name - User's full name
 * @param {string} props.avatarUrl - URL to avatar image (optional)
 * @param {string} props.size - Size: 'small', 'medium', 'large' (default: 'medium')
 * @param {string} props.className - Additional CSS classes
 * @param {Function} props.onClick - Click handler
 */
export const UserAvatar = ({ 
  name, 
  avatarUrl, 
  size = 'medium', 
  className = '',
  onClick 
}) => {
  const [imageError, setImageError] = useState(false)
  
  const shouldShowInitials = !avatarUrl || imageError
  const initials = getInitials(name)
  const bgColor = getAvatarColor(name)
  
  return (
    <div 
      className={`user-avatar user-avatar-${size} ${className}`}
      style={shouldShowInitials ? { backgroundColor: bgColor } : {}}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {shouldShowInitials ? (
        <span className="user-avatar-initials">{initials}</span>
      ) : (
        <img 
          src={avatarUrl} 
          alt={name}
          className="user-avatar-image"
          onError={() => setImageError(true)}
        />
      )}
    </div>
  )
}

export default UserAvatar
