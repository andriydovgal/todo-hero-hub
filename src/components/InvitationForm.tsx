
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from 'sonner';
import { createInvitation } from '@/lib/supabase';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InfoIcon, Copy, CheckIcon } from 'lucide-react';

const invitationSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
  role: z.enum(['admin', 'user']),
});

type InvitationFormValues = z.infer<typeof invitationSchema>;

const InvitationForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [invitationLink, setInvitationLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    setValue,
    watch,
  } = useForm<InvitationFormValues>({
    resolver: zodResolver(invitationSchema),
    defaultValues: {
      email: '',
      role: 'user',
    },
  });
  
  const watchRole = watch('role');
  
  const onSubmit = async (data: InvitationFormValues) => {
    setIsLoading(true);
    
    try {
      const result = await createInvitation(data.email, data.role);
      toast.success(`Invitation sent to ${data.email}`);
      setInvitationLink(result.invitationLink);
      reset();
    } catch (error: any) {
      if (error.code === '23505') {
        toast.error('This email has already been invited');
      } else {
        toast.error(error.message || 'Failed to send invitation');
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const copyToClipboard = () => {
    if (invitationLink) {
      navigator.clipboard.writeText(invitationLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('Invitation link copied to clipboard');
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Invite a new user</CardTitle>
        <CardDescription>
          Send an invitation to allow someone to register
        </CardDescription>
      </CardHeader>
      <CardContent>
        {invitationLink && (
          <Alert className="mb-4 bg-green-50">
            <InfoIcon className="h-4 w-4 text-green-600" />
            <AlertDescription className="flex flex-col gap-2">
              <div className="text-sm text-green-800">Invitation created successfully!</div>
              <div className="flex items-center gap-2">
                <Input 
                  value={invitationLink} 
                  readOnly 
                  className="pr-10 text-xs bg-white"
                />
                <Button 
                  onClick={copyToClipboard} 
                  size="icon" 
                  variant="ghost" 
                  className="h-8 w-8"
                  type="button"
                >
                  {copied ? <CheckIcon className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <div className="text-xs text-green-700 mt-1">
                Share this link with the invited user to complete registration.
              </div>
            </AlertDescription>
          </Alert>
        )}
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              type="email"
              {...register('email')}
              placeholder="user@example.com"
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label>User role</Label>
            <RadioGroup 
              defaultValue="user" 
              value={watchRole}
              onValueChange={(value) => setValue('role', value as 'admin' | 'user')}
              className="flex flex-col space-y-1"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="user" id="role-user" />
                <Label htmlFor="role-user" className="cursor-pointer">Regular user</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="admin" id="role-admin" />
                <Label htmlFor="role-admin" className="cursor-pointer">Administrator</Label>
              </div>
            </RadioGroup>
            {errors.role && (
              <p className="text-sm text-red-500">{errors.role.message}</p>
            )}
          </div>
          
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Sending...' : 'Send invitation'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default InvitationForm;
