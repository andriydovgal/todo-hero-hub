import React, { useState, useEffect } from 'react';
import { getInvitations, deleteInvitation, Invitation } from '@/lib/supabase';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from "@/components/ui/badge";
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

const InvitationList = () => {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [invitationToDelete, setInvitationToDelete] = useState<string | null>(null);
  
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
