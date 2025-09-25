
import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Search, Filter, MapPin, Star, X, DollarSign } from 'lucide-react';

export interface SearchFilters {
  category?: string;
  location?: string;
  rating?: number;
  priceRange?: string;
  sortBy?: string;
  openNow?: boolean;
}

interface SearchBarProps {
  onSearch: (query: string, filters?: SearchFilters) => void;
  placeholder?: string;
  defaultValue?: string;
  showFilters?: boolean;
  filters?: SearchFilters;
}

const categories = [
  { value: 'restaurant', label: 'Restaurants' },
  { value: 'retail', label: 'Retail & Shopping' },
  { value: 'health', label: 'Health & Medical' },
  { value: 'beauty', label: 'Beauty & Spa' },
  { value: 'automotive', label: 'Automotive' },
  { value: 'home', label: 'Home & Garden' },
  { value: 'professional', label: 'Professional Services' },
  { value: 'fitness', label: 'Fitness & Recreation' },
  { value: 'entertainment', label: 'Entertainment' },
  { value: 'education', label: 'Education' },
  { value: 'finance', label: 'Financial Services' },
  { value: 'travel', label: 'Travel & Hotels' },
  { value: 'other', label: 'Other' }
];

const priceRanges = [
  { value: '$', label: '$' },
  { value: '$$', label: '$$' },
  { value: '$$$', label: '$$$' },
  { value: '$$$$', label: '$$$$' }
];

const sortOptions = [
  { value: 'relevance', label: 'Most Relevant' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'distance', label: 'Distance' },
  { value: 'newest', label: 'Newest' },
  { value: 'mostReviewed', label: 'Most Reviewed' }
];

const SearchBar: React.FC<SearchBarProps> = ({ 
  onSearch, 
  placeholder = "Search for businesses, restaurants, services...",
  defaultValue = "",
  showFilters = true,
  filters = {}
}) => {
  const [query, setQuery] = useState(defaultValue);
  const [searchFilters, setSearchFilters] = useState<SearchFilters>(filters);
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query, searchFilters);
  };

  const updateFilter = (key: keyof SearchFilters, value: any) => {
    const newFilters = { ...searchFilters, [key]: value };
    setSearchFilters(newFilters);
  };

  const removeFilter = (key: keyof SearchFilters) => {
    const newFilters = { ...searchFilters };
    delete newFilters[key];
    setSearchFilters(newFilters);
  };

  const clearAllFilters = () => {
    setSearchFilters({});
  };

  const activeFiltersCount = Object.keys(searchFilters).length;
  const hasActiveFilters = activeFiltersCount > 0;

  return (
    <div className="w-full max-w-4xl">
      <form onSubmit={handleSubmit} className="relative">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Input
              type="text"
              placeholder={placeholder}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full h-14 pl-6 pr-16 text-lg rounded-full border-2 border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-lg"
            />
            <Button
              type="submit"
              size="sm"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full h-10 w-10 p-0"
            >
              <Search size={18} />
            </Button>
          </div>
          
          {showFilters && (
            <Popover open={showFiltersPanel} onOpenChange={setShowFiltersPanel}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="h-14 px-6 rounded-full relative"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Filters
                  {hasActiveFilters && (
                    <Badge className="ml-2 bg-primary text-white rounded-full w-5 h-5 p-0 text-xs flex items-center justify-center">
                      {activeFiltersCount}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-4" align="end">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Filters</h3>
                    {hasActiveFilters && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={clearAllFilters}
                        className="h-auto p-1 text-xs"
                      >
                        Clear all
                      </Button>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Category</label>
                      <Select
                        value={searchFilters.category || ''}
                        onValueChange={(value) => updateFilter('category', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="All categories" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.value} value={category.value}>
                              {category.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-1 block">Location</label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          placeholder="Enter location"
                          value={searchFilters.location || ''}
                          onChange={(e) => updateFilter('location', e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-1 block">Minimum Rating</label>
                      <Select
                        value={searchFilters.rating?.toString() || ''}
                        onValueChange={(value) => updateFilter('rating', parseInt(value))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Any rating" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="4">4+ stars</SelectItem>
                          <SelectItem value="3">3+ stars</SelectItem>
                          <SelectItem value="2">2+ stars</SelectItem>
                          <SelectItem value="1">1+ stars</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-1 block">Price Range</label>
                      <Select
                        value={searchFilters.priceRange || ''}
                        onValueChange={(value) => updateFilter('priceRange', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Any price" />
                        </SelectTrigger>
                        <SelectContent>
                          {priceRanges.map((price) => (
                            <SelectItem key={price.value} value={price.value}>
                              <div className="flex items-center gap-2">
                                <DollarSign className="w-4 h-4" />
                                {price.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-1 block">Sort By</label>
                      <Select
                        value={searchFilters.sortBy || 'relevance'}
                        onValueChange={(value) => updateFilter('sortBy', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {sortOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="openNow"
                        checked={searchFilters.openNow || false}
                        onChange={(e) => updateFilter('openNow', e.target.checked)}
                        className="rounded border-gray-300"
                      />
                      <label htmlFor="openNow" className="text-sm font-medium">
                        Open now
                      </label>
                    </div>
                  </div>

                  <Button
                    onClick={() => {
                      onSearch(query, searchFilters);
                      setShowFiltersPanel(false);
                    }}
                    className="w-full"
                  >
                    Apply Filters
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>
      </form>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 mt-3">
          {searchFilters.category && (
            <Badge variant="secondary" className="flex items-center gap-1">
              {categories.find(c => c.value === searchFilters.category)?.label}
              <X
                className="w-3 h-3 cursor-pointer hover:text-red-500"
                onClick={() => removeFilter('category')}
              />
            </Badge>
          )}
          {searchFilters.location && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {searchFilters.location}
              <X
                className="w-3 h-3 cursor-pointer hover:text-red-500"
                onClick={() => removeFilter('location')}
              />
            </Badge>
          )}
          {searchFilters.rating && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Star className="w-3 h-3" />
              {searchFilters.rating}+ stars
              <X
                className="w-3 h-3 cursor-pointer hover:text-red-500"
                onClick={() => removeFilter('rating')}
              />
            </Badge>
          )}
          {searchFilters.priceRange && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <DollarSign className="w-3 h-3" />
              {searchFilters.priceRange}
              <X
                className="w-3 h-3 cursor-pointer hover:text-red-500"
                onClick={() => removeFilter('priceRange')}
              />
            </Badge>
          )}
          {searchFilters.openNow && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Open Now
              <X
                className="w-3 h-3 cursor-pointer hover:text-red-500"
                onClick={() => removeFilter('openNow')}
              />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
