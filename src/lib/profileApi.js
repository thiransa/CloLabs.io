import { supabase } from './supabaseClient.js';

/**
 * Load user profile from Supabase
 * @param {string} userId - User ID
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export async function loadUserProfile(userId) {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      // Profile doesn't exist yet
      if (error.code === 'PGRST116') {
        return { success: true, data: null };
      }
      console.error('Error loading profile:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Unexpected error loading profile:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Save user profile to Supabase
 * @param {string} userId - User ID
 * @param {Object} profileData - Profile data
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export async function saveUserProfile(userId, profileData) {
  try {
    const payload = {
      user_id: userId,
      name: profileData.name,
      phone: profileData.phone,
      company: profileData.company,
      role: profileData.role,
      bio: profileData.bio,
      email_notifications: profileData.emailNotifications,
      push_notifications: profileData.pushNotifications,
      weekly_report: profileData.weeklyReport,
      auto_save: profileData.autoSave,
      language: profileData.language,
      timezone: profileData.timezone
    };

    // Try to update first
    const { data: existingProfile } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('user_id', userId)
      .single();

    let result;
    if (existingProfile) {
      // Update existing profile
      result = await supabase
        .from('user_profiles')
        .update(payload)
        .eq('user_id', userId)
        .select()
        .single();
    } else {
      // Insert new profile
      result = await supabase
        .from('user_profiles')
        .insert([payload])
        .select()
        .single();
    }

    if (result.error) {
      console.error('Error saving profile:', result.error);
      return { success: false, error: result.error.message };
    }

    return { success: true, data: result.data };
  } catch (error) {
    console.error('Unexpected error saving profile:', error);
    return { success: false, error: error.message };
  }
}
