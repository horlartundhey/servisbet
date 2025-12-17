import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./contexts/AuthContext";
import Header from "./components/Header";
import Footer from "./components/Footer";
import ScrollToTop from "./components/ScrollToTop";

// Lazy load pages
const Index = lazy(() => import("./pages/Index"));
const DigitalServices = lazy(() => import("./pages/DigitalServices"));
const BusinessDetail = lazy(() => import("./pages/BusinessDetail"));
const AllBusinesses = lazy(() => import("./pages/AllBusinesses"));
const Auth = lazy(() => import("./pages/Auth"));
const UserProfile = lazy(() => import("./pages/UserProfile"));
const WriteReview = lazy(() => import("./pages/WriteReview"));
const SearchResults = lazy(() => import("./pages/SearchResults"));
const BusinessDashboard = lazy(() => import("./pages/BusinessDashboard"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const Pricing = lazy(() => import("./pages/Pricing"));
const VerifyEmail = lazy(() => import("./pages/VerifyEmail"));
const VerifyReview = lazy(() => import("./pages/VerifyReview"));
const Contact = lazy(() => import("./pages/Contact"));
const Portfolio = lazy(() => import("./pages/Portfolio"));

// Simple loading component
const Loading = () => (
  <div style={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    height: '100vh',
    fontSize: '18px',
    color: '#666'
  }}>
    Loading...
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <ScrollToTop />
          <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1">
              <Suspense fallback={<Loading />}>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/digital-services" element={<DigitalServices />} />
                  <Route path="/businesses" element={<AllBusinesses />} />
                  <Route path="/business/:id" element={<BusinessDetail />} />
                  <Route path="/search" element={<SearchResults />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/profile" element={<UserProfile />} />
                  <Route path="/write-review/:id" element={<WriteReview />} />
                  <Route path="/business-dashboard" element={<BusinessDashboard />} />
                  <Route path="/admin" element={<AdminDashboard />} />
                  <Route path="/pricing" element={<Pricing />} />
                  <Route path="/verify-email" element={<VerifyEmail />} />
                  <Route path="/verify-email/:token" element={<VerifyEmail />} />
                  <Route path="/verify-review" element={<VerifyReview />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/portfolio" element={<Portfolio />} />
                  <Route path="*" element={<Index />} />
                </Routes>
              </Suspense>
            </main>
            <Footer />
          </div>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
