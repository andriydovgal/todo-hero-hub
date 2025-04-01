import { useState, useEffect } from 'react';
import { getUserProfiles, UserProfile, updateUserRole, deleteUser } from '@/lib/supabase';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pencil, Info, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { STORAGE_KEYS, USER_ROLES, UserRole } from '@/lib/constants';

const Users = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);

  const getCurrentUserId = () => {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    
    if (token) {
      try {
        const { user } = JSON.parse(token);
        return user?.id || null;
      } catch (error) {
        console.error('Error parsing auth token:', error);
        return null;
      }
    }
    return null;
  };

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const data = await getUserProfiles();
      setUsers(data);
      // Get current user ID from localStorage
      const userId = getCurrentUserId();
      if (userId) {
        setCurrentUserId(userId);
      }
    } catch (error) {
      toast.error('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleEditUser = (user: UserProfile) => {
    setEditingUser(user);
    setSelectedRole(user.role);
  };

  const handleDeleteUser = (user: UserProfile) => {
    setUserToDelete(user);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;

    try {
      await deleteUser(userToDelete.id);
      await fetchUsers(); // Refresh the users list
      toast.success('User deleted successfully');
      setUserToDelete(null);
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };

  const handleRoleChange = (newRole: UserRole) => {
    setSelectedRole(newRole);
  };

  const handleSave = async () => {
    if (!editingUser || !selectedRole) return;

    try {
      await updateUserRole(editingUser.id, selectedRole);
      await fetchUsers(); // Refresh the users list
      toast.success('User role updated successfully');
      setEditingUser(null);
      setSelectedRole(null);
    } catch (error) {
      toast.error('Failed to update user role');
    }
  };

  const isCurrentUser = (userId: string) => userId === currentUserId;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Users</CardTitle>
        <CardDescription>
          Manage system users and their roles
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center p-4">
            <p>Loading users...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center p-4">
            <p className="text-muted-foreground">No users found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={user.role === USER_ROLES.ADMIN ? 'destructive' : 'default'}>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(user.created_at), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>
                      {format(new Date(user.updated_at), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => handleEditUser(user)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              Edit user profile
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive hover:text-destructive"
                                  onClick={() => handleDeleteUser(user)}
                                  disabled={isCurrentUser(user.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              {isCurrentUser(user.id)
                                ? "You cannot delete your own account"
                                : "Delete user"}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <Dialog open={!!editingUser} onOpenChange={() => {
        setEditingUser(null);
        setSelectedRole(null);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              {isCurrentUser(editingUser?.id || '')
                ? "Update your profile information. Role cannot be modified."
                : "Update user information. Some fields cannot be modified."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={editingUser?.email || ''}
                disabled
                className="bg-muted"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="role">Role</Label>
              <div className="flex items-center gap-2">
                <Select
                  value={selectedRole || undefined}
                  onValueChange={handleRoleChange}
                  disabled={isCurrentUser(editingUser?.id || '')}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={USER_ROLES.ADMIN}>Admin</SelectItem>
                    <SelectItem value={USER_ROLES.USER}>User</SelectItem>
                  </SelectContent>
                </Select>
                {isCurrentUser(editingUser?.id || '') && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        You cannot modify your own role
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Joined</Label>
              <Input
                value={editingUser ? format(new Date(editingUser.created_at), 'MMM dd, yyyy') : ''}
                disabled
                className="bg-muted"
              />
            </div>
            <div className="grid gap-2">
              <Label>Last Updated</Label>
              <Input
                value={editingUser ? format(new Date(editingUser.updated_at), 'MMM dd, yyyy') : ''}
                disabled
                className="bg-muted"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setEditingUser(null);
              setSelectedRole(null);
            }}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!selectedRole || selectedRole === editingUser?.role || isCurrentUser(editingUser?.id || '')}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the user account
              for {userToDelete?.email}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default Users; 