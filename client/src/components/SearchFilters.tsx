import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { 
  Filter, 
  MapPin, 
  Star, 
  DollarSign, 
  Clock, 
  X, 
  SlidersHorizontal,
  Search
} from 'lucide-react';

export interface SearchFilters {
  category?: string;
  location?: string;
  radius?: number; // in kilometers
  rating?: number;
  priceRange?: string;
  openNow?: boolean;
  sortBy?: 'relevance' | 'rating' | 'distance' | 'price' | 'newest';
  sortOrder?: 'asc' | 'desc';
  hasPhotos?: boolean;
  verified?: boolean;
  features?: string[]; // parking, wifi, wheelchair accessible, etc.
}

interface SearchFiltersProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  onApply: () => void;
  onReset: () => void;
  isCompact?: boolean;
}

const categories = [
  { value: 'restaurant', label: 'Restaurants' },
  { value: 'retail', label: 'Retail & Shopping' },
  { value: 'health', label: 'Health & Medical' },
  { value: 'beauty', label: 'Beauty & Spa' },
  { value: 'automotive', label: 'Automotive' },
  { value: 'home', label: 'Home & Garden' },
  { value: 'professional', label: 'Professional Services' },
  { value: 'entertainment', label: 'Entertainment' },
  { value: 'fitness', label: 'Fitness & Sports' },
  { value: 'education', label: 'Education' },
  { value: 'travel', label: 'Travel & Tourism' },
  { value: 'technology', label: 'Technology' },
];

const priceRanges = [
  { value: '$', label: '$ - Budget Friendly' },
  { value: '$$', label: '$$ - Moderate' },
  { value: '$$$', label: '$$$ - Expensive' },
  { value: '$$$$', label: '$$$$ - Luxury' }
];

const sortOptions = [
  { value: 'relevance', label: 'Most Relevant' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'distance', label: 'Nearest' },
  { value: 'price', label: 'Price' },
  { value: 'newest', label: 'Newest' }
];

const businessFeatures = [
  { value: 'parking', label: 'Parking Available' },
  { value: 'wifi', label: 'Free WiFi' },
  { value: 'wheelchair', label: 'Wheelchair Accessible' },
  { value: 'outdoor', label: 'Outdoor Seating' },
  { value: 'delivery', label: 'Delivery Available' },
  { value: 'takeout', label: 'Takeout' },
  { value: 'reservations', label: 'Accepts Reservations' },
  { value: 'credit_cards', label: 'Credit Cards Accepted' }
];

const SearchFilters: React.FC<SearchFiltersProps> = ({
  filters,
  onFiltersChange,
  onApply,
  onReset,
  isCompact = false
}) => {
  const [localFilters, setLocalFilters] = useState<SearchFilters>(filters);
  const [expanded, setExpanded] = useState(!isCompact);

  const updateFilter = (key: keyof SearchFilters, value: any) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const removeFilter = (key: keyof SearchFilters) => {
    const newFilters = { ...localFilters };
    delete newFilters[key];
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleFeatureChange = (feature: string, checked: boolean) => {
    const currentFeatures = localFilters.features || [];
    const newFeatures = checked
      ? [...currentFeatures, feature]
      : currentFeatures.filter(f => f !== feature);
    
    updateFilter('features', newFeatures.length > 0 ? newFeatures : undefined);
  };

  const hasActiveFilters = Object.keys(localFilters).some(key => 
    key !== 'sortBy' && key !== 'sortOrder' && localFilters[key as keyof SearchFilters]
  );

  const activeFilterCount = Object.keys(localFilters).filter(key => 
    key !== 'sortBy' && key !== 'sortOrder' && localFilters[key as keyof SearchFilters]
  ).length;

  if (isCompact && !expanded) {
    return (
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          onClick={() => setExpanded(true)}
          className="flex items-center gap-2"
        >
          <Filter className="w-4 h-4" />
          Filters
          {activeFilterCount > 0 && (
            <Badge className="ml-1 bg-primary text-white rounded-full w-5 h-5 p-0 text-xs">
              {activeFilterCount}
            </Badge>
          )}
        </Button>

        {/* Active Filters Preview */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-1">
            {localFilters.category && (
              <Badge variant="secondary" className="text-xs">
                {categories.find(c => c.value === localFilters.category)?.label}
                <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => removeFilter('category')} />
              </Badge>
            )}
            {localFilters.location && (
              <Badge variant="secondary" className="text-xs">
                <MapPin className="w-3 h-3 mr-1" />
                {localFilters.location}
                <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => removeFilter('location')} />
              </Badge>
            )}
            {localFilters.rating && (
              <Badge variant="secondary" className="text-xs">
                <Star className="w-3 h-3 mr-1" />
                {localFilters.rating}+
                <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => removeFilter('rating')} />
              </Badge>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5" />
            Search Filters
          </CardTitle>
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onReset}
                className="text-xs"
              >
                Clear All
              </Button>
            )}
            {isCompact && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExpanded(false)}
                className="h-8 w-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Category Filter */}
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Search className="w-4 h-4" />
            Category
          </Label>
          <Select
            value={localFilters.category || ''}
            onValueChange={(value) => updateFilter('category', value || undefined)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.value} value={category.value}>
                  {category.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Location Filter */}
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Location
          </Label>
          <Input
            placeholder="Enter location (city, area, zip code)"
            value={localFilters.location || ''}
            onChange={(e) => updateFilter('location', e.target.value || undefined)}
          />
          {localFilters.location && (
            <div className="space-y-2">
              <Label className="text-xs text-gray-600">Search radius: {localFilters.radius || 10} km</Label>
              <Slider
                value={[localFilters.radius || 10]}
                onValueChange={(values: number[]) => updateFilter('radius', values[0])}
                max={50}
                min={1}
                step={1}
                className="w-full"
              />
            </div>
          )}
        </div>

        {/* Rating Filter */}
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Star className="w-4 h-4" />
            Minimum Rating
          </Label>
          <div className="grid grid-cols-5 gap-2">
            {[1, 2, 3, 4, 5].map((rating) => (
              <Button
                key={rating}
                variant={localFilters.rating === rating ? "default" : "outline"}
                size="sm"
                onClick={() => updateFilter('rating', rating)}
                className="flex items-center gap-1"
              >
                <Star className="w-3 h-3" />
                {rating}+
              </Button>
            ))}
          </div>
        </div>

        {/* Price Range Filter */}
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Price Range
          </Label>
          <div className="grid grid-cols-2 gap-2">
            {priceRanges.map((range) => (
              <Button
                key={range.value}
                variant={localFilters.priceRange === range.value ? "default" : "outline"}
                size="sm"
                onClick={() => updateFilter('priceRange', range.value)}
                className="text-xs"
              >
                {range.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Sort Options */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Sort By</Label>
          <Select
            value={localFilters.sortBy || 'relevance'}
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

        {/* Quick Filters */}
        <div className="space-y-3">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Quick Filters
          </Label>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="openNow"
                checked={localFilters.openNow || false}
                onCheckedChange={(checked) => updateFilter('openNow', checked)}
              />
              <Label htmlFor="openNow" className="text-sm">Open now</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="verified"
                checked={localFilters.verified || false}
                onCheckedChange={(checked) => updateFilter('verified', checked)}
              />
              <Label htmlFor="verified" className="text-sm">Verified businesses only</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="hasPhotos"
                checked={localFilters.hasPhotos || false}
                onCheckedChange={(checked) => updateFilter('hasPhotos', checked)}
              />
              <Label htmlFor="hasPhotos" className="text-sm">Has photos</Label>
            </div>
          </div>
        </div>

        {/* Business Features */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Features & Amenities</Label>
          <div className="grid grid-cols-2 gap-2">
            {businessFeatures.map((feature) => (
              <div key={feature.value} className="flex items-center space-x-2">
                <Checkbox
                  id={feature.value}
                  checked={localFilters.features?.includes(feature.value) || false}
                  onCheckedChange={(checked) => handleFeatureChange(feature.value, !!checked)}
                />
                <Label htmlFor={feature.value} className="text-xs">{feature.label}</Label>
              </div>
            ))}
          </div>
        </div>

        {/* Apply/Reset Buttons */}
        <div className="flex gap-2 pt-4">
          <Button onClick={onApply} className="flex-1">
            Apply Filters
            {activeFilterCount > 0 && (
              <Badge className="ml-2 bg-white text-primary rounded-full w-5 h-5 p-0 text-xs">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
          {hasActiveFilters && (
            <Button variant="outline" onClick={onReset}>
              Reset
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SearchFilters;