import { createClient } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { z } from 'zod';

// These types should match your Supabase schema
export type TaskStatus = 'pending' | 'in_progress' | 'completed';

export type Task = {
  id: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  due_date?: string | null;
  priority: number;
  created_at: string;
  user_id: string;
  category?: string | null;
};

export type UserProfile = {
  id: string;
  email: string;
  role: 'admin' | 'user';
  created_at: string;
  updated_at: string;
};

export type Invitation = {
  id: string;
  email: string;
  token: string;
  role: 'admin' | 'user';
  created_by: string;
  created_at: string;
  expires_at: string;
  used: boolean;
};

// User authentication functions
export const signUp = async (email: string, password: string, token?: string) => {
  // If token was provided, mark the invitation as used after signup
  const signupResponse = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/login`,
      data: {
        invitation_token: token,
        requires_password_setup: token ? true : false // Set flag for users created via invitation
      }
    }
  });

  // If signup was successful and we have a token, mark the invitation as used
  if (token && !signupResponse.error && signupResponse.data?.user) {
    try {
      // Update the invitation to mark it as used
      await supabase
        .from('invitations')
        .update({ used: true })
        .eq('token', token);
    } catch (error) {
      console.error('Error marking invitation as used:', error);
      // We don't want to fail the signup if this update fails
    }
  }
  
  return signupResponse;
};

export const signIn = async (email: string, password: string) => {
  const response = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  return response;
};

export const signOut = async () => {
  return await supabase.auth.signOut();
};

export const getCurrentUser = async () => {
  return await supabase.auth.getUser();
};

export const getCurrentSession = async () => {
  return await supabase.auth.getSession();
};

// Get current user profile with role information
export const getUserProfile = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;
  
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single();
    
  if (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
  
  return data as UserProfile;
};

export const getUserRole = async () => {
  const profile = await getUserProfile();
  return profile?.role;
};

// Check if user is admin
export const isAdmin = async () => {
  const role = await getUserRole();
  return role === 'admin';
};

// Invitation management
export const createInvitation = async (email: string, role: 'admin' | 'user' = 'user') => {
  const token = generateToken();
  
  // Set expiration date to 7 days from now
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);
  
  // Get current user to set as creator
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');
  
  const { data, error } = await supabase
    .from('invitations')
    .insert({
      email,
      token,
      role,
      created_by: user.id,
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single();
    
  if (error) {
    console.error('Error creating invitation:', error);
    throw error;
  }
  
  // Generate invitation link that can be shared
  const invitationLink = `${window.location.origin}/login?token=${token}`;
  
  return { 
    invitation: data as Invitation,
    invitationLink
  };
};

export const getInvitations = async () => {
  const { data, error } = await supabase
    .from('invitations')
    .select('*')
    .order('created_at', { ascending: false });
    
  if (error) {
    console.error('Error fetching invitations:', error);
    return [];
  }
  
  return data as Invitation[];
};

export const deleteInvitation = async (id: string) => {
  const { error } = await supabase
    .from('invitations')
    .delete()
    .eq('id', id);
    
  if (error) {
    console.error('Error deleting invitation:', error);
    throw error;
  }
  
  return true;
};

export const verifyInvitationToken = async (token: string) => {
  try {
    if (!token || token.trim() === '') {
      console.error('Empty token provided');
      return { error: 'not_found' };
    }
    
    console.log(`Verifying invitation token: "${token}"`);
    console.log(`Token length: ${token.length}`);
    
    // First, let's check if there's any invitation with this token
    const { data: invitations, error } = await supabase
      .from('invitations')
      .select('*')
      .eq('token', token);
      
    if (error) {
      console.error('Error querying invitations with token:', error);
      return { error: 'database_error' };
    }
    
    console.log(`Found ${invitations?.length || 0} invitations with this token:`, invitations);
    
    // Check if any invitation exists with this token
    if (!invitations || invitations.length === 0) {
      console.log('No invitations found with this token');
      return { error: 'not_found' };
    }
    
    // Find valid invitation
    const validInvitation = invitations.find(inv => {
      const isUsed = inv.used === true;
      const isExpired = new Date(inv.expires_at) < new Date();
      
      console.log(`Invitation ID ${inv.id}:`);
      console.log(`- Email: ${inv.email}`);
      console.log(`- Used: ${isUsed}`);
      console.log(`- Expires at: ${inv.expires_at}`);
      console.log(`- Is expired: ${isExpired}`);
      
      return !isUsed && !isExpired;
    });
    
    if (!validInvitation) {
      // If no valid invitation, check why - was it used or expired?
      const usedInvitation = invitations.find(inv => inv.used === true);
      if (usedInvitation) {
        console.log('Invitation found but already used:', usedInvitation);
        return { error: 'already_used' };
      }
      
      const expiredInvitation = invitations.find(inv => new Date(inv.expires_at) < new Date());
      if (expiredInvitation) {
        console.log('Invitation found but expired:', expiredInvitation);
        return { error: 'expired' };
      }
      
      console.log('No valid invitation found for token');
      return { error: 'invalid' };
    }
    
    console.log('Valid invitation found:', validInvitation);
    return validInvitation;
  } catch (error) {
    console.error('Exception in verifyInvitationToken:', error);
    return { error: 'unexpected_error' };
  }
};

// Sends an invitation email using the Edge Function
export const sendInvitationEmail = async (email: string, invitationLink: string, role: 'admin' | 'user') => {
  try {
    const { data, error } = await supabase.functions.invoke('send-invitation', {
      body: { email, invitationLink, role },
    });
    
    if (error) {
      console.error('Error invoking send-invitation function:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error sending invitation email:', error);
    throw error;
  }
};

// Helper function to generate random token
const generateToken = () => {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
};

// Task CRUD operations
export const getTasks = async () => {
  const isUserAdmin = await isAdmin();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }
  
  // If the user is an admin, fetch all tasks, otherwise only fetch their own tasks
  if (isUserAdmin) {
    return await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });
  } else {
    return await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
  }
};

export const getTaskById = async (id: string) => {
  return await supabase
    .from('tasks')
    .select('*')
    .eq('id', id)
    .single();
};

export const createTask = async (task: Omit<Task, 'id' | 'created_at' | 'user_id'>) => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error('User not authenticated');
  
  return await supabase
    .from('tasks')
    .insert([
      {
        ...task,
        user_id: user.id,
      }
    ])
    .select()
    .single();
};

export const updateTask = async (id: string, updates: Partial<Omit<Task, 'id' | 'created_at' | 'user_id'>>) => {
  return await supabase
    .from('tasks')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
};

export const deleteTask = async (id: string) => {
  return await supabase
    .from('tasks')
    .delete()
    .eq('id', id);
};

// For admin operations (getting all users, etc.)
export const getUserProfiles = async () => {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('id, email, role, created_at, updated_at')
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data as UserProfile[];
};

export const updateUserRole = async (userId: string, newRole: 'admin' | 'user') => {
  const { data, error } = await supabase
    .from('user_profiles')
    .update({ 
      role: newRole,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as UserProfile;
};

export const deleteUser = async (userId: string) => {
  const { error } = await supabase
    .from('user_profiles')
    .delete()
    .eq('id', userId);

  if (error) {
    throw error;
  }
};
