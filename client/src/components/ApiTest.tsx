import React, { useState } from 'react';
import { businessService } from '../services/businessService';
import { Button } from '@/components/ui/button';

const ApiTest = () => {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testApi = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log('Testing API call...');
      const businessData = await businessService.getBusinessById('68c9260af9eef2eeb634a18d');
      console.log('API Response:', businessData);
      setResult(businessData);
    } catch (err: any) {
      console.error('API Error:', err);
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">API Test</h1>
      
      <Button onClick={testApi} disabled={loading} className="mb-4">
        {loading ? 'Testing...' : 'Test Business API'}
      </Button>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <strong>Error:</strong> {error}
        </div>
      )}

      {result && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          <strong>Success!</strong> Business loaded: {result.name}
          <pre className="mt-2 text-xs overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default ApiTest;