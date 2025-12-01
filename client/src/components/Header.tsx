import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
// @ts-ignore
import servlogo from '../assets/images/servisbeta-logo.png';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, User, Menu, LogOut, Settings, UserCircle, Bell, X } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
// Removed notification center for iOS compatibility
// import { useNotificationCenter } from '../contexts/NotificationCenterContext';
// import NotificationCenter from './NotificationCenter';

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  // Temporarily disable notifications for iOS compatibility
  // const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotificationCenter();
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getUserInitials = () => {
    if (!user) return 'U';
    const firstName = user.firstName || '';
    const lastName = user.lastName || '';
    return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase() || 'U';
  };

  const handleNotificationClick = (notification: any) => {
    // Handle notification click - navigate to relevant page
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    } else if (notification.type === 'review' && notification.businessId) {
      navigate(`/business/${notification.businessId}`);
    } else if (notification.type === 'response' && notification.metadata?.reviewId) {
      navigate(`/profile`); // Navigate to user's reviews
    }
    setShowNotifications(false);
  };

  const getUserDashboardLink = () => {
    if (!user) return '/profile';
    
    switch (user.role) {
      case 'admin':
        return '/admin';
      case 'business':
        return '/business-dashboard';
      case 'user':
      default:
        return '/profile';
    }
  };

  const scrollToSection = (sectionId: string) => {
    setMobileMenuOpen(false);
    
    if (location.pathname !== '/') {
      // Navigate to home with hash
      navigate(`/#${sectionId}`);
    } else {
      // Already on home page, just scroll
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  return (
    <header className="bg-background border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">           
            <span className=" "><img className="w-32" src={servlogo} alt="ServisBeta Logo" /></span>
          </Link>

          {/* Search Bar - Hidden on mobile */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <form onSubmit={handleSearch} className="relative w-full">
              <Input
                type="text"
                placeholder="Search businesses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            </form>
          </div>

          {/* Navigation - Desktop */}
          <nav className="hidden lg:flex items-center space-x-8">
            <button 
              onClick={() => scrollToSection('services')} 
              className="text-foreground hover:text-primary transition-colors font-medium"
            >
              Services
            </button>
            <button 
              onClick={() => scrollToSection('process')} 
              className="text-foreground hover:text-primary transition-colors font-medium"
            >
              Process
            </button>
            <Link to="/portfolio" className="text-foreground hover:text-primary transition-colors font-medium">
              Portfolio
            </Link>
            <Link to="/search" className="text-foreground/60 hover:text-primary transition-colors text-sm font-medium">
              Browse Businesses
            </Link>
            {isAuthenticated && user?.role === 'business' && (
              <Link to="/business-dashboard" className="text-foreground hover:text-primary transition-colors font-medium">
                Dashboard
              </Link>
            )}
            {user?.role === 'admin' && (
              <Link to="/admin" className="text-foreground hover:text-primary transition-colors font-medium">
                Admin
              </Link>
            )}
          </nav>

          {/* Auth Section */}
          <div className="flex items-center space-x-3">
            {isAuthenticated && user ? (
              <>
                {/* Real-time Notification Center - Temporarily disabled for iOS compatibility */}
                {/* <NotificationCenter /> */}

                {/* Authenticated User Menu */}
                <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatar} alt={`${user.firstName} ${user.lastName}`} />
                      <AvatarFallback>{getUserInitials()}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground capitalize">
                        {user.role}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to={getUserDashboardLink()} className="flex items-center">
                      <UserCircle className="mr-2 h-4 w-4" />
                      <span>Dashboard</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="flex items-center">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="flex items-center cursor-pointer text-red-600 focus:text-red-600"
                    onClick={handleLogout}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              </>
            ) : (
              // Guest User Buttons
              <>
                <Button variant="ghost" size="sm" asChild className="hidden sm:flex">
                  <Link to="/auth">Log in</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link to="/auth">Sign up</Link>
                </Button>
              </>
            )}
            
            {/* Mobile Menu Button */}
            <Button 
              variant="ghost" 
              size="sm" 
              className="lg:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 top-16 bg-background z-50 overflow-y-auto border-t">
            <nav className="flex flex-col p-6 space-y-4">
              <button 
                onClick={() => scrollToSection('services')} 
                className="text-left text-lg font-medium text-foreground hover:text-primary transition-colors py-2"
              >
                Services
              </button>
              <button 
                onClick={() => scrollToSection('process')} 
                className="text-left text-lg font-medium text-foreground hover:text-primary transition-colors py-2"
              >
                Process
              </button>
              <Link 
                to="/portfolio" 
                className="text-lg font-medium text-foreground hover:text-primary transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Portfolio
              </Link>
              <Link 
                to="/search" 
                className="text-lg font-medium text-foreground/60 hover:text-primary transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Browse Businesses
              </Link>
              {isAuthenticated && user?.role === 'business' && (
                <Link 
                  to="/business-dashboard" 
                  className="text-lg font-medium text-foreground hover:text-primary transition-colors py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
              )}
              {user?.role === 'admin' && (
                <Link 
                  to="/admin" 
                  className="text-lg font-medium text-foreground hover:text-primary transition-colors py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Admin
                </Link>
              )}
              
              {!isAuthenticated && (
                <div className="flex flex-col space-y-3 pt-4 border-t">
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    asChild
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Link to="/auth">Log in</Link>
                  </Button>
                  <Button 
                    className="w-full bg-primary hover:bg-primary/90" 
                    asChild
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Link to="/auth">Sign up</Link>
                  </Button>
                </div>
              )}
            </nav>
          </div>
        )}


        {/* Mobile Search - Visible on small screens */}
        <div className="md:hidden pb-3">
          <form onSubmit={handleSearch} className="relative">
            <Input
              type="text"
              placeholder="Search businesses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          </form>
        </div>
      </div>

      {/* NotificationCenter - Disabled for iOS compatibility */}
      {/* <NotificationCenter
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        notifications={notifications}
        onMarkAsRead={markAsRead}
        onMarkAllAsRead={markAllAsRead}
        onNotificationClick={handleNotificationClick}
      /> */}
    </header>
  );
};

export default Header;