import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ResponseTemplateManager from '../components/ResponseTemplateManager';

const TemplatesPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        <Route path="/" element={<ResponseTemplateManager />} />
        <Route path="*" element={<Navigate to="/templates" replace />} />
      </Routes>
    </div>
  );
};

export default TemplatesPage;