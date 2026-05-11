import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

const LabelFaces = () => {
  const [sources, setSources] = useState([]);
  const [selectedSource, setSelectedSource] = useState('');
  const [groups, setGroups] = useState([]);
  const [labels, setLabels] = useState({});
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const [annotating, setAnnotating] = useState(false);
  const [annotationStatus, setAnnotationStatus] = useState('');
  const [annotatedImages, setAnnotatedImages] = useState([]);
  const [showGallery, setShowGallery] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [newSourceName, setNewSourceName] = useState('');
  const [creating, setCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Per-group autocomplete suggestions
  const [suggestionsMap, setSuggestionsMap] = useState({});
  const [typingTimeouts, setTypingTimeouts] = useState({});

  // Cluster images modal state
  const [clusterModalOpen, setClusterModalOpen] = useState(false);
  const [selectedCluster, setSelectedCluster] = useState(null);
  const [clusterPhotos, setClusterPhotos] = useState([]);
  const [loadingClusterImages, setLoadingClusterImages] = useState(false);
  const [enlargedImage, setEnlargedImage] = useState(null);

  // Fetch sources
  const fetchSources = async () => {
    try {
      const res = await axios.get(`${API_BASE}/sources`);
      setSources(res.data);
      if (res.data.length > 0 && !selectedSource) setSelectedSource(res.data[0]);
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch groups and labels
  const fetchData = async (source) => {
    setLoading(true);
    try {
      const [groupsRes, labelsRes] = await Promise.all([
        axios.get(`${API_BASE}/face-groups?source=${source}`),
        axios.get(`${API_BASE}/face-labels?source=${source}`)
      ]);
      setGroups(groupsRes.data);
      setLabels(labelsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSources();
  }, []);

  useEffect(() => {
    if (selectedSource) {
      fetchData(selectedSource);
      checkProcessingStatus(selectedSource);
      checkAnnotationStatus(selectedSource);
      fetchAnnotatedImages(selectedSource);
    }
  }, [selectedSource]);

  const checkProcessingStatus = async (source) => {
    try {
      const res = await axios.get(`${API_BASE}/process-status?source=${source}`);
      if (res.data.status === 'processing') {
        setProcessing(true);
        setProcessingStatus('Processing...');
        setTimeout(() => checkProcessingStatus(source), 5000);
      } else if (res.data.status === 'completed') {
        setProcessing(false);
        setProcessingStatus('Ready');
        fetchData(source);
      } else if (res.data.status === 'error') {
        setProcessing(false);
        setProcessingStatus('Error');
      } else {
        setProcessing(false);
        setProcessingStatus('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const checkAnnotationStatus = async (source) => {
    try {
      const res = await axios.get(`${API_BASE}/annotation-status?source=${source}`);
      if (res.data.status === 'processing') {
        setAnnotating(true);
        setAnnotationStatus('Annotating...');
        setTimeout(() => checkAnnotationStatus(source), 5000);
      } else if (res.data.status === 'completed') {
        setAnnotating(false);
        setAnnotationStatus('Ready');
        fetchAnnotatedImages(source);
      } else if (res.data.status === 'error') {
        setAnnotating(false);
        setAnnotationStatus('Error');
      } else {
        setAnnotating(false);
        setAnnotationStatus('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAnnotatedImages = async (source) => {
    try {
      const res = await axios.get(`${API_BASE}/annotated-images?source=${source}`);
      setAnnotatedImages(res.data.images || []);
    } catch (err) {
      console.error('Failed to fetch annotated images:', err);
    }
  };

  const handleProcessSource = async () => {
    if (!selectedSource) return;
    setProcessing(true);
    setProcessingStatus('Starting...');
    try {
      await axios.post(`${API_BASE}/process-source`, { username: selectedSource });
      setProcessingStatus('Processing started. This may take a few minutes.');
      setTimeout(() => checkProcessingStatus(selectedSource), 2000);
    } catch (err) {
      console.error(err);
      alert('Failed to start processing: ' + (err.response?.data?.error || err.message));
      setProcessing(false);
      setProcessingStatus('');
    }
  };

  const handleAnnotate = async () => {
    if (!selectedSource) return;
    setAnnotating(true);
    setAnnotationStatus('Starting...');
    try {
      await axios.post(`${API_BASE}/annotate-source`, { username: selectedSource });
      setAnnotationStatus('Annotation started. This may take a few minutes.');
      setTimeout(() => checkAnnotationStatus(selectedSource), 2000);
    } catch (err) {
      console.error(err);
      alert('Failed to start annotation: ' + (err.response?.data?.error || err.message));
      setAnnotating(false);
      setAnnotationStatus('');
    }
  };

  const handleAutoLabel = async () => {
    if (!selectedSource) return;
    setProcessing(true);
    try {
      const res = await axios.post(`${API_BASE}/auto-label`, { source: selectedSource });
      alert(res.data.message);
      fetchData(selectedSource);
    } catch (err) {
      alert('Auto‑label failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setProcessing(false);
    }
  };

  // Fetch images for a specific cluster
  const fetchClusterImages = async (cluster) => {
    setLoadingClusterImages(true);
    setSelectedCluster(cluster);
    try {
      const res = await axios.get(`${API_BASE}/cluster-images`, {
        params: { source: selectedSource, clusterId: cluster.id }
      });
      setClusterPhotos(res.data.photos || []);
      setClusterModalOpen(true);
    } catch (err) {
      console.error('Failed to fetch cluster images:', err);
      alert('Could not load images for this person');
    } finally {
      setLoadingClusterImages(false);
    }
  };

  // Update label and fetch suggestions (debounced)
  const updateLabel = async (groupId, newValue) => {
    const updatedLabels = { ...labels, [groupId]: { label: newValue, lastUpdated: new Date().toISOString() } };
    setLabels(updatedLabels);

    if (typingTimeouts[groupId]) clearTimeout(typingTimeouts[groupId]);

    const timeoutId = setTimeout(async () => {
      if (newValue.length >= 2) {
        try {
          const res = await axios.get(`${API_BASE}/autocomplete/labels`, {
            params: { source: selectedSource, q: newValue }
          });
          setSuggestionsMap(prev => ({ ...prev, [groupId]: res.data }));
        } catch (err) {
          console.error('Autocomplete error:', err);
          setSuggestionsMap(prev => ({ ...prev, [groupId]: [] }));
        }
      } else {
        setSuggestionsMap(prev => ({ ...prev, [groupId]: [] }));
      }
    }, 300);
    setTypingTimeouts(prev => ({ ...prev, [groupId]: timeoutId }));

    try {
      await axios.post(`${API_BASE}/face-labels?source=${selectedSource}`, updatedLabels);
    } catch (err) {
      console.error('Save label error:', err);
    }
  };

  const handleCreateSource = async () => {
    if (!newSourceName.trim()) return;
    setCreating(true);
    try {
      await axios.post(`${API_BASE}/sources`, { username: newSourceName });
      await fetchSources();
      setShowModal(false);
      setNewSourceName('');
      setSelectedSource(newSourceName);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Failed to create source');
    } finally {
      setCreating(false);
    }
  };

  const openAnnotatedFolder = () => {
    window.open(`file:///D:/instagramscraping/annotated/${selectedSource}`, '_blank');
  };

  // Filter groups by search term
  const filteredGroups = groups.filter(group => {
    const label = labels[group.id]?.label || '';
    if (!searchTerm) return true;
    return label.toLowerCase().includes(searchTerm.toLowerCase()) ||
           group.id.toLowerCase().includes(searchTerm.toLowerCase());
  });

  if (loading && !groups.length) return <div style={{ color: 'white', padding: '1.5rem' }}>Loading face groups...</div>;

  return (
    <div style={{ padding: '1.5rem', backgroundColor: '#111', color: 'white', minHeight: '100vh' }}>
      {/* Toolbar */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <label htmlFor="sourceSelect">Instagram Account: </label>
        <select
          id="sourceSelect"
          value={selectedSource}
          onChange={(e) => setSelectedSource(e.target.value)}
          style={{ padding: '0.3rem 0.8rem', borderRadius: '0.375rem', backgroundColor: '#374151', color: 'white', border: 'none' }}
        >
          {sources.map(src => (
            <option key={src} value={src}>{src}</option>
          ))}
        </select>
        
        <input
          type="text"
          placeholder="🔍 Search by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ padding: '0.3rem 0.8rem', borderRadius: '0.375rem', backgroundColor: '#374151', color: 'white', border: 'none', width: '200px' }}
        />
        
        <button
          onClick={() => setShowModal(true)}
          style={{ padding: '0.3rem 1rem', backgroundColor: '#4CAF50', border: 'none', borderRadius: '0.375rem', cursor: 'pointer' }}
        >
          ➕ New Source
        </button>
        <button
          onClick={handleProcessSource}
          disabled={processing}
          style={{ padding: '0.3rem 1rem', backgroundColor: processing ? '#6b7280' : '#ff9800', border: 'none', borderRadius: '0.375rem', cursor: processing ? 'not-allowed' : 'pointer' }}
        >
          {processing ? 'Processing...' : '🔄 Process Source'}
        </button>
        {processingStatus && <span style={{ color: '#ff9800' }}>{processingStatus}</span>}

        <button
          onClick={handleAnnotate}
          disabled={annotating}
          style={{ padding: '0.3rem 1rem', backgroundColor: annotating ? '#6b7280' : '#2196F3', border: 'none', borderRadius: '0.375rem', cursor: annotating ? 'not-allowed' : 'pointer' }}
        >
          {annotating ? 'Annotating...' : '🏷️ Annotate Photos'}
        </button>
        {annotationStatus && <span style={{ color: '#2196F3' }}>{annotationStatus}</span>}

        <button
          onClick={handleAutoLabel}
          disabled={processing}
          style={{ padding: '0.3rem 1rem', backgroundColor: '#10b981', border: 'none', borderRadius: '0.375rem', cursor: 'pointer' }}
        >
          🏷️ Auto‑Label
        </button>

        <button
          onClick={() => setShowGallery(true)}
          disabled={annotatedImages.length === 0}
          style={{ padding: '0.3rem 1rem', backgroundColor: annotatedImages.length ? '#9c27b0' : '#6b7280', border: 'none', borderRadius: '0.375rem', cursor: annotatedImages.length ? 'pointer' : 'not-allowed' }}
        >
          📷 View Annotated ({annotatedImages.length})
        </button>

        <button
          onClick={openAnnotatedFolder}
          disabled={annotatedImages.length === 0}
          style={{ padding: '0.3rem 1rem', backgroundColor: annotatedImages.length ? '#607d8b' : '#6b7280', border: 'none', borderRadius: '0.375rem', cursor: annotatedImages.length ? 'pointer' : 'not-allowed' }}
        >
          📂 Open Folder
        </button>
      </div>

      <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>🏷️ Label Face Groups</h1>
      <p style={{ color: '#9ca3af', marginBottom: '1rem' }}>💡 Click any face card to see all photos of that person</p>

      {/* Face groups grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.5rem' }}>
        {filteredGroups.map((group) => {
          const currentLabel = labels[group.id]?.label || '';
          const datalistId = `suggestions-${group.id}`;
          const suggestionsForGroup = suggestionsMap[group.id] || [];
          return (
            <div 
              key={group.id} 
              style={{ 
                backgroundColor: '#1f2937', 
                borderRadius: '0.5rem', 
                padding: '1rem', 
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s'
              }}
              onClick={() => fetchClusterImages(group)}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <img
                  src={group.img}
                  onError={(e) => { e.target.src = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22128%22 height=%22128%22 viewBox=%220 0 128 128%22%3E%3Crect width=%22128%22 height=%22128%22 fill=%22%23374151%22/%3E%3Ctext x=%2264%22 y=%2264%22 text-anchor=%22middle%22 dominant-baseline=%22middle%22 fill=%22%239ca3af%22%3E?%3C/text%3E%3C/svg%3E'; }}
                  style={{ width: '128px', height: '128px', objectFit: 'cover', borderRadius: '9999px', border: '2px solid #4b5563' }}
                />
              </div>
              <p style={{ textAlign: 'center', color: '#9ca3af', marginTop: '0.5rem', fontSize: '0.875rem' }}>{group.size} faces</p>
              <input
                type="text"
                list={datalistId}
                style={{
                  marginTop: '0.75rem',
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  backgroundColor: '#374151',
                  border: '1px solid #4b5563',
                  borderRadius: '0.375rem',
                  color: 'white',
                  fontSize: '0.875rem',
                  outline: 'none',
                }}
                placeholder="Person name"
                value={currentLabel}
                onChange={(e) => {
                  e.stopPropagation();
                  updateLabel(group.id, e.target.value);
                }}
                onClick={(e) => e.stopPropagation()}
              />
              <datalist id={datalistId}>
                {suggestionsForGroup.map(name => (
                  <option key={name} value={name} />
                ))}
              </datalist>
              {currentLabel && (
                <p style={{ fontSize: '0.75rem', color: '#4ade80', textAlign: 'center', marginTop: '0.25rem' }}>✓ Saved: {currentLabel}</p>
              )}
            </div>
          );
        })}
      </div>

      {filteredGroups.length === 0 && groups.length > 0 && (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>
          No matching faces found for "{searchTerm}"
        </div>
      )}

      {/* Cluster Images Modal */}
      {clusterModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.95)',
          zIndex: 3000,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            padding: '1rem 1.5rem',
            backgroundColor: '#1f2937',
            borderBottom: '1px solid #374151'
          }}>
            <div>
              <h2 style={{ margin: 0 }}>
                {selectedCluster?.label || selectedCluster?.id}
              </h2>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: '#9ca3af' }}>
                {clusterPhotos.length} photos • {selectedCluster?.size} face detections
              </p>
            </div>
            <button 
              onClick={() => setClusterModalOpen(false)}
              style={{ 
                background: 'none', 
                border: 'none', 
                color: 'white', 
                fontSize: '1.5rem', 
                cursor: 'pointer',
                padding: '0.5rem'
              }}
            >
              ✖
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
            {loadingClusterImages ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>Loading images...</div>
            ) : clusterPhotos.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>
                No photos found for this person.
                {selectedCluster?.label && <div>Make sure annotation pipeline has been run.</div>}
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                {clusterPhotos.map((photo, idx) => (
                  <div 
                    key={idx} 
                    style={{ 
                      backgroundColor: '#1f2937', 
                      borderRadius: '0.5rem', 
                      overflow: 'hidden',
                      cursor: 'pointer',
                      transition: 'transform 0.2s'
                    }}
                    onClick={() => setEnlargedImage(photo)}
                  >
                    <img 
                      src={`http://localhost:5000${photo.imageUrl || photo.originalUrl}`}
                      alt={`Photo ${idx + 1}`}
                      style={{ 
                        width: '100%', 
                        height: 'auto', 
                        display: 'block',
                        borderBottom: '1px solid #374151'
                      }}
                    />
                    <div style={{ padding: '0.5rem', fontSize: '0.75rem', color: '#9ca3af' }}>
                      {photo.date && <span>📅 {photo.date} </span>}
                      {photo.hour !== null && <span>🕐 {photo.hour}:00 </span>}
                      <span>👤 {photo.faceCount} faces</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Enlarged Image Modal */}
      {enlargedImage && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.98)',
          zIndex: 4000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column'
        }} onClick={() => setEnlargedImage(null)}>
          <button 
            onClick={() => setEnlargedImage(null)}
            style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              background: 'none',
              border: 'none',
              color: 'white',
              fontSize: '2rem',
              cursor: 'pointer'
            }}
          >
            ✖
          </button>
          <img 
            src={`http://localhost:5000${enlargedImage.annotatedUrl || enlargedImage.originalUrl}`}
            alt="Enlarged"
            style={{ 
              maxWidth: '90%', 
              maxHeight: '90%', 
              objectFit: 'contain',
              borderRadius: '8px'
            }}
            onClick={(e) => e.stopPropagation()}
          />
          <div style={{ 
            position: 'absolute', 
            bottom: '1rem', 
            backgroundColor: 'rgba(0,0,0,0.7)', 
            padding: '0.5rem 1rem',
            borderRadius: '0.5rem',
            fontSize: '0.8rem'
          }}>
            {enlargedImage.date && <>📅 {enlargedImage.date} </>}
            {enlargedImage.hour !== null && <>🕐 {enlargedImage.hour}:00 </>}
            👤 {enlargedImage.faceCount} faces
          </div>
        </div>
      )}

      {/* Create Source Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{ backgroundColor: '#1f2937', padding: '2rem', borderRadius: '0.5rem', minWidth: '300px' }}>
            <h3>Create New Instagram Source</h3>
            <input
              type="text"
              placeholder="Instagram username"
              value={newSourceName}
              onChange={(e) => setNewSourceName(e.target.value)}
              style={{ width: '100%', marginTop: '1rem', padding: '0.5rem', borderRadius: '0.375rem', border: 'none' }}
            />
            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowModal(false)} style={{ padding: '0.3rem 1rem', backgroundColor: '#6b7280', border: 'none', borderRadius: '0.375rem', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleCreateSource} disabled={creating} style={{ padding: '0.3rem 1rem', backgroundColor: '#4CAF50', border: 'none', borderRadius: '0.375rem', cursor: 'pointer' }}>
                {creating ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Annotated Gallery Modal */}
      {showGallery && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.9)',
          display: 'flex', flexDirection: 'column',
          zIndex: 2000,
          overflowY: 'auto'
        }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '1rem' }}>
            <button onClick={() => setShowGallery(false)} style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer' }}>✖</button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center', padding: '1rem' }}>
            {annotatedImages.map((img, idx) => (
              <div key={idx} style={{ width: '300px', backgroundColor: '#1f2937', borderRadius: '0.5rem', overflow: 'hidden' }}>
                <img src={`http://localhost:5000${img}`} alt={`Annotated ${idx}`} style={{ width: '100%', height: 'auto' }} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LabelFaces;