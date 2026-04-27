import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { createProfile } from '../api';

// Fix Leaflet default icon issue for Webpack/Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Debounce helper
const debounce = (fn, delay) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
};

// Map click handler component
function LocationMarker({ setLatLng }) {
  useMapEvents({
    click(e) {
      setLatLng({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

const AddPersonGeo = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    village: '',
    city: '',
    voterId: '',
    instagram: '',
    youtube: '',
    confidence: 85,
    latitude: '',
    longitude: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mapCenter, setMapCenter] = useState([12.9716, 77.5946]); // Bangalore
  const [markerPos, setMarkerPos] = useState(null);
  const [mapKey, setMapKey] = useState(0);

  const searchInputRef = useRef(null);

  // Fetch location suggestions – English only
  const fetchSuggestions = useCallback(async (query) => {
    if (!query || query.length < 3) {
      setSuggestions([]);
      return;
    }
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=5&countrycodes=in&accept-language=en`
      );
      const data = await response.json();
      setSuggestions(data);
      setShowSuggestions(true);
    } catch (err) {
      console.error('Search error:', err);
    }
  }, []);

  const debouncedFetch = useRef(debounce(fetchSuggestions, 500)).current;

  useEffect(() => {
    debouncedFetch(searchQuery);
  }, [searchQuery, debouncedFetch]);

  const handleSuggestionClick = (place) => {
    const lat = parseFloat(place.lat);
    const lon = parseFloat(place.lon);
    setMapCenter([lat, lon]);
    setMarkerPos([lat, lon]);
    setFormData(prev => ({
      ...prev,
      latitude: lat.toFixed(6),
      longitude: lon.toFixed(6),
      village: place.address?.village || place.address?.town || place.address?.city || '',
      city: place.address?.city || place.address?.state_district || '',
    }));
    setSearchQuery(place.display_name);
    setShowSuggestions(false);
    setMapKey(prev => prev + 1);
  };

  const setLatLng = useCallback(({ lat, lng }) => {
    setMarkerPos([lat, lng]);
    setFormData(prev => ({
      ...prev,
      latitude: lat.toFixed(6),
      longitude: lng.toFixed(6),
    }));
    // Reverse geocode – also English only
    fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=en`)
      .then(res => res.json())
      .then(data => {
        if (data.address) {
          setFormData(prev => ({
            ...prev,
            village: data.address.village || data.address.town || data.address.city || '',
            city: data.address.city || data.address.state_district || '',
          }));
        }
      })
      .catch(console.error);
  }, []);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? '' : parseInt(value)) : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.age || !formData.latitude || !formData.longitude) {
      setError('Please fill Name, Age, and select a location on map or enter coordinates');
      return;
    }
    setSubmitting(true);
    setError('');

    const newPerson = {
      name: formData.name,
      age: parseInt(formData.age),
      location: `${formData.village || 'Unknown'}, ${formData.city || 'Unknown'}`,
      voterId: formData.voterId || `MANUAL_${Date.now()}`,
      instagram: formData.instagram,
      youtube: formData.youtube,
      confidence: formData.confidence / 100,
      lat: parseFloat(formData.latitude),
      lng: parseFloat(formData.longitude),
    };

    try {
      // ✅ Save to backend – change URL to your actual endpoint
      await createProfile(newPerson);
      
      // If using a different API approach, you might need to adjust this part
      // const response = await fetch('/api/people', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(newPerson),
      // });
      //
      // if (!response.ok) throw new Error('Server responded with error');
      //
      // const savedPerson = await response.json();
      // console.log('Saved to backend:', savedPerson);
      
      // Redirect to dashboard on success
      navigate('/dashboard', { state: { newPerson: savedPerson } });
    } catch (err) {
      console.error('Save error:', err);
      setError('Failed to save person to database. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <div className="geo-page">
      <div className="grid-bg"></div>
      <div className="orb orb-1"></div>
      <div className="orb orb-2"></div>
      <div className="scanline"></div>

      <div className="geo-container">
        <div className="cyber-card geo-card">
          <h2 className="glitch-title" data-text="🌍 GEOLOCATION REGISTRY">🌍 GEOLOCATION REGISTRY</h2>
          <p className="subtitle">Precision targeting with lat/long – CIA‑grade mapping</p>

          <form onSubmit={handleSubmit} className="geo-form">
            <div className="form-row">
              <div className="form-group">
                <label>Full Name *</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="e.g., Rajesh Kumar" required />
              </div>
              <div className="form-group">
                <label>Age *</label>
                <input type="number" name="age" value={formData.age} onChange={handleChange} placeholder="e.g., 28" min="18" max="120" required />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group full-width">
                <label>🔍 Search Location (Autocomplete)</label>
                <div className="autocomplete-wrapper">
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Type city, village, or address..."
                    className="search-input"
                  />
                  {showSuggestions && suggestions.length > 0 && (
                    <ul className="suggestions-list">
                      {suggestions.map((place, idx) => (
                        <li key={idx} onClick={() => handleSuggestionClick(place)}>
                          {place.display_name}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Latitude *</label>
                <input type="number" step="any" name="latitude" value={formData.latitude} onChange={handleChange} placeholder="e.g., 12.9716" required />
              </div>
              <div className="form-group">
                <label>Longitude *</label>
                <input type="number" step="any" name="longitude" value={formData.longitude} onChange={handleChange} placeholder="e.g., 77.5946" required />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Village</label>
                <input type="text" name="village" value={formData.village} onChange={handleChange} placeholder="Auto‑filled from map" />
              </div>
              <div className="form-group">
                <label>City</label>
                <input type="text" name="city" value={formData.city} onChange={handleChange} placeholder="Auto‑filled from map" />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Voter ID (optional)</label>
                <input type="text" name="voterId" value={formData.voterId} onChange={handleChange} placeholder="e.g., ALQ1234567" />
              </div>
              <div className="form-group">
                <label>Instagram handle</label>
                <input type="text" name="instagram" value={formData.instagram} onChange={handleChange} placeholder="@username" />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>YouTube handle</label>
                <input type="text" name="youtube" value={formData.youtube} onChange={handleChange} placeholder="@channelname" />
              </div>
              <div className="form-group">
                <label>Confidence Score: {formData.confidence}%</label>
                <input type="range" name="confidence" min="0" max="100" value={formData.confidence} onChange={handleChange} className="confidence-slider" />
              </div>
            </div>

            <div className="form-row">
              <div className="map-wrapper">
                <MapContainer key={mapKey} center={mapCenter} zoom={13} style={{ height: '400px', width: '100%', borderRadius: '0.5rem' }}>
                  <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; CartoDB'
                  />
                  {markerPos && <Marker position={markerPos} />}
                  <LocationMarker setLatLng={setLatLng} />
                </MapContainer>
                <p className="map-hint">📍 Click on map to set precise coordinates</p>
              </div>
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="form-actions">
              <button type="button" onClick={() => navigate('/dashboard')} className="cancel-btn">Cancel</button>
              <button type="submit" disabled={submitting} className="submit-btn">{submitting ? 'SAVING...' : 'REGISTER TARGET'}</button>
            </div>
          </form>
        </div>
      </div>

      <style>{`
        /* All styles unchanged – same as your original */
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: #050508; font-family: 'Inter', sans-serif; }
        .geo-page { position: relative; min-height: 100vh; background: linear-gradient(135deg, #050508 0%, #0a0a1a 100%); color: #e0e0e0; overflow-x: hidden; }
        .grid-bg { position: fixed; inset: 0; background-image: linear-gradient(rgba(0,242,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(0,242,255,0.06) 1px, transparent 1px); background-size: 40px 40px; animation: gridMove 20s linear infinite; pointer-events: none; }
        @keyframes gridMove { 0% { transform: translate(0,0); } 100% { transform: translate(40px,40px); } }
        .orb { position: fixed; border-radius: 50%; filter: blur(100px); opacity: 0.2; pointer-events: none; }
        .orb-1 { width: 400px; height: 400px; background: #00f2ff; top: -150px; left: -150px; animation: float 12s infinite; }
        .orb-2 { width: 500px; height: 500px; background: #ff00e6; bottom: -200px; right: -200px; animation: float 15s infinite reverse; }
        @keyframes float { 0%,100% { transform: translate(0,0); } 50% { transform: translate(50px,50px); } }
        .scanline { position: fixed; inset: 0; background: repeating-linear-gradient(0deg, rgba(0,255,255,0.02) 0px, rgba(0,255,255,0.02) 2px, transparent 2px, transparent 8px); pointer-events: none; animation: scanlineMove 8s linear infinite; }
        @keyframes scanlineMove { 0% { transform: translateY(-100%); } 100% { transform: translateY(100%); } }
        .geo-container { position: relative; z-index: 10; display: flex; justify-content: center; align-items: center; min-height: 100vh; padding: 2rem; }
        .cyber-card { background: rgba(12,12,20,0.85); backdrop-filter: blur(12px); border: 1px solid rgba(0,242,255,0.4); border-radius: 1.5rem; padding: 2rem; width: 100%; max-width: 1000px; box-shadow: 0 0 30px rgba(0,242,255,0.2); }
        .glitch-title { font-size: 1.8rem; font-weight: 800; background: linear-gradient(135deg, #00f2ff, #ffffff, #ff00e6); -webkit-background-clip: text; background-clip: text; color: transparent; text-align: center; animation: glitch-skew 3s infinite; position: relative; }
        .glitch-title::before, .glitch-title::after { content: attr(data-text); position: absolute; top: 0; left: 0; width: 100%; height: 100%; }
        .glitch-title::before { color: #00f2ff; z-index: -1; animation: glitch-offset 0.3s infinite; }
        .glitch-title::after { color: #ff00e6; z-index: -2; animation: glitch-offset2 0.3s infinite; }
        @keyframes glitch-skew { 0%,100% { transform: skew(0deg); } 95% { transform: skew(0deg); } 96% { transform: skew(2deg); } 97% { transform: skew(-2deg); } 98% { transform: skew(0deg); } }
        @keyframes glitch-offset { 0%,100% { clip-path: inset(0 0 0 0); transform: translate(0); } 95% { clip-path: inset(0 0 0 0); transform: translate(0); } 96% { clip-path: inset(20% 0 30% 0); transform: translate(-2px); } 97% { clip-path: inset(10% 0 50% 0); transform: translate(2px); } 98% { clip-path: inset(0 0 0 0); transform: translate(0); } }
        @keyframes glitch-offset2 { 0%,100% { clip-path: inset(0 0 0 0); transform: translate(0); } 95% { clip-path: inset(0 0 0 0); transform: translate(0); } 96% { clip-path: inset(50% 0 20% 0); transform: translate(2px); } 97% { clip-path: inset(30% 0 10% 0); transform: translate(-2px); } 98% { clip-path: inset(0 0 0 0); transform: translate(0); } }
        .subtitle { text-align: center; color: #9ca3af; font-family: monospace; margin-bottom: 2rem; }
        .geo-form { display: flex; flex-direction: column; gap: 1.5rem; }
        .form-row { display: flex; gap: 1rem; flex-wrap: wrap; }
        .form-group { flex: 1; min-width: 180px; }
        .full-width { flex: 1 1 100%; }
        .form-group label { display: block; font-size: 0.8rem; font-family: monospace; color: #00f2ff; margin-bottom: 0.3rem; letter-spacing: 1px; }
        .form-group input, .form-group select { width: 100%; padding: 0.6rem 0.8rem; background: rgba(0,0,0,0.6); border: 1px solid rgba(0,242,255,0.3); border-radius: 0.5rem; color: #e0e0e0; font-family: monospace; transition: 0.2s; }
        .form-group input:focus, .form-group select:focus { outline: none; border-color: #00f2ff; box-shadow: 0 0 8px rgba(0,242,255,0.4); }
        .autocomplete-wrapper { position: relative; }
        .suggestions-list { position: absolute; top: 100%; left: 0; right: 0; background: #0a0a1a; border: 1px solid #00f2ff; border-radius: 0.5rem; max-height: 200px; overflow-y: auto; z-index: 1000; list-style: none; padding: 0; margin: 0; }
        .suggestions-list li { padding: 0.6rem 0.8rem; cursor: pointer; border-bottom: 1px solid rgba(0,242,255,0.2); font-size: 0.8rem; }
        .suggestions-list li:hover { background: rgba(0,242,255,0.2); }
        .map-wrapper { width: 100%; margin-top: 0.5rem; }
        .map-hint { font-size: 0.7rem; color: #6b7280; margin-top: 0.3rem; text-align: center; font-family: monospace; }
        .error-message { background: rgba(255,0,0,0.2); border-left: 3px solid #ff4d4d; padding: 0.5rem; border-radius: 0.3rem; color: #ff4d4d; font-size: 0.8rem; text-align: center; }
        .form-actions { display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1rem; }
        .cancel-btn, .submit-btn { padding: 0.6rem 1.5rem; border-radius: 0.5rem; font-family: monospace; font-weight: bold; cursor: pointer; transition: 0.2s; }
        .cancel-btn { background: transparent; border: 1px solid rgba(255,77,77,0.5); color: #ff4d4d; }
        .cancel-btn:hover { background: rgba(255,77,77,0.2); box-shadow: 0 0 5px #ff4d4d; }
        .submit-btn { background: linear-gradient(135deg, rgba(0,242,255,0.2), rgba(255,0,230,0.2)); border: 1px solid rgba(0,242,255,0.5); color: #00f2ff; }
        .submit-btn:hover:not(:disabled) { background: rgba(0,242,255,0.3); box-shadow: 0 0 10px #00f2ff; }
        .submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .confidence-slider { cursor: pointer; }
        @media (max-width: 768px) { .cyber-card { padding: 1.5rem; } .form-row { flex-direction: column; gap: 1rem; } .map-wrapper { height: 300px; } }
      `}</style>
    </div>
  );
};

export default AddPersonGeo;