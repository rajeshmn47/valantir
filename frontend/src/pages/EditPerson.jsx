import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getProfile, updateProfile, searchProfiles } from '../api';

// Fix Leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const debounce = (fn, delay) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
};

function LocationMarker({ setLatLng }) {
  useMapEvents({
    click(e) {
      setLatLng({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

const EditProfileGeo = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [advancedOpen, setAdvancedOpen] = useState(false);

  // Basic form data (unchanged)
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
    avatar: '',            // <-- ADDED
    // New fields
    phone: '',
    email: '',
    street: '',
    locality: '',
    pincode: '',
    constituency: '',
    ward: '',
    boothId: '',
    work: '',
    skills: '',
    incomeBracket: '',
    educationLevel: '',
    homeOwnership: '',
    vehicles: [],
    partyAffiliation: '',
    turnoutLikelihood: 0.5,
    swingVoter: false,
    influencerScore: 0.5,
    hasSmartphone: false,
    primaryPlatform: '',
    householdId: '',
    verificationStatus: 'unverified',
    dataSources: [],
    tags: '',
    notes: '',
    lastContacted: '',
    consentGiven: false,
    optOut: false,
  });

  // Voting history as an array of objects
  const [votingHistory, setVotingHistory] = useState([]);
  const [newVotingEntry, setNewVotingEntry] = useState({
    electionDate: '',
    electionType: 'general',
    partyVotedFor: '',
    boothId: '',
    verified: false
  });

  // Family members – each includes relativeName for display
  const [familyMembers, setFamilyMembers] = useState([]);
  const [relativeSearch, setRelativeSearch] = useState('');
  const [relativeSuggestions, setRelativeSuggestions] = useState([]);
  const [showRelativeSuggestions, setShowRelativeSuggestions] = useState(false);
  const [newRelative, setNewRelative] = useState({
    relativeId: '',
    relativeName: '',    // store name for display
    relationType: 'other',
    confidence: 1.0,
    notes: ''
  });
  const [uploadingImage, setUploadingImage] = useState(false);

  // Location search
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mapCenter, setMapCenter] = useState([12.9716, 77.5946]);
  const [markerPos, setMarkerPos] = useState(null);
  const [mapKey, setMapKey] = useState(0);
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

  // Fetch location suggestions
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
      console.error(err);
    }
  }, []);

  const debouncedFetch = useRef(debounce(fetchSuggestions, 500)).current;
  useEffect(() => {
    debouncedFetch(searchQuery);
  }, [searchQuery, debouncedFetch]);

  // Debounced search for relatives
  const fetchRelativeSuggestions = useCallback(async (query) => {
    if (!query || query.length < 2) {
      setRelativeSuggestions([]);
      return;
    }
    try {
      const response = await searchProfiles(query);
      const results = response.data;
      // Exclude current profile
      const filtered = results.filter(p => p._id !== id);
      setRelativeSuggestions(filtered);
      setShowRelativeSuggestions(true);
    } catch (err) {
      console.error(err);
    }
  }, [id]);

  const debouncedRelativeSearch = useRef(debounce(fetchRelativeSuggestions, 400)).current;
  useEffect(() => {
    debouncedRelativeSearch(relativeSearch);
  }, [relativeSearch, debouncedRelativeSearch]);

  // Load full profile data
  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        const response = await getProfile(id);
        const profile = response.data?.profile || response.data;

        // Social links
        let socialLinks = profile.socialLinks || {};
        if (socialLinks instanceof Map) socialLinks = Object.fromEntries(socialLinks);

        // Split location
        let village = '', city = '';
        if (profile.location) {
          const parts = profile.location.split(',').map(s => s.trim());
          village = parts[0] || '';
          city = parts[1] || '';
        }

        // Basic fields
        setFormData({
          name: profile.name || '',
          age: profile.age || '',
          village,
          city,
          voterId: profile.sourceMetadata?.sourceId || profile.voterId || '',
          instagram: socialLinks.instagram || '',
          youtube: socialLinks.youtube || '',
          confidence: (profile.confidenceScore ?? 0.85) * 100,
          latitude: String(profile.latitude ?? profile.lat ?? ''),
          longitude: String(profile.longitude ?? profile.lng ?? ''),
          phone: profile.phone || '',
          email: profile.email || '',
          street: profile.address?.street || '',
          locality: profile.address?.locality || '',
          pincode: profile.address?.pincode || '',
          constituency: profile.address?.constituency || '',
          ward: profile.address?.ward || '',
          boothId: profile.address?.boothId || '',
          work: profile.work || '',
          skills: profile.skills?.join(', ') || '',
          incomeBracket: profile.incomeBracket || '',
          educationLevel: profile.educationLevel || '',
          homeOwnership: profile.homeOwnership || '',
          vehicles: profile.vehicles || [],
          partyAffiliation: profile.partyAffiliation || '',
          turnoutLikelihood: profile.turnoutLikelihood ?? 0.5,
          swingVoter: profile.swingVoter ?? false,
          influencerScore: profile.influencerScore ?? 0.5,
          hasSmartphone: profile.hasSmartphone ?? false,
          primaryPlatform: profile.primaryPlatform || '',
          householdId: profile.householdId || '',
          verificationStatus: profile.verificationStatus || 'unverified',
          dataSources: profile.dataSources || [],
          tags: profile.tags?.join(', ') || '',
          notes: profile.notes || '',
          lastContacted: profile.lastContacted ? profile.lastContacted.split('T')[0] : '',
          consentGiven: profile.consentGiven ?? false,
          optOut: profile.optOut ?? false,
          avatar: profile.avatar || '',
        });

        // Voting history
        if (profile.votingHistory && Array.isArray(profile.votingHistory)) {
          setVotingHistory(profile.votingHistory);
        }

        // Family members – extract name from populated relativeId
        if (profile.family && Array.isArray(profile.family)) {
          const familyWithNames = profile.family.map(f => ({
            relativeId: f.relativeId?._id || f.relativeId,
            relativeName: f.relativeId?.name || 'Unknown',
            relationType: f.relationType,
            confidence: f.confidence,
            notes: f.notes || ''
          }));
          setFamilyMembers(familyWithNames);
        }

        // Map marker
        if (profile.latitude || profile.lat) {
          const lat = profile.latitude ?? profile.lat;
          const lng = profile.longitude ?? profile.lng;
          if (lat && lng) {
            setMapCenter([lat, lng]);
            setMarkerPos([lat, lng]);
          }
        }
      } catch (err) {
        console.error(err);
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [id]);

  // Location autocomplete handlers
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

  // Generic change handler
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? (value === '' ? '' : parseFloat(value)) : value,
    }));
  };

  // Multi‑select for dataSources & vehicles
  const handleMultiSelect = (e, field) => {
    const options = e.target.options;
    const values = [];
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) values.push(options[i].value);
    }
    setFormData(prev => ({ ...prev, [field]: values }));
  };

  // Voting history management
  const addVotingEntry = () => {
    if (!newVotingEntry.electionDate || !newVotingEntry.partyVotedFor) {
      alert('Election date and party are required');
      return;
    }
    setVotingHistory([...votingHistory, { ...newVotingEntry }]);
    setNewVotingEntry({
      electionDate: '',
      electionType: 'general',
      partyVotedFor: '',
      boothId: '',
      verified: false
    });
  };
  const removeVotingEntry = (index) => {
    const updated = [...votingHistory];
    updated.splice(index, 1);
    setVotingHistory(updated);
  };

  // Family management
  const addFamilyMember = () => {
    if (!newRelative.relativeId) {
      alert('Please select a relative');
      return;
    }
    setFamilyMembers([...familyMembers, { ...newRelative }]);
    setNewRelative({ relativeId: '', relativeName: '', relationType: 'other', confidence: 1.0, notes: '' });
    setRelativeSearch('');
  };

  const removeFamilyMember = (index) => {
    const updated = [...familyMembers];
    updated.splice(index, 1);
    setFamilyMembers(updated);
  };

  const handleRelativeSelect = (profile) => {
    setNewRelative(prev => ({
      ...prev,
      relativeId: profile._id,
      relativeName: profile.name,
    }));
    setRelativeSearch(profile.name);
    setShowRelativeSuggestions(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.latitude || !formData.longitude) {
      setError('Name and coordinates are required');
      return;
    }
    setSubmitting(true);
    setError('');

    let avatarUrl = formData.avatar;

    // If a new image file is selected, upload it now
    if (selectedImageFile) {
      setUploadingImage(true);
      const uploadFormData = new FormData();
      uploadFormData.append('image', selectedImageFile);
      try {
        const response = await fetch('http://localhost:5000/api/upload', {
          method: 'POST',
          body: uploadFormData,
        });
        const data = await response.json();
        if (response.ok) {
          avatarUrl = data.url;
        } else {
          throw new Error(data.error || 'Upload failed');
        }
      } catch (err) {
        setError('Failed to upload image');
        setSubmitting(false);
        setUploadingImage(false);
        return;
      }
      setUploadingImage(false);
    }

    // Prepare family payload (exclude relativeName)
    const familyPayload = familyMembers.map(f => ({
      relativeId: f.relativeId,
      relationType: f.relationType,
      confidence: f.confidence,
      notes: f.notes
    }));

    // Build payload – matches your schema exactly
    const payload = {
      // Core Identity
      name: formData.name,
      age: formData.age ? parseInt(formData.age) : undefined,

      // Location & Address
      location: `${formData.village || 'Unknown'}, ${formData.city || 'Unknown'}`,
      latitude: parseFloat(formData.latitude),
      longitude: parseFloat(formData.longitude),
      address: {
        street: formData.street,
        locality: formData.locality,
        pincode: formData.pincode,
        constituency: formData.constituency,
        ward: formData.ward,
        boothId: formData.boothId
      },

      // Contact
      phone: formData.phone,
      email: formData.email,

      // Work & Skills
      work: formData.work,
      skills: formData.skills ? formData.skills.split(',').map(s => s.trim()) : [],

      // Economic & Demographic
      incomeBracket: formData.incomeBracket,
      educationLevel: formData.educationLevel,
      homeOwnership: formData.homeOwnership,
      vehicles: formData.vehicles,

      // Political & Voting Behavior
      partyAffiliation: formData.partyAffiliation,
      votingHistory: votingHistory,
      turnoutLikelihood: formData.turnoutLikelihood,
      swingVoter: formData.swingVoter,
      influencerScore: formData.influencerScore,

      // Digital & Social Footprint
      socialLinks: {},
      hasSmartphone: formData.hasSmartphone,
      primaryPlatform: formData.primaryPlatform,

      // Family & Household
      family: familyPayload,          // cleaned payload
      householdId: formData.householdId || undefined,

      // Data Quality
      confidenceScore: formData.confidence / 100,
      verificationStatus: formData.verificationStatus,
      dataSources: formData.dataSources,
      tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : [],
      notes: formData.notes,
      lastContacted: formData.lastContacted ? new Date(formData.lastContacted) : undefined,
      isActive: true,

      // Privacy & Compliance
      consentGiven: formData.consentGiven,
      optOut: formData.optOut,

      // Merging & Source Metadata
      sourceMetadata: formData.voterId ? {
        sourceType: 'manual',
        sourceId: formData.voterId,
        extractedAt: new Date()
      } : undefined,

      // Image
      avatar: avatarUrl,
    };

    // Add social links if non‑empty
    if (formData.instagram) payload.socialLinks.instagram = formData.instagram;
    if (formData.youtube) payload.socialLinks.youtube = formData.youtube;

    try {
      await updateProfile(id, payload);
      navigate(`/profile/${id}`);
    } catch (err) {
      console.error(err);
      setError('Failed to update profile');
      setSubmitting(false);
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }
    setSelectedImageFile(file);
    // Create local preview URL
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>LOADING PROFILE DATA...</p>
      </div>
    );
  }

  return (
    <div className="geo-page">
      <div className="grid-bg"></div>
      <div className="orb orb-1"></div>
      <div className="orb orb-2"></div>
      <div className="scanline"></div>

      <div className="geo-container">
        <div className="cyber-card">
          <h2 className="glitch-title" data-text="✏️ EDIT PROFILE (FULL)">✏️ EDIT PROFILE (FULL)</h2>
          <p className="subtitle">Complete voter intelligence – basic + advanced fields</p>

          <form onSubmit={handleSubmit} className="geo-form">
            {/* ========== BASIC SECTION ========== */}
            <div className="form-section">
              <h3 className="section-title">📍 Basic Information</h3>
              <div className="form-row">
                <div className="form-group"><label>Full Name *</label><input type="text" name="name" value={formData.name} onChange={handleChange} required /></div>
                <div className="form-group"><label>Age *</label><input type="number" name="age" value={formData.age} onChange={handleChange} min="18" max="120" required /></div>
              </div>
              <div className="form-row full-width">
                <div className="form-group full-width">
                  <label>🔍 Search Location</label>
                  <div className="autocomplete-wrapper">
                    <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search new location..." />
                    {showSuggestions && suggestions.length > 0 && (
                      <ul className="suggestions-list">
                        {suggestions.map((place, idx) => <li key={idx} onClick={() => handleSuggestionClick(place)}>{place.display_name}</li>)}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Latitude *</label><input type="number" step="any" name="latitude" value={formData.latitude} onChange={handleChange} required /></div>
                <div className="form-group"><label>Longitude *</label><input type="number" step="any" name="longitude" value={formData.longitude} onChange={handleChange} required /></div>
              </div>
              <div className="form-group">
                <label>Profile Image</label>
                <input type="file" accept="image/*" onChange={handleImageSelect} />
                {(imagePreview || formData.avatar) && (
                  <div className="image-preview">
                    <img src={imagePreview || formData.avatar} alt="Preview" style={{ maxWidth: '100px', marginTop: '0.5rem', borderRadius: '50%' }} />
                    <button type="button" onClick={() => {
                      setSelectedImageFile(null);
                      setImagePreview('');
                      setFormData(prev => ({ ...prev, avatar: '' }));
                    }} className="remove-img">×</button>
                  </div>
                )}
              </div>
              <div className="form-row">
                <div className="form-group"><label>Village</label><input type="text" name="village" value={formData.village} onChange={handleChange} /></div>
                <div className="form-group"><label>City</label><input type="text" name="city" value={formData.city} onChange={handleChange} /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Voter ID</label><input type="text" name="voterId" value={formData.voterId} onChange={handleChange} /></div>
                <div className="form-group"><label>Instagram</label><input type="text" name="instagram" value={formData.instagram} onChange={handleChange} /></div>
                <div className="form-group"><label>YouTube</label><input type="text" name="youtube" value={formData.youtube} onChange={handleChange} /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Confidence: {formData.confidence}%</label><input type="range" name="confidence" min="0" max="100" value={formData.confidence} onChange={handleChange} className="confidence-slider" /></div>
              </div>
              <div className="map-wrapper">
                <MapContainer key={mapKey} center={mapCenter} zoom={13} style={{ height: '400px', width: '100%', borderRadius: '0.5rem' }}>
                  <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" attribution='&copy; OSM & CartoDB' />
                  {markerPos && <Marker position={markerPos} />}
                  <LocationMarker setLatLng={setLatLng} />
                </MapContainer>
                <p className="map-hint">📍 Click on map to move marker – updates coordinates automatically</p>
              </div>
            </div>

            {/* ========== TOGGLE BUTTON ========== */}
            <button type="button" onClick={() => setAdvancedOpen(!advancedOpen)} className="toggle-advanced">
              {advancedOpen ? '▼ Hide Advanced Fields' : '▶ Show Advanced Fields (Political, Family, etc.)'}
            </button>

            {advancedOpen && (
              <>
                {/* Address Details */}
                <div className="form-section">
                  <h3 className="section-title">🏠 Address Details</h3>
                  <div className="form-row">
                    <div className="form-group"><label>Street</label><input type="text" name="street" value={formData.street} onChange={handleChange} /></div>
                    <div className="form-group"><label>Locality</label><input type="text" name="locality" value={formData.locality} onChange={handleChange} /></div>
                  </div>
                  <div className="form-row">
                    <div className="form-group"><label>Pincode</label><input type="text" name="pincode" value={formData.pincode} onChange={handleChange} /></div>
                    <div className="form-group"><label>Constituency</label><input type="text" name="constituency" value={formData.constituency} onChange={handleChange} /></div>
                  </div>
                  <div className="form-row">
                    <div className="form-group"><label>Ward</label><input type="text" name="ward" value={formData.ward} onChange={handleChange} /></div>
                    <div className="form-group"><label>Booth ID</label><input type="text" name="boothId" value={formData.boothId} onChange={handleChange} /></div>
                  </div>
                </div>

                {/* Contact & Work */}
                <div className="form-section">
                  <h3 className="section-title">📞 Contact & Work</h3>
                  <div className="form-row">
                    <div className="form-group"><label>Phone</label><input type="tel" name="phone" value={formData.phone} onChange={handleChange} /></div>
                    <div className="form-group"><label>Email</label><input type="email" name="email" value={formData.email} onChange={handleChange} /></div>
                  </div>
                  <div className="form-row">
                    <div className="form-group"><label>Work/Occupation</label><input type="text" name="work" value={formData.work} onChange={handleChange} /></div>
                    <div className="form-group"><label>Skills (comma separated)</label><input type="text" name="skills" value={formData.skills} onChange={handleChange} placeholder="e.g., farming, teaching, IT" /></div>
                  </div>
                </div>

                {/* Economic & Demographic */}
                <div className="form-section">
                  <h3 className="section-title">💰 Economic & Demographic</h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Income Bracket</label>
                      <select name="incomeBracket" value={formData.incomeBracket} onChange={handleChange}>
                        <option value="">Select</option>
                        <option value="below poverty">Below Poverty</option>
                        <option value="0-5L">0-5 Lakhs</option>
                        <option value="5-10L">5-10 Lakhs</option>
                        <option value="10-25L">10-25 Lakhs</option>
                        <option value="25L+">25 Lakhs+</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Education Level</label>
                      <select name="educationLevel" value={formData.educationLevel} onChange={handleChange}>
                        <option value="">Select</option>
                        <option value="illiterate">Illiterate</option>
                        <option value="primary">Primary</option>
                        <option value="secondary">Secondary</option>
                        <option value="higher secondary">Higher Secondary</option>
                        <option value="graduate">Graduate</option>
                        <option value="postgraduate">Postgraduate</option>
                        <option value="doctorate">Doctorate</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Home Ownership</label>
                      <select name="homeOwnership" value={formData.homeOwnership} onChange={handleChange}>
                        <option value="">Select</option>
                        <option value="owned">Owned</option>
                        <option value="rented">Rented</option>
                        <option value="leased">Leased</option>
                        <option value="others">Others</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Vehicles</label>
                      <select multiple value={formData.vehicles} onChange={(e) => handleMultiSelect(e, 'vehicles')}>
                        <option value="bicycle">Bicycle</option>
                        <option value="motorcycle">Motorcycle</option>
                        <option value="car">Car</option>
                        <option value="tractor">Tractor</option>
                        <option value="none">None</option>
                      </select>
                      <small>Hold Ctrl/Cmd to select multiple</small>
                    </div>
                  </div>
                </div>

                {/* Political & Voting Behavior */}
                <div className="form-section">
                  <h3 className="section-title">🗳️ Political & Voting Behavior</h3>
                  <div className="form-row">
                    <div className="form-group"><label>Party Affiliation</label><input type="text" name="partyAffiliation" value={formData.partyAffiliation} onChange={handleChange} placeholder="BJP, INC, AAP, etc." /></div>
                    <div className="form-group"><label>Turnout Likelihood (0-1)</label><input type="number" step="0.01" name="turnoutLikelihood" value={formData.turnoutLikelihood} onChange={handleChange} /></div>
                  </div>
                  <div className="form-row">
                    <div className="form-group checkbox-group"><label><input type="checkbox" name="swingVoter" checked={formData.swingVoter} onChange={handleChange} /> Swing Voter</label></div>
                    <div className="form-group"><label>Influencer Score (0-1)</label><input type="number" step="0.01" name="influencerScore" value={formData.influencerScore} onChange={handleChange} /></div>
                  </div>

                  <label>Voting History</label>
                  <div className="voting-history-list">
                    {votingHistory.map((vh, idx) => (
                      <div key={idx} className="voting-entry">
                        <span>{vh.electionDate?.split('T')[0]} - {vh.electionType} : {vh.partyVotedFor}</span>
                        <button type="button" onClick={() => removeVotingEntry(idx)}>❌</button>
                      </div>
                    ))}
                  </div>
                  <div className="add-voting">
                    <div className="form-row">
                      <div className="form-group"><input type="date" value={newVotingEntry.electionDate} onChange={(e) => setNewVotingEntry({ ...newVotingEntry, electionDate: e.target.value })} placeholder="Election Date" /></div>
                      <div className="form-group">
                        <select value={newVotingEntry.electionType} onChange={(e) => setNewVotingEntry({ ...newVotingEntry, electionType: e.target.value })}>
                          <option value="general">General</option>
                          <option value="assembly">Assembly</option>
                          <option value="local">Local</option>
                          <option value="by-election">By-election</option>
                        </select>
                      </div>
                      <div className="form-group"><input type="text" value={newVotingEntry.partyVotedFor} onChange={(e) => setNewVotingEntry({ ...newVotingEntry, partyVotedFor: e.target.value })} placeholder="Party voted for" /></div>
                      <div className="form-group"><input type="text" value={newVotingEntry.boothId} onChange={(e) => setNewVotingEntry({ ...newVotingEntry, boothId: e.target.value })} placeholder="Booth ID" /></div>
                      <button type="button" onClick={addVotingEntry}>+ Add</button>
                    </div>
                  </div>
                </div>

                {/* Digital Footprint */}
                <div className="form-section">
                  <h3 className="section-title">📱 Digital Footprint</h3>
                  <div className="form-row">
                    <div className="form-group checkbox-group"><label><input type="checkbox" name="hasSmartphone" checked={formData.hasSmartphone} onChange={handleChange} /> Has Smartphone</label></div>
                    <div className="form-group">
                      <label>Primary Platform</label>
                      <select name="primaryPlatform" value={formData.primaryPlatform} onChange={handleChange}>
                        <option value="">None</option>
                        <option value="WhatsApp">WhatsApp</option>
                        <option value="Facebook">Facebook</option>
                        <option value="Instagram">Instagram</option>
                        <option value="Telegram">Telegram</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Family & Relatives */}
                <div className="form-section">
                  <h3 className="section-title">👨‍👩‍👧‍👦 Family & Relatives</h3>
                  <div className="family-list">
                    {familyMembers.map((rel, idx) => (
                      <div key={idx} className="family-entry">
                        <span>{rel.relativeName} ({rel.relationType})</span>
                        <button type="button" onClick={() => removeFamilyMember(idx)}>❌</button>
                      </div>
                    ))}
                  </div>
                  <div className="add-relative">
                    <div className="autocomplete-wrapper">
                      <input type="text" value={relativeSearch} onChange={(e) => setRelativeSearch(e.target.value)} placeholder="Search existing profile by name..." />
                      {showRelativeSuggestions && relativeSuggestions.length > 0 && (
                        <ul className="suggestions-list">
                          {relativeSuggestions.map(prof => (
                            <li key={prof._id} onClick={() => handleRelativeSelect(prof)}>{prof.name} (ID: {prof._id})</li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <div className="form-group">
                      <select value={newRelative.relationType} onChange={(e) => setNewRelative({ ...newRelative, relationType: e.target.value })}>
                        <option value="spouse">Spouse</option>
                        <option value="parent">Parent</option>
                        <option value="child">Child</option>
                        <option value="sibling">Sibling</option>
                        <option value="grandparent">Grandparent</option>
                        <option value="grandchild">Grandchild</option>
                        <option value="aunt">Aunt</option>
                        <option value="uncle">Uncle</option>
                        <option value="cousin">Cousin</option>
                        <option value="in-law">In‑law</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <input type="text" placeholder="Notes (optional)" value={newRelative.notes} onChange={(e) => setNewRelative({ ...newRelative, notes: e.target.value })} />
                    <button type="button" onClick={addFamilyMember}>+ Add Relative</button>
                  </div>
                  <div className="form-group"><label>Household ID (optional)</label><input type="text" name="householdId" value={formData.householdId} onChange={handleChange} /></div>
                </div>

                {/* Data Quality */}
                <div className="form-section">
                  <h3 className="section-title">📋 Data Quality & Operations</h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Verification Status</label>
                      <select name="verificationStatus" value={formData.verificationStatus} onChange={handleChange}>
                        <option value="unverified">Unverified</option>
                        <option value="partial">Partial</option>
                        <option value="verified">Verified</option>
                        <option value="field-confirmed">Field‑confirmed</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Data Sources</label>
                      <select multiple value={formData.dataSources} onChange={(e) => handleMultiSelect(e, 'dataSources')}>
                        <option value="electoral roll">Electoral roll</option>
                        <option value="manual entry">Manual entry</option>
                        <option value="social scraping">Social scraping</option>
                        <option value="web scraping">Web scraping</option>
                        <option value="api">API</option>
                        <option value="field survey">Field survey</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group"><label>Tags (comma separated)</label><input type="text" name="tags" value={formData.tags} onChange={handleChange} placeholder="influencer, swing, first-time voter" /></div>
                    <div className="form-group"><label>Last Contacted</label><input type="date" name="lastContacted" value={formData.lastContacted} onChange={handleChange} /></div>
                  </div>
                  <div className="form-group"><label>Notes</label><textarea name="notes" rows="3" value={formData.notes} onChange={handleChange}></textarea></div>
                </div>

                {/* Privacy */}
                <div className="form-section">
                  <h3 className="section-title">🔒 Privacy & Compliance</h3>
                  <div className="form-row">
                    <div className="form-group checkbox-group"><label><input type="checkbox" name="consentGiven" checked={formData.consentGiven} onChange={handleChange} /> Consent Given</label></div>
                    <div className="form-group checkbox-group"><label><input type="checkbox" name="optOut" checked={formData.optOut} onChange={handleChange} /> Opt‑Out (Do not contact)</label></div>
                  </div>
                </div>
              </>
            )}

            {error && <div className="error-message">{error}</div>}
            <div className="form-actions">
              <button type="button" onClick={() => navigate(-1)} className="cancel-btn">Cancel</button>
              <button type="submit" disabled={submitting} className="submit-btn">{submitting ? 'UPDATING...' : 'UPDATE PROFILE'}</button>
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
        .form-group input, .form-group select, .form-group textarea { width: 100%; padding: 0.6rem 0.8rem; background: rgba(0,0,0,0.6); border: 1px solid rgba(0,242,255,0.3); border-radius: 0.5rem; color: #e0e0e0; font-family: monospace; transition: 0.2s; }
        .form-group input:focus, .form-group select:focus, .form-group textarea:focus { outline: none; border-color: #00f2ff; box-shadow: 0 0 8px rgba(0,242,255,0.4); }
        .checkbox-group { display: flex; align-items: center; gap: 0.5rem; }
        .checkbox-group label { margin-bottom: 0; cursor: pointer; }
        .section-title { font-size: 1rem; border-left: 3px solid #00f2ff; padding-left: 0.5rem; margin: 1rem 0 0.5rem 0; color: #ff00e6; }
        .toggle-advanced { background: rgba(0,242,255,0.2); border: 1px solid #00f2ff; padding: 0.5rem; border-radius: 0.5rem; color: #00f2ff; cursor: pointer; font-family: monospace; width: 100%; margin-top: 1rem; }
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
        .voting-history-list, .family-list { background: rgba(0,0,0,0.4); padding: 0.5rem; border-radius: 0.5rem; margin-bottom: 0.5rem; }
        .voting-entry, .family-entry { display: flex; justify-content: space-between; align-items: center; padding: 0.3rem; border-bottom: 1px solid rgba(0,242,255,0.2); }
        .add-voting, .add-relative { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-top: 0.5rem; }
        .loading-container { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 60vh; gap: 1rem; }
        .spinner { width: 2rem; height: 2rem; border: 3px solid rgba(0,242,255,0.3); border-top-color: #00f2ff; border-radius: 50%; animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) { .cyber-card { padding: 1.5rem; } .form-row { flex-direction: column; gap: 1rem; } .map-wrapper { height: 300px; } }
      `}</style>
    </div>
  );
};

export default EditProfileGeo;