import React, { useState, useEffect } from 'react';
import { Wand2, Copy, Send, X, Edit3 } from 'lucide-react';

interface ReviewTemplate {
  _id: string;
  name: string;
  description: string;
  template: string;
  category: string;
  variables: Array<{ name: string; placeholder: string; required: boolean }>;
  usageCount: number;
  isDefault?: boolean;
}

interface TemplateVariables {
  [key: string]: string;
}

interface TemplateSelector {
  review: {
    _id: string;
    rating: number;
    content: string;
    customerName?: string;
  };
  onTemplateSelect: (renderedContent: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

const ReviewTemplateSelector: React.FC<TemplateSelector> = ({ 
  review, 
  onTemplateSelect, 
  onClose, 
  isOpen 
}) => {
  const [templates, setTemplates] = useState<ReviewTemplate[]>([]);
  const [suggestedTemplates, setSuggestedTemplates] = useState<ReviewTemplate[]>([]);
  const [defaultTemplates, setDefaultTemplates] = useState<ReviewTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<ReviewTemplate | null>(null);
  const [variables, setVariables] = useState<TemplateVariables>({});
  const [customizedContent, setCustomizedContent] = useState('');
  const [activeTab, setActiveTab] = useState<'suggested' | 'custom' | 'default'>('suggested');

  useEffect(() => {
    if (isOpen) {
      fetchTemplates();
      fetchSuggestedTemplates();
      fetchDefaultTemplates();
    }
  }, [isOpen, review._id]);

  const fetchTemplates = async () => {
    try {
      const token = localStorage.getItem('token');
      const businessId = localStorage.getItem('businessId');
      
      if (!businessId) return;

      const response = await fetch(`/api/templates/business/${businessId}?rating=${review.rating}`, {
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
    }
  };

  const fetchSuggestedTemplates = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/templates/suggestions/${review._id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSuggestedTemplates(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching suggested templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDefaultTemplates = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/response-templates/defaults?rating=${review.rating}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setDefaultTemplates(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching default templates:', error);
    }
  };

  const renderTemplate = (template: ReviewTemplate, vars: TemplateVariables = {}) => {
    let content = template.template;
    
    // Auto-populate common variables
    const autoVars = {
      customerName: review.customerName || 'valued customer',
      rating: review.rating.toString(),
      ...vars
    };

    template.variables.forEach(variable => {
      const value = autoVars[variable.name] || variable.placeholder || `{{${variable.name}}}`;
      content = content.replace(new RegExp(`{{${variable.name}}}`, 'g'), value);
    });
    
    return content;
  };

  const handleTemplateSelect = (template: ReviewTemplate) => {
    setSelectedTemplate(template);
    
    // Initialize variables with defaults
    const initialVars: TemplateVariables = {};
    template.variables.forEach(variable => {
      initialVars[variable.name] = variable.placeholder;
    });
    
    // Auto-populate common variables
    initialVars.customerName = review.customerName || 'valued customer';
    initialVars.rating = review.rating.toString();
    
    setVariables(initialVars);
    setCustomizedContent(renderTemplate(template, initialVars));
  };

  const handleVariableChange = (variableName: string, value: string) => {
    const newVariables = { ...variables, [variableName]: value };
    setVariables(newVariables);
    if (selectedTemplate) {
      setCustomizedContent(renderTemplate(selectedTemplate, newVariables));
    }
  };

  const handleUseTemplate = async () => {
    if (!selectedTemplate) return;

    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/templates/${selectedTemplate._id}/use`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          variables,
          reviewId: review._id
        }),
      });

      if (response.ok) {
        onTemplateSelect(customizedContent);
        onClose();
      }
    } catch (error) {
      console.error('Error using template:', error);
    }
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      appreciation: 'bg-green-100 text-green-800',
      apology: 'bg-red-100 text-red-800',
      improvement: 'bg-yellow-100 text-yellow-800',
      clarification: 'bg-blue-100 text-blue-800',
      invitation: 'bg-purple-100 text-purple-800',
      general: 'bg-gray-100 text-gray-800'
    };
    return colors[category as keyof typeof colors] || colors.general;
  };

  if (!isOpen) return null;

  const currentTemplates = 
    activeTab === 'suggested' ? suggestedTemplates :
    activeTab === 'default' ? defaultTemplates :
    templates;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex h-full">
          {/* Left Panel - Template Selection */}
          <div className="w-1/2 border-r border-gray-200 flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Select Template</h2>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Review Info */}
              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium">Review:</span>
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map(star => (
                      <span
                        key={star}
                        className={star <= review.rating ? 'text-yellow-400' : 'text-gray-300'}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                </div>
                <p className="text-sm text-gray-700 line-clamp-2">
                  {review.content}
                </p>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-gray-200">
                <button
                  onClick={() => setActiveTab('suggested')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 ${
                    activeTab === 'suggested' 
                      ? 'border-blue-500 text-blue-600' 
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Suggested ({suggestedTemplates.length})
                </button>
                <button
                  onClick={() => setActiveTab('custom')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 ${
                    activeTab === 'custom' 
                      ? 'border-blue-500 text-blue-600' 
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  My Templates ({templates.length})
                </button>
                <button
                  onClick={() => setActiveTab('default')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 ${
                    activeTab === 'default' 
                      ? 'border-blue-500 text-blue-600' 
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Defaults ({defaultTemplates.length})
                </button>
              </div>
            </div>

            {/* Templates List */}
            <div className="flex-1 overflow-y-auto p-6">
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : currentTemplates.length === 0 ? (
                <div className="text-center py-8">
                  <Wand2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No templates found
                  </h3>
                  <p className="text-gray-600">
                    {activeTab === 'suggested' 
                      ? 'No templates match this review'
                      : activeTab === 'custom'
                      ? 'Create your first template to get started'
                      : 'No default templates available'
                    }
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {currentTemplates.map(template => (
                    <div
                      key={template._id}
                      onClick={() => handleTemplateSelect(template)}
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        selectedTemplate?._id === template._id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-gray-900">{template.name}</h3>
                        <div className="flex items-center gap-2">
                          {template.isDefault && (
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              Default
                            </span>
                          )}
                          <span className={`text-xs px-2 py-1 rounded ${getCategoryColor(template.category)}`}>
                            {template.category}
                          </span>
                        </div>
                      </div>
                      
                      {template.description && (
                        <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                      )}
                      
                      <div className="bg-gray-50 rounded p-3 mb-3">
                        <p className="text-sm text-gray-700 line-clamp-3">
                          {renderTemplate(template)}
                        </p>
                      </div>
                      
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Used {template.usageCount} times</span>
                        {template.variables.length > 0 && (
                          <span>{template.variables.length} variables</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Template Preview & Customization */}
          <div className="w-1/2 flex flex-col">
            {selectedTemplate ? (
              <>
                {/* Preview Header */}
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {selectedTemplate.name}
                  </h3>
                  {selectedTemplate.description && (
                    <p className="text-sm text-gray-600 mb-4">{selectedTemplate.description}</p>
                  )}
                  
                  {selectedTemplate.variables.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Customize Variables:</h4>
                      <div className="space-y-3">
                        {selectedTemplate.variables.map(variable => (
                          <div key={variable.name}>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              {variable.name}
                              {variable.required && <span className="text-red-500 ml-1">*</span>}
                            </label>
                            <input
                              type="text"
                              value={variables[variable.name] || ''}
                              onChange={(e) => handleVariableChange(variable.name, e.target.value)}
                              placeholder={variable.placeholder}
                              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Preview Content */}
                <div className="flex-1 p-6">
                  <div className="h-full flex flex-col">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium text-gray-700">Preview:</h4>
                      <button
                        onClick={() => setCustomizedContent(renderTemplate(selectedTemplate, variables))}
                        className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                      >
                        <Edit3 className="w-3 h-3" />
                        Reset
                      </button>
                    </div>
                    
                    <textarea
                      value={customizedContent}
                      onChange={(e) => setCustomizedContent(e.target.value)}
                      className="flex-1 border border-gray-300 rounded-lg p-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                      placeholder="Template preview will appear here..."
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="p-6 border-t border-gray-200">
                  <div className="flex items-center justify-end gap-3">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(customizedContent);
                        // Could add a toast notification here
                      }}
                      className="flex items-center gap-2 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      <Copy className="w-4 h-4" />
                      Copy
                    </button>
                    <button
                      onClick={handleUseTemplate}
                      className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                    >
                      <Send className="w-4 h-4" />
                      Use Template
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <Wand2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Select a Template
                  </h3>
                  <p className="text-gray-600">
                    Choose a template from the left to preview and customize it
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewTemplateSelector;