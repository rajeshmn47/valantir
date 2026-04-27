import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ForceGraph2D from 'react-force-graph-2d';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { getProfile } from '../api';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

// ---------- ORIGINAL MOCK DATA (UNCHANGED) ----------
const generateMockProfile = (id) => {
  const profiles = {
    'ALQ3410149': {
      id: 'ALQ3410149',
      name: 'SUNIL KUMAR',
      aliases: ['Sunny', 'SK_2916', 'Reddy'],
      age: 21,
      location: { city: 'Gauribidanur', state: 'Karnataka', coordinates: [13.6, 77.5] },
      gender: 'Male',
      voterDetails: { father: 'ASHWATHAPPA', mother: 'Lakshmamma', houseNumber: 'MAIN ROAD', pollingStation: 'Govt Higher Primary School, Maraluru', partNo: 87 },
      social: {
        instagram: 'sunil_k_2916',
        youtube: 'sunil_gaming',
        twitter: '@sunil_k',
        facebook: 'sunil.kumar.9',
        linkedin: 'sunil-kumar-29'
      },
      profession: 'Student / Aspiring Gamer',
      education: 'B.A. Political Science, University of Mysore',
      employer: 'Freelance Content Creator',
      riskScore: 84,
      threatLevel: 'MEDIUM-HIGH',
      lastSeen: '2024-03-15T14:23:00Z',
      image: 'https://randomuser.me/api/portraits/men/32.jpg',
      bio: 'Political science student, passionate about gaming and social issues. Active on multiple platforms.',
      associates: [
        { id: 'a1', name: 'Ramesh K', relation: 'friend', profession: 'Software Engineer', image: 'https://randomuser.me/api/portraits/men/41.jpg' },
        { id: 'a2', name: 'Anitha S', relation: 'sister', profession: 'Teacher', image: 'https://randomuser.me/api/portraits/women/44.jpg' },
        { id: 'a3', name: 'Nagaraja', relation: 'father', profession: 'Farmer', image: 'https://randomuser.me/api/portraits/men/52.jpg' },
        { id: 'a4', name: 'Lakshmi', relation: 'mother', profession: 'Homemaker', image: 'https://randomuser.me/api/portraits/women/63.jpg' },
        { id: 'a5', name: 'Vikram Reddy', relation: 'cousin', profession: 'Startup Founder', image: 'https://randomuser.me/api/portraits/men/72.jpg' }
      ],
      familyTree: {
        nodes: [
          { id: '1', name: 'Nagaraja', type: 'father', gender: 'male', image: 'https://randomuser.me/api/portraits/men/52.jpg', profession: 'Farmer' },
          { id: '2', name: 'Lakshmi', type: 'mother', gender: 'female', image: 'https://randomuser.me/api/portraits/women/63.jpg', profession: 'Homemaker' },
          { id: '3', name: 'SUNIL KUMAR', type: 'self', gender: 'male', image: 'https://randomuser.me/api/portraits/men/32.jpg', profession: 'Student' },
          { id: '4', name: 'Anitha', type: 'sister', gender: 'female', image: 'https://randomuser.me/api/portraits/women/44.jpg', profession: 'Teacher' },
          { id: '5', name: 'Ramesh', type: 'brother', gender: 'male', image: 'https://randomuser.me/api/portraits/men/41.jpg', profession: 'Software Engineer' },
          { id: '6', name: 'Vikram', type: 'cousin', gender: 'male', image: 'https://randomuser.me/api/portraits/men/72.jpg', profession: 'Startup Founder' }
        ],
        connections: [
          { from: '1', to: '2', relation: 'wife' },
          { from: '1', to: '3', relation: 'father' },
          { from: '2', to: '3', relation: 'mother' },
          { from: '1', to: '4', relation: 'father' },
          { from: '1', to: '5', relation: 'father' },
          { from: '1', to: '6', relation: 'uncle' }
        ]
      },
      socialNetwork: {
        nodes: [
          { id: 'self', name: 'SUNIL KUMAR', group: 0, img: 'https://randomuser.me/api/portraits/men/32.jpg' },
          { id: 'ig1', name: 'gaming_freak', platform: 'instagram', group: 1 },
          { id: 'yt1', name: 'tech_reviews', platform: 'youtube', group: 1 },
          { id: 'tw1', name: '@political_wire', platform: 'twitter', group: 1 },
          { id: 'friend1', name: 'Ramesh', group: 2 },
          { id: 'friend2', name: 'Anjali', group: 2 }
        ],
        links: [
          { source: 'self', target: 'ig1' },
          { source: 'self', target: 'yt1' },
          { source: 'self', target: 'tw1' },
          { source: 'self', target: 'friend1' },
          { source: 'self', target: 'friend2' }
        ]
      },
      comments: {
        youtube: [
          { id: 'y1', video: 'Gaming Live Stream', text: 'Great gameplay! 🔥', date: '2024-03-10', likes: 45, replies: 3 },
          { id: 'y2', video: 'Political Debate 2024', text: 'Very insightful analysis', date: '2024-03-05', likes: 12, replies: 1 },
          { id: 'y3', video: 'Budget 2024 Breakdown', text: 'This is misleading', date: '2024-02-28', likes: 8, replies: 5 }
        ],
        instagram: [
          { id: 'i1', post: 'Sunset at Mysore Palace', text: 'Beautiful shot!', date: '2024-03-12', likes: 23 },
          { id: 'i2', post: 'New Gaming Setup', text: '🔥🔥', date: '2024-03-08', likes: 67 },
          { id: 'i3', post: 'Political Rally', text: 'Proud of our leader', date: '2024-02-25', likes: 89 }
        ],
        twitter: [
          { id: 't1', text: 'Just voted for the first time! #Elections2024', date: '2024-03-14', retweets: 12, likes: 45 },
          { id: 't2', text: 'Excited for the new season of my gaming channel', date: '2024-03-01', retweets: 2, likes: 23 }
        ]
      },
      amazonReviews: [
        { id: 'a1', product: 'Wireless Headphones', rating: 5, text: 'Amazing sound quality, perfect for gaming', date: '2024-02-20', helpful: 34 },
        { id: 'a2', product: 'Gaming Mouse', rating: 4, text: 'Good value, but a bit small', date: '2024-01-15', helpful: 12 },
        { id: 'a3', product: 'Desk Mat', rating: 5, text: 'Perfect for my setup', date: '2024-01-05', helpful: 8 }
      ],
      activityTimeline: [
        { date: '2024-03-15', type: 'twitter', content: 'Tweeted about election' },
        { date: '2024-03-14', type: 'instagram', content: 'Liked a post' },
        { date: '2024-03-13', type: 'youtube', content: 'Commented on gaming video' },
        { date: '2024-03-12', type: 'amazon', content: 'Reviewed headphones' }
      ],
      threatIndicators: [
        { name: 'Sentiment Analysis', value: 'Neutral', score: 0.4 },
        { name: 'Network Centrality', value: 'High', score: 0.85 },
        { name: 'Anomaly Detection', value: 'Low', score: 0.2 }
      ]
    }
  };
  return profiles[id] || profiles['ALQ3410149'];
};

const ProfilePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const graphRef = useRef();

  // Chart data for activity trend
  const activityData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
    datasets: [
      {
        label: 'Social Activity Score',
        data: [12, 19, 28, 45, 62],
        fill: true,
        backgroundColor: 'rgba(0, 242, 255, 0.2)',
        borderColor: '#00f2ff',
        tension: 0.4
      }
    ]
  };

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      try {
        const response = await getProfile(id);
        const realProfile = response.data?.profile || response.data;
        if (realProfile && realProfile._id) {
          const enriched = {
            id: realProfile.voterId || realProfile._id,
            _id: realProfile._id,
            name: realProfile.name,
            age: realProfile.age,
            location: {
              city: realProfile.address?.city || realProfile.location?.split(',')[0]?.trim() || 'Unknown',
              state: realProfile.location?.split(',')[1]?.trim() || 'Karnataka',
              coordinates: [realProfile.latitude || 13.6, realProfile.longitude || 77.5]
            },
            gender: 'Not specified',
            aliases: [],
            voterDetails: {
              father: realProfile.sourceMetadata?.fatherName || 'Unknown',
              mother: realProfile.sourceMetadata?.motherName || 'Unknown',
              houseNumber: realProfile.address?.street || '',
              pollingStation: realProfile.address?.boothId || 'Unknown',
              partNo: realProfile.address?.ward || ''
            },
            social: {
              instagram: realProfile.socialLinks?.instagram || '',
              youtube: realProfile.socialLinks?.youtube || '',
              twitter: realProfile.socialLinks?.twitter || '',
              facebook: realProfile.socialLinks?.facebook || '',
              linkedin: realProfile.socialLinks?.linkedin || ''
            },
            profession: realProfile.work || 'Not specified',
            education: realProfile.educationLevel || 'Not specified',
            employer: 'Unknown',
            riskScore: (realProfile.confidenceScore || 0.5) * 100,
            threatLevel: realProfile.confidenceScore > 0.7 ? 'MEDIUM-HIGH' : 'LOW',
            lastSeen: realProfile.lastContacted || new Date().toISOString(),
            image: `https://ui-avatars.com/api/?name=${encodeURIComponent(realProfile.name)}&background=0f172a&color=00f2ff&rounded=true`,
            avatar: `${realProfile.avatar}`,
            bio: realProfile.notes || 'No additional information available.',
            associates: (realProfile.family || []).map(rel => ({
              id: rel.relativeId?._id || rel.relativeId,
              name: rel.relativeId?.name || 'Unknown',      // shows actual name
              relation: rel.relationType,
              profession: rel.relativeId?.work || 'Unknown',
              image: rel.relativeId?.avatar || 'https://randomuser.me/api/portraits/lego/1.jpg'
            })),
            familyTree: null,
            socialNetwork: null,
            comments: { youtube: [], instagram: [], twitter: [] },
            amazonReviews: [],
            activityTimeline: [],
            threatIndicators: [
              { name: 'Sentiment Analysis', value: 'Neutral', score: 0.4 },
              { name: 'Network Centrality', value: 'Low', score: 0.2 }
            ]
          };
          setProfile(enriched);
        } else {
          throw new Error('No profile data');
        }
      } catch (error) {
        console.warn('Backend profile not found – using dummy data', error);
        const dummyProfile = generateMockProfile(id);
        setProfile(dummyProfile);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [id]);

  if (loading) {
    return (
      <div className="profile-container">
        <div className="bg-grid"></div>
        <div className="scanline"></div>
        <div className="loading-screen">
          <div className="spinner"></div>
          <p>DECRYPTING INTELLIGENCE DATA</p>
          <div className="data-stream"></div>
        </div>
      </div>
    );
  }

  if (!profile) return <div>Profile not found</div>;

  // The rest of the JSX is exactly as you had it (unchanged)
  // I'm including it below, but it's the same as your original return.

  return (
    <div className="profile-container">
      <div className="bg-grid"></div>
      <div className="scanline"></div>
      <div className="particle-stream"></div>
      <div className="profile-content">
        <div className="action-buttons">
          <button onClick={() => navigate('/')} className="back-btn">← BACK TO DASHBOARD</button>
          <button
            onClick={() => navigate(`/edit-profile/${profile._id || profile.id}`)}
            className="edit-profile-btn"
          >
            ✏️ EDIT PROFILE
          </button>
        </div>
        {/* HERO SECTION */}
        <div className="profile-hero">
          <div className="avatar-large" style={{ backgroundImage: `url(${profile.avatar})` }}>
            <div className="glow-ring"></div>
          </div>
          <div className="hero-info">
            <div className="name-section">
              <h1 className="glitch-text" data-text={profile.name}>{profile.name}</h1>
              <div className="aliases">AKA: {profile.aliases.join(' | ')}</div>
            </div>
            <div className="risk-panel">
              <div className="risk-score">
                <span>RISK SCORE</span>
                <strong>{profile.riskScore}</strong>
                <div className="risk-bar"><div style={{ width: `${profile.riskScore}%`, background: profile.riskScore > 70 ? '#ff0040' : '#00f2ff' }}></div></div>
              </div>
              <div className="threat-level">THREAT LEVEL: {profile.threatLevel}</div>
            </div>
            <div className="meta-grid">
              <div>🪪 {profile.id}</div>
              <div>🎂 {profile.age} years</div>
              <div>📍 {profile.location.city}, {profile.location.state}</div>
              <div>⚧ {profile.gender}</div>
              <div>💼 {profile.profession}</div>
              <div>🎓 {profile.education}</div>
            </div>
            <div className="bio">{profile.bio}</div>
            <div className="social-badges">
              {profile.social.instagram && <a href={`https://instagram.com/${profile.social.instagram}`} target="_blank" className="social-badge ig">📷 Instagram</a>}
              {profile.social.youtube && <a href={`https://youtube.com/@${profile.social.youtube}`} target="_blank" className="social-badge yt">📺 YouTube</a>}
              {profile.social.twitter && <a href={`https://twitter.com/${profile.social.twitter}`} target="_blank" className="social-badge tw">🐦 Twitter</a>}
              {profile.social.facebook && <a href={`https://facebook.com/${profile.social.facebook}`} target="_blank" className="social-badge fb">📘 Facebook</a>}
              {profile.social.linkedin && <a href={`https://linkedin.com/in/${profile.social.linkedin}`} target="_blank" className="social-badge li">🔗 LinkedIn</a>}
            </div>
          </div>
        </div>

        {/* TABS */}
        <div className="tabs">
          {['overview', 'family', 'network', 'footprint', 'voter', 'intel'].map(tab => (
            <button key={tab} className={`tab ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
              {tab === 'overview' && '🔍 OVERVIEW'}
              {tab === 'family' && '🌳 FAMILY & ASSOCIATES'}
              {tab === 'network' && '🕸️ SOCIAL NETWORK'}
              {tab === 'footprint' && '⏱️ DIGITAL FOOTPRINT'}
              {tab === 'voter' && '📋 VOTER DETAILS'}
              {tab === 'intel' && '🧠 PREDICTIVE INTEL'}
            </button>
          ))}
        </div>

        {/* TAB CONTENT */}
        <div className="tab-content">
          {activeTab === 'overview' && (
            <div className="overview-grid">
              <div className="info-card">
                <h3>📊 Correlation Summary</h3>
                <div className="stat-list">
                  <div><span>Instagram:</span> {profile.social.instagram ? '✅ Active' : '❌'}</div>
                  <div><span>YouTube:</span> {profile.social.youtube ? '✅ Active' : '❌'}</div>
                  <div><span>Twitter:</span> {profile.social.twitter ? '✅ Active' : '❌'}</div>
                  <div><span>Amazon Reviews:</span> {profile.amazonReviews.length} found</div>
                  <div><span>Last Seen:</span> {new Date(profile.lastSeen).toLocaleString()}</div>
                </div>
              </div>
              <div className="info-card">
                <h3>🎯 Professional Profile</h3>
                <ul>
                  <li><strong>Profession:</strong> {profile.profession}</li>
                  <li><strong>Employer:</strong> {profile.employer}</li>
                  <li><strong>Education:</strong> {profile.education}</li>
                </ul>
              </div>
              <div className="info-card full-width">
                <h3>📈 Activity Trend (Last 5 Months)</h3>
                <Line data={activityData} options={{ responsive: true, plugins: { legend: { labels: { color: '#e0e0e0' } } }, scales: { x: { ticks: { color: '#9ca3af' } }, y: { ticks: { color: '#9ca3af' } } } }} />
              </div>
            </div>
          )}

          {activeTab === 'family' && (
            <div className="family-section">
              <div className="family-tree">
                <h3>🌳 Family Tree (Real Relatives)</h3>
                <div className="tree-container">
                  {profile.familyTree?.nodes?.map(node => (
                    <div key={node.id} className="tree-node" style={{ marginLeft: node.type === 'self' ? '40px' : '0' }}>
                      <div className="tree-avatar" style={{ backgroundImage: `url(${node.image})` }}></div>
                      <div className="tree-info">
                        <strong>{node.name}</strong>
                        <span>{node.type}</span>
                        <span className="profession">{node.profession}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="associates-grid">
                <h3>🤝 Known Associates (Real Life)</h3>
                {profile.associates.map(assoc => (
                  <div
                    key={assoc.id}
                    className="associate-card"
                    onClick={() => {
                      if (assoc.id && assoc.id !== 'Unknown') {
                        navigate(`/profile/${assoc.id}`);
                      }
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="assoc-avatar" style={{ backgroundImage: `url(${assoc.image})` }}></div>
                    <div className="assoc-info">
                      <strong>{assoc.name}</strong>
                      <span>{assoc.relation}</span>
                      <span>{assoc.profession}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'network' && (
            <div className="network-graph">
              <h3>🕸️ Social Network Graph (Force-Directed)</h3>
              {profile.socialNetwork ? (
                <ForceGraph2D
                  graphData={profile.socialNetwork}
                  nodeLabel="name"
                  nodeAutoColorBy="group"
                  nodeCanvasObject={(node, ctx, globalScale) => {
                    const label = node.name;
                    const fontSize = 12 / globalScale;
                    ctx.font = `${fontSize}px Sans-Serif`;
                    ctx.fillStyle = node.group === 0 ? '#ff00e6' : '#00f2ff';
                    ctx.beginPath();
                    ctx.arc(node.x, node.y, 5, 0, 2 * Math.PI);
                    ctx.fill();
                    ctx.fillStyle = '#e0e0e0';
                    ctx.fillText(label, node.x + 8, node.y + 4);
                  }}
                  linkColor={() => 'rgba(0,242,255,0.4)'}
                  width={800}
                  height={500}
                  backgroundColor="rgba(0,0,0,0)"
                />
              ) : (
                <p className="no-data">No social network data available for this profile.</p>
              )}
            </div>
          )}

          {activeTab === 'footprint' && (
            <div className="footprint-tab">
              <div className="feed-columns">
                <div className="feed-col">
                  <h3>📺 YouTube Comments</h3>
                  {profile.comments.youtube.map(c => (
                    <div key={c.id} className="feed-item">
                      <div className="feed-content">
                        <p><strong>{c.video}</strong></p>
                        <p>"{c.text}"</p>
                        <div className="feed-meta">👍 {c.likes} | 💬 {c.replies} replies | 📅 {c.date}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="feed-col">
                  <h3>📷 Instagram Comments</h3>
                  {profile.comments.instagram.map(c => (
                    <div key={c.id} className="feed-item">
                      <div className="feed-content">
                        <p>Post: {c.post}</p>
                        <p>"{c.text}"</p>
                        <div className="feed-meta">❤️ {c.likes} | 📅 {c.date}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="feed-col">
                  <h3>🐦 Twitter Activity</h3>
                  {profile.comments.twitter.map(c => (
                    <div key={c.id} className="feed-item">
                      <div className="feed-content">
                        <p>"{c.text}"</p>
                        <div className="feed-meta">🔁 {c.retweets} | ❤️ {c.likes} | 📅 {c.date}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="feed-col">
                  <h3>🛒 Amazon Reviews</h3>
                  {profile.amazonReviews.map(r => (
                    <div key={r.id} className="feed-item">
                      <div className="feed-content">
                        <p><strong>{r.product}</strong> – ⭐ {r.rating}/5</p>
                        <p>"{r.text}"</p>
                        <div className="feed-meta">👍 {r.helpful} helpful | 📅 {r.date}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'voter' && (
            <div className="info-card">
              <h3>📄 Electoral Roll Data (Government Source)</h3>
              <table className="details-table">
                <tbody>
                  <tr><td>Voter ID</td><td>{profile.id}</td></tr>
                  <tr><td>Name</td><td>{profile.name}</td></tr>
                  <tr><td>Father's Name</td><td>{profile.voterDetails.father}</td></tr>
                  <tr><td>Mother's Name</td><td>{profile.voterDetails.mother}</td></tr>
                  <tr><td>House Number</td><td>{profile.voterDetails.houseNumber}</td></tr>
                  <tr><td>Polling Station</td><td>{profile.voterDetails.pollingStation}</td></tr>
                  <tr><td>Part Number</td><td>{profile.voterDetails.partNo}</td></tr>
                  <tr><td>Qualifying Date</td><td>01-04-2024</td></tr>
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'intel' && (
            <div className="intel-grid">
              <div className="info-card">
                <h3>🧠 Behavioral Analysis</h3>
                {profile.threatIndicators.map(ind => (
                  <div key={ind.name} className="indicator">
                    <span>{ind.name}</span>
                    <span>{ind.value}</span>
                    <div className="indicator-bar"><div style={{ width: `${ind.score * 100}%`, background: '#00f2ff' }}></div></div>
                  </div>
                ))}
              </div>
              <div className="info-card">
                <h3>⚠️ Predicted Next Actions</h3>
                <ul>
                  <li>High probability of engagement on political hashtags in next 48h</li>
                  <li>Potential to join new gaming community (discord)</li>
                  <li>Sentiment shift detected – monitor for radicalisation</li>
                </ul>
              </div>
              <div className="info-card full-width">
                <h3>📡 Live Data Stream (Simulated)</h3>
                <div className="data-stream">
                  <div>🟢 2024-03-15 14:23: New Instagram comment detected</div>
                  <div>🟡 2024-03-15 12:10: YouTube channel subscription increased by 5%</div>
                  <div>🔴 2024-03-14 22:05: Retweeted political content</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        /* All styles unchanged – same as your original */
        .profile-container {
          position: relative;
          min-height: 100vh;
          background: #050508;
          color: #e0e0e0;
          font-family: 'Inter', monospace;
          overflow-x: hidden;
        }
        .bg-grid {
          position: fixed;
          inset: 0;
          background-image: linear-gradient(rgba(0,242,255,0.08) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(0,242,255,0.08) 1px, transparent 1px);
          background-size: 40px 40px;
          animation: gridMove 20s linear infinite;
          pointer-events: none;
        }
        @keyframes gridMove {
          0% { background-position: 0 0; }
          100% { background-position: 40px 40px; }
        }
        .scanline {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: repeating-linear-gradient(0deg, rgba(0,255,255,0.02) 0px, rgba(0,255,255,0.02) 2px, transparent 2px, transparent 8px);
          pointer-events: none;
          animation: scanlineMove 8s linear infinite;
          z-index: 999;
        }
        @keyframes scanlineMove {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
        .particle-stream {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: radial-gradient(circle at 20% 40%, rgba(0,242,255,0.03) 0%, transparent 50%);
          pointer-events: none;
        }
        .profile-content {
          position: relative;
          z-index: 10;
          max-width: 1400px;
          margin: 0 auto;
          padding: 2rem;
        }
        .back-btn {
          background: rgba(0,242,255,0.1);
          border: 1px solid #00f2ff;
          padding: 0.5rem 1.2rem;
          border-radius: 2rem;
          color: #00f2ff;
          cursor: pointer;
          margin-bottom: 2rem;
          font-family: monospace;
          transition: all 0.2s;
        }
        .back-btn:hover { background: #00f2ff20; transform: translateX(-4px); }
        
        /* Hero */
        .profile-hero {
          display: flex;
          flex-wrap: wrap;
          gap: 2rem;
          background: rgba(12,12,20,0.7);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(0,242,255,0.3);
          border-radius: 2rem;
          padding: 2rem;
          margin-bottom: 2rem;
          box-shadow: 0 0 40px rgba(0,0,0,0.5);
        }
        .avatar-large {
          width: 140px;
          height: 140px;
          border-radius: 50%;
          background-size: cover;
          background-position: center;
          position: relative;
          border: 2px solid #00f2ff;
          box-shadow: 0 0 20px rgba(0,242,255,0.5);
        }
        .glow-ring {
          position: absolute;
          inset: -4px;
          border-radius: 50%;
          border: 1px solid #ff00e6;
          animation: pulseRing 2s infinite;
        }
        @keyframes pulseRing {
          0% { opacity: 0.5; transform: scale(1); }
          100% { opacity: 0; transform: scale(1.3); }
        }
        .hero-info { flex: 1; }
        .glitch-text {
          font-size: 2.2rem;
          font-weight: 800;
          background: linear-gradient(135deg, #00f2ff, #ff00e6);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          animation: glitch-skew 3s infinite;
        }
        .aliases { font-size: 0.8rem; color: #9ca3af; margin-top: 0.2rem; }
        .risk-panel { display: flex; align-items: center; gap: 2rem; margin: 1rem 0; }
        .risk-score { background: #00000080; padding: 0.5rem 1rem; border-radius: 1rem; border-left: 4px solid #ff0040; }
        .risk-score strong { font-size: 2rem; margin-left: 0.5rem; }
        .risk-bar { width: 100px; height: 4px; background: #333; margin-top: 0.3rem; }
        .risk-bar div { height: 100%; border-radius: 2px; }
        .threat-level { font-family: monospace; color: #ff0040; letter-spacing: 1px; }
        .meta-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 0.5rem; margin: 1rem 0; font-size: 0.8rem; }
        .bio { border-left: 3px solid #00f2ff; padding-left: 1rem; font-style: italic; margin: 1rem 0; }
        .social-badges { display: flex; gap: 0.8rem; flex-wrap: wrap; }
        .social-badge { text-decoration: none; padding: 0.3rem 0.8rem; border-radius: 2rem; font-size: 0.7rem; transition: all 0.2s; }
        .social-badge.ig { background: #ff00e620; border: 1px solid #ff00e6; color: #ff00e6; }
        .social-badge.yt { background: #ff000020; border: 1px solid #ff0000; color: #ff0000; }
        .social-badge.tw { background: #1da1f220; border: 1px solid #1da1f2; color: #1da1f2; }
        .social-badge:hover { transform: scale(1.05); filter: brightness(1.2); }
        
        /* Tabs */
        .tabs { display: flex; gap: 0.5rem; border-bottom: 1px solid rgba(0,242,255,0.3); margin-bottom: 2rem; flex-wrap: wrap; }
        .tab { background: transparent; border: none; padding: 0.7rem 1.5rem; color: #9ca3af; font-family: monospace; cursor: pointer; transition: all 0.2s; }
        .tab.active { color: #00f2ff; border-bottom: 2px solid #00f2ff; text-shadow: 0 0 5px rgba(0,242,255,0.5); }
        
        /* Cards & Grids */
        .info-card { background: rgba(12,12,20,0.75); backdrop-filter: blur(12px); border: 1px solid rgba(0,242,255,0.2); border-radius: 1rem; padding: 1.5rem; margin-bottom: 1.5rem; transition: all 0.3s; }
        .info-card:hover { border-color: #00f2ff; box-shadow: 0 0 20px rgba(0,242,255,0.2); }
        .full-width { grid-column: 1 / -1; }
        .overview-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1.5rem; }
        .stat-list div { margin: 0.5rem 0; font-family: monospace; }
        
        /* Family & Associates */
        .family-section { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; }
        .tree-container { display: flex; flex-wrap: wrap; gap: 1rem; justify-content: center; }
        .tree-node { background: rgba(0,242,255,0.1); border-radius: 1rem; padding: 0.8rem; text-align: center; width: 120px; border: 1px solid rgba(0,242,255,0.3); }
        .tree-avatar { width: 60px; height: 60px; border-radius: 50%; background-size: cover; margin: 0 auto 0.5rem; border: 1px solid #00f2ff; }
        .tree-info strong { display: block; font-size: 0.9rem; }
        .tree-info span { font-size: 0.7rem; color: #9ca3af; display: block; }
        .profession { font-size: 0.65rem; color: #ff00e6; }
        .associates-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem; }
        .associate-card { background: rgba(12,12,20,0.75); border-radius: 1rem; padding: 0.8rem; display: flex; gap: 1rem; align-items: center; border: 1px solid rgba(0,242,255,0.2); }
        .assoc-avatar { width: 50px; height: 50px; border-radius: 50%; background-size: cover; }
        .assoc-info strong { display: block; font-size: 0.9rem; }
        .assoc-info span { font-size: 0.7rem; color: #9ca3af; }
        
        /* Social Footprint */
        .feed-columns { display: flex; gap: 1.5rem; overflow-x: auto; padding-bottom: 1rem; }
        .feed-col { min-width: 320px; background: rgba(12,12,20,0.75); border-radius: 1rem; padding: 1rem; border: 1px solid rgba(0,242,255,0.2); }
        .feed-item { border-bottom: 1px solid rgba(0,242,255,0.1); padding: 0.8rem 0; }
        .feed-meta { font-size: 0.7rem; color: #9ca3af; margin-top: 0.3rem; }
        
        /* Intel */
        .intel-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem; }
        .indicator { margin: 1rem 0; }
        .indicator-bar { height: 4px; background: #333; margin-top: 0.3rem; }
        .data-stream div { font-family: monospace; font-size: 0.7rem; border-left: 2px solid #00f2ff; padding-left: 0.5rem; margin: 0.5rem 0; }
        
        /* Table */
        .details-table { width: 100%; border-collapse: collapse; }
        .details-table td { padding: 0.7rem; border-bottom: 1px solid rgba(0,242,255,0.2); }
        .details-table td:first-child { font-weight: bold; width: 35%; color: #00f2ff; }
        
        /* Network Graph */
        .network-graph { background: rgba(0,0,0,0.4); border-radius: 1rem; padding: 1rem; height: 550px; }
        
        /* Loading */
        .loading-screen { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; }
        .spinner { width: 50px; height: 50px; border: 3px solid rgba(0,242,255,0.3); border-top-color: #00f2ff; border-radius: 50%; animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        
        @media (max-width: 768px) {
          .profile-hero { flex-direction: column; align-items: center; text-align: center; }
          .meta-grid { justify-content: center; }
          .family-section { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
};

export default ProfilePage;