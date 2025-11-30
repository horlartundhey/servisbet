import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search, Filter, Grid, List, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import BusinessCard from '../components/BusinessCard';
import { CategoryBreadcrumb } from '../components/Breadcrumb';
import { SEOManager } from '../utils/seo';
import { businessService, Business as ApiBusiness } from '../services/businessService';

// Transform function for business data
const transformBusiness = (apiBusiness: ApiBusiness) => ({
  id: apiBusiness._id,
  slug: apiBusiness.slug,
  name: apiBusiness.name,
  category: apiBusiness.category,
  rating: apiBusiness.averageRating || 0,
  reviewCount: apiBusiness.totalReviews || 0,
  image: apiBusiness.cover || apiBusiness.images?.[1] || apiBusiness.images?.[0] || 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=500&h=300&fit=crop',
  description: apiBusiness.description,
});

const categories = [
  'All Categories',
  'Restaurant',
  'Technology',
  'Beauty & Spa',
  'Cafe',
  'Healthcare',
  'Automotive',
  'Shopping',
  'Entertainment',
  'Services',
  'Education'
];

const AllBusinesses = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // State management
  const [businesses, setBusinesses] = useState<ReturnType<typeof transformBusiness>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Pagination and filtering state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  const itemsPerPage = 12;

  // Initialize from URL params
  useEffect(() => {
    const page = parseInt(searchParams.get('page') || '1');
    const query = searchParams.get('q') || '';
    const category = searchParams.get('category') || 'All Categories';
    const sort = searchParams.get('sort') || 'name';
    const order = searchParams.get('order') || 'asc';

    setCurrentPage(page);
    setSearchQuery(query);
    setSelectedCategory(category);
    setSortBy(sort);
    setSortOrder(order as 'asc' | 'desc');
  }, [searchParams]);

  // Load businesses data
  useEffect(() => {
    const loadBusinesses = async () => {
      try {
        setLoading(true);
        setError(null);

        const params: any = {
          page: currentPage,
          limit: itemsPerPage,
          sortBy,
          order: sortOrder
        };

        if (searchQuery) {
          params.search = searchQuery;
        }

        if (selectedCategory && selectedCategory !== 'All Categories') {
          params.category = selectedCategory;
        }

        const result = await businessService.getBusinesses(params);
        const transformedBusinesses = result.businesses.map(transformBusiness);
        
        setBusinesses(transformedBusinesses);
        setTotalPages(result.totalPages);

        // Update SEO based on current filters
        if (selectedCategory && selectedCategory !== 'All Categories') {
          SEOManager.setCategoryPageMeta(selectedCategory);
        } else if (searchQuery) {
          SEOManager.setSearchPageMeta(searchQuery);
        } else {
          SEOManager.updateMetaTags({
            title: 'Find Local Businesses - Servisbeta Business Directory',
            description: 'Discover the best local businesses in your area. Browse restaurants, services, healthcare providers, and more with verified customer reviews.'
          });
        }
        setTotalCount(result.total);

      } catch (error) {
        console.error('Error loading businesses:', error);
        setError('Failed to load businesses. Please try again.');
        setBusinesses([]);
      } finally {
        setLoading(false);
      }
    };

    loadBusinesses();
  }, [currentPage, searchQuery, selectedCategory, sortBy, sortOrder]);

  // Update URL params when filters change
  const updateURLParams = (updates: Record<string, string | number>) => {
    const newParams = new URLSearchParams(searchParams);
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        newParams.set(key, value.toString());
      } else {
        newParams.delete(key);
      }
    });

    setSearchParams(newParams);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
    updateURLParams({ q: query, page: '1' });
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setCurrentPage(1);
    updateURLParams({ 
      category: category === 'All Categories' ? '' : category, 
      page: '1' 
    });
  };

  const handleSortChange = (sort: string) => {
    const [sortField, order] = sort.split('-');
    setSortBy(sortField);
    setSortOrder(order as 'asc' | 'desc');
    updateURLParams({ sort: sortField, order });
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    updateURLParams({ page: page.toString() });
  };

  const handleBusinessClick = (businessId: string, business?: any) => {
    const identifier = business?.slug || businessId;
    navigate(`/business/${identifier}`);
  };

  const renderPagination = () => {
    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <div className="flex items-center justify-center space-x-2 mt-8">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage <= 1}
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>

        {pages.map((page) => (
          <Button
            key={page}
            variant={page === currentPage ? "default" : "outline"}
            size="sm"
            onClick={() => handlePageChange(page)}
          >
            {page}
          </Button>
        ))}

        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          {/* Breadcrumb */}
          {selectedCategory && selectedCategory !== 'All Categories' ? (
            <CategoryBreadcrumb category={selectedCategory} className="mb-4" />
          ) : (
            <CategoryBreadcrumb category="All Businesses" className="mb-4" />
          )}
          
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">All Businesses</h1>
              <p className="text-gray-600 mt-1">
                Discover {totalCount.toLocaleString()} businesses in our directory
              </p>
            </div>
            
            {/* Search Bar */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search businesses..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10 w-80"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Filters and Controls */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Category Filter */}
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-gray-500" />
                  <Select value={selectedCategory} onValueChange={handleCategoryChange}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Sort Filter */}
                <Select value={`${sortBy}-${sortOrder}`} onValueChange={handleSortChange}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                    <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                    <SelectItem value="rating-desc">Rating (High to Low)</SelectItem>
                    <SelectItem value="rating-asc">Rating (Low to High)</SelectItem>
                    <SelectItem value="reviewCount-desc">Most Reviews</SelectItem>
                    <SelectItem value="createdAt-desc">Newest First</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading businesses...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-12">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </div>
        )}

        {/* Results */}
        {!loading && !error && (
          <>
            {businesses.length > 0 ? (
              <>
                {/* Results Info */}
                <div className="flex items-center justify-between mb-6">
                  <p className="text-gray-600">
                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} businesses
                  </p>
                </div>

                {/* Business Grid/List */}
                <div className={
                  viewMode === 'grid' 
                    ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" 
                    : "space-y-4"
                }>
                  {businesses.map((business) => (
                    <BusinessCard
                      key={business.id}
                      {...business}
                      onClick={handleBusinessClick}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && renderPagination()}
              </>
            ) : (
              <div className="text-center py-12">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No businesses found</h3>
                <p className="text-gray-600 mb-4">
                  Try adjusting your search criteria or filters.
                </p>
                <Button onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('All Categories');
                  handleSearch('');
                  handleCategoryChange('All Categories');
                }}>
                  Clear Filters
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AllBusinesses;