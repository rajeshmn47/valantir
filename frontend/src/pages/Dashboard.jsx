import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Mock data
const mockVoters = [
  { name: "Nirmala N", age: 30, location: "Gauribidanur, Karnataka", voterId: "ALQ2210680", instagram: "nirmala_n", youtube: "", confidence: 0.92 },
  { name: "MK Parwathamma", age: 37, location: "Gauribidanur, Karnataka", voterId: "ALQ0009472", instagram: "", youtube: "", confidence: 0.88 },
  { name: "Anithamma", age: 36, location: "Gauribidanur, Karnataka", voterId: "ALQ0010017", instagram: "anitha_36", youtube: "", confidence: 0.95 },
  { name: "Bhoomika S N", age: 23, location: "Gauribidanur, Karnataka", voterId: "ALQ3398245", instagram: "bhoomika_sn", youtube: "bhoomika_creator", confidence: 0.91 },
  { name: "SUNIL KUMAR", age: 21, location: "Gauribidanur, Karnataka", voterId: "ALQ3410149", instagram: "sunil_k_2916", youtube: "sunil_gaming", confidence: 0.89 },
  { name: "GANGAMMA", age: 80, location: "Gauribidanur, Karnataka", voterId: "ALQ2271112", instagram: "", youtube: "", confidence: 0.97 },
  { name: "Gopala", age: 49, location: "Gauribidanur, Karnataka", voterId: "ALQ2160661", instagram: "gopala_49", youtube: "", confidence: 0.86 },
  { name: "Sharadamma", age: 46, location: "Gauribidanur, Karnataka", voterId: "ALQ0009894", instagram: "", youtube: "", confidence: 0.90 },
  { name: "Shobha.G.S", age: 44, location: "Gauribidanur, Karnataka", voterId: "ALQ2160729", instagram: "shobha_gs", youtube: "", confidence: 0.93 },
  { name: "Ashok Nayaka.M.A", age: 34, location: "Gauribidanur, Karnataka", voterId: "ALQ2160646", instagram: "ashok_nayaka", youtube: "ashok_vlogs", confidence: 0.87 }
];

const Dashboard = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(mockVoters);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = () => {
    if (!query.trim()) {
      setResults(mockVoters);
      return;
    }
    setIsLoading(true);
    setTimeout(() => {
      const filtered = mockVoters.filter(v =>
        v.name.toLowerCase().includes(query.toLowerCase()) ||
        v.voterId.toLowerCase().includes(query.toLowerCase()) ||
        (v.instagram && v.instagram.includes(query.toLowerCase()))
      );
      setResults(filtered);
      setIsLoading(false);
    }, 800);
  };

  const stats = {
    total: results.length,
    avgAge: results.length ? Math.round(results.reduce((a, b) => a + (b.age || 0), 0) / results.length) : 0,
    withSocial: results.filter(v => v.instagram || v.youtube).length,
    uniqueLocations: new Set(results.map(v => v.location).filter(Boolean)).size
  };

  return (
    <div className="app-container">
      {/* Background effects */}
      <div className="grid-bg"></div>
      <div className="orb orb-1"></div>
      <div className="orb orb-2"></div>
      <div className="scanline"></div>

      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="logo-area">
            <div className="icon-badge">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <div>
              <h1 className="glitch-title" data-text="PEOPLE INTELLIGENCE PLATFORM">PEOPLE INTELLIGENCE PLATFORM</h1>
              <div className="badge-row">
                <span>⚡ QUANTUM ENGINE v2.4</span>
                <span>👁️ LIVE SURVEILLANCE</span>
              </div>
            </div>
          </div>
          <div className="security-status">
            <div>SECURE CONNECTION</div>
            <div>ENCRYPTED • TOR ROUTING ACTIVE</div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="main">
        <div className="hero">
          <h2>Trace. Identify. Correlate.</h2>
          <p>Cross‑reference electoral rolls, social media activity, and digital footprints in real time.</p>
        </div>

        {/* Search */}
        <div className="search-wrapper">
          <div className="search-container">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Enter Voter ID, name, or Instagram handle..."
              className="search-input"
            />
            <button onClick={handleSearch} disabled={isLoading} className="search-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>
          </div>
          {isLoading && (
            <div className="loading-indicator">
              <span className="dot"></span>
              <span>QUERYING GLOBAL DATABASES</span>
              <span className="cursor"></span>
            </div>
          )}
        </div>

        {/* Results */}
        <div className="results-area">
          {isLoading ? (
            <div className="loading-spinner">
              <div className="spinner"></div>
              <p>DECRYPTING DIGITAL FOOTPRINTS</p>
              <small>scanning 47+ data sources...</small>
            </div>
          ) : (
            <>
              {/* Stats grid */}
              <div className="stats-grid">
                <div className="stat-card">
                  <div><span className="stat-label">Total Profiles</span><span className="stat-value">{stats.total}</span></div>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                </div>
                <div className="stat-card">
                  <div><span className="stat-label">Avg. Age</span><span className="stat-value">{stats.avgAge || '—'}</span></div>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                </div>
                <div className="stat-card">
                  <div><span className="stat-label">Social Links</span><span className="stat-value">{stats.withSocial}</span></div>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M4 4h16v16H4z"/><circle cx="9" cy="9" r="2"/><circle cx="15" cy="15" r="2"/><line x1="9" y1="15" x2="15" y2="9"/></svg>
                </div>
                <div className="stat-card">
                  <div><span className="stat-label">Locations</span><span className="stat-value">{stats.uniqueLocations}</span></div>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                </div>
              </div>

              {/* Voter cards */}
              <div className="cards-container">
                {results.map((profile, idx) => (
                  <div onClick={()=>navigate('/profile/1234')} key={profile.voterId || idx} className="voter-card cursor-pointer" style={{ animationDelay: `${idx * 0.05}s` }}>
                    <div className="card-header">
                      <div className="avatar">{profile.name.charAt(0)}</div>
                      <div className="card-title">
                        <h3>{profile.name}</h3>
                        <span className="confidence">{Math.round(profile.confidence * 100)}% MATCH</span>
                      </div>
                    </div>
                    <div className="card-details">
                      {profile.age && <div><span>🎂 Age:</span> {profile.age}</div>}
                      {profile.location && <div><span>📍 Location:</span> {profile.location}</div>}
                      {profile.voterId && <div><span>🆔 Voter ID:</span> {profile.voterId}</div>}
                    </div>
                    <div className="card-footer">
                      <div className="social-links">
                        {profile.instagram && <a href={`https://instagram.com/${profile.instagram}`} target="_blank" rel="noopener noreferrer" className="ig-link">📷 Instagram</a>}
                        {profile.youtube && <a href={`https://youtube.com/@${profile.youtube}`} target="_blank" rel="noopener noreferrer" className="yt-link">📺 YouTube</a>}
                      </div>
                      <div className="sync-time">
                        <span>last sync: {new Date().toLocaleString()}</span>
                        <span>🔗 {(profile.instagram ? 1 : 0) + (profile.youtube ? 1 : 0)} sources</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </main>

      <footer className="footer">
        <span>⚠️ AUTHORIZED ACCESS ONLY ⚠️</span>
        <span>•</span>
        <span>ALL ACTIVITIES ARE LOGGED</span>
        <span>•</span>
        <span className="live">LIVE FEED ACTIVE</span>
      </footer>

      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          background: #050508;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        .app-container {
          position: relative;
          min-height: 100vh;
          background: linear-gradient(135deg, #050508 0%, #0a0a1a 100%);
          color: #e0e0e0;
          font-family: 'Inter', sans-serif;
          overflow-x: hidden;
        }

        /* Background grid */
        .grid-bg {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-image: linear-gradient(rgba(0, 242, 255, 0.06) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(0, 242, 255, 0.06) 1px, transparent 1px);
          background-size: 40px 40px;
          pointer-events: none;
          animation: gridMove 20s linear infinite;
          z-index: 0;
        }

        @keyframes gridMove {
          0% { transform: translate(0, 0); }
          100% { transform: translate(40px, 40px); }
        }

        /* Orbs */
        .orb {
          position: fixed;
          border-radius: 50%;
          filter: blur(100px);
          opacity: 0.2;
          pointer-events: none;
          z-index: 0;
        }
        .orb-1 { width: 400px; height: 400px; background: #00f2ff; top: -150px; left: -150px; animation: float 12s infinite; }
        .orb-2 { width: 500px; height: 500px; background: #ff00e6; bottom: -200px; right: -200px; animation: float 15s infinite reverse; }
        @keyframes float {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(50px, 50px); }
        }

        /* Scanline */
        .scanline {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          background: repeating-linear-gradient(0deg, rgba(0, 255, 255, 0.02) 0px, rgba(0, 255, 255, 0.02) 2px, transparent 2px, transparent 8px);
          z-index: 999;
          animation: scanlineMove 8s linear infinite;
        }
        @keyframes scanlineMove {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }

        /* Header */
        .header {
          position: sticky;
          top: 0;
          z-index: 20;
          backdrop-filter: blur(12px);
          background: rgba(0, 0, 0, 0.4);
          border-bottom: 1px solid rgba(0, 242, 255, 0.2);
        }
        .header-content {
          max-width: 1280px;
          margin: 0 auto;
          padding: 1rem 2rem;
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
        }
        .logo-area {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .icon-badge {
          padding: 0.5rem;
          border-radius: 0.75rem;
          background: linear-gradient(135deg, rgba(0, 242, 255, 0.2), rgba(255, 0, 230, 0.2));
          color: #00f2ff;
        }
        .glitch-title {
          font-size: 1.5rem;
          font-weight: 900;
          letter-spacing: -0.02em;
          background: linear-gradient(135deg, #00f2ff, #ffffff, #ff00e6);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          position: relative;
          animation: glitch-skew 3s infinite;
        }
        .glitch-title::before,
        .glitch-title::after {
          content: attr(data-text);
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
        }
        .glitch-title::before {
          color: #00f2ff;
          z-index: -1;
          animation: glitch-offset 0.3s infinite;
        }
        .glitch-title::after {
          color: #ff00e6;
          z-index: -2;
          animation: glitch-offset2 0.3s infinite;
        }
        @keyframes glitch-skew {
          0%, 100% { transform: skew(0deg); }
          95% { transform: skew(0deg); }
          96% { transform: skew(2deg); }
          97% { transform: skew(-2deg); }
          98% { transform: skew(0deg); }
        }
        @keyframes glitch-offset {
          0%, 100% { clip-path: inset(0 0 0 0); transform: translate(0); }
          95% { clip-path: inset(0 0 0 0); transform: translate(0); }
          96% { clip-path: inset(20% 0 30% 0); transform: translate(-2px); }
          97% { clip-path: inset(10% 0 50% 0); transform: translate(2px); }
          98% { clip-path: inset(0 0 0 0); transform: translate(0); }
        }
        @keyframes glitch-offset2 {
          0%, 100% { clip-path: inset(0 0 0 0); transform: translate(0); }
          95% { clip-path: inset(0 0 0 0); transform: translate(0); }
          96% { clip-path: inset(50% 0 20% 0); transform: translate(2px); }
          97% { clip-path: inset(30% 0 10% 0); transform: translate(-2px); }
          98% { clip-path: inset(0 0 0 0); transform: translate(0); }
        }
        .badge-row {
          display: flex;
          gap: 1rem;
          margin-top: 0.25rem;
          font-size: 0.75rem;
          font-family: monospace;
          color: #6b7280;
        }
        .security-status {
          text-align: right;
          font-size: 0.7rem;
        }
        .security-status div:first-child {
          color: #00f2ff;
          font-family: monospace;
          letter-spacing: 1px;
        }
        .security-status div:last-child {
          color: #6b7280;
        }

        /* Main */
        .main {
          position: relative;
          z-index: 10;
          max-width: 1280px;
          margin: 0 auto;
          padding: 2rem 2rem 4rem;
        }
        .hero {
          text-align: center;
          margin-bottom: 3rem;
        }
        .hero h2 {
          font-size: 2.5rem;
          font-weight: 800;
          background: linear-gradient(135deg, #00f2ff, #ff00e6);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          margin-bottom: 0.5rem;
        }
        .hero p {
          color: #9ca3af;
          font-family: monospace;
          font-size: 0.875rem;
          max-width: 600px;
          margin: 0 auto;
        }

        /* Search */
        .search-wrapper {
          max-width: 768px;
          margin: 0 auto 3rem;
          position: relative;
        }
        .search-container {
          position: relative;
          display: flex;
          align-items: center;
        }
        .search-input {
          width: 100%;
          padding: 1rem 5rem 1rem 1.5rem;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(0, 242, 255, 0.3);
          border-radius: 1rem;
          font-size: 1rem;
          font-family: monospace;
          color: #00f2ff;
          transition: all 0.3s;
        }
        .search-input:focus {
          outline: none;
          border-color: #00f2ff;
          box-shadow: 0 0 15px rgba(0, 242, 255, 0.4);
        }
        .search-input::placeholder {
          color: #6b7280;
        }
        .search-btn {
          position: absolute;
          right: 0.5rem;
          top: 50%;
          transform: translateY(-50%);
          background: linear-gradient(135deg, rgba(0, 242, 255, 0.2), rgba(255, 0, 230, 0.2));
          border: none;
          padding: 0.75rem;
          border-radius: 0.75rem;
          cursor: pointer;
          color: #00f2ff;
          transition: all 0.2s;
        }
        .search-btn:hover:not(:disabled) {
          background: linear-gradient(135deg, rgba(0, 242, 255, 0.4), rgba(255, 0, 230, 0.4));
        }
        .search-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .loading-indicator {
          position: absolute;
          bottom: -2rem;
          left: 0;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.75rem;
          font-family: monospace;
          color: #00f2ff;
        }
        .dot {
          width: 0.5rem;
          height: 0.5rem;
          background: #00f2ff;
          border-radius: 50%;
          animation: pulse 1s infinite;
        }
        .cursor::after {
          content: '_';
          animation: blink 1s step-end infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }

        /* Stats grid */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 1.5rem;
          margin-bottom: 3rem;
        }
        .stat-card {
          background: rgba(12, 12, 20, 0.75);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(0, 242, 255, 0.2);
          border-radius: 1rem;
          padding: 1.25rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          transition: all 0.3s;
        }
        .stat-card:hover {
          transform: translateY(-4px);
          border-color: #00f2ff;
          box-shadow: 0 0 20px rgba(0, 242, 255, 0.3);
        }
        .stat-label {
          font-size: 0.7rem;
          text-transform: uppercase;
          color: #9ca3af;
          letter-spacing: 1px;
        }
        .stat-value {
          font-size: 2rem;
          font-weight: bold;
          display: block;
          color: #00f2ff;
        }
        .stat-card svg {
          opacity: 0.5;
          stroke: currentColor;
          color: #00f2ff;
        }

        /* Cards container */
        .cards-container {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .voter-card {
          background: rgba(12, 12, 20, 0.75);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(0, 242, 255, 0.2);
          border-radius: 1rem;
          padding: 1.25rem;
          transition: all 0.3s;
          animation: fadeUp 0.5s ease-out forwards;
          opacity: 0;
        }
        .voter-card:hover {
          transform: translateY(-4px);
          border-color: #00f2ff;
          box-shadow: 0 0 20px rgba(0, 242, 255, 0.3);
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .card-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1rem;
        }
        .avatar {
          width: 2.5rem;
          height: 2.5rem;
          border-radius: 50%;
          background: linear-gradient(135deg, rgba(0, 242, 255, 0.3), rgba(255, 0, 230, 0.3));
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 1.1rem;
        }
        .card-title {
          flex: 1;
        }
        .card-title h3 {
          font-size: 1.25rem;
          font-weight: bold;
          background: linear-gradient(135deg, #00f2ff, #ff00e6);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        .confidence {
          font-size: 0.7rem;
          padding: 0.2rem 0.5rem;
          border-radius: 999px;
          background: rgba(0, 242, 255, 0.2);
          border: 1px solid rgba(0, 242, 255, 0.3);
          color: #00f2ff;
        }
        .card-details {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 0.5rem;
          margin-bottom: 1rem;
          font-size: 0.875rem;
        }
        .card-details span {
          color: #9ca3af;
          margin-right: 0.5rem;
        }
        .card-footer {
          border-top: 1px solid rgba(0, 242, 255, 0.2);
          padding-top: 0.75rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 0.5rem;
          font-size: 0.7rem;
          font-family: monospace;
        }
        .social-links {
          display: flex;
          gap: 0.75rem;
        }
        .ig-link, .yt-link {
          text-decoration: none;
          padding: 0.25rem 0.5rem;
          border-radius: 0.5rem;
          transition: all 0.2s;
        }
        .ig-link {
          background: rgba(255, 0, 230, 0.2);
          color: #ff00e6;
        }
        .yt-link {
          background: rgba(255, 0, 0, 0.2);
          color: #ff4d4d;
        }
        .ig-link:hover, .yt-link:hover {
          filter: brightness(1.2);
        }
        .sync-time {
          display: flex;
          gap: 0.5rem;
          color: #6b7280;
        }
        .sync-time span:last-child {
          color: #00f2ff;
        }

        /* Loading spinner */
        .loading-spinner {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 4rem;
          text-align: center;
        }
        .spinner {
          width: 3rem;
          height: 3rem;
          border: 3px solid rgba(0, 242, 255, 0.3);
          border-top-color: #00f2ff;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 1rem;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .loading-spinner p {
          color: #00f2ff;
          font-family: monospace;
          letter-spacing: 2px;
          animation: pulseGlow 1.5s infinite;
        }
        @keyframes pulseGlow {
          0% { text-shadow: 0 0 2px #00f2ff; opacity: 0.6; }
          50% { text-shadow: 0 0 10px #00f2ff; opacity: 1; }
          100% { text-shadow: 0 0 2px #00f2ff; opacity: 0.6; }
        }

        /* Footer */
        .footer {
          border-top: 1px solid rgba(0, 242, 255, 0.2);
          padding: 1rem;
          text-align: center;
          font-size: 0.7rem;
          font-family: monospace;
          color: #6b7280;
          display: flex;
          justify-content: center;
          gap: 1rem;
          flex-wrap: wrap;
        }
        .live {
          color: #00f2ff;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .header-content {
            flex-direction: column;
            align-items: flex-start;
          }
          .security-status {
            text-align: left;
          }
          .hero h2 {
            font-size: 1.8rem;
          }
          .stats-grid {
            grid-template-columns: 1fr;
          }
          .card-details {
            grid-template-columns: 1fr;
          }
          .card-footer {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;