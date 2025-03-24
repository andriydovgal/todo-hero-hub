
import { createClient } from '@supabase/supabase-js';

// These types should match your Supabase schema
export type TaskStatus = 'pending' | 'in_progress' | 'completed';

export type Task = {
  id: string;
  title: string;
  description?: string;
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
};

// Initialize the Supabase client
const supabaseUrl = 'https://your-supabase-url.supabase.co';
const supabaseKey = 'your-supabase-anon-key';

export const supabase = createClient(supabaseUrl, supabaseKey);

// User authentication functions
export const signUp = async (email: string, password: string) => {
  return await supabase.auth.signUp({
    email,
    password,
  });
};

export const signIn = async (email: string, password: string) => {
  return await supabase.auth.signInWithPassword({
    email,
    password,
  });
};

export const signOut = async () => {
  return await supabase.auth.signOut();
};

export const getCurrentUser = async () => {
  return await supabase.auth.getUser();
};

// Task CRUD operations
export const getTasks = async () => {
  return await supabase
    .from('tasks')
    .select('*')
    .order('created_at', { ascending: false });
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
      },
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
  return await supabase
    .from('user_profiles')
    .select('*');
};

export const getUserRole = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;
  
  const { data } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single();
    
  return data?.role;
};

// SQL for creating the tables and RLS policies:
/*
-- Create user_profiles table
CREATE TABLE user_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'user')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create tasks table
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed')) DEFAULT 'pending',
  due_date TIMESTAMP WITH TIME ZONE,
  priority INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  category TEXT
);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only see and modify their own profile
CREATE POLICY user_profiles_policy ON user_profiles 
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Admins can see all profiles
CREATE POLICY admin_user_profiles_policy ON user_profiles 
  USING (
    (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin'
  );

-- Users can CRUD their own tasks
CREATE POLICY user_tasks_policy ON tasks 
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Admins can see all tasks
CREATE POLICY admin_tasks_policy ON tasks 
  USING (
    (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin'
  );

-- Admins can modify all tasks
CREATE POLICY admin_tasks_modify_policy ON tasks 
  WITH CHECK (
    (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin'
  );

-- Create trigger to add a profile entry when a new user signs up
CREATE OR REPLACE FUNCTION create_user_profile_on_signup()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (id, email, role)
  VALUES (new.id, new.email, 'user');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE create_user_profile_on_signup();
*/
