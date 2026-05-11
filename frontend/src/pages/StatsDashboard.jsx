import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

const StatsDashboard = () => {
  const [sources, setSources] = useState([]);
  const [selectedSource, setSelectedSource] = useState('');
  const [startHour, setStartHour] = useState(0);
  const [endHour, setEndHour] = useState(23);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Gallery modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalImages, setModalImages] = useState([]);
  const [modalTitle, setModalTitle] = useState('');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Fetch sources
  useEffect(() => {
    const fetchSources = async () => {
      try {
        const res = await axios.get(`${API_BASE}/sources`);
        setSources(res.data || []);
        if (res.data?.length) setSelectedSource(res.data[0]);
      } catch (err) { console.error(err); }
    };
    fetchSources();
  }, []);

  // Fetch stats
  useEffect(() => {
    if (!selectedSource) return;
    const fetchStats = async () => {
      setLoading(true);
      try {
        const params = { source: selectedSource, startHour, endHour };
        const res = await axios.get(`${API_BASE}/stats`, { params });
        setStats(res.data);
      } catch (err) { console.error(err); setStats(null); }
      finally { setLoading(false); }
    };
    fetchStats();
  }, [selectedSource, startHour, endHour]);

  // Fetch images for a specific year and hour
  const fetchImagesForRow = async (year, hour) => {
    try {
      const res = await axios.get(`${API_BASE}/photos-by-hour`, {
        params: { source: selectedSource, year, hour }
      });
      const images = res.data.images || [];
      setModalImages(images);
      setModalTitle(`Photos for ${year} – hour ${hour}:00 to ${hour+1}:00`);
      setCurrentImageIndex(0);
      setModalOpen(true);
    } catch (err) {
      console.error(err);
      alert('Could not load images for this row');
    }
  };

  if (loading) return <div style={{ color: 'white', padding: '1rem' }}>Loading stats...</div>;
  if (!stats) return <div style={{ color: 'white', padding: '1rem' }}>No stats available</div>;

  const yearlyData = stats.yearlyHourlyBreakdown || [];

  return (
    <div style={{ padding: '1.5rem', backgroundColor: '#111', color: 'white', minHeight: '100vh' }}>
      <h1>📊 Activity Statistics by Year & Hour</h1>

      {/* Filters (same as before) */}
      <div style={{ marginBottom: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <label>Account:</label>
        <select value={selectedSource} onChange={e => setSelectedSource(e.target.value)} style={{ backgroundColor: '#1f2937', color: 'white', padding: '0.25rem 0.5rem', borderRadius: '4px', border: '1px solid #4b5563' }}>
          {sources.map(src => <option key={src} value={src}>{src}</option>)}
        </select>
        <label>Hour range:</label>
        <input type="number" min="0" max="23" value={startHour} onChange={e => setStartHour(parseInt(e.target.value) || 0)} style={{ width: '70px', backgroundColor: '#1f2937', color: 'white', padding: '0.25rem', borderRadius: '4px', border: '1px solid #4b5563', textAlign: 'center' }} />
        <span>–</span>
        <input type="number" min="0" max="23" value={endHour} onChange={e => setEndHour(parseInt(e.target.value) || 23)} style={{ width: '70px', backgroundColor: '#1f2937', color: 'white', padding: '0.25rem', borderRadius: '4px', border: '1px solid #4b5563', textAlign: 'center' }} />
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
        <div><strong>Total Images in Folder:</strong> {stats.totalImagesInFolder ?? 0}</div>
        <div><strong>Photos with Faces:</strong> {stats.totalPhotosWithFaces ?? 0}</div>
        <div><strong>Total Faces Detected:</strong> {stats.totalFaces ?? 0}</div>
        <div><strong>Unknown Faces:</strong> {stats.unknownFaces ?? 0}</div>
        <div><strong>Unique Persons:</strong> {stats.uniquePersons ?? 0}</div>
      </div>

      {/* Yearly & Hourly Table with Image Buttons */}
      <h2>Yearly & Hourly Breakdown</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#1f2937' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #4b5563' }}>
            <th>Year</th><th>Hour</th><th>Photos</th><th>Total Faces</th><th>Known</th><th>Unknown</th><th>Unique Persons</th><th>Action</th>
          </tr>
        </thead>
        <tbody>
          {yearlyData.map(item => (
            <tr key={`${item.year}-${item.hour}`} style={{ borderBottom: '1px solid #374151' }}>
              <td style={{ padding: '0.5rem' }}>{item.year}</td>
              <td>{item.hour}:00 – {(item.hour+1)%24}:00</td>
              <td>{item.photos}</td>
              <td>{item.totalFaces}</td>
              <td>{item.knownFaces}</td>
              <td>{item.unknownFaces}</td>
              <td>{item.uniquePersons}</td>
              <td>
                {item.photos > 0 && (
                  <button onClick={() => fetchImagesForRow(item.year, item.hour)} style={{ backgroundColor: '#3b82f6', border: 'none', color: 'white', padding: '0.25rem 0.75rem', borderRadius: '4px', cursor: 'pointer' }}>
                    Show Images
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Modal for displaying images */}
      {modalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }} onClick={() => setModalOpen(false)}>
          <div style={{ backgroundColor: '#1f2937', padding: '1rem', borderRadius: '8px', maxWidth: '90vw', maxHeight: '90vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginTop: 0 }}>{modalTitle}</h3>
            {modalImages.length === 0 && <p>No annotated images for this hour. Run annotation pipeline first.</p>}
            {modalImages.length > 0 && (
              <>
                <img src={`http://localhost:5000${modalImages[currentImageIndex]}`} alt="selected" style={{ maxWidth: '100%', maxHeight: '60vh', objectFit: 'contain' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem' }}>
                  <button onClick={() => setCurrentImageIndex(prev => (prev - 1 + modalImages.length) % modalImages.length)} style={{ backgroundColor: '#3b82f6', border: 'none', color: 'white', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer' }}>Previous</button>
                  <span>{currentImageIndex+1} / {modalImages.length}</span>
                  <button onClick={() => setCurrentImageIndex(prev => (prev + 1) % modalImages.length)} style={{ backgroundColor: '#3b82f6', border: 'none', color: 'white', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer' }}>Next</button>
                </div>
              </>
            )}
            <button onClick={() => setModalOpen(false)} style={{ marginTop: '1rem', backgroundColor: '#ef4444', border: 'none', color: 'white', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer' }}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StatsDashboard;