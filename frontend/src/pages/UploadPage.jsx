import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import UploadForm from '../components/UploadForm';
import { uploadPDF } from '../api';

const UploadPage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleUpload = async (file) => {
    setIsLoading(true);
    setError('');
    setResult(null);
    
    try {
      const response = await uploadPDF(file);
      setResult(response.data);
      
      // Navigate to the new profile after a delay
      setTimeout(() => {
        navigate(`/profile/${response.data.profile._id}`);
      }, 2000);
    } catch (err) {
      console.error('Upload failed:', err);
      setError(err.response?.data?.error || 'Failed to process PDF. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Upload PDF Document
          </h1>
          <p className="text-gray-600">
            Extract person information from PDF files using AI
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8">
          <UploadForm onUpload={handleUpload} isLoading={isLoading} />
          
          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700">{error}</p>
            </div>
          )}
          
          {result && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 font-medium">✓ PDF processed successfully!</p>
              <p className="text-green-700 mt-2">
                Extracted profile: <strong>{result.extractedData.name}</strong>
                {result.merged && <span className="ml-2 text-sm">(Merged with existing profile)</span>}
              </p>
              <p className="text-green-600 text-sm mt-1">Redirecting to profile...</p>
            </div>
          )}
        </div>

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-2">How it works</h3>
          <ul className="text-blue-800 text-sm space-y-1">
            <li>• Upload any PDF document (resumes, reports, profiles)</li>
            <li>• System extracts name, age, and location using regex patterns</li>
            <li>• For complex documents, OpenAI API provides enhanced extraction</li>
            <li>• Automatically merges with existing similar profiles</li>
            <li>• Scanned PDFs use OCR fallback (Tesseract.js)</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default UploadPage;