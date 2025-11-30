import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * ScrollToTop component - Handles scroll behavior on route changes
 * - Scrolls to top on route change
 * - Handles hash-based scrolling (e.g., /#services, /#process)
 */
const ScrollToTop = () => {
  const location = useLocation();

  useEffect(() => {
    // Check if there's a hash in the URL
    if (location.hash) {
      // Extract the section ID from hash
      const id = location.hash.replace('#', '');
      
      // Use multiple attempts to find and scroll to the element
      const scrollToElement = (attempt = 0) => {
        const element = document.getElementById(id);
        
        if (element) {
          // Element found - scroll to it with offset for fixed header
          const headerOffset = 80; // Height of fixed header
          const elementPosition = element.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
          return true;
        }
        
        // If element not found and we haven't tried too many times, try again
        if (attempt < 5) {
          setTimeout(() => scrollToElement(attempt + 1), 200);
        }
        return false;
      };

      // Start scrolling attempts after a small delay to ensure DOM is ready
      setTimeout(() => scrollToElement(0), 100);
    } else {
      // No hash - scroll to top immediately
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'instant'
      });
    }
  }, [location.pathname, location.hash]);

  return null;
};

export default ScrollToTop;
