// Credit tracking API functions
import { supabase } from './supabaseClient';

/**
 * Get user's credit information
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function getUserCredits() {
  try {
    console.log('[creditsApi] Getting user credits...');
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error('[creditsApi] No user authenticated');
      return { data: null, error: 'User not authenticated' };
    }

    console.log('[creditsApi] User ID:', user.id);

    let { data, error } = await supabase
      .from('user_credits')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle(); // Use maybeSingle instead of single to handle no results gracefully

    console.log('[creditsApi] Query result:', { data, error });

    // If no credits record exists, create one with 100 credits
    if (!data && !error) {
      console.log('[creditsApi] No credits record found, creating one with 100 credits');
      
      const resetDate = new Date();
      resetDate.setDate(resetDate.getDate() + 30);
      
      const { data: newCredits, error: insertError } = await supabase
        .from('user_credits')
        .upsert({
          user_id: user.id,
          total_credits: 100,
          used_credits: 0,
          reset_date: resetDate.toISOString()
        }, {
          onConflict: 'user_id',
          ignoreDuplicates: false
        })
        .select()
        .single();

      console.log('[creditsApi] Upsert result:', { newCredits, insertError });

      if (insertError) {
        console.error('[creditsApi] Error creating credits:', insertError);
        return { data: null, error: insertError.message };
      }

      return { data: newCredits, error: null };
    }

    if (error) {
      console.error('[creditsApi] Error fetching credits:', error);
      return { data: null, error: error.message };
    }

    console.log('[creditsApi] Credits loaded successfully:', data);
    return { data, error: null };
  } catch (err) {
    console.error('[creditsApi] Exception:', err);
    return { data: null, error: err.message };
  }
}

/**
 * Deduct credits from user's account
 * @param {number} amount - Number of credits to deduct
 * @returns {Promise<{success: boolean, data: Object|null, error: Error|null}>}
 */
export async function deductCredits(amount = 1) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, data: null, error: 'User not authenticated' };
    }

    // Get current credits
    const { data: currentCredits, error: fetchError } = await getUserCredits();
    
    if (fetchError || !currentCredits) {
      return { success: false, data: null, error: fetchError || 'Credits not found' };
    }

    // Check if user has enough credits
    if (currentCredits.credits_remaining < amount) {
      return { 
        success: false, 
        data: currentCredits, 
        error: `Insufficient credits. You need ${amount} credits but only have ${currentCredits.credits_remaining} remaining.` 
      };
    }

    // Deduct credits
    const { data, error } = await supabase
      .from('user_credits')
      .update({ 
        used_credits: currentCredits.used_credits + amount,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('[creditsApi] Error deducting credits:', error);
      return { success: false, data: null, error: error.message };
    }

    console.log(`[creditsApi] Deducted ${amount} credits. Remaining: ${data.credits_remaining}`);
    return { success: true, data, error: null };
  } catch (err) {
    console.error('[creditsApi] Exception:', err);
    return { success: false, data: null, error: err.message };
  }
}

/**
 * Check if user has enough credits
 * @param {number} amount - Number of credits needed
 * @returns {Promise<{hasCredits: boolean, remaining: number, error: Error|null}>}
 */
export async function checkCredits(amount = 1) {
  try {
    const { data, error } = await getUserCredits();
    
    if (error || !data) {
      return { hasCredits: false, remaining: 0, error: error || 'Credits not found' };
    }

    return {
      hasCredits: data.credits_remaining >= amount,
      remaining: data.credits_remaining,
      error: null
    };
  } catch (err) {
    console.error('[creditsApi] Exception:', err);
    return { hasCredits: false, remaining: 0, error: err.message };
  }
}

/**
 * Get days until credit reset
 * @returns {Promise<{days: number, error: Error|null}>}
 */
export async function getDaysUntilReset() {
  try {
    const { data, error } = await getUserCredits();
    
    if (error || !data) {
      return { days: 0, error: error || 'Credits not found' };
    }

    const resetDate = new Date(data.reset_date);
    const now = new Date();
    const diffTime = resetDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return { days: Math.max(0, diffDays), error: null };
  } catch (err) {
    console.error('[creditsApi] Exception:', err);
    return { days: 0, error: err.message };
  }
}
