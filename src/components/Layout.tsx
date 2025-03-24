
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { LogOut, Settings, User, Menu, X } from 'lucide-react';
import { signOut, getCurrentUser, getUserRole } from '@/lib/supabase';
import { toast } from 'sonner';
import { AnimatedContainer } from './ui-components';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data: { user } } = await getCurrentUser();
        if (user) {
          setUserEmail(user.email);
          const role = await getUserRole();
          setUserRole(role);
        } else {
          navigate('/login');
        }
      } catch (error) {
        console.error('Error fetching user:', error);
        navigate('/login');
      }
    };
    
    fetchUser();
  }, [navigate]);
  
  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Signed out successfully');
      navigate('/login');
    } catch (error: any) {
      toast.error('Error signing out: ' + error.message);
    }
  };
  
  const getInitials = (email: string | null): string => {
    if (!email) return '';
    
    // Extract the part before @ and get the first letter
    const username = email.split('@')[0];
    return username.charAt(0).toUpperCase();
  };
  
  const closeMobileMenu = () => {
    setIsMenuOpen(false);
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
        <div className="full-container flex h-14 items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="font-medium transition-colors hover:text-primary">
              TaskHero
            </Link>
          </div>
          
          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          
          {/* Desktop menu */}
          <nav className="hidden md:flex items-center gap-5">
            <Link 
              to="/dashboard" 
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              Dashboard
            </Link>
            {userRole === 'admin' && (
              <Link 
                to="/admin" 
                className="text-sm font-medium transition-colors hover:text-primary"
              >
                Admin
              </Link>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {getInitials(userEmail)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    {userEmail && (
                      <p className="font-medium">{userEmail}</p>
                    )}
                    {userRole && (
                      <p className="text-xs text-muted-foreground">
                        {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
                      </p>
                    )}
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/settings" className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-red-600 focus:text-red-600"
                  onClick={handleSignOut}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>
        </div>
      </header>
      
      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden fixed inset-0 top-14 z-40 bg-background/80 backdrop-blur-sm animate-fade-in">
          <nav className="fixed top-14 left-0 right-0 bottom-0 bg-white p-6 animate-slide-in">
            <div className="flex flex-col gap-6">
              <Link 
                to="/dashboard" 
                className="text-lg font-medium"
                onClick={closeMobileMenu}
              >
                Dashboard
              </Link>
              
              {userRole === 'admin' && (
                <Link 
                  to="/admin" 
                  className="text-lg font-medium"
                  onClick={closeMobileMenu}
                >
                  Admin
                </Link>
              )}
              
              <Link 
                to="/profile" 
                className="text-lg font-medium"
                onClick={closeMobileMenu}
              >
                Profile
              </Link>
              
              <Link 
                to="/settings" 
                className="text-lg font-medium"
                onClick={closeMobileMenu}
              >
                Settings
              </Link>
              
              <Separator />
              
              <Button
                variant="ghost"
                className="justify-start p-0 h-auto font-medium text-lg text-red-600"
                onClick={() => {
                  closeMobileMenu();
                  handleSignOut();
                }}
              >
                <LogOut className="mr-2 h-5 w-5" />
                Sign out
              </Button>
            </div>
          </nav>
        </div>
      )}
      
      {/* Main content */}
      <AnimatedContainer className="flex-1 py-6 px-4 sm:px-6 lg:px-8">
        <div className="full-container">
          {children}
        </div>
      </AnimatedContainer>
      
      {/* Footer */}
      <footer className="py-6 bg-white/80 backdrop-blur-md border-t">
        <div className="full-container">
          <p className="text-center text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} TaskHero. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
