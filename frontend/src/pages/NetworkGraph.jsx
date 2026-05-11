import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import ForceGraph2D from 'react-force-graph-2d';

const API_BASE = 'http://localhost:5000/api';

const NetworkGraph = () => {
  const [sources, setSources] = useState([]);
  const [selectedSource, setSelectedSource] = useState('');
  const [graphData, setGraphData] = useState({ nodes: [], edges: [] });
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const fgRef = useRef();

  useEffect(() => {
    fetchSources();
  }, []);

  useEffect(() => {
    if (selectedSource) {
      fetchNetworkData();
    }
  }, [selectedSource]);

  const fetchSources = async () => {
    try {
      const res = await axios.get(`${API_BASE}/sources`);
      setSources(res.data);
      if (res.data.length > 0) setSelectedSource(res.data[0]);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchNetworkData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/network`, {
        params: { source: selectedSource }
      });
      
      setGraphData({
        nodes: res.data.nodes,
        links: res.data.edges
      });
      setStats({
        totalPeople: res.data.totalPeople,
        totalPhotos: res.data.totalPhotos,
        totalCoAppearances: res.data.totalCoAppearances
      });
    } catch (err) {
      console.error('Failed to fetch network:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{ color: 'white', padding: '1rem' }}>Loading network...</div>;

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#111', color: 'white' }}>
      {/* Toolbar */}
      <div style={{ padding: '1rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', borderBottom: '1px solid #374151' }}>
        <label>Account:</label>
        <select
          value={selectedSource}
          onChange={(e) => setSelectedSource(e.target.value)}
          style={{ padding: '0.3rem 0.8rem', borderRadius: '0.375rem', backgroundColor: '#374151', color: 'white', border: 'none' }}
        >
          {sources.map(src => <option key={src} value={src}>{src}</option>)}
        </select>
        
        <div style={{ display: 'flex', gap: '2rem', marginLeft: 'auto', fontSize: '0.8rem' }}>
          <span>👥 People: {stats.totalPeople}</span>
          <span>📷 Photos: {stats.totalPhotos}</span>
          <span>🔗 Connections: {stats.totalCoAppearances}</span>
        </div>
      </div>

      {/* Network Graph */}
      <div style={{ flex: 1, position: 'relative' }}>
        <ForceGraph2D
          ref={fgRef}
          graphData={graphData}
          nodeLabel="label"
          nodeColor={(node) => {
            // Color by degree or influence
            const degree = graphData.links.filter(l => l.source === node.id || l.target === node.id).length;
            if (degree > 10) return '#ff6b6b';
            if (degree > 5) return '#4ecdc4';
            return '#45b7d1';
          }}
          nodeRelSize={6}
          linkColor={() => '#888'}
          linkWidth={(link) => Math.min(link.weight / 2, 5)}
          linkDirectionalParticles={2}
          linkDirectionalParticleSpeed={0.005}
          onNodeClick={(node) => {
            // Highlight connected nodes
            const connectedIds = new Set();
            graphData.links.forEach(link => {
              if (link.source === node.id) connectedIds.add(link.target);
              if (link.target === node.id) connectedIds.add(link.source);
            });
            
            fgRef.current.nodeColor(n => 
              n.id === node.id ? '#ff0' : 
              connectedIds.has(n.id) ? '#f90' : 
              '#aaa'
            );
          }}
          cooldownTicks={100}
          warmupTicks={100}
          d3AlphaDecay={0.02}
          d3VelocityDecay={0.3}
        />
      </div>

      {/* Instructions */}
      <div style={{ padding: '0.5rem 1rem', fontSize: '0.7rem', color: '#666', borderTop: '1px solid #374151' }}>
        💡 Drag to move • Scroll to zoom • Click node to highlight connections
      </div>
    </div>
  );
};

export default NetworkGraph;