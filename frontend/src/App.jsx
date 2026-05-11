import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import ProfilePage from './pages/ProfilePage';
import UploadPage from './pages/UploadPage';
import { CaseList, CaseDetail } from './pages/CaseManagement';
import Analytics from './pages/Analytics';
import AddPerson from './pages/AddPerson';
import AllProfiles from './pages/AllProfiles';
import EditProfile from './pages/EditPerson';
import LabelFaces from './pages/LabelFaces';
import StatsDashboard from './pages/StatsDashboard';
import NetworkGraph from './pages/NetworkGraph';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex space-x-8">
                <Link to="/" className="flex items-center text-gray-900 hover:text-blue-600">
                  <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Search
                </Link>
                <Link to="/upload" className="flex items-center text-gray-900 hover:text-blue-600">
                  <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  Upload PDF
                </Link>
                <Link to="/cases" className="flex items-center text-gray-900 hover:text-blue-600">
                  <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Cases
                </Link>
                <Link to="/label-faces" className="flex items-center text-gray-900 hover:text-blue-600">
                  <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Label Faces
                </Link>
              </div>
            </div>
          </div>
        </nav>

        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/profile/:id" element={<ProfilePage />} />
          <Route path="/profiles" element={<AllProfiles />} />
          <Route path="/edit-profile/:id" element={<EditProfile />} />
          <Route path="/add-person" element={<AddPerson />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/cases" element={<CaseList />} />
          <Route path="/cases/:id" element={<CaseDetail />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/label-faces" element={<LabelFaces />} />
          <Route path="/stats-dashboard" element={<StatsDashboard />} />
          <Route path="/network-graph" element={<NetworkGraph />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;