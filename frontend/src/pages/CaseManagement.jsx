import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCases, getCase, createCase, addNoteToCase } from '../api';

const CaseList = () => {
  const navigate = useNavigate();
  const [cases, setCases] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCaseTitle, setNewCaseTitle] = useState('');
  const [newCaseDesc, setNewCaseDesc] = useState('');

  useEffect(() => {
    fetchCases();
  }, []);

  const fetchCases = async () => {
    try {
      const response = await getCases();
      setCases(response.data);
    } catch (error) {
      console.error('Failed to fetch cases:', error);
    }
  };

  const handleCreateCase = async () => {
    if (!newCaseTitle.trim()) return;
    try {
      await createCase({ title: newCaseTitle, description: newCaseDesc });
      setShowCreateModal(false);
      setNewCaseTitle('');
      setNewCaseDesc('');
      fetchCases();
    } catch (error) {
      console.error('Failed to create case:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Investigation Cases</h1>
            <p className="text-gray-600 mt-1">Manage and organize your investigations</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            + New Case
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cases.map((case_) => (
            <div
              key={case_._id}
              onClick={() => navigate(`/cases/${case_._id}`)}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{case_.title}</h3>
              {case_.description && (
                <p className="text-gray-600 text-sm mb-3">{case_.description}</p>
              )}
              <div className="flex justify-between text-sm text-gray-500">
                <span>{case_.profiles?.length || 0} profiles</span>
                <span>{case_.notes?.length || 0} notes</span>
              </div>
              {case_.tags && case_.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {case_.tags.slice(0, 3).map((tag, idx) => (
                    <span key={idx} className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h2 className="text-xl font-bold mb-4">Create New Case</h2>
              <input
                type="text"
                placeholder="Case Title"
                value={newCaseTitle}
                onChange={(e) => setNewCaseTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-3 focus:outline-none focus:border-blue-500"
              />
              <textarea
                placeholder="Description (optional)"
                value={newCaseDesc}
                onChange={(e) => setNewCaseDesc(e.target.value)}
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:border-blue-500"
              />
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateCase}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const CaseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [case_, setCase] = useState(null);
  const [newNote, setNewNote] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCase();
  }, [id]);

  const fetchCase = async () => {
    try {
      const response = await getCase(id);
      setCase(response.data);
    } catch (error) {
      console.error('Failed to fetch case:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    try {
      await addNoteToCase(id, newNote, []);
      setNewNote('');
      fetchCase();
    } catch (error) {
      console.error('Failed to add note:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!case_) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Case not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => navigate('/cases')}
          className="mb-6 text-blue-600 hover:text-blue-800 flex items-center"
        >
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Cases
        </button>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">{case_.title}</h1>
            {case_.description && (
              <p className="text-gray-600 mt-2">{case_.description}</p>
            )}
          </div>

          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Associated Profiles</h2>
            <div className="space-y-3">
              {case_.profiles?.map((item) => (
                <div
                  key={item.profileId._id}
                  onClick={() => navigate(`/profile/${item.profileId._id}`)}
                  className="flex justify-between items-center p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
                >
                  <div>
                    <p className="font-medium text-gray-900">{item.profileId.name}</p>
                    {item.profileId.location && (
                      <p className="text-sm text-gray-500">{item.profileId.location}</p>
                    )}
                  </div>
                  <span className="text-xs text-gray-400">
                    Added {new Date(item.addedAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
              {(!case_.profiles || case_.profiles.length === 0) && (
                <p className="text-gray-500 text-sm">No profiles added to this case yet.</p>
              )}
            </div>
          </div>

          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Investigation Notes</h2>
            <div className="space-y-4 mb-6">
              {case_.notes?.map((note, idx) => (
                <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-gray-700">{note.text}</p>
                  <div className="flex justify-between items-center mt-2">
                    <div className="flex gap-2">
                      {note.tags?.map((tag, tagIdx) => (
                        <span key={tagIdx} className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(note.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
              {(!case_.notes || case_.notes.length === 0) && (
                <p className="text-gray-500 text-sm">No notes yet. Add your first note below.</p>
              )}
            </div>

            <div className="mt-4">
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Add a note to this case..."
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={handleAddNote}
                disabled={!newNote.trim()}
                className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Note
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export { CaseList, CaseDetail };