import React, { useState, useEffect } from 'react';
import { Bar, Pie, Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement);

const Analytics = () => {
  // Mock data from extracted voters
  const [ageGroups, setAgeGroups] = useState({ '18-30': 0, '31-45': 0, '46-60': 0, '60+': 0 });
  const [genderData, setGenderData] = useState({ Male: 0, Female: 0 });
  const [topLocations, setTopLocations] = useState([]);

  useEffect(() => {
    // Simulate analytics from extracted voters
    const mockVoters = JSON.parse(localStorage.getItem('mockVoters')) || [
      { name: "Nirmala N", age: 30, location: "Gauribidanur", gender: "Female" },
      { name: "MK Parwathamma", age: 37, location: "Gauribidanur", gender: "Female" },
      { name: "Anithamma", age: 36, location: "Gauribidanur", gender: "Female" },
      { name: "SUNIL KUMAR", age: 21, location: "Gauribidanur", gender: "Male" },
      { name: "GANGAMMA", age: 80, location: "Gauribidanur", gender: "Female" },
      { name: "Gopala", age: 49, location: "Gauribidanur", gender: "Male" },
      { name: "Sharadamma", age: 46, location: "Gauribidanur", gender: "Female" },
      { name: "Shobha.G.S", age: 44, location: "Gauribidanur", gender: "Female" },
      { name: "Ashok Nayaka.M.A", age: 34, location: "Gauribidanur", gender: "Male" }
    ];
    const groups = { '18-30': 0, '31-45': 0, '46-60': 0, '60+': 0 };
    const genders = { Male: 0, Female: 0 };
    const locCount = {};
    mockVoters.forEach(v => {
      if (v.age >= 18 && v.age <= 30) groups['18-30']++;
      else if (v.age <= 45) groups['31-45']++;
      else if (v.age <= 60) groups['46-60']++;
      else groups['60+']++;
      if (v.gender === 'Male') genders.Male++;
      else if (v.gender === 'Female') genders.Female++;
      locCount[v.location] = (locCount[v.location] || 0) + 1;
    });
    setAgeGroups(groups);
    setGenderData(genders);
    setTopLocations(Object.entries(locCount).sort((a,b) => b[1]-a[1]).slice(0,5));
  }, []);

  const barData = {
    labels: Object.keys(ageGroups),
    datasets: [{ label: 'Voters', data: Object.values(ageGroups), backgroundColor: '#00f2ff80', borderColor: '#00f2ff', borderWidth: 1 }]
  };
  const pieData = {
    labels: Object.keys(genderData),
    datasets: [{ data: Object.values(genderData), backgroundColor: ['#00f2ff', '#ff00e6'] }]
  };

  return (
    <div className="analytics-container">
      <div className="grid-bg"></div>
      <div className="scanline"></div>
      <div className="content">
        <h1 className="page-title">📈 Voter Demographics</h1>
        <div className="charts-grid">
          <div className="chart-card">
            <h3>Age Distribution</h3>
            <Bar data={barData} options={{ responsive: true, plugins: { legend: { labels: { color: '#e0e0e0' } } } }} />
          </div>
          <div className="chart-card">
            <h3>Gender Ratio</h3>
            <Pie data={pieData} options={{ responsive: true, plugins: { legend: { labels: { color: '#e0e0e0' } } } }} />
          </div>
          <div className="chart-card full-width">
            <h3>Top Locations</h3>
            <ul className="location-list">
              {topLocations.map(([loc, count]) => (
                <li key={loc}><span>{loc}</span><span>{count} voters</span></li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      <style>{`
        .analytics-container { position: relative; min-height: 100vh; background: #050508; color: #e0e0e0; font-family: 'Inter', monospace; }
        .grid-bg { position: fixed; inset: 0; background-image: linear-gradient(rgba(0,242,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(0,242,255,0.06) 1px, transparent 1px); background-size: 40px 40px; animation: gridMove 20s linear infinite; pointer-events: none; }
        @keyframes gridMove { 0% { background-position: 0 0; } 100% { background-position: 40px 40px; } }
        .scanline { position: fixed; inset: 0; background: repeating-linear-gradient(0deg, rgba(0,255,255,0.02) 0px, rgba(0,255,255,0.02) 2px, transparent 2px, transparent 8px); pointer-events: none; animation: scanlineMove 8s linear infinite; z-index: 999; }
        @keyframes scanlineMove { 0% { transform: translateY(-100%); } 100% { transform: translateY(100%); } }
        .content { position: relative; z-index: 10; max-width: 1280px; margin: 0 auto; padding: 2rem; }
        .page-title { font-size: 2rem; margin-bottom: 2rem; background: linear-gradient(135deg, #00f2ff, #ff00e6); -webkit-background-clip: text; background-clip: text; color: transparent; font-weight: 800; }
        .charts-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 2rem; }
        .chart-card { background: rgba(12,12,20,0.75); backdrop-filter: blur(12px); border: 1px solid rgba(0,242,255,0.2); border-radius: 1rem; padding: 1.5rem; transition: all 0.3s; }
        .chart-card:hover { transform: translateY(-4px); border-color: #00f2ff; box-shadow: 0 0 20px rgba(0,242,255,0.3); }
        .full-width { grid-column: 1 / -1; }
        .location-list { list-style: none; padding: 0; }
        .location-list li { display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid rgba(0,242,255,0.2); font-family: monospace; }
        @media (max-width: 768px) { .charts-grid { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
};

export default Analytics;