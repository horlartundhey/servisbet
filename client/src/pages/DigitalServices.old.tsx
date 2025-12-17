import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BusinessGrid from '../components/BusinessGrid';
import { businessService, Business as ApiBusiness } from '../services/businessService';
import { Search, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Transform function for interface compatibility
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
  'Hotel',
  'Retail',
  'Healthcare',
  'Beauty',
  'Automotive',
  'Technology',
  'Education',
  'Financial',
  'Legal',
  'Real Estate',
  'Entertainment',
  'Fitness',
  'Home Services',
  'Professional Services',
  'Other'
];

const DigitalServices = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [businesses, setBusinesses] = useState<ReturnType<typeof transformBusiness>[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
  });

  useEffect(() => {
    loadBusinesses();
  }, [selectedCategory]);

  const loadBusinesses = async (page = 1) => {
    try {
      setLoading(true);
      const params: any = {
        page,
        limit: 12,
      };

      if (selectedCategory && selectedCategory !== 'All Categories') {
        params.category = selectedCategory;
      }

      const result = await businessService.getBusinesses(params);
      const transformedBusinesses = result.businesses.map(transformBusiness);
      setBusinesses(transformedBusinesses);
      setPagination({
        currentPage: result.page || 1,
        totalPages: result.totalPages || 1,
        totalCount: result.total || 0,
      });
    } catch (error) {
      console.error('Error loading businesses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleBusinessClick = (businessId: string, business?: any) => {
    const identifier = business?.slug || businessId;
    navigate(`/business/${identifier}`);
  };

  const handlePageChange = (newPage: number) => {
    loadBusinesses(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary via-primary/90 to-secondary text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Discover Digital Services
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-white/90">
              Browse verified businesses and read authentic reviews from real customers
            </p>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search for businesses, services, or locations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-6 text-lg rounded-full border-0 shadow-xl"
                />
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-6 w-6" />
                <Button
                  type="submit"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 rounded-full px-8"
                  size="lg"
                >
                  Search
                </Button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* Filters and Results */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          {/* Filter Bar */}
          <div className="bg-white rounded-lg shadow-sm border p-4 mb-8">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-5 w-5 text-muted-foreground" />
                <span className="font-semibold text-foreground">Filter by:</span>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder="Category" />
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

              <div className="text-sm text-muted-foreground">
                {pagination.totalCount} {pagination.totalCount === 1 ? 'business' : 'businesses'} found
              </div>
            </div>
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading businesses...</p>
              </div>
            </div>
          ) : businesses.length === 0 ? (
            /* Empty State */
            <div className="text-center py-20">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-2xl font-semibold text-foreground mb-2">No businesses found</h3>
              <p className="text-muted-foreground mb-6">
                Try adjusting your filters or search for something else
              </p>
              <Button onClick={() => setSelectedCategory('All Categories')}>
                Clear Filters
              </Button>
            </div>
          ) : (
            /* Business Grid */
            <>
              <BusinessGrid businesses={businesses} onBusinessClick={handleBusinessClick} />

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-12">
                  <Button
                    variant="outline"
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={pagination.currentPage === 1}
                  >
                    Previous
                  </Button>

                  <div className="flex gap-2">
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      let pageNum;
                      if (pagination.totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (pagination.currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (pagination.currentPage >= pagination.totalPages - 2) {
                        pageNum = pagination.totalPages - 4 + i;
                      } else {
                        pageNum = pagination.currentPage - 2 + i;
                      }

                      return (
                        <Button
                          key={pageNum}
                          variant={pagination.currentPage === pageNum ? 'default' : 'outline'}
                          onClick={() => handlePageChange(pageNum)}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>

                  <Button
                    variant="outline"
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={pagination.currentPage === pagination.totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
};

export default DigitalServices;
