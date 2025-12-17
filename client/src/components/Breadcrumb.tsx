import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
  showHome?: boolean;
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ 
  items, 
  className,
  showHome = true 
}) => {
  const location = useLocation();

  const breadcrumbItems = showHome 
    ? [{ label: 'Home', href: '/', icon: Home }, ...items]
    : items;

  return (
    <nav 
      aria-label="breadcrumb" 
      className={cn("flex items-center space-x-1 text-sm text-muted-foreground", className)}
    >
      <ol className="flex items-center space-x-1">
        {breadcrumbItems.map((item, index) => {
          const isLast = index === breadcrumbItems.length - 1;
          const Icon = item.icon;
          
          return (
            <li key={index} className="flex items-center">
              {index > 0 && (
                <ChevronRight className="w-4 h-4 mx-1 text-muted-foreground/60" />
              )}
              
              {item.href && !isLast ? (
                <Link 
                  to={item.href}
                  className="flex items-center hover:text-foreground transition-colors duration-200"
                  title={item.label}
                >
                  {Icon && <Icon className="w-4 h-4 mr-1" />}
                  <span className="truncate max-w-[200px]">{item.label}</span>
                </Link>
              ) : (
                <span 
                  className={cn(
                    "flex items-center",
                    isLast ? "text-foreground font-medium" : "text-muted-foreground"
                  )}
                  title={item.label}
                >
                  {Icon && <Icon className="w-4 h-4 mr-1" />}
                  <span className="truncate max-w-[200px]">{item.label}</span>
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

// Hook for automatic breadcrumb generation based on route
export const useBreadcrumbs = () => {
  const location = useLocation();
  const pathSegments = location.pathname.split('/').filter(Boolean);
  
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const breadcrumbs: BreadcrumbItem[] = [];
    
    for (let i = 0; i < pathSegments.length; i++) {
      const segment = pathSegments[i];
      const path = '/' + pathSegments.slice(0, i + 1).join('/');
      const isLast = i === pathSegments.length - 1;
      
      // Generate breadcrumb based on path segment
      switch (segment) {
        case 'digital-services':
          breadcrumbs.push({
            label: 'Digital Services',
            href: isLast ? undefined : '/digital-services'
          });
          break;
        case 'businesses':
          breadcrumbs.push({
            label: 'Businesses',
            href: isLast ? undefined : '/businesses'
          });
          break;
        case 'business':
          if (i + 1 < pathSegments.length) {
            // Skip the business segment, it will be handled by the business name
            continue;
          }
          break;
        case 'search':
          breadcrumbs.push({
            label: 'Search Results',
            href: isLast ? undefined : path
          });
          break;
        case 'pricing':
          breadcrumbs.push({
            label: 'Pricing',
            href: isLast ? undefined : path
          });
          break;
        case 'profile':
          breadcrumbs.push({
            label: 'My Profile',
            href: isLast ? undefined : path
          });
          break;
        case 'business-dashboard':
          breadcrumbs.push({
            label: 'Business Dashboard',
            href: isLast ? undefined : path
          });
          break;
        case 'analytics':
          breadcrumbs.push({
            label: 'Analytics',
            href: isLast ? undefined : path
          });
          break;
        case 'admin':
          breadcrumbs.push({
            label: 'Admin Dashboard',
            href: isLast ? undefined : path
          });
          break;
        case 'write-review':
          breadcrumbs.push({
            label: 'Write Review',
            href: isLast ? undefined : path
          });
          break;
        default:
          // For dynamic segments like business IDs, we'll handle them separately
          if (pathSegments[i - 1] === 'business') {
            // This will be replaced by the actual business name in the component
            breadcrumbs.push({
              label: 'Business Details',
              href: isLast ? undefined : path
            });
          } else {
            breadcrumbs.push({
              label: segment.charAt(0).toUpperCase() + segment.slice(1),
              href: isLast ? undefined : path
            });
          }
      }
    }
    
    return breadcrumbs;
  };
  
  return generateBreadcrumbs();
};

// Specific breadcrumb components for different pages
export const BusinessBreadcrumb: React.FC<{
  business?: { name: string; category: string; id: string };
  className?: string;
}> = ({ business, className }) => {
  const items: BreadcrumbItem[] = [
    { label: 'Businesses', href: '/businesses' }
  ];
  
  if (business) {
    items.push(
      { 
        label: business.category, 
        href: `/businesses?category=${encodeURIComponent(business.category)}` 
      },
      { label: business.name }
    );
  }
  
  return <Breadcrumb items={items} className={className} />;
};

export const SearchBreadcrumb: React.FC<{
  query?: string;
  category?: string;
  location?: string;
  className?: string;
}> = ({ query, category, location, className }) => {
  const items: BreadcrumbItem[] = [
    { label: 'Search Results', href: '/search' }
  ];
  
  if (category) {
    items.push({ label: category });
  } else if (query) {
    items.push({ label: `"${query}"` });
  }
  
  if (location) {
    items.push({ label: `in ${location}` });
  }
  
  return <Breadcrumb items={items} className={className} />;
};

export const CategoryBreadcrumb: React.FC<{
  category: string;
  className?: string;
}> = ({ category, className }) => {
  const items: BreadcrumbItem[] = [
    { label: 'Businesses', href: '/businesses' },
    { label: category }
  ];
  
  return <Breadcrumb items={items} className={className} />;
};

export default Breadcrumb;