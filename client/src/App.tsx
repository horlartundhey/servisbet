
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import { NotificationCenterProvider } from "./contexts/NotificationCenterContext";
import { NotificationProvider as SocketNotificationProvider } from "./contexts/NotificationSocketContext";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Index from "./pages/Index";
import BusinessDetail from "./pages/BusinessDetail";
import AllBusinesses from "./pages/AllBusinesses";
import WriteReview from "./pages/WriteReview";
import UserProfile from "./pages/UserProfile";
import SearchResults from "./pages/SearchResults";
import BusinessDashboard from "./pages/BusinessDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import AnalyticsPage from "./pages/AnalyticsPage";
import Auth from "./pages/Auth";
import VerifyEmail from "./pages/VerifyEmail";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Pricing from "./pages/Pricing";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Protected Route Component
const ProtectedRoute = ({ 
  children, 
  roles = [] 
}: { 
  children: React.ReactNode; 
  roles?: string[] 
}) => {
  const { isAuthenticated, user } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }
  
  if (roles.length > 0 && user && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

// Public Route Component (redirects authenticated users)
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, user } = useAuth();
  
  console.log('PublicRoute check:', { isAuthenticated, user }); // Debug log
  
  if (isAuthenticated && user) {
    console.log('PublicRoute redirecting user with role:', user.role); // Debug log
    // Redirect based on user role
    if (user.role === 'admin') {
      return <Navigate to="/admin" replace />;
    } else if (user.role === 'business') {
      return <Navigate to="/business-dashboard" replace />;
    } else {
      return <Navigate to="/profile" replace />;
    }
  }
  
  return <>{children}</>;
};

const AppContent = () => (
  <div className="min-h-screen flex flex-col">
    <Header />
    <main className="flex-1">
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Index />} />
        <Route path="/businesses" element={<AllBusinesses />} />
        <Route path="/search" element={<SearchResults />} />
        <Route path="/business/:id" element={<BusinessDetail />} />
        <Route path="/pricing" element={<Pricing />} />
        
        {/* Auth Route (redirects if already authenticated) */}
        <Route path="/auth" element={
          <PublicRoute>
            <Auth />
          </PublicRoute>
        } />
        
        {/* Email Verification Routes */}
        <Route path="/verify-email/:token" element={<VerifyEmail />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/verify-review" element={<VerifyEmail />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        
        {/* Anonymous Review Route - No Authentication Required */}
        <Route path="/write-review/:id" element={<WriteReview />} />
        
        <Route path="/profile" element={
          <ProtectedRoute roles={['user']}>
            <UserProfile />
          </ProtectedRoute>
        } />
        
        {/* Business Protected Routes */}
        <Route path="/business-dashboard" element={
          <ProtectedRoute roles={['business']}>
            <BusinessDashboard />
          </ProtectedRoute>
        } />
        
        <Route path="/analytics" element={
          <ProtectedRoute roles={['business']}>
            <AnalyticsPage />
          </ProtectedRoute>
        } />
        
        {/* Admin Protected Routes */}
        <Route path="/admin" element={
          <ProtectedRoute roles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        } />
        
        {/* Catch-all route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </main>
    <Footer />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <NotificationProvider>
        <NotificationCenterProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthProvider>
              <SocketNotificationProvider>
                <AppContent />
              </SocketNotificationProvider>
            </AuthProvider>
          </BrowserRouter>
        </NotificationCenterProvider>
      </NotificationProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
