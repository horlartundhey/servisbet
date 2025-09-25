import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Edit, Trash2, Copy, Eye, BarChart3 } from 'lucide-react';
import CreateTemplateModal from './CreateTemplateModal';

interface ResponseTemplate {
  _id: string;
  name: string;
  description: string;
  template: string;
  category: string;
  ratingRange: { min: number; max: number };
  keywords: string[];
  variables: Array<{ name: string; placeholder: string; required: boolean }>;
  autoApply: boolean;
  tags: string[];
  isActive: boolean;
  usageCount: number;
  lastUsed?: Date;
}

interface TemplateCategory {
  value: string;
  label: string;
  description: string;
  recommendedRatings: number[];
  color: string;
}

const ResponseTemplateManager: React.FC = () => {
  const [templates, setTemplates] = useState<ResponseTemplate[]>([]);
  const [categories, setCategories] = useState<TemplateCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ResponseTemplate | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<ResponseTemplate | null>(null);

  useEffect(() => {
    fetchTemplates();
    fetchCategories();
  }, [selectedCategory]);

  const fetchTemplates = async () => {
    try {
      const token = localStorage.getItem('token');
      const businessId = localStorage.getItem('businessId');
      
      if (!businessId) {
        console.error('Business ID not found');
        return;
      }

      const params = new URLSearchParams();
      if (selectedCategory !== 'all') {
        params.append('category', selectedCategory);
      }

      const response = await fetch(`/api/templates/business/${businessId}?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTemplates(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/response-templates/categories', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCategories(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!window.confirm('Are you sure you want to delete this template?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/templates/${templateId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setTemplates(templates.filter(t => t._id !== templateId));
      }
    } catch (error) {
      console.error('Error deleting template:', error);
    }
  };

  const getCategoryColor = (category: string) => {
    const categoryData = categories.find(c => c.value === category);
    return categoryData?.color || 'gray';
  };

  const getCategoryBadgeClass = (color: string) => {
    const colorClasses = {
      green: 'bg-green-100 text-green-800',
      red: 'bg-red-100 text-red-800',
      yellow: 'bg-yellow-100 text-yellow-800',
      blue: 'bg-blue-100 text-blue-800',
      purple: 'bg-purple-100 text-purple-800',
      gray: 'bg-gray-100 text-gray-800'
    };
    return colorClasses[color as keyof typeof colorClasses] || colorClasses.gray;
  };

  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.keywords.some(keyword => 
      keyword.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Response Templates</h1>
          <p className="text-gray-600">
            Create and manage response templates to quickly reply to customer reviews
          </p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-2">
              <Filter className="text-gray-400 w-4 h-4" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Create Template Button */}
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Template
            </button>
          </div>
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map(template => (
            <div key={template._id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6">
                {/* Template Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {template.name}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">
                      {template.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    <button
                      onClick={() => setSelectedTemplate(template)}
                      className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                      title="View template"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setEditingTemplate(template)}
                      className="p-1 text-gray-400 hover:text-yellow-600 transition-colors"
                      title="Edit template"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteTemplate(template._id)}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                      title="Delete template"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Category and Rating Range */}
                <div className="flex items-center gap-2 mb-3">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryBadgeClass(getCategoryColor(template.category))}`}>
                    {categories.find(c => c.value === template.category)?.label || template.category}
                  </span>
                  <span className="text-xs text-gray-500">
                    {template.ratingRange.min}-{template.ratingRange.max} stars
                  </span>
                </div>

                {/* Template Preview */}
                <div className="bg-gray-50 rounded-lg p-3 mb-4">
                  <p className="text-sm text-gray-700 line-clamp-3">
                    {template.template}
                  </p>
                </div>

                {/* Variables */}
                {template.variables.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs font-medium text-gray-600 mb-2">Variables:</p>
                    <div className="flex flex-wrap gap-1">
                      {template.variables.map(variable => (
                        <span
                          key={variable.name}
                          className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded"
                        >
                          {variable.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Stats */}
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>Used {template.usageCount} times</span>
                  {template.autoApply && (
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                      Auto-apply
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredTemplates.length === 0 && (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <Copy className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || selectedCategory !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : 'Create your first response template to get started'
              }
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Template
            </button>
          </div>
        )}
      </div>

      {/* Template Preview Modal */}
      {selectedTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  {selectedTemplate.name}
                </h2>
                <button
                  onClick={() => setSelectedTemplate(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <p className="text-gray-600">{selectedTemplate.description}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Template Content
                  </label>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                      {selectedTemplate.template}
                    </pre>
                  </div>
                </div>
                
                {selectedTemplate.variables.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Variables
                    </label>
                    <div className="space-y-2">
                      {selectedTemplate.variables.map(variable => (
                        <div key={variable.name} className="flex items-center gap-3 text-sm">
                          <span className="font-mono bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {variable.name}
                          </span>
                          <span className="text-gray-600">
                            {variable.placeholder}
                          </span>
                          {variable.required && (
                            <span className="text-red-600 text-xs">Required</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Template Modal */}
      <CreateTemplateModal
        isOpen={showCreateModal || editingTemplate !== null}
        onClose={() => {
          setShowCreateModal(false);
          setEditingTemplate(null);
        }}
        onSuccess={() => {
          fetchTemplates();
          setShowCreateModal(false);
          setEditingTemplate(null);
        }}
        editingTemplate={editingTemplate}
      />
    </div>
  );
};

export default ResponseTemplateManager;