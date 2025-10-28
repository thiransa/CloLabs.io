import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Builder.css';
import logo from './assets/17F007DC-F981-4891-AED4-6F81382D4181.PNG';

const Builder = () => {
  const navigate = useNavigate();
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState('apps');
  const [selectedNode, setSelectedNode] = useState(null);
  const [rightSidebarExpanded, setRightSidebarExpanded] = useState(false);
  const [nodes, setNodes] = useState([]);
  const [connections, setConnections] = useState([]);
  const [zoom, setZoom] = useState(1);
  const [draggingNode, setDraggingNode] = useState(null);
  const [dragOffset, setDragOffset] = useState({x: 0, y: 0});
  const [drawingConnection, setDrawingConnection] = useState(null);
  const [tempLine, setTempLine] = useState(null);
  const [wasDragging, setWasDragging] = useState(false);
  const canvasRef = useRef(null);
  const draggingNodeRef = useRef(null);
  const drawingConnectionRef = useRef(null);
  const zoomRef = useRef(1);
  const dragOffsetRef = useRef({x: 0, y: 0});
  const nodesRef = useRef([]);
  const connectionsRef = useRef([]);

  const toggleSidebar = () => {
    setSidebarExpanded(!sidebarExpanded);
  };

  const handleTabClick = (tab) => {
    setActiveTab(tab);
  };

  const toggleRightSidebar = () => {
    setRightSidebarExpanded(!rightSidebarExpanded);
  };

  const selectNode = (nodeData) => {
    setSelectedNode(nodeData);
    setRightSidebarExpanded(true);
  };

  const closeRightSidebar = () => {
    setSelectedNode(null);
    setRightSidebarExpanded(false);
  };

  const addNode = (type, x = 400, y = 300) => {
    const newNode = {
      id: Date.now(),
      type,
      title: getNodeTitle(type),
      x,
      y,
      width: 200,
      height: 80,
    };
    setNodes([...nodes, newNode]);
  };

  const getNodeTitle = (type) => {
    switch (type) {
      case 'trigger': return 'When new email received';
      case 'action': return 'Send message to Slack';
      case 'condition': return 'If subject contains';
      case 'delay': return 'Delay 5 minutes';
      default: return 'Node';
    }
  };

  const getNodeIcon = (type) => {
    switch (type) {
      case 'trigger':
        return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>;
      case 'action':
        return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 2L11 13"/><path d="M22 2L15 22 11 13 2 9 22 2z"/></svg>;
      case 'condition':
        return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 12l2 2 4-4"/><path d="M21 12c-1.5-3-4-6-9-6s-7.5 3-9 6c1.5 3 4 6 9 6s7.5-3 9-6z"/></svg>;
      case 'delay':
        return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>;
      default:
        return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>;
    }
  };

  const handleZoomIn = () => {
    setZoom(Math.min(zoom * 1.2, 3));
  };

  const handleZoomOut = () => {
    setZoom(Math.max(zoom / 1.2, 0.5));
  };

  const handleFitToScreen = () => {
    setZoom(1);
  };

  const handleCanvasClick = (e) => {
    if (draggingNode || drawingConnection) return;
    if (e.target === e.currentTarget) {
      // Clicked on canvas background
      setSelectedNode(null);
      setRightSidebarExpanded(false);
    }
  };

  const handleCanvasContextMenu = (e) => {
    e.preventDefault();
    if (draggingNode || drawingConnection) return;
    // Open add node panel or show context menu
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;
    // For now, add a trigger node at click position
    addNode('trigger', x, y);
  };

  const handleNodeMouseDown = (e, node) => {
    e.stopPropagation();
    setWasDragging(false);
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left) / zoom;
    const mouseY = (e.clientY - rect.top) / zoom;
    setDraggingNode(node.id);
    setDragOffset({x: mouseX - node.x, y: mouseY - node.y});
    draggingNodeRef.current = node.id;
    dragOffsetRef.current = {x: mouseX - node.x, y: mouseY - node.y};
  };

  useEffect(() => {
    draggingNodeRef.current = draggingNode;
    drawingConnectionRef.current = drawingConnection;
    zoomRef.current = zoom;
    dragOffsetRef.current = dragOffset;
    nodesRef.current = nodes;
    connectionsRef.current = connections;
  });

  const handleMouseMove = (e) => {
    if (draggingNodeRef.current) {
      setWasDragging(true);
      const rect = canvasRef.current.getBoundingClientRect();
      const mouseX = (e.clientX - rect.left) / zoomRef.current;
      const mouseY = (e.clientY - rect.top) / zoomRef.current;
      setNodes(nodes => nodes.map(n => n.id === draggingNodeRef.current ? {...n, x: mouseX - dragOffsetRef.current.x, y: mouseY - dragOffsetRef.current.y} : n));
    }
    if (drawingConnectionRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const mouseX = (e.clientX - rect.left) / zoomRef.current;
      const mouseY = (e.clientY - rect.top) / zoomRef.current;
      setTempLine(prev => ({...prev, x2: mouseX, y2: mouseY}));
    }
  };

  const handleMouseUp = (e) => {
    if (draggingNodeRef.current) {
      setDraggingNode(null);
      draggingNodeRef.current = null;
    }
    if (drawingConnectionRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const mouseX = (e.clientX - rect.left) / zoomRef.current;
      const mouseY = (e.clientY - rect.top) / zoomRef.current;
      // Check for connection
      const targetNode = nodesRef.current.find(n => {
        if (n.id === drawingConnectionRef.current.from) return false;
        const inputX = n.x - n.width / 2 - 6;
        const inputY = n.y;
        const dist = Math.sqrt((mouseX - inputX) ** 2 + (mouseY - inputY) ** 2);
        return dist < 40;
      });
      if (targetNode) {
        setConnections(connections => [...connections, {
          id: Date.now(),
          fromNode: drawingConnectionRef.current.from,
          toNode: targetNode.id
        }]);
      }
      setDrawingConnection(null);
      setTempLine(null);
      drawingConnectionRef.current = null;
    }
  };

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const handleConnectionMouseDown = (e, nodeId, point) => {
    e.stopPropagation();
    if (point === 'output') {
      const node = nodes.find(n => n.id === nodeId);
      const x = node.x + node.width / 2 - 6;
      const y = node.y;
      setDrawingConnection({from: nodeId, point});
      setTempLine({x1: x, y1: y, x2: x, y2: y});
      drawingConnectionRef.current = {from: nodeId, point};
    }
  };

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingNode, drawingConnection, zoom, nodes, connections]);

  return (
    <div className="builder-container">
      {/* Logo and Brand Text in Upper Left Corner */}
      <div className="builder-logo-stack">
        <img src={logo} alt="CloLabs Logo" className="builder-logo" />
        <div className="builder-logo-text">Clolabs<span className="separator">|</span><span className="builder-text">Builder</span></div>
      </div>
      
      {/* Header Actions - Right Upper Corner */}
      <div className="builder-header-actions">
        <button className="header-btn home-btn" title="Home" onClick={() => navigate('/dashboard')}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9,22 9,12 15,12 15,22"/>
          </svg>
        </button>
        <button className="header-btn save-btn" title="Save">Save</button>
        <button className="header-btn share-btn" title="Share">Share</button>
        <button className="header-btn run-btn" title="Run">Run</button>
      </div>
      
      {/* Left Sidebar - Node/App Library */}
      <div className={`builder-sidebar ${sidebarExpanded ? 'expanded' : 'collapsed'}`}>
        <div className="builder-sidebar-toggle" onClick={toggleSidebar}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </div>
        
        {/* Sidebar Tabs */}
        <div className="builder-sidebar-tabs">
          <div 
            className={`builder-tab ${activeTab === 'apps' ? 'active' : ''}`}
            onClick={() => handleTabClick('apps')}
          >
            <div className="builder-tab-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <rect x="9" y="9" width="6" height="6"/>
                <path d="M9 1v6M15 1v6M9 17v6M15 17v6M1 9h6M1 15h6M17 9h6M17 15h6"/>
              </svg>
            </div>
            <span className="builder-tab-text">Apps</span>
          </div>
          
          <div 
            className={`builder-tab ${activeTab === 'logic' ? 'active' : ''}`}
            onClick={() => handleTabClick('logic')}
          >
            <div className="builder-tab-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
              </svg>
            </div>
            <span className="builder-tab-text">Logic</span>
          </div>
          
          <div 
            className={`builder-tab ${activeTab === 'templates' ? 'active' : ''}`}
            onClick={() => handleTabClick('templates')}
          >
            <div className="builder-tab-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14,2 14,8 20,8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10,9 9,9 8,9"/>
              </svg>
            </div>
            <span className="builder-tab-text">Templates</span>
          </div>
          
          <div 
            className={`builder-tab ${activeTab === 'snippets' ? 'active' : ''}`}
            onClick={() => handleTabClick('snippets')}
          >
            <div className="builder-tab-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 12l2 2 4-4"/>
                <path d="M21 12c-1.5-3-4-6-9-6s-7.5 3-9 6c1.5 3 4 6 9 6s7.5-3 9-6z"/>
              </svg>
            </div>
            <span className="builder-tab-text">My Snippets</span>
          </div>
        </div>
        
        {/* Tab Content */}
        <div className="builder-sidebar-content">
          {/* Apps Tab */}
          {activeTab === 'apps' && (
            <div className="tab-content">
              <h3 className="tab-title">Available Apps</h3>
              <div className="apps-grid">
                <div className="app-item">
                  <div className="app-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                      <polyline points="22,6 12,13 2,6"/>
                    </svg>
                  </div>
                  <span className="app-name">Gmail</span>
                  <button className="app-add-btn">Add</button>
                </div>
                
                <div className="app-item">
                  <div className="app-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                  </div>
                  <span className="app-name">Slack</span>
                  <button className="app-add-btn">Add</button>
                </div>
                
                <div className="app-item">
                  <div className="app-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14,2 14,8 20,8"/>
                      <line x1="16" y1="13" x2="8" y2="13"/>
                      <line x1="16" y1="17" x2="8" y2="17"/>
                      <polyline points="10,9 9,9 8,9"/>
                    </svg>
                  </div>
                  <span className="app-name">Notion</span>
                  <button className="app-add-btn">Add</button>
                </div>
                
                <div className="app-item">
                  <div className="app-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14,2 14,8 20,8"/>
                      <line x1="16" y1="13" x2="8" y2="13"/>
                      <line x1="16" y1="17" x2="8" y2="17"/>
                      <polyline points="10,9 9,9 8,9"/>
                    </svg>
                  </div>
                  <span className="app-name">Google Sheets</span>
                  <button className="app-add-btn">Add</button>
                </div>
                
                <div className="app-item">
                  <div className="app-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                      <line x1="16" y1="2" x2="16" y2="6"/>
                      <line x1="8" y1="2" x2="8" y2="6"/>
                      <line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                  </div>
                  <span className="app-name">Google Calendar</span>
                  <button className="app-add-btn">Add</button>
                </div>
                
                <div className="app-item">
                  <div className="app-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                      <rect x="7" y="7" width="3" height="9"/>
                      <rect x="14" y="7" width="3" height="5"/>
                    </svg>
                  </div>
                  <span className="app-name">Trello</span>
                  <button className="app-add-btn">Add</button>
                </div>
              </div>
            </div>
          )}
          
          {/* Logic Tab */}
          {activeTab === 'logic' && (
            <div className="tab-content">
              <h3 className="tab-title">Logic Components</h3>
              <div className="logic-items">
                <div className="logic-item">
                  <div className="logic-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 12l2 2 4-4"/>
                      <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z"/>
                    </svg>
                  </div>
                  <span className="logic-name">Condition</span>
                  <button className="logic-add-btn">Add</button>
                </div>
                
                <div className="logic-item">
                  <div className="logic-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                      <polyline points="3.27,6.96 12,12.01 20.73,6.96"/>
                      <line x1="12" y1="22.08" x2="12" y2="12"/>
                    </svg>
                  </div>
                  <span className="logic-name">Loop</span>
                  <button className="logic-add-btn">Add</button>
                </div>
                
                <div className="logic-item">
                  <div className="logic-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Z"/>
                      <circle cx="12" cy="12" r="3"/>
                      <path d="M12 1v6M12 17v6M4.22 4.22l4.24 4.24M15.54 15.54l4.24 4.24M1 12h6M17 12h6M4.22 19.78l4.24-4.24M15.54 8.46l4.24-4.24"/>
                    </svg>
                  </div>
                  <span className="logic-name">AI Tool</span>
                  <button className="logic-add-btn">Add</button>
                </div>
                
                <div className="logic-item">
                  <div className="logic-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <polyline points="12,6 12,12 16,14"/>
                    </svg>
                  </div>
                  <span className="logic-name">Delay</span>
                  <button className="logic-add-btn">Add</button>
                </div>
              </div>
            </div>
          )}
          
          {/* Templates Tab */}
          {activeTab === 'templates' && (
            <div className="tab-content">
              <h3 className="tab-title">Templates</h3>
              <div className="template-items">
                <div className="template-item">
                  <div className="template-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                  </div>
                  <div className="template-info">
                    <span className="template-name">Welcome Flow</span>
                    <span className="template-desc">Onboard new users</span>
                  </div>
                  <button className="template-use-btn">Use</button>
                </div>
                
                <div className="template-item">
                  <div className="template-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
                      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
                    </svg>
                  </div>
                  <div className="template-info">
                    <span className="template-name">Task Alert</span>
                    <span className="template-desc">Notify about deadlines</span>
                  </div>
                  <button className="template-use-btn">Use</button>
                </div>
                
                <div className="template-item">
                  <div className="template-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="20" x2="18" y2="10"/>
                      <line x1="12" y1="20" x2="12" y2="4"/>
                      <line x1="6" y1="20" x2="6" y2="14"/>
                    </svg>
                  </div>
                  <div className="template-info">
                    <span className="template-name">Report Generator</span>
                    <span className="template-desc">Auto-generate reports</span>
                  </div>
                  <button className="template-use-btn">Use</button>
                </div>
              </div>
            </div>
          )}
          
          {/* My Snippets Tab */}
          {activeTab === 'snippets' && (
            <div className="tab-content">
              <h3 className="tab-title">My Snippets</h3>
              <div className="snippets-empty">
                <div className="empty-state">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M9 12l2 2 4-4"/>
                    <path d="M21 12c-1.5-3-4-6-9-6s-7.5 3-9 6c1.5 3 4 6 9 6s7.5-3 9-6z"/>
                  </svg>
                  <p>No saved snippets yet</p>
                  <button className="create-snippet-btn">Create First Snippet</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Builder Title */}
      <div className="builder-title">
        <input 
          type="text" 
          defaultValue="Untitled" 
          className="builder-title-input"
          placeholder="Enter workflow name..."
        />
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="builder-title-icon">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
      </div>
      
      {/* Main Builder Area */}
      <div className={`builder-main ${sidebarExpanded ? 'sidebar-expanded' : 'sidebar-collapsed'} ${rightSidebarExpanded ? 'right-sidebar-expanded' : 'right-sidebar-collapsed'}`}>
        {/* Builder Canvas */}
        <div className="builder-canvas-wrapper">
          <div ref={canvasRef} className="builder-canvas-grid" onClick={handleCanvasClick} onContextMenu={handleCanvasContextMenu}>
            <div className="canvas-grid-bg" style={{ transform: `scale(${zoom})`, transformOrigin: 'center' }}></div>
            <div className="canvas-content" style={{ transform: `scale(${zoom})`, transformOrigin: 'center' }}>
              {/* Render Nodes */}
              {nodes.map(node => (
                <div
                  key={node.id}
                  className={`canvas-node ${node.type}-node ${draggingNode === node.id ? 'dragging' : ''}`}
                  style={{
                    transform: `translate(${node.x - node.width / 2}px, ${node.y - node.height / 2}px)`,
                    width: node.width,
                    height: node.height,
                  }}
                  onMouseDown={(e) => handleNodeMouseDown(e, node)}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (wasDragging) {
                      setWasDragging(false);
                      return;
                    }
                    selectNode(node);
                  }}
                >
                  <div className="node-header">
                    <div className="node-icon">
                      {getNodeIcon(node.type)}
                    </div>
                    <span className="node-title">{node.title}</span>
                  </div>
                  <div className="node-content">
                    {/* Node specific content */}
                  </div>
                  <div className="connection-point input-point" onMouseDown={(e) => handleConnectionMouseDown(e, node.id, 'input')}></div>
                  <div className="connection-point output-point" onMouseDown={(e) => handleConnectionMouseDown(e, node.id, 'output')}></div>
                </div>
              ))}
              
              {/* Render Connections */}
              <svg className="canvas-connections" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
                {connections.map(conn => {
                  const fromNode = nodes.find(n => n.id === conn.fromNode);
                  const toNode = nodes.find(n => n.id === conn.toNode);
                  if (!fromNode || !toNode) return null;
                  const x1 = fromNode.x + fromNode.width / 2;
                  const y1 = fromNode.y;
                  const x2 = toNode.x - toNode.width / 2;
                  const y2 = toNode.y;
                  return (
                    <line
                      key={conn.id}
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke="rgba(255,255,255,0.6)"
                      strokeWidth="2"
                      markerEnd="url(#arrowhead)"
                    />
                  );
                })}
                {tempLine && (
                  <line
                    x1={tempLine.x1}
                    y1={tempLine.y1}
                    x2={tempLine.x2}
                    y2={tempLine.y2}
                    stroke="rgba(255,255,255,0.5)"
                    strokeWidth="2"
                    strokeDasharray="5,5"
                  />
                )}
                <defs>
                  <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" fill="rgba(255,255,255,0.6)" />
                  </marker>
                </defs>
              </svg>
            </div>
            
            {/* Canvas Bottom Bar */}
            <div className="canvas-bottom-bar">
              {/* Node Type Buttons */}
              <div className="node-types">
                <button className="node-type-btn trigger-node" title="Add Trigger Node" onClick={() => addNode('trigger')}>
                  Trigger
                </button>
                <button className="node-type-btn action-node" title="Add Action Node" onClick={() => addNode('action')}>
                  Action
                </button>
                <button className="node-type-btn condition-node" title="Add Condition Node" onClick={() => addNode('condition')}>
                  Condition
                </button>
                <button className="node-type-btn delay-node" title="Add Delay Node" onClick={() => addNode('delay')}>
                  Delay
                </button>
              </div>
              
              {/* Zoom Controls */}
              <div className="zoom-controls">
                <button className="zoom-btn" title="Zoom Out" onClick={handleZoomOut}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/></svg>
                </button>
                <span className="zoom-label">{Math.round(zoom * 100)}%</span>
                <button className="zoom-btn" title="Zoom In" onClick={handleZoomIn}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                </button>
                <button className="zoom-btn fit-btn" title="Fit to Screen" onClick={handleFitToScreen}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><polyline points="9,3 9,9 3,9"/><polyline points="15,21 15,15 21,15"/></svg>
                </button>
              </div>
              
              {/* Add Node Button */}
              <button className="add-node-btn" title="Add Node" onClick={() => addNode('action')}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19"/>
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Right Sidebar - Properties/Config Panel */}
      <div className={`builder-right-sidebar ${rightSidebarExpanded ? 'expanded' : 'collapsed'}`}>
        
        {rightSidebarExpanded && selectedNode && (
          <div className="config-panel">
            <div className="config-header">
              <h3 className="config-title">Node Configuration</h3>
              <button className="config-close-btn" onClick={closeRightSidebar}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            
            <div className="config-content">
              {/* Node Title */}
              <div className="config-section">
                <label className="config-label">Node Title</label>
                <input 
                  type="text" 
                  className="config-input" 
                  defaultValue={selectedNode.title}
                  placeholder="Enter node title..."
                />
              </div>
              
              {/* App Connection */}
              <div className="config-section">
                <label className="config-label">App Connection</label>
                <select className="config-select">
                  <option value="">Connect {selectedNode.type}</option>
                  <option value="account1">{selectedNode.type} Account 1</option>
                  <option value="account2">{selectedNode.type} Account 2</option>
                  <option value="new">+ Add New Connection</option>
                </select>
              </div>
              
              {/* Action Type */}
              <div className="config-section">
                <label className="config-label">Action Type</label>
                <select className="config-select" defaultValue={selectedNode.action}>
                  <option value="Send Email">Send Email</option>
                  <option value="Read Email">Read Email</option>
                  <option value="Read Label">Read Label</option>
                  <option value="Create Draft">Create Draft</option>
                </select>
              </div>
              
              {/* Configuration Fields */}
              <div className="config-section">
                <label className="config-label">Recipient</label>
                <input 
                  type="email" 
                  className="config-input" 
                  placeholder="user@example.com"
                />
              </div>
              
              <div className="config-section">
                <label className="config-label">Subject</label>
                <input 
                  type="text" 
                  className="config-input" 
                  placeholder="Email subject..."
                />
              </div>
              
              <div className="config-section">
                <label className="config-label">Message</label>
                <textarea 
                  className="config-textarea" 
                  rows="4"
                  placeholder="Email message content..."
                ></textarea>
              </div>
              
              {/* Action Buttons */}
              <div className="config-actions">
                <button className="config-test-btn">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="5,3 19,12 5,21 5,3"/>
                  </svg>
                  Test Node
                </button>
                
                <div className="config-secondary-actions">
                  <button className="config-duplicate-btn">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                    </svg>
                    Duplicate
                  </button>
                  
                  <button className="config-delete-btn">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3,6 5,6 21,6"/>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                      <line x1="10" y1="11" x2="10" y2="17"/>
                      <line x1="14" y1="11" x2="14" y2="17"/>
                    </svg>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Builder;