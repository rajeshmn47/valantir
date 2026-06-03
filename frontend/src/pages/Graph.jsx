import React, { useState, useRef, useEffect } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import {
    LayoutGrid, Search, Map as MapIcon, Image as ImageIcon, Database, FileText,
    ChevronRight, Bell, Globe, Circle
} from 'lucide-react';

const Graph = () => {
    const fgRef = useRef();
    const [imageCache, setImageCache] = useState({});

    // --- CENTRAL PERSON: OSAMA BIN LADEN ---
    const centralPerson = {
        id: 'central',
        label: 'Osama bin Laden',
        val: 25,
        group: 0,
        initials: 'OB',
        isCentral: true,
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=OsamaBinLaden&backgroundColor=transparent&size=64'
    };

    const firstDegrees = [
        'Mohammed Atta', 'Khalid Sheikh Mohammed', 'Abu Musab al-Zarqawi', 'Ayman al-Zawahiri',
        'Mohammed Omar', 'Abu Bakr al-Baghdadi', 'Ramzi bin al-Shibh', 'Muhammad Atef'
    ];

    const secondDegrees = [
        'Zacarias Moussaoui', 'Marwan al-Shehhi', 'Hani Hanjour', 'Nawaf al-Hazmi',
        'Khalid al-Mihdhar', 'Saeed al-Ghamdi', 'Ahmed al-Haznawi', 'Ahmad al-Nami',
        'Wail al-Shehri', 'Waleed al-Shehri', 'Satam al-Suqami', 'Mohand al-Shehri'
    ];

    const allPeople = [
        centralPerson,
        ...firstDegrees.map((name, i) => ({
            id: `node-${i + 1}`,
            label: name,
            val: 10 + Math.floor(Math.random() * 6),
            group: 1,
            initials: name.split(' ').map(w => w[0]).join(''),
            isCentral: false,
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name.replace(/\s/g, '')}&backgroundColor=transparent&size=64`
        })),
        ...secondDegrees.map((name, i) => ({
            id: `node-${i + 10}`,
            label: name,
            val: 6 + Math.floor(Math.random() * 4),
            group: 2,
            initials: name.split(' ').map(w => w[0]).join(''),
            isCentral: false,
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name.replace(/\s/g, '')}&backgroundColor=transparent&size=64`
        }))
    ];

    const centralLinks = firstDegrees.map((name, i) => ({
        source: 'central',
        target: `node-${i + 1}`,
        weight: 3 + Math.floor(Math.random() * 3),
        curvature: 0.1
    }));

    const secondaryLinks = [];
    for (let i = 0; i < firstDegrees.length; i++) {
        const numConnections = 2 + Math.floor(Math.random() * 2);
        for (let j = 0; j < numConnections; j++) {
            const targetIdx = Math.floor(Math.random() * secondDegrees.length);
            secondaryLinks.push({
                source: `node-${i + 1}`,
                target: `node-${targetIdx + 10}`,
                weight: 1 + Math.floor(Math.random() * 2),
                curvature: 0.2 + Math.random() * 0.3
            });
        }
    }

    const tertiaryLinks = [];
    for (let i = 0; i < 10; i++) {
        const a = Math.floor(Math.random() * secondDegrees.length) + 10;
        let b;
        do {
            b = Math.floor(Math.random() * secondDegrees.length) + 10;
        } while (a === b);
        tertiaryLinks.push({
            source: `node-${a}`,
            target: `node-${b}`,
            weight: 1,
            curvature: 0.3
        });
    }

    const allLinks = [...centralLinks, ...secondaryLinks, ...tertiaryLinks];

    const [graphData] = useState({ nodes: allPeople, links: allLinks });
    const [stats] = useState({
        totalPeople: 1452,
        connections: 9811,
        migrationEvents: 345,
        verifiedFaces: 2103
    });

    // Preload all avatar images
    useEffect(() => {
        const loadAllImages = async () => {
            const cache = {};
            const promises = allPeople.map((node) => {
                return new Promise((resolve) => {
                    const img = new Image();
                    img.crossOrigin = 'Anonymous';
                    img.src = node.avatar;
                    img.onload = () => {
                        cache[node.id] = img;
                        resolve();
                    };
                    img.onerror = () => {
                        const fallbackImg = new Image();
                        fallbackImg.crossOrigin = 'Anonymous';
                        fallbackImg.src = `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><circle cx="32" cy="32" r="32" fill="${node.isCentral ? '#3b82f6' : ['#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899'][node.group % 5]}"/><text x="32" y="36" font-size="20" text-anchor="middle" fill="white" font-weight="bold">${node.initials}</text></svg>`;
                        fallbackImg.onload = () => {
                            cache[node.id] = fallbackImg;
                            resolve();
                        };
                        fallbackImg.onerror = () => resolve();
                    };
                });
            });
            await Promise.all(promises);
            setImageCache(cache);
        };
        loadAllImages();
    }, []);

    useEffect(() => {
        if (fgRef.current) {
            setTimeout(() => fgRef.current.zoomToFit(500), 300);
        }
    }, []);

    const styles = {
        container: {
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: '#0F172A',
            display: 'flex',
            flexDirection: 'row',
            overflow: 'hidden',
            fontFamily: 'sans-serif',
            color: '#e2e8f0'
        },
        leftSidebar: {
            width: '260px',
            backgroundColor: '#111927',
            borderRight: '1px solid #1f2d42',
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            overflowY: 'auto',
            flexShrink: 0
        },
        logoContainer: {
            padding: '16px',
            borderBottom: '1px solid #1f2d42',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
        },
        logoIcon: {
            color: '#3b82f6',
            fontSize: '24px',
            fontWeight: 'bold'
        },
        logoText: {
            fontSize: '18px',
            fontWeight: 'bold',
            color: 'white'
        },
        navContainer: {
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px'
        },
        branchSection: {
            marginTop: '16px',
            padding: '0 16px'
        },
        branchTitle: {
            fontSize: '14px',
            fontWeight: '600',
            color: 'white',
            marginBottom: '8px'
        },
        branchList: {
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
        },
        branchItem: {
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '8px',
            borderRadius: '8px',
            cursor: 'pointer'
        },
        branchAvatar: {
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: '#2a3441',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            fontWeight: 'bold',
            color: 'white'
        },
        branchInfo: {
            flex: 1
        },
        branchName: {
            fontSize: '14px',
            color: 'white'
        },
        branchMembers: {
            fontSize: '11px',
            color: '#9ca3af'
        },
        centerArea: {
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            backgroundColor: '#0b121e',
            minWidth: 0,
            flexShrink: 1
        },
        topBar: {
            height: '50px',
            display: 'flex',
            alignItems: 'center',
            padding: '0 16px',
            borderBottom: '1px solid #1f2d42',
            backgroundColor: '#111927',
            justifyContent: 'space-between'
        },
        topBarLeft: {
            fontSize: '12px',
            color: 'white'
        },
        topBarRight: {
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
        },
        avatar: {
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: '#8b5cf6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '12px'
        },
        graphContainer: {
            flex: 1,
            position: 'relative',
            overflow: 'hidden',
            minHeight: 0
        },
        rightSidebar: {
            position: 'absolute',
            top: 0,
            right: 0,
            width: '320px',
            height: '50%',
            backgroundColor: '#111927',
            borderLeft: '1px solid #1f2d42',
            borderBottom: '1px solid #1f2d42',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            overflowY: 'auto',
            zIndex: 20,
            borderBottomLeftRadius: '12px'
        },
        rightCard: {
            backgroundColor: '#1f2937',
            borderRadius: '12px',
            padding: '16px',
            border: '1px solid #374151'
        },
        rightTitle: {
            fontWeight: '600',
            color: 'white',
            marginBottom: '12px'
        },
        inputGroup: {
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
        },
        input: {
            width: '100%',
            backgroundColor: '#111927',
            border: '1px solid #374151',
            borderRadius: '8px',
            padding: '8px',
            fontSize: '14px',
            color: 'white',
            outline: 'none'
        },
        button: {
            width: '100%',
            backgroundColor: '#3b82f6',
            color: 'white',
            padding: '8px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            border: 'none',
            cursor: 'pointer'
        },
        geoContainer: {
            width: '100%',
            height: '128px',
            backgroundColor: '#0b121e',
            borderRadius: '8px',
            border: '1px solid #374151',
            marginBottom: '16px'
        },
        donutContainer: {
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
        },
        donut: {
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: 'conic-gradient(#10b981 0% 12%, #3b82f6 12% 35%, #eab308 35% 55%, #a855f7 55% 70%, #6b7280 70% 100%)'
        },
        legendItem: {
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
        },
        legendDot: {
            width: '6px',
            height: '6px',
            borderRadius: '50%'
        },
        aiInsights: {
            position: 'absolute',
            bottom: '16px',
            right: '16px',
            backgroundColor: 'rgba(31, 41, 55, 0.9)',
            backdropFilter: 'blur(4px)',
            border: '1px solid #374151',
            borderRadius: '12px',
            padding: '16px',
            width: '256px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            zIndex: 10
        },
        aiTitle: {
            fontSize: '14px',
            fontWeight: 'bold',
            color: 'white',
            marginBottom: '12px'
        },
        aiList: {
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            marginBottom: '16px'
        },
        aiItem: {
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
            fontSize: '12px',
            color: '#d1d5db',
            cursor: 'pointer'
        },
        aiCompleteness: {
            fontSize: '10px',
            color: '#9ca3af',
            marginBottom: '4px'
        },
        progressBar: {
            width: '100%',
            backgroundColor: '#374151',
            borderRadius: '4px',
            height: '6px'
        },
        progressFill: {
            backgroundColor: '#10b981',
            height: '6px',
            borderRadius: '4px',
            width: '78%'
        },
        statsBar: {
            position: 'absolute',
            bottom: '16px',
            left: '16px',
            backgroundColor: 'rgba(31, 41, 55, 0.9)',
            backdropFilter: 'blur(4px)',
            border: '1px solid #374151',
            borderRadius: '12px',
            padding: '12px 24px',
            display: 'flex',
            gap: '24px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            zIndex: 10
        },
        statItem: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
        },
        statLabel: {
            fontSize: '10px',
            color: '#9ca3af'
        },
        statValue: {
            fontSize: '18px',
            fontWeight: 'bold',
            color: '#60a5fa'
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.leftSidebar}>
                <div style={styles.logoContainer}>
                    <div style={styles.logoIcon}>K</div>
                    <h1 style={styles.logoText}>Kith & Kin</h1>
                </div>
                <div style={styles.navContainer}>
                    <NavItem active icon={<Globe size={18} />} label="Global Graph" styles={styles} />
                    <NavItem icon={<Search size={18} />} label="Discovery" styles={styles} />
                    <NavItem icon={<MapIcon size={18} />} label="Migration Map" styles={styles} />
                    <NavItem icon={<ImageIcon size={18} />} label="Photo Clusters" styles={styles} />
                    <NavItem icon={<Database size={18} />} label="Manage Data" styles={styles} />
                    <NavItem icon={<FileText size={18} />} label="Reports" styles={styles} />
                </div>
                <div style={styles.branchSection}>
                    <div style={styles.branchTitle}>BRANCHES & COMMUNITIES</div>
                    <div style={styles.branchList}>
                        {['Desai-Khan', 'Miller-Chen', 'Sarah Lunkm', 'Mille-Chen'].map((name, i) => (
                            <div key={i} style={styles.branchItem}>
                                <div style={styles.branchAvatar}>{name.split(' ').map(w => w[0]).join('')}</div>
                                <div style={styles.branchInfo}>
                                    <div style={styles.branchName}>{name} Branch</div>
                                    <div style={styles.branchMembers}>{Math.floor(Math.random() * 50) + 50} members</div>
                                </div>
                                <ChevronRight size={14} color="#6b7280" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div style={styles.centerArea}>
                <div style={styles.topBar}>
                    <div style={styles.topBarLeft}>Force Graph</div>
                    <div style={styles.topBarRight}>
                        <Bell size={18} color="#9ca3af" />
                        <div style={styles.avatar}>OB</div>
                    </div>
                </div>

                <div style={styles.graphContainer}>
                    <ForceGraph2D
                        ref={fgRef}
                        graphData={graphData}
                        nodeLabel="label"
                        nodeCanvasObject={(node, ctx, globalScale) => {
                            const img = imageCache[node.id];
                            const radius = node.isCentral ? 24 / globalScale : 14 / globalScale;

                            if (img) {
                                ctx.save();
                                ctx.beginPath();
                                ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);
                                ctx.clip();
                                ctx.drawImage(img, node.x - radius, node.y - radius, radius * 2, radius * 2);
                                ctx.restore();

                                if (node.isCentral) {
                                    ctx.beginPath();
                                    ctx.arc(node.x, node.y, radius + 2, 0, 2 * Math.PI);
                                    ctx.strokeStyle = 'rgba(59, 130, 246, 0.6)';
                                    ctx.lineWidth = 4 / globalScale;
                                    ctx.stroke();

                                    const gradient = ctx.createRadialGradient(node.x, node.y, radius, node.x, node.y, radius * 2.5);
                                    gradient.addColorStop(0, 'rgba(59, 130, 246, 0.2)');
                                    gradient.addColorStop(1, 'rgba(59, 130, 246, 0)');
                                    ctx.beginPath();
                                    ctx.arc(node.x, node.y, radius * 2.5, 0, 2 * Math.PI);
                                    ctx.fillStyle = gradient;
                                    ctx.fill();
                                }
                            }

                            if (globalScale > 0.4) {
                                ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
                                ctx.font = `${node.isCentral ? 12 / globalScale : 10 / globalScale}px Sans-Serif`;
                                ctx.textAlign = 'center';
                                ctx.textBaseline = 'top';
                                ctx.fillText(node.label, node.x, node.y + radius + 3 / globalScale);
                            }
                        }}
                        nodeRelSize={20}
                        linkColor={() => '#475569'}
                        linkWidth={(link) => {
                            if (link.source.id === 'central' || link.target.id === 'central') {
                                return 4;
                            }
                            return Math.min(link.weight / 2, 3);
                        }}
                        linkDirectionalParticles={(link) => {
                            if (link.source.id === 'central' || link.target.id === 'central') {
                                return 4;
                            }
                            return 1;
                        }}
                        linkDirectionalParticleSpeed={0.005}
                        linkCurvature={(link) => link.curvature || 0.15}
                        cooldownTicks={150}
                        warmupTicks={50}
                        d3AlphaDecay={0.015}
                        d3VelocityDecay={0.3}
                    />

                    <div style={styles.rightSidebar}>
                        <div style={styles.rightCard}>
                            <h3 style={styles.rightTitle}>RELATIONSHIP FINDER</h3>
                            <div style={styles.inputGroup}>
                                <input type="text" placeholder="Person A" style={styles.input} />
                                <input type="text" placeholder="Person B" style={styles.input} />
                                <button style={styles.button}>Find Relationship</button>
                            </div>
                            <div style={{ marginTop: '12px', fontSize: '11px', color: '#9ca3af', borderTop: '1px solid #374151', paddingTop: '12px' }}>
                                <span>Automatically calculated shortest path</span>
                                <div style={{ color: '#60a5fa', marginTop: '4px' }}>Mohammed Atta → Khalid Sheikh Mohammed → Osama bin Laden</div>
                            </div>
                        </div>

                        <div style={styles.rightCard}>
                            <h3 style={styles.rightTitle}>GEOGRAPHIC DISTRIBUTION</h3>
                            <div style={styles.geoContainer}></div>
                            <div style={styles.donutContainer}>
                                <div style={styles.donut}></div>
                                <div style={{ fontSize: '10px', color: '#d1d5db' }}>
                                    <div style={styles.legendItem}><span style={{ ...styles.legendDot, backgroundColor: '#10b981' }}></span> Afghanistan (12%)</div>
                                    <div style={styles.legendItem}><span style={{ ...styles.legendDot, backgroundColor: '#3b82f6' }}></span> Saudi Arabia (8%)</div>
                                    <div style={styles.legendItem}><span style={{ ...styles.legendDot, backgroundColor: '#eab308' }}></span> Pakistan (35%)</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div style={styles.aiInsights}>
                        <div style={styles.aiTitle}>AI INSIGHTS & TASKS</div>
                        <div style={styles.aiList}>
                            {['Verify 15 new Photo Clusters', 'Resolve duplicate node: Mohammed Atta', 'Review 2 migration paths'].map((text, i) => (
                                <div key={i} style={styles.aiItem}>
                                    <Circle size={10} color="#6b7280" style={{ marginTop: '2px' }} />
                                    <span>{text}</span>
                                </div>
                            ))}
                        </div>
                        <div style={styles.aiCompleteness}>Graph Completeness: 78%</div>
                        <div style={styles.progressBar}>
                            <div style={styles.progressFill}></div>
                        </div>
                    </div>

                    <div style={styles.statsBar}>
                        <div style={styles.statItem}>
                            <div style={styles.statLabel}>Total People:</div>
                            <div style={styles.statValue}>{stats.totalPeople.toLocaleString()}</div>
                        </div>
                        <div style={styles.statItem}>
                            <div style={styles.statLabel}>Connections:</div>
                            <div style={styles.statValue}>{stats.connections.toLocaleString()}</div>
                        </div>
                        <div style={styles.statItem}>
                            <div style={styles.statLabel}>Migration Events:</div>
                            <div style={styles.statValue}>{stats.migrationEvents.toLocaleString()}</div>
                        </div>
                        <div style={styles.statItem}>
                            <div style={styles.statLabel}>Verified Faces:</div>
                            <div style={styles.statValue}>{stats.verifiedFaces.toLocaleString()}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const NavItem = ({ icon, label, active, styles }) => (
    <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '8px 12px',
        borderRadius: '6px',
        cursor: 'pointer',
        backgroundColor: active ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
        color: active ? '#60a5fa' : '#9ca3af',
        transition: 'background-color 0.2s'
    }}>
        <div style={{ color: active ? '#60a5fa' : '#6b7280' }}>{icon}</div>
        <span style={{ fontSize: '14px', fontWeight: '500' }}>{label}</span>
    </div>
);

export default Graph;