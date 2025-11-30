import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import SearchBar, { SearchFilters } from '../components/SearchBar';
import BusinessGrid from '../components/BusinessGrid';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Filter } from "lucide-react";
import { businessService, Business as ApiBusiness } from '../services/businessService';

// Interface expected by BusinessGrid component
interface Business {
  id: string;
  slug?: string;
  name: string;
  category: string;
  rating: number;
  reviewCount: number;
  image: string;
  description: string;
}

// Function to transform API Business to component Business format
const transformBusiness = (apiBusiness: ApiBusiness): Business => {
  return {
    id: apiBusiness._id,
    slug: apiBusiness.slug,
    name: apiBusiness.name,
    category: apiBusiness.category,
    rating: apiBusiness.averageRating || 0,
    reviewCount: apiBusiness.totalReviews || 0,
    image: apiBusiness.cover || apiBusiness.images?.[1] || apiBusiness.images?.[0] || 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=500&h=300&fit=crop',
    description: apiBusiness.description,
  };
};

const SearchResults = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalResults, setTotalResults] = useState(0);
  const [filters, setFilters] = useState<SearchFilters>({
    category: searchParams.get('category') || undefined,
    location: searchParams.get('location') || undefined,
    rating: searchParams.get('rating') ? parseInt(searchParams.get('rating')!) : undefined,
    priceRange: searchParams.get('priceRange') || undefined,
    sortBy: searchParams.get('sortBy') || 'relevance',
    openNow: searchParams.get('openNow') === 'true'
  });

  // Fetch businesses from API
  const fetchBusinesses = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        search: query || undefined,
        category: filters.category,
        location: filters.location,
        priceRange: filters.priceRange,
        rating: filters.rating,
        sort: filters.sortBy,
        page: 1,
        limit: 50
      };

      const result = await businessService.getBusinesses(params);
      const transformedBusinesses = result.businesses.map(transformBusiness);
      setBusinesses(transformedBusinesses);
      setTotalResults(result.total);
    } catch (err) {
      setError('Failed to load businesses. Please try again.');
      console.error('Error fetching businesses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const newQuery = searchParams.get('q') || '';
    setQuery(newQuery);
    setFilters({
      category: searchParams.get('category') || undefined,
      location: searchParams.get('location') || undefined,
      rating: searchParams.get('rating') ? parseInt(searchParams.get('rating')!) : undefined,
      priceRange: searchParams.get('priceRange') || undefined,
      sortBy: searchParams.get('sortBy') || 'relevance',
      openNow: searchParams.get('openNow') === 'true'
    });
  }, [searchParams]);

  // Fetch businesses when filters change
  useEffect(() => {
    fetchBusinesses();
  }, [query, filters]);

  const handleSearch = (newQuery: string, newFilters?: SearchFilters) => {
    const params = new URLSearchParams();
    if (newQuery) params.set('q', newQuery);
    if (newFilters?.category) params.set('category', newFilters.category);
    if (newFilters?.location) params.set('location', newFilters.location);
    if (newFilters?.rating) params.set('rating', newFilters.rating.toString());
    if (newFilters?.priceRange) params.set('priceRange', newFilters.priceRange);
    if (newFilters?.sortBy) params.set('sortBy', newFilters.sortBy);
    if (newFilters?.openNow) params.set('openNow', 'true');

    setSearchParams(params);
  };

  const handleBusinessClick = (businessId: string, business?: any) => {
    const identifier = business?.slug || businessId;
    navigate(`/business/${identifier}`);
  };

  const clearAllFilters = () => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    params.set('sortBy', 'relevance');
    setSearchParams(params);
  };

  const hasActiveFilters = filters.category || filters.location || filters.rating || 
    filters.priceRange || filters.openNow || (filters.sortBy && filters.sortBy !== 'relevance');

  return (
    <div className="min-h-screen bg-background">
      {/* Search Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="max-w-4xl mx-auto">
            <SearchBar 
              onSearch={handleSearch} 
              defaultValue={query}
              filters={filters}
            />
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="container mx-auto px-4 py-8">
        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading businesses...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-12">
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={fetchBusinesses} variant="outline">
              Try Again
            </Button>
          </div>
        )}

        {/* Results Content */}
        {!loading && !error && (
          <>
            {/* Results Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">
                  {businesses.length} results
                  {query && ` for "${query}"`}
                  {filters.location && ` in ${filters.location}`}
                </h2>
                <p className="text-muted-foreground">
                  Showing {businesses.length} of {totalResults} businesses
                </p>
              </div>

              {hasActiveFilters && (
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Filters applied</span>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={clearAllFilters}
                  >
                    Clear all
                  </Button>
                </div>
              )}
            </div>

        {/* Active Filters Summary */}
        {hasActiveFilters && (
          <div className="mb-6">
            <div className="flex flex-wrap gap-2">
              {filters.category && (
                <Badge variant="secondary" className="capitalize">
                  Category: {filters.category.replace('_', ' ')}
                </Badge>
              )}
              {filters.location && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {filters.location}
                </Badge>
              )}
              {filters.rating && (
                <Badge variant="secondary">
                  {filters.rating}+ stars
                </Badge>
              )}
              {filters.priceRange && (
                <Badge variant="secondary">
                  {filters.priceRange}
                </Badge>
              )}
              {filters.openNow && (
                <Badge variant="secondary">
                  Open now
                </Badge>
              )}
              {filters.sortBy && filters.sortBy !== 'relevance' && (
                <Badge variant="secondary">
                  Sorted by: {filters.sortBy.replace(/([A-Z])/g, ' $1').toLowerCase()}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Results Grid */}
        {businesses.length === 0 ? (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
              <p className="text-gray-500 mb-4">
                Try adjusting your search terms or filters to find what you're looking for.
              </p>
              <div className="space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setQuery('');
                    handleSearch('');
                  }}
                >
                  Clear search
                </Button>
                <Button 
                  variant="outline" 
                  onClick={clearAllFilters}
                  disabled={!hasActiveFilters}
                >
                  Clear filters
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <BusinessGrid businesses={businesses} onBusinessClick={handleBusinessClick} />
        )}

        {/* Load More (if needed for pagination) */}
        {businesses.length > 12 && (
          <div className="text-center mt-8">
            <Button variant="outline" size="lg">
              Load more results
            </Button>
          </div>
        )}
          </>
        )}
      </div>
    </div>
  );
};

export default SearchResults;