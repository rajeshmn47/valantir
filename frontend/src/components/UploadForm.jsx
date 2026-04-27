import React, { useState } from 'react';

const UploadForm = ({ onUpload, isLoading }) => {
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setError('');
    } else {
      setFile(null);
      setError('Please select a valid PDF file');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (file) {
      onUpload(file);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md">
      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2">
          Upload PDF Document
        </label>
        <div className="relative">
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            disabled={isLoading}
          />
        </div>
        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        <p className="text-gray-500 text-xs mt-2">
          Upload PDFs containing person information. The system will extract name, age, and location automatically.
        </p>
      </div>
      
      <button
        type="submit"
        disabled={!file || isLoading}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? 'Processing PDF...' : 'Upload and Extract'}
      </button>
    </form>
  );
};

export default UploadForm;