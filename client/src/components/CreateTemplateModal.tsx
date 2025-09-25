import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, Eye, Save } from 'lucide-react';

interface TemplateVariable {
  name: string;
  placeholder: string;
  required: boolean;
}

interface TemplateCategory {
  value: string;
  label: string;
  description: string;
  recommendedRatings: number[];
  color: string;
}

interface CreateTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingTemplate?: any;
}

const CreateTemplateModal: React.FC<CreateTemplateModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  editingTemplate
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    template: '',
    category: 'general',
    ratingRange: { min: 1, max: 5 },
    keywords: [] as string[],
    variables: [] as TemplateVariable[],
    autoApply: false,
    tags: [] as string[]
  });

  const [categories, setCategories] = useState<TemplateCategory[]>([]);
  const [keywordInput, setKeywordInput] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [previewMode, setPreviewMode] = useState(false);
  const [previewData, setPreviewData] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
      if (editingTemplate) {
        setFormData({
          name: editingTemplate.name || '',
          description: editingTemplate.description || '',
          template: editingTemplate.template || '',
          category: editingTemplate.category || 'general',
          ratingRange: editingTemplate.ratingRange || { min: 1, max: 5 },
          keywords: editingTemplate.keywords || [],
          variables: editingTemplate.variables || [],
          autoApply: editingTemplate.autoApply || false,
          tags: editingTemplate.tags || []
        });
      }
    } else {
      resetForm();
    }
  }, [isOpen, editingTemplate]);

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

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      template: '',
      category: 'general',
      ratingRange: { min: 1, max: 5 },
      keywords: [],
      variables: [],
      autoApply: false,
      tags: []
    });
    setKeywordInput('');
    setTagInput('');
    setPreviewMode(false);
    setPreviewData({});
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleRatingRangeChange = (type: 'min' | 'max', value: number) => {
    setFormData(prev => ({
      ...prev,
      ratingRange: {
        ...prev.ratingRange,
        [type]: value
      }
    }));
  };

  const addKeyword = () => {
    if (keywordInput.trim() && !formData.keywords.includes(keywordInput.trim())) {
      setFormData(prev => ({
        ...prev,
        keywords: [...prev.keywords, keywordInput.trim()]
      }));
      setKeywordInput('');
    }
  };

  const removeKeyword = (keyword: string) => {
    setFormData(prev => ({
      ...prev,
      keywords: prev.keywords.filter(k => k !== keyword)
    }));
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  const addVariable = () => {
    setFormData(prev => ({
      ...prev,
      variables: [...prev.variables, { name: '', placeholder: '', required: false }]
    }));
  };

  const updateVariable = (index: number, field: keyof TemplateVariable, value: any) => {
    setFormData(prev => ({
      ...prev,
      variables: prev.variables.map((variable, i) => 
        i === index ? { ...variable, [field]: value } : variable
      )
    }));
  };

  const removeVariable = (index: number) => {
    setFormData(prev => ({
      ...prev,
      variables: prev.variables.filter((_, i) => i !== index)
    }));
  };

  const renderPreview = () => {
    let preview = formData.template;
    
    formData.variables.forEach(variable => {
      const value = previewData[variable.name] || variable.placeholder || `{{${variable.name}}}`;
      preview = preview.replace(new RegExp(`{{${variable.name}}}`, 'g'), value);
    });
    
    return preview;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const businessId = localStorage.getItem('businessId');

      if (!businessId) {
        alert('Business ID not found');
        return;
      }

      const url = editingTemplate 
        ? `/api/templates/${editingTemplate._id}`
        : '/api/templates';
      
      const method = editingTemplate ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          businessId
        }),
      });

      if (response.ok) {
        onSuccess();
        onClose();
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Error saving template');
      }
    } catch (error) {
      console.error('Error saving template:', error);
      alert('Error saving template');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const selectedCategory = categories.find(c => c.value === formData.category);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              {editingTemplate ? 'Edit Template' : 'Create Response Template'}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Template Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Thank You Response"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  {categories.map(category => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
                {selectedCategory && (
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedCategory.description}
                  </p>
                )}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={2}
                placeholder="Brief description of when to use this template"
              />
            </div>

            {/* Rating Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rating Range
              </label>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600">Min:</label>
                  <select
                    value={formData.ratingRange.min}
                    onChange={(e) => handleRatingRangeChange('min', parseInt(e.target.value))}
                    className="border border-gray-300 rounded px-2 py-1"
                  >
                    {[1, 2, 3, 4, 5].map(num => (
                      <option key={num} value={num}>{num}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600">Max:</label>
                  <select
                    value={formData.ratingRange.max}
                    onChange={(e) => handleRatingRangeChange('max', parseInt(e.target.value))}
                    className="border border-gray-300 rounded px-2 py-1"
                  >
                    {[1, 2, 3, 4, 5].map(num => (
                      <option key={num} value={num}>{num}</option>
                    ))}
                  </select>
                </div>
                {selectedCategory && (
                  <span className="text-sm text-gray-600">
                    Recommended: {selectedCategory.recommendedRatings.join(', ')} stars
                  </span>
                )}
              </div>
            </div>

            {/* Template Content */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Template Content *
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPreviewMode(!previewMode)}
                    className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                  >
                    <Eye className="w-4 h-4" />
                    {previewMode ? 'Edit' : 'Preview'}
                  </button>
                </div>
              </div>
              
              {previewMode ? (
                <div className="bg-gray-50 border border-gray-300 rounded-lg p-4">
                  {formData.variables.length > 0 && (
                    <div className="mb-4 space-y-2">
                      <p className="text-sm font-medium text-gray-700">Preview Variables:</p>
                      <div className="grid grid-cols-2 gap-2">
                        {formData.variables.map(variable => (
                          <input
                            key={variable.name}
                            type="text"
                            placeholder={`${variable.name} (${variable.placeholder})`}
                            value={previewData[variable.name] || ''}
                            onChange={(e) => setPreviewData(prev => ({
                              ...prev,
                              [variable.name]: e.target.value
                            }))}
                            className="text-sm border border-gray-200 rounded px-2 py-1"
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="bg-white border rounded p-3">
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">
                      {renderPreview()}
                    </pre>
                  </div>
                </div>
              ) : (
                <textarea
                  value={formData.template}
                  onChange={(e) => handleInputChange('template', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={6}
                  placeholder="Write your template content here. Use {{variableName}} for dynamic content."
                  required
                />
              )}
            </div>

            {/* Variables */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Variables
                </label>
                <button
                  type="button"
                  onClick={addVariable}
                  className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                >
                  <Plus className="w-4 h-4" />
                  Add Variable
                </button>
              </div>
              
              {formData.variables.length > 0 && (
                <div className="space-y-3 border border-gray-200 rounded-lg p-4">
                  {formData.variables.map((variable, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <input
                        type="text"
                        placeholder="Variable name"
                        value={variable.name}
                        onChange={(e) => updateVariable(index, 'name', e.target.value)}
                        className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm"
                      />
                      <input
                        type="text"
                        placeholder="Default value"
                        value={variable.placeholder}
                        onChange={(e) => updateVariable(index, 'placeholder', e.target.value)}
                        className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm"
                      />
                      <label className="flex items-center gap-1 text-sm">
                        <input
                          type="checkbox"
                          checked={variable.required}
                          onChange={(e) => updateVariable(index, 'required', e.target.checked)}
                          className="rounded"
                        />
                        Required
                      </label>
                      <button
                        type="button"
                        onClick={() => removeVariable(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Keywords */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Keywords (for auto-suggestions)
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  placeholder="Add keywords..."
                />
                <button
                  type="button"
                  onClick={addKeyword}
                  className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 text-sm"
                >
                  Add
                </button>
              </div>
              {formData.keywords.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.keywords.map(keyword => (
                    <span
                      key={keyword}
                      className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm flex items-center gap-1"
                    >
                      {keyword}
                      <button
                        type="button"
                        onClick={() => removeKeyword(keyword)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Auto Apply */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="autoApply"
                checked={formData.autoApply}
                onChange={(e) => handleInputChange('autoApply', e.target.checked)}
                className="rounded"
              />
              <label htmlFor="autoApply" className="text-sm text-gray-700">
                Auto-apply this template for matching reviews
              </label>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Saving...' : editingTemplate ? 'Update Template' : 'Create Template'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTemplateModal;