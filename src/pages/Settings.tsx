
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { getCurrentUser } from '@/lib/supabase';
import AccountPreferences from '@/components/AccountPreferences';
import ChangePasswordModal from '@/components/ChangePasswordModal';
import { KeyRound } from 'lucide-react';

const Settings = () => {
  const [loading, setLoading] = useState(true);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        setLoading(true);
        const { data } = await getCurrentUser();
        if (!data.user) {
          toast.error('You must be logged in to view settings');
          navigate('/login');
        }
      } catch (error) {
        console.error('Error checking auth:', error);
        toast.error('Authentication error');
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [navigate]);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-pulse text-lg">Loading settings...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto max-w-3xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground mt-2">
            Manage your account settings and preferences
          </p>
        </div>

        <div className="grid gap-6">
          {/* Account Settings Card */}
          <Card>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
              <CardDescription>
                Manage your account information and security
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Password</h3>
                <p className="text-sm text-muted-foreground">
                  Change your password to keep your account secure
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => setPasswordModalOpen(true)}
                  className="flex items-center gap-2"
                >
                  <KeyRound className="h-4 w-4" />
                  Change Password
                </Button>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Delete Account</h3>
                <p className="text-sm text-muted-foreground">
                  Permanently delete your account and all associated data
                </p>
                <Button variant="destructive" onClick={() => toast.error('This feature is not yet implemented')}>
                  Delete Account
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Preferences */}
          <AccountPreferences />
        </div>
      </div>

      {/* Password Change Modal */}
      <ChangePasswordModal 
        open={passwordModalOpen} 
        onOpenChange={setPasswordModalOpen} 
      />
    </Layout>
  );
};

export default Settings;
