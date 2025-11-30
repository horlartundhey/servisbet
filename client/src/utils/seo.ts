// SEO Meta Tag Management Utility
interface MetaTagConfig {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
  siteName?: string;
  twitterCard?: string;
}

interface StructuredData {
  "@context": string;
  "@type": string;
  [key: string]: any;
}

export class SEOManager {
  private static readonly DEFAULT_TITLE = "Servisbeta - Discover the Best Local Businesses & Reviews";
  private static readonly DEFAULT_DESCRIPTION = "Find and review the best local businesses in your area. Servisbeta helps you discover restaurants, services, and more with real customer reviews and ratings.";
  private static readonly DEFAULT_IMAGE = "/og-image.jpg";
  private static readonly SITE_URL = "https://servisbeta.com";

  /**
   * Update meta tags dynamically for the current page
   */
  static updateMetaTags(config: MetaTagConfig): void {
    // Update title
    if (config.title) {
      document.title = config.title;
    }

    // Update or create meta tags
    this.updateMetaTag('name', 'description', config.description || this.DEFAULT_DESCRIPTION);
    this.updateMetaTag('name', 'keywords', config.keywords);
    
    // Open Graph tags
    this.updateMetaTag('property', 'og:title', config.title || this.DEFAULT_TITLE);
    this.updateMetaTag('property', 'og:description', config.description || this.DEFAULT_DESCRIPTION);
    this.updateMetaTag('property', 'og:image', config.image || this.DEFAULT_IMAGE);
    this.updateMetaTag('property', 'og:url', config.url || this.SITE_URL);
    this.updateMetaTag('property', 'og:type', config.type || 'website');
    this.updateMetaTag('property', 'og:site_name', config.siteName || 'Servisbeta');

    // Twitter Card tags
    this.updateMetaTag('name', 'twitter:title', config.title || this.DEFAULT_TITLE);
    this.updateMetaTag('name', 'twitter:description', config.description || this.DEFAULT_DESCRIPTION);
    this.updateMetaTag('name', 'twitter:image', config.image || this.DEFAULT_IMAGE);
    this.updateMetaTag('name', 'twitter:card', config.twitterCard || 'summary_large_image');

    // Update canonical URL
    this.updateCanonicalUrl(config.url || this.SITE_URL);
  }

  /**
   * Add structured data to the page
   */
  static addStructuredData(data: StructuredData): void {
    // Remove existing structured data
    const existingScript = document.querySelector('script[type="application/ld+json"]');
    if (existingScript) {
      existingScript.remove();
    }

    // Add new structured data
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(data);
    document.head.appendChild(script);
  }

  /**
   * Generate business structured data
   */
  static generateBusinessSchema(business: any): StructuredData {
    return {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      "name": business.name,
      "description": business.description,
      "address": business.address ? {
        "@type": "PostalAddress",
        "streetAddress": business.address.street,
        "addressLocality": business.address.city,
        "addressRegion": business.address.state,
        "postalCode": business.address.zipCode,
        "addressCountry": business.address.country
      } : undefined,
      "telephone": business.phone,
      "email": business.email,
      "url": business.website,
      "image": business.image,
      "aggregateRating": business.reviewCount > 0 ? {
        "@type": "AggregateRating",
        "ratingValue": business.rating,
        "reviewCount": business.reviewCount,
        "bestRating": "5",
        "worstRating": "1"
      } : undefined,
      "openingHoursSpecification": this.generateOpeningHours(business.businessHours)
    };
  }

  /**
   * Generate review structured data
   */
  static generateReviewSchema(reviews: any[]): StructuredData {
    return {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "itemListElement": reviews.map((review, index) => ({
        "@type": "Review",
        "position": index + 1,
        "author": {
          "@type": "Person",
          "name": review.customerName || "Anonymous"
        },
        "reviewRating": {
          "@type": "Rating",
          "ratingValue": review.rating,
          "bestRating": "5",
          "worstRating": "1"
        },
        "datePublished": review.createdAt,
        "reviewBody": review.content
      }))
    };
  }

  /**
   * Generate breadcrumb structured data
   */
  static generateBreadcrumbSchema(items: Array<{ name: string; url?: string }>): StructuredData {
    return {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": items.map((item, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "name": item.name,
        "item": item.url ? `${this.SITE_URL}${item.url}` : undefined
      }))
    };
  }

  /**
   * Create business-specific meta tags
   */
  static setBusinessPageMeta(business: any): void {
    const title = `${business.name} - Reviews & Information | Servisbeta`;
    const description = `Read reviews for ${business.name}, a ${business.category} business${business.address?.city ? ` in ${business.address.city}` : ''}. ${business.description?.substring(0, 100)}${business.description?.length > 100 ? '...' : ''}`;
    const url = `${this.SITE_URL}/business/${business.id}`;

    this.updateMetaTags({
      title,
      description,
      image: business.image || this.DEFAULT_IMAGE,
      url,
      type: 'article',
      keywords: `${business.name}, ${business.category}, reviews, business, ${business.address?.city || ''}`
    });

    // Add business structured data
    const businessSchema = this.generateBusinessSchema(business);
    this.addStructuredData(businessSchema);
  }

  /**
   * Create search results meta tags
   */
  static setSearchPageMeta(query?: string, location?: string, category?: string): void {
    let title = "Find Local Businesses";
    let description = "Discover the best local businesses in your area";

    if (query || category) {
      const searchTerm = query || category;
      title = `${searchTerm} businesses ${location ? `in ${location}` : ''} - Servisbeta`;
      description = `Find the best ${searchTerm.toLowerCase()} businesses ${location ? `in ${location}` : 'in your area'}. Read reviews, compare options, and discover great local services.`;
    } else if (location) {
      title = `Local Businesses in ${location} - Servisbeta`;
      description = `Discover local businesses in ${location}. Read reviews and find the best services in your area.`;
    }

    this.updateMetaTags({
      title,
      description,
      keywords: `${query || category || ''} ${location || ''} local business directory reviews`.trim()
    });
  }

  /**
   * Create category page meta tags
   */
  static setCategoryPageMeta(category: string): void {
    const title = `${category} Businesses - Find the Best Local ${category} Services | Servisbeta`;
    const description = `Discover top-rated ${category.toLowerCase()} businesses in your area. Read verified customer reviews and find the perfect service for your needs.`;

    this.updateMetaTags({
      title,
      description,
      keywords: `${category.toLowerCase()}, local business, reviews, services, directory`
    });
  }

  /**
   * Private helper methods
   */
  private static updateMetaTag(attribute: string, name: string, content?: string): void {
    if (!content) return;

    let meta = document.querySelector(`meta[${attribute}="${name}"]`) as HTMLMetaElement;
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute(attribute, name);
      document.head.appendChild(meta);
    }
    meta.content = content;
  }

  private static updateCanonicalUrl(url: string): void {
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = url;
  }

  private static generateOpeningHours(businessHours?: any): any[] {
    if (!businessHours) return [];

    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    return days
      .filter(day => businessHours[day] && !businessHours[day].closed)
      .map(day => ({
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": day.charAt(0).toUpperCase() + day.slice(1),
        "opens": businessHours[day].open,
        "closes": businessHours[day].close
      }));
  }
}

/**
 * React hook for SEO management
 */
export const useSEO = (config: MetaTagConfig) => {
  const updateSEO = (newConfig: MetaTagConfig) => {
    SEOManager.updateMetaTags({ ...config, ...newConfig });
  };

  const addStructuredData = (data: StructuredData) => {
    SEOManager.addStructuredData(data);
  };

  return { updateSEO, addStructuredData };
};