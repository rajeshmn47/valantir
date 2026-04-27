import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllProfiles } from '../api';

const AllProfiles = () => {
    const navigate = useNavigate();
    const [profiles, setProfiles] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        loadProfiles();
    }, []);

    const loadProfiles = async () => {
        try {
            setLoading(true);
            const response = await getAllProfiles();
            setProfiles(response.data);
            setFiltered(response.data);
            setError('');
        } catch (err) {
            console.error('Load profiles error:', err);
            setError('Failed to load profiles. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    // Filter profiles based on search query
    useEffect(() => {
        if (!searchQuery.trim()) {
            setFiltered(profiles);
            return;
        }
        const query = searchQuery.toLowerCase();
        const filteredList = profiles.filter(p =>
            p.name?.toLowerCase().includes(query) ||
            p.location?.toLowerCase().includes(query) ||
            p.sourceMetadata?.sourceId?.toLowerCase().includes(query) ||
            (p.socialLinks?.instagram && p.socialLinks.instagram.toLowerCase().includes(query))
        );
        setFiltered(filteredList);
    }, [searchQuery, profiles]);

    // Calculate stats
    const stats = {
        total: filtered.length,
        avgAge: filtered.length ? Math.round(filtered.reduce((sum, p) => sum + (p.age || 0), 0) / filtered.length) : 0,
        withSocial: filtered.filter(p => p.socialLinks && Object.keys(p.socialLinks).length > 0).length,
        uniqueLocations: new Set(filtered.map(p => p.location).filter(Boolean)).size,
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>LOADING PROFILES FROM DATABASE...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="error-container">
                <p>{error}</p>
                <button onClick={loadProfiles}>Retry</button>
            </div>
        );
    }

    return (
        <div className="profiles-page">
            <div className="grid-bg"></div>
            <div className="orb orb-1"></div>
            <div className="orb orb-2"></div>
            <div className="scanline"></div>

            <div className="content-wrapper">
                <div className="header-section">
                    <h1 className="glitch-title" data-text="📋 ALL PROFILES">📋 ALL PROFILES</h1>
                    <p className="subtitle">{profiles.length} total records in database</p>
                </div>

                {/* Search */}
                <div className="search-wrapper">
                    <div className="search-container">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by name, location, voter ID, or Instagram..."
                            className="search-input"
                        />
                        <button className="search-btn">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <circle cx="11" cy="11" r="8" />
                                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Stats */}
                <div className="stats-grid">
                    <div className="stat-card">
                        <div><span className="stat-label">Total Profiles</span><span className="stat-value">{stats.total}</span></div>
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                    </div>
                    <div className="stat-card">
                        <div><span className="stat-label">Avg. Age</span><span className="stat-value">{stats.avgAge || '—'}</span></div>
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
                    </div>
                    <div className="stat-card">
                        <div><span className="stat-label">Social Links</span><span className="stat-value">{stats.withSocial}</span></div>
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M4 4h16v16H4z" /><circle cx="9" cy="9" r="2" /><circle cx="15" cy="15" r="2" /><line x1="9" y1="15" x2="15" y2="9" /></svg>
                    </div>
                    <div className="stat-card">
                        <div><span className="stat-label">Locations</span><span className="stat-value">{stats.uniqueLocations}</span></div>
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                    </div>
                </div>

                {/* Profile cards */}
                <div className="cards-container">
                    <div className="cards-container">
                        {filtered.map((profile) => (
                            <div
                                key={profile._id}
                                className="profile-card"
                                onClick={() => navigate(`/profile/${profile._id}`)}
                            >
                                <div className="card-header">
                                    <div className="avatar">{profile.name?.charAt(0) || '?'}</div>
                                    <div className="card-title">
                                        <h3>{profile.name}</h3>
                                        <span className="confidence">{(profile.confidenceScore * 100).toFixed(0)}% MATCH</span>
                                    </div>
                                </div>
                                <div className="card-details">
                                    {profile.age && <div><span>🎂 Age:</span> {profile.age}</div>}
                                    {profile.location && <div><span>📍 Location:</span> {profile.location}</div>}
                                    {profile.sourceMetadata?.sourceId && <div><span>🆔 Voter ID:</span> {profile.sourceMetadata.sourceId}</div>}
                                </div>
                                <div className="card-footer">
                                    <div className="social-links">
                                        {profile.socialLinks?.instagram && (
                                            <a href={`https://instagram.com/${profile.socialLinks.instagram}`} target="_blank" rel="noopener noreferrer" className="ig-link">
                                                📷 Instagram
                                            </a>
                                        )}
                                        {profile.socialLinks?.youtube && (
                                            <a href={`https://youtube.com/@${profile.socialLinks.youtube}`} target="_blank" rel="noopener noreferrer" className="yt-link">
                                                📺 YouTube
                                            </a>
                                        )}
                                    </div>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); navigate(`/edit-profile/${profile._id}`); }}
                                        className="edit-btn"
                                    >
                                        ✏️ Edit
                                    </button>
                                    <div className="sync-time">
                                        <span>added: {new Date(profile.createdAt).toLocaleDateString()}</span>
                                        <span>🔗 {profile.socialLinks ? Object.keys(profile.socialLinks).length : 0} sources</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                {filtered.length === 0 && (
                    <div className="no-results">No profiles match your search.</div>
                )}
            </div>

            <style>{`
        /* Same styles as before – keep them unchanged */
        .profiles-page { position: relative; min-height: 100vh; background: linear-gradient(135deg, #050508 0%, #0a0a1a 100%); color: #e0e0e0; font-family: 'Inter', sans-serif; overflow-x: hidden; }
        .grid-bg { position: fixed; inset: 0; background-image: linear-gradient(rgba(0,242,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(0,242,255,0.06) 1px, transparent 1px); background-size: 40px 40px; animation: gridMove 20s linear infinite; pointer-events: none; }
        @keyframes gridMove { 0% { transform: translate(0,0); } 100% { transform: translate(40px,40px); } }
        .orb { position: fixed; border-radius: 50%; filter: blur(100px); opacity: 0.2; pointer-events: none; }
        .orb-1 { width: 400px; height: 400px; background: #00f2ff; top: -150px; left: -150px; animation: float 12s infinite; }
        .orb-2 { width: 500px; height: 500px; background: #ff00e6; bottom: -200px; right: -200px; animation: float 15s infinite reverse; }
        @keyframes float { 0%,100% { transform: translate(0,0); } 50% { transform: translate(50px,50px); } }
        .scanline { position: fixed; inset: 0; background: repeating-linear-gradient(0deg, rgba(0,255,255,0.02) 0px, rgba(0,255,255,0.02) 2px, transparent 2px, transparent 8px); pointer-events: none; animation: scanlineMove 8s linear infinite; }
        @keyframes scanlineMove { 0% { transform: translateY(-100%); } 100% { transform: translateY(100%); } }
        .content-wrapper { position: relative; z-index: 10; max-width: 1280px; margin: 0 auto; padding: 2rem; }
        .header-section { text-align: center; margin-bottom: 2rem; }
        .glitch-title { font-size: 2rem; font-weight: 800; background: linear-gradient(135deg, #00f2ff, #ffffff, #ff00e6); -webkit-background-clip: text; background-clip: text; color: transparent; animation: glitch-skew 3s infinite; display: inline-block; }
        @keyframes glitch-skew { 0%,100% { transform: skew(0deg); } 95% { transform: skew(0deg); } 96% { transform: skew(2deg); } 97% { transform: skew(-2deg); } 98% { transform: skew(0deg); } }
        .subtitle { color: #9ca3af; font-family: monospace; margin-top: 0.5rem; }
        .search-wrapper { max-width: 600px; margin: 0 auto 2rem; }
        .search-container { position: relative; }
        .search-input { width: 100%; padding: 0.8rem 3rem 0.8rem 1rem; background: rgba(0,0,0,0.6); border: 1px solid rgba(0,242,255,0.3); border-radius: 2rem; color: #00f2ff; font-family: monospace; }
        .search-input:focus { outline: none; border-color: #00f2ff; box-shadow: 0 0 10px rgba(0,242,255,0.4); }
        .search-btn { position: absolute; right: 0.5rem; top: 50%; transform: translateY(-50%); background: none; border: none; color: #00f2ff; cursor: pointer; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px,1fr)); gap: 1rem; margin-bottom: 2rem; }
        .stat-card { background: rgba(12,12,20,0.75); backdrop-filter: blur(12px); border: 1px solid rgba(0,242,255,0.2); border-radius: 1rem; padding: 1rem; display: flex; justify-content: space-between; align-items: center; transition: 0.3s; }
        .stat-card:hover { transform: translateY(-2px); border-color: #00f2ff; box-shadow: 0 0 15px rgba(0,242,255,0.3); }
        .stat-label { font-size: 0.7rem; text-transform: uppercase; color: #9ca3af; }
        .stat-value { font-size: 1.8rem; font-weight: bold; color: #00f2ff; }
        .cards-container { display: flex; flex-direction: column; gap: 1rem; }
        .profile-card { background: rgba(12,12,20,0.75); backdrop-filter: blur(12px); border: 1px solid rgba(0,242,255,0.2); border-radius: 1rem; padding: 1rem; cursor: pointer; transition: 0.3s; animation: fadeIn 0.3s ease; }
        .profile-card:hover { transform: translateY(-3px); border-color: #00f2ff; box-shadow: 0 0 20px rgba(0,242,255,0.3); }
        @keyframes fadeIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        .card-header { display: flex; align-items: center; gap: 1rem; margin-bottom: 0.8rem; }
        .avatar { width: 2.5rem; height: 2.5rem; border-radius: 50%; background: linear-gradient(135deg, rgba(0,242,255,0.3), rgba(255,0,230,0.3)); display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 1.2rem; }
        .card-title h3 { font-size: 1.2rem; background: linear-gradient(135deg, #00f2ff, #ff00e6); -webkit-background-clip: text; background-clip: text; color: transparent; }
        .confidence { font-size: 0.7rem; padding: 0.2rem 0.5rem; border-radius: 1rem; background: rgba(0,242,255,0.2); border: 1px solid rgba(0,242,255,0.3); color: #00f2ff; }
        .card-details { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px,1fr)); gap: 0.5rem; margin-bottom: 0.8rem; font-size: 0.8rem; }
        .card-details span { color: #9ca3af; margin-right: 0.5rem; }
        .card-footer { border-top: 1px solid rgba(0,242,255,0.2); padding-top: 0.5rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem; font-size: 0.7rem; }
        .social-links { display: flex; gap: 0.5rem; }
        .ig-link, .yt-link { text-decoration: none; padding: 0.2rem 0.5rem; border-radius: 0.5rem; }
        .ig-link { background: rgba(255,0,230,0.2); color: #ff00e6; }
        .yt-link { background: rgba(255,0,0,0.2); color: #ff4d4d; }
        .sync-time { color: #6b7280; }
        .loading-container, .error-container { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 60vh; gap: 1rem; }
        .spinner { width: 2rem; height: 2rem; border: 3px solid rgba(0,242,255,0.3); border-top-color: #00f2ff; border-radius: 50%; animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .error-container button { background: rgba(0,242,255,0.2); border: 1px solid #00f2ff; padding: 0.5rem 1rem; border-radius: 0.5rem; color: #00f2ff; cursor: pointer; }
        .no-results { text-align: center; padding: 2rem; color: #6b7280; font-family: monospace; }
        @media (max-width: 768px) { .stats-grid { grid-template-columns: 1fr; } .card-details { grid-template-columns: 1fr; } }
      `}</style>
        </div>
    );
};

export default AllProfiles;