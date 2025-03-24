
import React, { useState, useEffect } from 'react';
import { getInvitations, deleteInvitation, Invitation } from '@/lib/supabase';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, Link as LinkIcon, Copy, CheckIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const InvitationList = () => {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [invitationToDelete, setInvitationToDelete] = useState<string | null>(null);
  const [selectedInvitationLink, setSelectedInvitationLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  
  const fetchInvitations = async () => {
    setIsLoading(true);
    try {
      const data = await getInvitations();
      setInvitations(data);
    } catch (error) {
      toast.error('Failed to load invitations');
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchInvitations();
  }, []);
  
  const handleDeleteInvitation = async (id: string) => {
    try {
      await deleteInvitation(id);
      setInvitations(invitations.filter(inv => inv.id !== id));
      toast.success('Invitation deleted');
    } catch (error) {
      toast.error('Failed to delete invitation');
    } finally {
      setInvitationToDelete(null);
    }
  };
  
  const generateInvitationLink = (token: string) => {
    return `${window.location.origin}/login?token=${token}`;
  };
  
  const showInvitationLink = (token: string) => {
    setSelectedInvitationLink(generateInvitationLink(token));
  };
  
  const copyToClipboard = () => {
    if (selectedInvitationLink) {
      navigator.clipboard.writeText(selectedInvitationLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('Invitation link copied to clipboard');
    }
  };
  
  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Invitations</CardTitle>
        <CardDescription>
          Manage pending invitations
        </CardDescription>
      </CardHeader>
      <CardContent>
        {selectedInvitationLink && (
          <div className="mb-4 p-3 bg-blue-50 rounded-md border border-blue-100">
            <div className="text-sm font-medium mb-2">Invitation Link:</div>
            <div className="flex items-center gap-2">
              <Input 
                value={selectedInvitationLink} 
                readOnly 
                className="pr-10 text-xs bg-white"
              />
              <Button 
                onClick={copyToClipboard} 
                size="icon" 
                variant="ghost" 
                className="h-8 w-8"
              >
                {copied ? <CheckIcon className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Share this link with the invited user to complete registration.
            </div>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => setSelectedInvitationLink(null)}
            >
              Close
            </Button>
          </div>
        )}
        
        {isLoading ? (
          <div className="flex justify-center p-4">
            <p>Loading invitations...</p>
          </div>
        ) : invitations.length === 0 ? (
          <div className="text-center p-4">
            <p className="text-muted-foreground">No invitations found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invitations.map((invitation) => (
                  <TableRow key={invitation.id}>
                    <TableCell>{invitation.email}</TableCell>
                    <TableCell>
                      <Badge variant={invitation.role === 'admin' ? 'destructive' : 'default'}>
                        {invitation.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {invitation.used ? (
                        <Badge variant="secondary">Used</Badge>
                      ) : isExpired(invitation.expires_at) ? (
                        <Badge variant="outline">Expired</Badge>
                      ) : (
                        <Badge variant="success">Active</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {format(new Date(invitation.expires_at), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end items-center gap-1">
                        {!invitation.used && !isExpired(invitation.expires_at) && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => showInvitationLink(invitation.token)}
                                >
                                  <LinkIcon className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Get invitation link</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => setInvitationToDelete(invitation.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete the invitation for {invitation.email}.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDeleteInvitation(invitation.id)}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default InvitationList;
