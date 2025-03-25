
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from '@/components/ui/form';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { getUserProfile, getCurrentUser } from '@/lib/supabase';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { User, Edit } from 'lucide-react';

const profileFormSchema = z.object({
  email: z.string().email().optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

const Profile = () => {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<{id: string, email: string, role: string} | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const navigate = useNavigate();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      email: '',
    },
  });

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        const userProfile = await getUserProfile();
        if (userProfile) {
          setProfile(userProfile);
          form.reset({
            email: userProfile.email,
          });
        } else {
          toast.error('Failed to load profile');
          navigate('/login');
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        toast.error('Error loading profile');
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [navigate, form]);

  const getInitials = (email: string): string => {
    if (!email) return '';
    
    // Extract the part before @ and get the first letter
    const username = email.split('@')[0];
    return username.charAt(0).toUpperCase();
  };

  const handleSaveProfile = async (data: ProfileFormValues) => {
    // In a real implementation, this would update the profile in the database
    toast.success('Profile settings saved');
    setIsEditing(false);
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-pulse text-lg">Loading profile...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto max-w-3xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
          <p className="text-muted-foreground mt-2">
            View and manage your account settings
          </p>
        </div>

        <div className="grid gap-6">
          {/* User profile card */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>User Profile</CardTitle>
                  <CardDescription>
                    Your personal information and preferences
                  </CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setIsEditing(!isEditing)}
                  className="ml-auto"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  {isEditing ? 'Cancel' : 'Edit'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6 mb-6">
                <Avatar className="h-20 w-20">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                    {profile?.email ? getInitials(profile.email) : <User className="h-8 w-8" />}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-medium">{profile?.email || 'User'}</h3>
                  <p className="text-sm text-muted-foreground capitalize">
                    {profile?.role || 'User'}
                  </p>
                </div>
              </div>

              {isEditing ? (
                <Form {...form}>
                  <form 
                    onSubmit={form.handleSubmit(handleSaveProfile)} 
                    className="space-y-4"
                  >
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Your email" 
                              {...field} 
                              disabled 
                              className="bg-muted"
                            />
                          </FormControl>
                          <FormDescription>
                            Your email address cannot be changed
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="mt-4">
                      Save Changes
                    </Button>
                  </form>
                </Form>
              ) : (
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Email</Label>
                    <div className="mt-1 text-base">{profile?.email}</div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Account Type</Label>
                    <div className="mt-1 capitalize text-base">{profile?.role}</div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Account ID</Label>
                    <div className="mt-1 text-xs text-muted-foreground font-mono bg-muted p-2 rounded">
                      {profile?.id}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Account preferences */}
          <Card>
            <CardHeader>
              <CardTitle>Account Preferences</CardTitle>
              <CardDescription>
                Manage your account preferences and settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Account preference settings will be implemented in a future update.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;
