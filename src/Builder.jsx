import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { 
  Search, Star, Zap, Mail, FileText, FolderOpen, Bell, 
  Database, Settings, ChevronDown, ChevronRight, Plus, Minus,
  Share2, X, Play, Clock, MessageSquare, Save, Home,
  Sparkles, CheckCircle2, Circle
} from 'lucide-react';
import { useAuth } from './contexts/AuthContext';
import { saveWorkflowToSupabase, loadWorkflow } from './lib/workflowApi.js';
import { fetchUserIntegrations } from './lib/integrationsApi.js';
import { simulateWorkflow } from './lib/simulationApi.js';
import { executeWorkflow, subscribeToExecution } from './lib/executionApi.js';
import { saveWorkflowRun } from './lib/runApi.js';
import SimulationLogPanel from './components/SimulationLogPanel.jsx';
import RunHistory from './components/RunHistory.jsx';
import GPTNodeEditor from './components/GPTNodeEditor.jsx';
import AIHelperChat from './components/AIHelperChat.jsx';
import './Builder.css';

const Builder = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const { user } = useAuth();
  
  // Workflow data structure: each workflow has its own canvas state
  const [workflows, setWorkflows] = useState({
    1: { id: 1, name: 'Draft', nodes: [], connections: [], nodeCounter: 1, connectionCounter: 1, supabaseId: null },
    2: { id: 2, name: 'Form-test-client', nodes: [], connections: [], nodeCounter: 1, connectionCounter: 1, supabaseId: null },
    3: { id: 3, name: 'Email automation', nodes: [], connections: [], nodeCounter: 1, connectionCounter: 1, supabaseId: null }
  });
  
  const [openWorkflowIds, setOpenWorkflowIds] = useState([1, 2, 3]);
  const [activeWorkflow, setActiveWorkflow] = useState(1);
  const [workflowCounter, setWorkflowCounter] = useState(4);
  const [editingTabId, setEditingTabId] = useState(null);
  const [editingTabName, setEditingTabName] = useState('');
  
  const [zoom, setZoom] = useState(100);
  const [expandedSections, setExpandedSections] = useState({
    favorites: true,
    basic: true,
    integration: true,
    functions: false,
    stores: false
  });
  const [activeRightTab, setActiveRightTab] = useState('setup');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Canvas interaction state
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [draggedNode, setDraggedNode] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [connectingFrom, setConnectingFrom] = useState(null);
  const [tempConnection, setTempConnection] = useState(null);
  const [editingNodeId, setEditingNodeId] = useState(null);
  const [editingNodeLabel, setEditingNodeLabel] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  // Webhook integrations state
  const [userWebhooks, setUserWebhooks] = useState([]);
  const [webhooksLoading, setWebhooksLoading] = useState(false);

  // Simulation state
  const [simulationTimeline, setSimulationTimeline] = useState(null);
  const [simulationSummary, setSimulationSummary] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [highlightedNodeId, setHighlightedNodeId] = useState(null);

  // Live execution state
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionId, setExecutionId] = useState(null);
  const [executionTimeline, setExecutionTimeline] = useState(null);
  const [executionSummary, setExecutionSummary] = useState(null);
  const [executionSubscription, setExecutionSubscription] = useState(null);

  // Share modal state
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [shareError, setShareError] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);

  // Track loaded workflow to prevent duplicate loading
  const loadedWorkflowRef = useRef(null);

  // Load workflow from query parameter on mount
  const workflowIdParam = searchParams.get('workflow');
  
  useEffect(() => {
    console.log('[Builder] useEffect triggered, workflowIdParam:', workflowIdParam, 'loadedWorkflowRef:', loadedWorkflowRef.current);
    
    // Only run once when workflowIdParam changes and hasn't been loaded yet
    if (!workflowIdParam || loadedWorkflowRef.current === workflowIdParam) {
      console.log('[Builder] Skipping workflow load - no param or already loaded');
      return;
    }
    
    // Additional check: see if this workflow is already open by supabaseId
    const alreadyOpenWorkflow = Object.values(workflows).find(
      w => w.supabaseId === workflowIdParam
    );
    
    if (alreadyOpenWorkflow) {
      console.log('[Builder] Workflow already open in tab, switching to it:', alreadyOpenWorkflow.id);
      setActiveWorkflow(alreadyOpenWorkflow.id);
      loadedWorkflowRef.current = workflowIdParam;
      return;
    }
    
    const loadWorkflowFromQuery = async () => {
      console.log('[Builder] Loading workflow from URL:', workflowIdParam);
      try {
        const result = await loadWorkflow(workflowIdParam);
        console.log('[Builder] loadWorkflow result:', result);
        if (result.success && result.data) {
          const loadedWorkflow = result.data;
          
          // Mark as loaded immediately to prevent re-runs
          loadedWorkflowRef.current = workflowIdParam;
          
          // Check if this workflow is already open
          setWorkflows(prevWorkflows => {
            const alreadyOpen = Object.values(prevWorkflows).find(
              w => w.supabaseId === loadedWorkflow.id
            );
            
            if (alreadyOpen) {
              // Just switch to the existing tab
              console.log('[Builder] Workflow already open, switching to tab:', alreadyOpen.id);
              setActiveWorkflow(alreadyOpen.id);
              return prevWorkflows; // No state change needed
            }
            
            // Create new workflow with a new ID
            const newId = workflowCounter;
            const newWorkflow = {
              id: newId,
              name: loadedWorkflow.name,
              nodes: loadedWorkflow.nodes || [],
              connections: loadedWorkflow.connections || [],
              nodeCounter: (loadedWorkflow.nodes?.length || 0) + 1,
              connectionCounter: (loadedWorkflow.connections?.length || 0) + 1,
              supabaseId: loadedWorkflow.id
            };
            
            console.log('[Builder] Creating new tab for workflow:', loadedWorkflow.name, 'with ID:', newId);
            
            // Update counter, open IDs, and active workflow
            setWorkflowCounter(newId + 1);
            setOpenWorkflowIds(prevIds => {
              // Prevent duplicate IDs
              if (prevIds.includes(newId)) {
                console.warn('[Builder] Workflow ID already in openWorkflowIds, not adding duplicate');
                return prevIds;
              }
              return [...prevIds, newId];
            });
            setActiveWorkflow(newId);
            
            // Return updated workflows with the new workflow
            return {
              ...prevWorkflows,
              [newId]: newWorkflow
            };
          });
        } else {
          console.error('Error loading workflow:', result.error);
        }
      } catch (error) {
        console.error('Error loading workflow:', error);
      }
    };
    
    loadWorkflowFromQuery();
  }, [workflowIdParam]); // Only depend on workflowIdParam
  
  // Handle AI-generated workflow from Dashboard
  useEffect(() => {
    if (location.state?.generatedWorkflow) {
      console.log('[Builder] Loading AI-generated workflow:', location.state.generatedWorkflow);
      
      const generatedData = location.state.generatedWorkflow;
      const workflowName = location.state.workflowName || 'AI Generated Workflow';
      
      // Create a new workflow tab with the generated content
      const newId = workflowCounter;
      
      // Process nodes and connections
      const processedNodes = generatedData.nodes?.map((node, index) => ({
        id: `node${index + 1}`,
        type: node.type || 'action',
        label: node.label || `Node ${index + 1}`,
        position: node.position || { x: 50 + (index * 200), y: 100 },
        data: { config: node.config || {} }
      })) || [];
      
      const processedConnections = (generatedData.edges || generatedData.connections || []).map((edge, index) => {
        const sourceNode = processedNodes[parseInt(edge.source) || 0];
        const targetNode = processedNodes[parseInt(edge.target) || 1];
        return {
          id: `conn${index + 1}`,
          source: sourceNode?.id || `node${parseInt(edge.source) + 1}`,
          target: targetNode?.id || `node${parseInt(edge.target) + 1}`
        };
      });
      
      setWorkflows(prev => ({
        ...prev,
        [newId]: {
          id: newId,
          name: workflowName,
          nodes: processedNodes,
          connections: processedConnections,
          nodeCounter: processedNodes.length + 1,
          connectionCounter: processedConnections.length + 1,
          supabaseId: null
        }
      }));
      
      setOpenWorkflowIds(prev => [...prev, newId]);
      setActiveWorkflow(newId);
      setWorkflowCounter(prev => prev + 1);
      
      // Clear the navigation state to prevent reloading on refresh
      window.history.replaceState({}, document.title);
      
      console.log('[Builder] AI workflow loaded:', processedNodes.length, 'nodes');
    }
  }, [location.state]);
  
  // Load user webhooks on mount
  useEffect(() => {
    const loadWebhooks = async () => {
      console.log('[Builder] Loading user webhooks...');
      setWebhooksLoading(true);
      const { data, error } = await fetchUserIntegrations();
      if (error) {
        console.error('[Builder] Error loading webhooks:', error);
      } else {
        console.log('[Builder] Loaded webhooks:', data?.length || 0);
        setUserWebhooks(data || []);
      }
      setWebhooksLoading(false);
    };
    loadWebhooks();
  }, []);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const switchWorkflow = (id) => {
    if (editingTabId !== id) {
      setActiveWorkflow(id);
    }
  };

  const handleTabDoubleClick = (id, name) => {
    setEditingTabId(id);
    setEditingTabName(name);
  };

  const handleTabNameChange = (e) => {
    setEditingTabName(e.target.value);
  };

  const handleTabNameBlur = () => {
    if (editingTabId && editingTabName.trim()) {
      setWorkflows(prev => ({
        ...prev,
        [editingTabId]: {
          ...prev[editingTabId],
          name: editingTabName.trim()
        }
      }));
    }
    setEditingTabId(null);
    setEditingTabName('');
  };

  const handleTabNameKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleTabNameBlur();
    } else if (e.key === 'Escape') {
      setEditingTabId(null);
      setEditingTabName('');
    }
  };

  const addNewWorkflow = () => {
    const newId = workflowCounter;
    const newWorkflow = {
      id: newId,
      name: `Workflow ${newId}`,
      nodes: [],
      connections: [],
      nodeCounter: 1,
      connectionCounter: 1,
      supabaseId: null
    };
    setWorkflows(prev => ({
      ...prev,
      [newId]: newWorkflow
    }));
    setOpenWorkflowIds(prev => [...prev, newId]);
    setWorkflowCounter(prev => prev + 1);
    setActiveWorkflow(newId);
  };

  const closeWorkflow = (id, e) => {
    e.stopPropagation();
    const remainingIds = openWorkflowIds.filter(wId => wId !== id);
    setOpenWorkflowIds(remainingIds);
    
    // Remove workflow data
    setWorkflows(prev => {
      const newWorkflows = { ...prev };
      delete newWorkflows[id];
      return newWorkflows;
    });
    
    // If closing the active workflow, switch to the first remaining one
    if (id === activeWorkflow && remainingIds.length > 0) {
      setActiveWorkflow(remainingIds[0]);
    }
  };

  // Save workflow to Supabase
  const handleSaveWorkflow = async () => {
    if (!currentWorkflow) return false;

    setIsSaving(true);

    try {
      const workflowData = {
        id: currentWorkflow.supabaseId,
        name: currentWorkflow.name,
        nodes: currentWorkflow.nodes,
        connections: currentWorkflow.connections,
        userId: user?.id || null
      };

      const result = await saveWorkflowToSupabase(workflowData);

      if (result.success) {
        // Update the workflow with the Supabase ID
        setWorkflows(prev => ({
          ...prev,
          [activeWorkflow]: {
            ...prev[activeWorkflow],
            supabaseId: result.data.id
          }
        }));

        // Update URL to include workflow ID so it persists on refresh
        const newUrl = `${window.location.pathname}?workflow=${result.data.id}`;
        window.history.pushState({}, '', newUrl);
        console.log('[Builder] Updated URL with workflow ID:', result.data.id);

        alert('Workflow saved successfully!');
        return true;
      } else {
        alert(`Error saving workflow: ${result.error}`);
        return false;
      }
    } catch (error) {
      console.error('Error saving workflow:', error);
      alert('An unexpected error occurred while saving');
      return false;
    } finally {
      setIsSaving(false);
    }
  };
  
  // Handle AI-generated workflow and add to canvas
  const handleWorkflowGenerated = (generatedWorkflow) => {
    if (!generatedWorkflow || !generatedWorkflow.nodes) {
      console.error('[Builder] Invalid workflow data received');
      return;
    }

    console.log('[Builder] Adding AI-generated workflow to canvas:', generatedWorkflow);

    const currentNodes = currentWorkflow.nodes || [];
    const currentConnections = currentWorkflow.connections || [];
    
    // Calculate offset to place new nodes (avoid overlap)
    const offsetX = 100;
    const offsetY = currentNodes.length > 0 ? 150 : 50;
    
    // Map generated nodes to canvas format
    const newNodes = generatedWorkflow.nodes.map((genNode, index) => {
      const nodeId = `node${currentWorkflow.nodeCounter + index}`;
      
      return {
        id: nodeId,
        type: genNode.type || 'action',
        label: genNode.label || `Node ${index + 1}`,
        position: {
          x: (genNode.position?.x || 50) + offsetX,
          y: (genNode.position?.y || 50 + (index * 100)) + offsetY
        },
        data: {
          config: genNode.config || {}
        }
      };
    });

    // Map generated edges/connections to canvas format
    const newConnections = (generatedWorkflow.edges || generatedWorkflow.connections || []).map((edge, index) => {
      // Find the actual node IDs from the generated nodes
      const sourceNode = newNodes.find((n, i) => 
        generatedWorkflow.nodes[i].id === edge.source || i === parseInt(edge.source)
      );
      const targetNode = newNodes.find((n, i) => 
        generatedWorkflow.nodes[i].id === edge.target || i === parseInt(edge.target)
      );

      if (!sourceNode || !targetNode) {
        console.warn('[Builder] Could not find nodes for edge:', edge);
        return null;
      }

      return {
        id: `conn${currentWorkflow.connectionCounter + index}`,
        source: sourceNode.id,
        target: targetNode.id
      };
    }).filter(Boolean);

    // Update workflow with new nodes and connections
    setWorkflows(prev => ({
      ...prev,
      [activeWorkflow]: {
        ...prev[activeWorkflow],
        nodes: [...currentNodes, ...newNodes],
        connections: [...currentConnections, ...newConnections],
        nodeCounter: prev[activeWorkflow].nodeCounter + newNodes.length,
        connectionCounter: prev[activeWorkflow].connectionCounter + newConnections.length
      }
    }));

    console.log('[Builder] Added', newNodes.length, 'nodes and', newConnections.length, 'connections');
  };

  // Handle share workflow
  const handleShareWorkflow = async () => {
    setShowShareModal(true);
    setShareError('');
    setLinkCopied(false);
    
    // If workflow is already saved, generate link immediately
    if (currentWorkflow.supabaseId) {
      const link = `${window.location.origin}/builder?workflow=${currentWorkflow.supabaseId}`;
      setShareLink(link);
      return;
    }
    
    // Otherwise, save it first
    setIsGeneratingLink(true);
    
    try {
      // Save workflow to get an ID
      const saved = await handleSaveWorkflow();
      
      if (saved && currentWorkflow.supabaseId) {
        const link = `${window.location.origin}/builder?workflow=${currentWorkflow.supabaseId}`;
        setShareLink(link);
      } else {
        throw new Error('Failed to save workflow');
      }
    } catch (error) {
      console.error('[Builder] Share failed:', error);
      setShareError('Failed to generate share link. Please save the workflow first.');
    } finally {
      setIsGeneratingLink(false);
    }
  };

  // Copy share link to clipboard
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 3000);
    } catch (error) {
      console.error('[Builder] Copy failed:', error);
      setShareError('Failed to copy link');
    }
  };
  
  // Simulate workflow execution (no real API calls)
  const handleSimulateWorkflow = async () => {
    if (!currentWorkflow || !currentWorkflow.nodes || currentWorkflow.nodes.length === 0) {
      alert('No nodes in workflow to simulate');
      return;
    }
    
    // Validate webhook nodes before simulation
    const webhookNodes = currentWorkflow.nodes.filter(node => 
      node.data?.config?.actionType === 'Webhook'
    );
    
    for (const node of webhookNodes) {
      const config = node.data?.config;
      
      // Check for validation errors in custom URL
      if (config?.customWebhookUrlError) {
        alert(`Cannot simulate: Node "${node.label}" has an invalid webhook URL. ${config.customWebhookUrlError}`);
        // Highlight the problematic node
        setSelectedNodeId(node.id);
        return;
      }
      
      // Check if custom URL is provided and validate format
      if (config?.customWebhookUrl) {
        const url = config.customWebhookUrl.trim();
        if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
          alert(`Cannot simulate: Node "${node.label}" has an invalid webhook URL. Must start with http:// or https://`);
          setSelectedNodeId(node.id);
          return;
        }
      }
      
      // Check if integration is selected but doesn't exist (deleted)
      if (config?.integrationId) {
        const integration = userWebhooks.find(w => w.id === config.integrationId);
        if (!integration) {
          alert(`Cannot simulate: Node "${node.label}" references a deleted webhook integration. Please select a valid webhook or paste a custom URL.`);
          setSelectedNodeId(node.id);
          return;
        }
      }
      
      // Check if node has any webhook URL configured
      if (!config?.customWebhookUrl && !config?.integrationId && !config?.selectedWebhookId) {
        alert(`Cannot simulate: Node "${node.label}" has no webhook URL configured. Please select a saved webhook or paste a custom URL.`);
        setSelectedNodeId(node.id);
        return;
      }
    }
    
    console.log('[Builder] Starting workflow simulation...');
    setIsSimulating(true);
    setSimulationTimeline(null);
    setSimulationSummary(null);
    
    // Prepare workflow model for simulation
    const workflowModel = {
      nodes: currentWorkflow.nodes.map(node => {
        let actionType = node.data?.config?.actionType;
        let webhookUrl = node.data?.config?.webhookUrl || node.data?.config?.customWebhookUrl;
        
        // If this is a Webhook action with a selected integration, check if it's a Slack webhook
        if (actionType === 'Webhook' && node.data?.config?.selectedWebhookId) {
          const webhook = userWebhooks.find(w => w.id === node.data.config.selectedWebhookId);
          if (webhook?.type === 'slack') {
            actionType = 'slack'; // Set to lowercase 'slack' for edge function
            webhookUrl = webhook.id; // Use integration ID instead of URL
          }
        }
        
        return {
          id: node.id,
          type: node.type,
          data: {
            label: node.label,
            actionType: actionType,
            webhookUrl: webhookUrl,
            prompt: node.data?.config?.prompt,
            condition: node.data?.config?.condition,
            ...node.data
          }
        };
      }),
      edges: currentWorkflow.connections.map(conn => ({
        id: conn.id,
        source: String(conn.from),
        target: String(conn.to)
      }))
    };
    
    // Sample payload for testing
    const samplePayload = {
      workflowId: currentWorkflow.supabaseId || currentWorkflow.id,
      workflowName: currentWorkflow.name,
      timestamp: new Date().toISOString(),
      testData: { message: 'This is a test simulation' }
    };
    
    try {
      const result = await simulateWorkflow(workflowModel, samplePayload);
      
      if (result.error) {
        console.error('[Builder] Simulation error:', result.error);
        alert(`Simulation failed: ${result.error.message}`);
        setIsSimulating(false);
        return;
      }
      
      console.log('[Builder] Simulation completed successfully');
      
      // Animate through timeline
      const timeline = result.data.timeline;
      const summary = result.data.summary;
      setSimulationTimeline(timeline);
      
      // Highlight nodes in sequence
      for (let i = 0; i < timeline.length; i++) {
        const entry = timeline[i];
        setHighlightedNodeId(entry.nodeId);
        await new Promise(resolve => setTimeout(resolve, entry.duration + 200));
      }
      
      // Clear highlight after animation
      setHighlightedNodeId(null);
      
      // Set summary
      setSimulationSummary(summary);
      
      // Save run to database (only if workflow has been saved)
      if (currentWorkflow.supabaseId) {
        console.log('[Builder] Saving workflow run to database...');
        const saveResult = await saveWorkflowRun({
          workflowId: currentWorkflow.supabaseId,
          userId: null, // Will be auto-detected from auth
          timeline: timeline,
          summary: summary,
          status: summary.status
        });
        
        if (saveResult.error) {
          console.error('[Builder] Failed to save run:', saveResult.error);
          // Don't alert user - run still completed successfully
        } else {
          console.log('[Builder] Run saved successfully:', saveResult.data?.id);
        }
      } else {
        console.log('[Builder] Workflow not saved yet - skipping run persistence');
      }
      
    } catch (err) {
      console.error('[Builder] Unexpected simulation error:', err);
      alert(`Unexpected error: ${err.message}`);
    } finally {
      setIsSimulating(false);
    }
  };

  // Execute workflow in production mode (live run)
  const handleExecuteWorkflow = async () => {
    if (!currentWorkflow || !currentWorkflow.nodes || currentWorkflow.nodes.length === 0) {
      alert('No nodes in workflow to execute');
      return;
    }

    // Validate webhook nodes before execution
    const webhookNodes = currentWorkflow.nodes.filter(node => 
      node.data?.config?.actionType === 'Webhook'
    );
    
    for (const node of webhookNodes) {
      const config = node.data?.config;
      
      if (config?.customWebhookUrlError) {
        alert(`Cannot execute: Node "${node.label}" has an invalid webhook URL. ${config.customWebhookUrlError}`);
        setSelectedNodeId(node.id);
        return;
      }
      
      if (config?.customWebhookUrl) {
        const url = config.customWebhookUrl.trim();
        if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
          alert(`Cannot execute: Node "${node.label}" has an invalid webhook URL. Must start with http:// or https://`);
          setSelectedNodeId(node.id);
          return;
        }
      }
      
      if (config?.integrationId) {
        const integration = userWebhooks.find(w => w.id === config.integrationId);
        if (!integration) {
          alert(`Cannot execute: Node "${node.label}" references a deleted webhook integration. Please select a valid webhook or paste a custom URL.`);
          setSelectedNodeId(node.id);
          return;
        }
      }
      
      if (!config?.customWebhookUrl && !config?.integrationId && !config?.selectedWebhookId) {
        alert(`Cannot execute: Node "${node.label}" has no webhook URL configured. Please select a saved webhook or paste a custom URL.`);
        setSelectedNodeId(node.id);
        return;
      }
    }

    console.log('[Builder] Starting live workflow execution...');
    setIsExecuting(true);
    setExecutionTimeline(null);
    setExecutionSummary(null);
    setExecutionId(null);
    
    // Prepare workflow model
    const workflowModel = {
      nodes: currentWorkflow.nodes.map(node => {
        let actionType = node.data?.config?.actionType;
        let webhookUrl = node.data?.config?.webhookUrl || node.data?.config?.customWebhookUrl;
        
        if (actionType === 'Webhook' && node.data?.config?.selectedWebhookId) {
          const webhook = userWebhooks.find(w => w.id === node.data.config.selectedWebhookId);
          if (webhook?.type === 'slack') {
            actionType = 'slack';
            webhookUrl = webhook.id;
          }
        }
        
        return {
          id: node.id,
          type: node.type,
          data: {
            label: node.label,
            actionType: actionType,
            webhookUrl: webhookUrl,
            prompt: node.data?.config?.prompt,
            condition: node.data?.config?.condition,
            ...node.data
          }
        };
      }),
      edges: currentWorkflow.connections.map(conn => ({
        id: conn.id,
        source: String(conn.from),
        target: String(conn.to)
      }))
    };
    
    // Input payload
    const inputPayload = {
      workflowId: currentWorkflow.supabaseId || currentWorkflow.id,
      workflowName: currentWorkflow.name,
      timestamp: new Date().toISOString(),
      triggerType: 'manual',
    };
    
    try {
      const result = await executeWorkflow(workflowModel, {
        inputPayload,
        workflowId: currentWorkflow.supabaseId,
        triggerType: 'manual',
        executionMode: 'production',
      });
      
      console.log('[Builder] Execution completed:', result.executionId, '-', result.status);
      
      setExecutionId(result.executionId);
      setExecutionTimeline(result.timeline);
      setExecutionSummary(result.summary);
      
      // Animate through timeline
      for (let i = 0; i < result.timeline.length; i++) {
        const entry = result.timeline[i];
        setHighlightedNodeId(entry.nodeId);
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      
      setHighlightedNodeId(null);
      
      if (result.status === 'failed') {
        alert(`Execution completed with errors. Check the timeline for details.`);
      }
      
    } catch (err) {
      console.error('[Builder] Execution error:', err);
      alert(`Execution failed: ${err.message}`);
    } finally {
      setIsExecuting(false);
    }
  };

  // Cleanup execution subscription on unmount
  useEffect(() => {
    return () => {
      if (executionSubscription) {
        executionSubscription();
      }
    };
  }, [executionSubscription]);


  // Get current workflow data
  const currentWorkflow = workflows[activeWorkflow];
  console.log('[Builder] Current workflow:', {
    activeWorkflow,
    workflowName: currentWorkflow?.name,
    supabaseId: currentWorkflow?.supabaseId,
    hasWorkflow: !!currentWorkflow
  });
  const nodes = currentWorkflow?.nodes || [];
  const connections = currentWorkflow?.connections || [];

  // Add node to current workflow canvas
  const addNode = (type, label, icon, color) => {
    if (!currentWorkflow) return;
    
    const newNode = {
      id: `node-${currentWorkflow.nodeCounter}`,
      type: type,
      label: label,
      icon: icon,
      color: color,
      x: 300,
      y: 100 + (currentWorkflow.nodeCounter * 30), // Stagger new nodes
      data: {}
    };
    
    setWorkflows(prev => ({
      ...prev,
      [activeWorkflow]: {
        ...prev[activeWorkflow],
        nodes: [...prev[activeWorkflow].nodes, newNode],
        nodeCounter: prev[activeWorkflow].nodeCounter + 1
      }
    }));
    setSelectedNodeId(newNode.id);
  };

  // Handle node click
  const handleNodeClick = (nodeId, e) => {
    e.stopPropagation();
    setSelectedNodeId(nodeId);
    setActiveRightTab('setup'); // Switch to setup tab when node clicked
  };

  // Handle node double click to edit
  const handleNodeDoubleClick = (nodeId, currentLabel, e) => {
    e.stopPropagation();
    setEditingNodeId(nodeId);
    setEditingNodeLabel(currentLabel);
  };

  // Handle node label change
  const handleNodeLabelChange = (e) => {
    setEditingNodeLabel(e.target.value);
  };

  // Handle node label blur (save)
  const handleNodeLabelBlur = () => {
    if (editingNodeId && editingNodeLabel.trim()) {
      setWorkflows(prev => ({
        ...prev,
        [activeWorkflow]: {
          ...prev[activeWorkflow],
          nodes: prev[activeWorkflow].nodes.map(node =>
            node.id === editingNodeId
              ? { ...node, label: editingNodeLabel.trim() }
              : node
          )
        }
      }));
    }
    setEditingNodeId(null);
    setEditingNodeLabel('');
  };

  // Handle node label keydown
  const handleNodeLabelKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleNodeLabelBlur();
    } else if (e.key === 'Escape') {
      setEditingNodeId(null);
      setEditingNodeLabel('');
    }
  };

  // Handle node drag start
  const handleNodeDragStart = (nodeId, e) => {
    const node = nodes.find(n => n.id === nodeId);
    setDraggedNode(nodeId);
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  // Handle mouse move (for dragging and connection drawing)
  const handleCanvasMouseMove = (e) => {
    if (draggedNode && currentWorkflow) {
      const canvas = e.currentTarget;
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left - dragOffset.x) / (zoom / 100);
      const y = (e.clientY - rect.top - dragOffset.y) / (zoom / 100);
      
      const updatedNodes = nodes.map(node => 
        node.id === draggedNode 
          ? { ...node, x, y }
          : node
      );
      
      setWorkflows(prev => ({
        ...prev,
        [activeWorkflow]: {
          ...prev[activeWorkflow],
          nodes: updatedNodes,
          connections: prev[activeWorkflow].connections.map(conn => {
            const sourceNode = updatedNodes.find(n => n.id === conn.source);
            const targetNode = updatedNodes.find(n => n.id === conn.target);
            return {
              ...conn,
              sourceX: sourceNode.x + 128,
              sourceY: sourceNode.y + 100,
              targetX: targetNode.x + 128,
              targetY: targetNode.y
            };
          })
        }
      }));
    }
    
    // Handle connection line drawing
    if (connectingFrom) {
      const canvas = e.currentTarget;
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) / (zoom / 100);
      const y = (e.clientY - rect.top) / (zoom / 100);
      
      setTempConnection({
        x1: connectingFrom.x,
        y1: connectingFrom.y,
        x2: x,
        y2: y
      });
    }
  };
  // Handle mouse up (stop dragging)
  const handleCanvasMouseUp = () => {
    setDraggedNode(null);
    setTempConnection(null);
  };

  // Get selected node
  const selectedNode = nodes.find(n => n.id === selectedNodeId);

  // Handle connection start (mousedown on handle)
  const handleConnectionStart = (nodeId, handleType, e) => {
    e.stopPropagation();
    const node = nodes.find(n => n.id === nodeId);
    
    setConnectingFrom({ 
      nodeId, 
      handleType,
      x: node.x + 128, // Center of node (256px / 2)
      y: handleType === 'bottom' ? node.y + 100 : node.y // Approximate node height
    });
  };

  // Handle connection end (mouseup on target handle)
  const handleConnectionEnd = (targetNodeId, targetHandleType, e) => {
    e.stopPropagation();
    
    if (connectingFrom && connectingFrom.nodeId !== targetNodeId) {
      // Valid connection - different nodes
      const sourceNode = nodes.find(n => n.id === connectingFrom.nodeId);
      const targetNode = nodes.find(n => n.id === targetNodeId);
      
      // Only allow bottom → top connections (flow direction)
      if (connectingFrom.handleType === 'bottom' && targetHandleType === 'top') {
        const newConnection = {
          id: `connection-${currentWorkflow.connectionCounter}`,
          source: connectingFrom.nodeId,
          target: targetNodeId,
          sourceX: sourceNode.x + 128,
          sourceY: sourceNode.y + 100,
          targetX: targetNode.x + 128,
          targetY: targetNode.y
        };
        
        setWorkflows(prev => ({
          ...prev,
          [activeWorkflow]: {
            ...prev[activeWorkflow],
            connections: [...prev[activeWorkflow].connections, newConnection],
            connectionCounter: prev[activeWorkflow].connectionCounter + 1
          }
        }));
      }
    }
    
    setConnectingFrom(null);
    setTempConnection(null);
  };

  return (
    <div className="builder-wrapper">
      <div className="builder-topbar">
        <div className="workflow-tabs">
          {openWorkflowIds.map(id => {
            const workflow = workflows[id];
            if (!workflow) return null;
            
            return (
              <div
                key={workflow.id}
                onClick={() => switchWorkflow(workflow.id)}
                onDoubleClick={() => handleTabDoubleClick(workflow.id, workflow.name)}
                className={`workflow-tab ${workflow.id === activeWorkflow ? 'active' : ''}`}
              >
                {editingTabId === workflow.id ? (
                  <input
                    type="text"
                    value={editingTabName}
                    onChange={handleTabNameChange}
                    onBlur={handleTabNameBlur}
                    onKeyDown={handleTabNameKeyDown}
                    onClick={(e) => e.stopPropagation()}
                    autoFocus
                    className="workflow-tab-name-input"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      color: 'inherit',
                      fontSize: '14px',
                      fontWeight: '500',
                      width: '120px',
                      padding: 0
                    }}
                  />
                ) : (
                  <span className="workflow-tab-name">{workflow.name}</span>
                )}
                <button
                  onClick={(e) => closeWorkflow(workflow.id, e)}
                  className="workflow-tab-close"
                >
                  <X size={14} />
                </button>
              </div>
            );
          })}
          <button onClick={addNewWorkflow} className="workflow-tab-add">
            <Plus size={16} />
          </button>
        </div>

        <div className="topbar-controls">
          <button onClick={() => navigate('/dashboard')} className="home-button" title="Back to Dashboard">
            <Home size={18} />
          </button>

          <div className="zoom-control">
            <button onClick={() => setZoom(Math.max(25, zoom - 25))} className="zoom-btn">
              <Minus size={16} />
            </button>
            <span className="zoom-value">{zoom}%</span>
            <button onClick={() => setZoom(Math.min(200, zoom + 25))} className="zoom-btn">
              <Plus size={16} />
            </button>
          </div>

          <button className="share-button" onClick={handleShareWorkflow}>
            <Share2 size={16} />
            <span>Share</span>
          </button>

          <div className="profile-avatars">
            <div className="avatar avatar-1">JD</div>
            <div className="avatar avatar-2">AM</div>
          </div>
        </div>
      </div>

      <div className="builder-main-layout">
        <div className="left-sidebar">
          <div className="sidebar-search">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search apps and functions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="sidebar-content">
            <div className="sidebar-section">
              <button onClick={() => toggleSection('favorites')} className="section-header">
                <div className="section-title-wrapper">
                  {expandedSections.favorites ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  <Star size={16} className="section-icon star" />
                  <span className="section-title">Favorites</span>
                </div>
              </button>
              {expandedSections.favorites && (
                <div className="section-items">
                  <div className="section-item">
                    <Mail size={16} />
                    <span>Gmail Trigger</span>
                  </div>
                  <div className="section-item">
                    <MessageSquare size={16} />
                    <span>Slack Message</span>
                  </div>
                </div>
              )}
            </div>

            <div className="sidebar-section">
              <button onClick={() => toggleSection('basic')} className="section-header">
                <div className="section-title-wrapper">
                  {expandedSections.basic ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  <Zap size={16} className="section-icon zap" />
                  <span className="section-title">Basic</span>
                </div>
              </button>
              {expandedSections.basic && (
                <div className="section-items">
                  <div 
                    className="section-item"
                    onClick={() => addNode('trigger', 'Trigger', Play, 'green')}
                  >
                    <Play size={16} className="icon-green" />
                    <span>Trigger</span>
                  </div>
                  <div 
                    className="section-item"
                    onClick={() => addNode('action', 'Action', Zap, 'purple')}
                  >
                    <Zap size={16} className="icon-purple" />
                    <span>Action</span>
                  </div>
                  <div 
                    className="section-item"
                    onClick={() => addNode('condition', 'Condition', CheckCircle2, 'orange')}
                  >
                    <CheckCircle2 size={16} className="icon-orange" />
                    <span>Condition</span>
                  </div>
                  <div 
                    className="section-item"
                    onClick={() => addNode('delay', 'Delay', Clock, 'blue')}
                  >
                    <Clock size={16} className="icon-blue" />
                    <span>Delay</span>
                  </div>
                  <div 
                    className="section-item"
                    onClick={() => addNode('gpt', 'GPT AI', Sparkles, 'pink')}
                  >
                    <Sparkles size={16} className="icon-pink" />
                    <span>GPT AI</span>
                  </div>
                </div>
              )}
            </div>

            <div className="sidebar-section">
              <button onClick={() => toggleSection('integration')} className="section-header">
                <div className="section-title-wrapper">
                  {expandedSections.integration ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  <Settings size={16} className="section-icon integration" />
                  <span className="section-title">Integration</span>
                </div>
              </button>
              {expandedSections.integration && (
                <div className="section-items integration-items">
                  <div 
                    className="integration-item"
                    onClick={() => addNode('integration', 'Gmail', Mail, 'gmail')}
                  >
                    <div className="integration-icon gmail">
                      <Mail size={16} />
                    </div>
                    <div className="integration-info">
                      <div className="integration-name">Gmail</div>
                      <div className="integration-desc">Send emails</div>
                    </div>
                  </div>
                  <div 
                    className="integration-item"
                    onClick={() => addNode('integration', 'Google Sheets', FileText, 'sheets')}
                  >
                    <div className="integration-icon sheets">
                      <FileText size={16} />
                    </div>
                    <div className="integration-info">
                      <div className="integration-name">Google Sheets</div>
                      <div className="integration-desc">Spreadsheet data</div>
                    </div>
                  </div>
                  <div 
                    className="integration-item"
                    onClick={() => addNode('integration', 'Google Docs', FileText, 'docs')}
                  >
                    <div className="integration-icon docs">
                      <FileText size={16} />
                    </div>
                    <div className="integration-info">
                      <div className="integration-name">Google Docs</div>
                      <div className="integration-desc">Document creation</div>
                    </div>
                  </div>
                  <div 
                    className="integration-item"
                    onClick={() => addNode('store', 'Dropbox', FolderOpen, 'dropbox')}
                  >
                    <div className="integration-icon dropbox">
                      <FolderOpen size={16} />
                    </div>
                    <div className="integration-info">
                      <div className="integration-name">Dropbox</div>
                      <div className="integration-desc">File storage</div>
                    </div>
                  </div>
                  <div 
                    className="integration-item"
                    onClick={() => addNode('integration', 'Notion', Bell, 'notion')}
                  >
                    <div className="integration-icon notion">
                      <Bell size={16} />
                    </div>
                    <div className="integration-info">
                      <div className="integration-name">Notion</div>
                      <div className="integration-desc">Workspace notes</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="sidebar-section">
              <button onClick={() => toggleSection('functions')} className="section-header">
                <div className="section-title-wrapper">
                  {expandedSections.functions ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  <Sparkles size={16} className="section-icon functions" />
                  <span className="section-title">Functions</span>
                </div>
              </button>
              {expandedSections.functions && (
                <div className="section-items">
                  <div 
                    className="section-item"
                    draggable={true}
                    onDragStart={(e) => {
                      e.dataTransfer.setData('application/reactflow', 'function');
                      e.dataTransfer.effectAllowed = 'move';
                    }}
                  >
                    <Sparkles size={16} className="icon-purple" />
                    <span>Data Transform</span>
                  </div>
                  <div 
                    className="section-item"
                    draggable={true}
                    onDragStart={(e) => {
                      e.dataTransfer.setData('application/reactflow', 'function');
                      e.dataTransfer.effectAllowed = 'move';
                    }}
                  >
                    <Sparkles size={16} className="icon-purple" />
                    <span>Format Text</span>
                  </div>
                </div>
              )}
            </div>

            <div className="sidebar-section">
              <button onClick={() => toggleSection('stores')} className="section-header">
                <div className="section-title-wrapper">
                  {expandedSections.stores ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  <Database size={16} className="section-icon stores" />
                  <span className="section-title">Stores & Utility</span>
                </div>
              </button>
              {expandedSections.stores && (
                <div className="section-items">
                  <div 
                    className="section-item"
                    draggable={true}
                    onDragStart={(e) => {
                      e.dataTransfer.setData('application/reactflow', 'store');
                      e.dataTransfer.effectAllowed = 'move';
                    }}
                  >
                    <Database size={16} className="icon-teal" />
                    <span>Storage Integration</span>
                  </div>
                  <div 
                    className="section-item"
                    draggable={true}
                    onDragStart={(e) => {
                      e.dataTransfer.setData('application/reactflow', 'store');
                      e.dataTransfer.effectAllowed = 'move';
                    }}
                  >
                    <Database size={16} className="icon-teal" />
                    <span>Synchronization</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Canvas Area */}
        <div 
          className="canvas-area"
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onClick={() => setSelectedNodeId(null)}
        >
          <div className="canvas-grid">
            <div 
              className="canvas-nodes"
              style={{ transform: `scale(${zoom / 100})` }}
            >
              {/* Render dynamic nodes */}
              {nodes.map(node => {
                // Map icon types to actual icon components
                const iconMap = {
                  'start': Play,
                  'form': FileText,
                  'action': Zap,
                  'gmail': Mail,
                  'sheets': Database,
                  'docs': FileText,
                  'dropbox': FolderOpen,
                  'notion': Bell
                };
                
                // Use the icon from the map, or the stored icon if it's a component, or default to Circle
                const IconComponent = typeof node.icon === 'function' 
                  ? node.icon 
                  : (iconMap[node.color] || iconMap[node.type] || Circle);
                
                const colorMap = {
                  green: 'green',
                  purple: 'purple',
                  blue: 'blue',
                  orange: 'orange',
                  gmail: 'red',
                  sheets: 'green',
                  docs: 'blue',
                  dropbox: 'blue',
                  notion: 'gray'
                };
                const iconColor = colorMap[node.color] || 'purple';
                
                return (
                  <div 
                    key={node.id}
                    className={`workflow-node ${selectedNodeId === node.id ? 'selected' : ''} ${highlightedNodeId === node.id ? 'simulating' : ''}`}
                    style={{ 
                      top: `${node.y}px`, 
                      left: `${node.x}px`,
                      cursor: draggedNode === node.id ? 'grabbing' : 'grab'
                    }}
                    onClick={(e) => handleNodeClick(node.id, e)}
                    onMouseDown={(e) => handleNodeDragStart(node.id, e)}
                  >
                    {/* Connection handle - top */}
                    <div 
                      className="connection-handle top"
                      onMouseUp={(e) => handleConnectionEnd(node.id, 'top', e)}
                      style={{
                        position: 'absolute',
                        top: '-6px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        background: '#3b82f6',
                        border: '2px solid white',
                        cursor: 'crosshair',
                        zIndex: 10
                      }}
                    />
                    
                    <div className="node-header">
                      <div className={`node-icon ${iconColor}`}>
                        <IconComponent size={20} />
                      </div>
                      <div className="node-info">
                        {editingNodeId === node.id ? (
                          <input
                            type="text"
                            value={editingNodeLabel}
                            onChange={handleNodeLabelChange}
                            onBlur={handleNodeLabelBlur}
                            onKeyDown={handleNodeLabelKeyDown}
                            onClick={(e) => e.stopPropagation()}
                            onMouseDown={(e) => e.stopPropagation()}
                            autoFocus
                            style={{
                              width: '100%',
                              fontSize: '14px',
                              fontWeight: '600',
                              color: '#111827',
                              border: '1px solid #3b82f6',
                              borderRadius: '4px',
                              padding: '2px 4px',
                              outline: 'none',
                              background: 'white'
                            }}
                          />
                        ) : (
                          <div 
                            className="node-title"
                            onDoubleClick={(e) => handleNodeDoubleClick(node.id, node.label, e)}
                          >
                            {node.label}
                          </div>
                        )}
                        <div className="node-subtitle">{node.type}</div>
                      </div>
                    </div>
                    <div className="node-description">
                      Click to configure this node
                    </div>
                    
                    {/* Connection handle - bottom */}
                    <div 
                      className="connection-handle bottom"
                      onMouseDown={(e) => handleConnectionStart(node.id, 'bottom', e)}
                      onMouseUp={(e) => handleConnectionEnd(node.id, 'bottom', e)}
                      style={{
                        position: 'absolute',
                        bottom: '-6px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        background: '#3b82f6',
                        border: '2px solid white',
                        cursor: 'crosshair',
                        zIndex: 10
                      }}
                    />
                  </div>
                );
              })}

              {/* Render SVG connections */}
              <svg 
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  pointerEvents: 'none',
                  zIndex: 1
                }}
              >
                {/* Permanent connections */}
                {connections.map(conn => {
                  const midY = (conn.sourceY + conn.targetY) / 2;
                  return (
                    <g key={conn.id}>
                      <path
                        d={`M ${conn.sourceX} ${conn.sourceY} 
                            C ${conn.sourceX} ${midY}, 
                              ${conn.targetX} ${midY}, 
                              ${conn.targetX} ${conn.targetY}`}
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth="2"
                        markerEnd="url(#arrowhead)"
                      />
                    </g>
                  );
                })}
                
                {/* Temporary connection while dragging */}
                {tempConnection && (
                  <path
                    d={`M ${tempConnection.x1} ${tempConnection.y1} 
                        L ${tempConnection.x2} ${tempConnection.y2}`}
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="2"
                    strokeDasharray="5,5"
                  />
                )}
                
                {/* Arrow marker definition */}
                <defs>
                  <marker
                    id="arrowhead"
                    markerWidth="10"
                    markerHeight="10"
                    refX="9"
                    refY="3"
                    orient="auto"
                  >
                    <polygon points="0 0, 10 3, 0 6" fill="#3b82f6" />
                  </marker>
                </defs>
              </svg>
            </div>
          </div>
        </div>

        <div className="right-sidebar">
          <div className="right-tabs">
            <button
              onClick={() => setActiveRightTab('setup')}
              className={`right-tab ${activeRightTab === 'setup' ? 'active' : ''}`}
            >
              Setup
            </button>
            <button
              onClick={() => setActiveRightTab('configure')}
              className={`right-tab ${activeRightTab === 'configure' ? 'active' : ''}`}
            >
              Configure
            </button>
            <button
              onClick={() => setActiveRightTab('test')}
              className={`right-tab ${activeRightTab === 'test' ? 'active' : ''}`}
            >
              Test
            </button>
            <button
              onClick={() => setActiveRightTab('history')}
              className={`right-tab ${activeRightTab === 'history' ? 'active' : ''}`}
            >
              History
            </button>
          </div>

          <div className="right-content">
            {activeRightTab === 'setup' && selectedNode && (
              <>
                {/* GPT Node Configuration */}
                {selectedNode.type === 'gpt' ? (
                  <GPTNodeEditor
                    node={selectedNode}
                    onSave={(config) => {
                      // Update node with GPT configuration
                      setWorkflows(prev => {
                        const workflow = prev[activeWorkflow];
                        const updatedNodes = workflow.nodes.map(node =>
                          node.id === selectedNodeId
                            ? { 
                                ...node, 
                                data: { 
                                  ...node.data, 
                                  config: { 
                                    ...node.data?.config, 
                                    ...config 
                                  } 
                                } 
                              }
                            : node
                        );
                        return {
                          ...prev,
                          [activeWorkflow]: { ...workflow, nodes: updatedNodes }
                        };
                      });
                      alert('GPT configuration saved successfully!');
                    }}
                    onClose={() => {
                      // Optional: handle close
                      console.log('GPT editor closed');
                    }}
                  />
                ) : (
                  /* Other node types - existing config panel */
                  <div className="config-panel">
                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>
                    {selectedNode.label}
                  </h3>
                  <p style={{ fontSize: '14px', color: '#6b7280' }}>
                    Configure this {selectedNode.type} node
                  </p>
                </div>

                <div className="config-item">
                  <label className="config-label">Node Label</label>
                  <input 
                    type="text"
                    className="config-select"
                    placeholder="Enter node label"
                    defaultValue={selectedNode.label}
                    style={{ padding: '10px 12px' }}
                  />
                </div>

                <div className="config-item">
                  <label className="config-label">Description</label>
                  <textarea 
                    className="config-select"
                    placeholder="Enter node description"
                    rows={3}
                    style={{ padding: '10px 12px', resize: 'vertical' }}
                  />
                </div>

                {selectedNode.type === 'trigger' && (
                  <div className="config-item">
                    <label className="config-label">Trigger Type</label>
                    <select className="config-select">
                      <option>Form Submission</option>
                      <option>Webhook</option>
                      <option>Schedule</option>
                      <option>Manual</option>
                    </select>
                  </div>
                )}

                {selectedNode.type === 'action' && (
                  <>
                    <div className="config-item">
                      <label className="config-label">Action Type</label>
                      <select 
                        className="config-select"
                        value={selectedNode.data?.config?.actionType || 'API Request'}
                        onChange={(e) => {
                          setWorkflows(prev => {
                            const workflow = prev[activeWorkflow];
                            const updatedNodes = workflow.nodes.map(node =>
                              node.id === selectedNodeId
                                ? { 
                                    ...node, 
                                    data: { 
                                      ...node.data, 
                                      config: { 
                                        ...node.data?.config, 
                                        actionType: e.target.value 
                                      } 
                                    } 
                                  }
                                : node
                            );
                            return {
                              ...prev,
                              [activeWorkflow]: { ...workflow, nodes: updatedNodes }
                            };
                          });
                        }}
                      >
                        <option>API Request</option>
                        <option>Send Email</option>
                        <option>Transform Data</option>
                        <option>AI Processing</option>
                        <option>Webhook</option>
                      </select>
                    </div>

                    {selectedNode.data?.config?.actionType === 'Webhook' && (
                      <>
                        <div className="config-item">
                          <label className="config-label">Select Saved Webhook</label>
                          <select 
                            className="config-select"
                            value={selectedNode.data?.config?.selectedWebhookId || ''}
                            onChange={(e) => {
                              const webhookId = e.target.value;
                              // Find the selected integration from user_integrations
                              const webhook = userWebhooks.find(w => w.id === webhookId);
                              console.log('[Builder] Selected webhook:', webhook);
                              
                              setWorkflows(prev => {
                                const workflow = prev[activeWorkflow];
                                const updatedNodes = workflow.nodes.map(node =>
                                  node.id === selectedNodeId
                                    ? { 
                                        ...node, 
                                        data: { 
                                          ...node.data, 
                                          config: { 
                                            ...node.data?.config, 
                                            // Store both integrationId and url from config
                                            integrationId: webhookId,
                                            selectedWebhookId: webhookId,
                                            url: webhook?.config?.url || webhook?.url || '',
                                            webhookUrl: webhook?.config?.url || webhook?.url || '',
                                            customWebhookUrl: '' // Clear custom URL when selecting saved webhook
                                          } 
                                        } 
                                      }
                                    : node
                                );
                                return {
                                  ...prev,
                                  [activeWorkflow]: { ...workflow, nodes: updatedNodes }
                                };
                              });
                            }}
                          >
                            <option value="">-- Choose a webhook --</option>
                            {webhooksLoading ? (
                              <option disabled>Loading...</option>
                            ) : userWebhooks.length === 0 ? (
                              <option disabled>No webhooks found</option>
                            ) : (
                              // Filter to show only generic webhooks (type='webhook')
                              userWebhooks
                                .filter(w => w.is_active && w.type === 'webhook')
                                .map(webhook => (
                                  <option key={webhook.id} value={webhook.id}>
                                    {webhook.name} {webhook.type && `[${webhook.type}]`}
                                  </option>
                                ))
                            )}
                          </select>
                          
                          {/* Warning badge if selected integration is missing/deleted */}
                          {selectedNode.data?.config?.integrationId && 
                           !userWebhooks.find(w => w.id === selectedNode.data.config.integrationId) && (
                            <div style={{ 
                              fontSize: '12px', 
                              color: '#dc2626', 
                              marginTop: '6px',
                              padding: '6px 10px',
                              background: '#fee2e2',
                              borderRadius: '6px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}>
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                                <line x1="12" y1="9" x2="12" y2="13"/>
                                <line x1="12" y1="17" x2="12.01" y2="17"/>
                              </svg>
                              <span>⚠️ Selected webhook was deleted. Please select another or enter a custom URL.</span>
                            </div>
                          )}
                          
                          <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                            <a 
                              href="/integrations" 
                              target="_blank" 
                              rel="noopener noreferrer"
                              style={{ color: '#0d2b45', textDecoration: 'underline' }}
                            >
                              Manage webhooks
                            </a>
                          </p>
                        </div>

                        <div className="config-item">
                          <label className="config-label">Or Paste Webhook URL</label>
                          <input 
                            type="text"
                            className="config-select"
                            placeholder="https://hooks.example.com/webhook"
                            value={selectedNode.data?.config?.customWebhookUrl || ''}
                            onChange={(e) => {
                              const inputUrl = e.target.value;
                              // Validate URL format (must start with http:// or https://)
                              const isValidUrl = !inputUrl || inputUrl.startsWith('http://') || inputUrl.startsWith('https://');
                              
                              setWorkflows(prev => {
                                const workflow = prev[activeWorkflow];
                                const updatedNodes = workflow.nodes.map(node =>
                                  node.id === selectedNodeId
                                    ? { 
                                        ...node, 
                                        data: { 
                                          ...node.data, 
                                          config: { 
                                            ...node.data?.config, 
                                            customWebhookUrl: inputUrl,
                                            customWebhookUrlError: isValidUrl ? null : 'URL must start with http:// or https://',
                                            // Clear saved webhook selection when using custom URL
                                            ...(inputUrl ? { 
                                              integrationId: null,
                                              selectedWebhookId: '',
                                              url: inputUrl 
                                            } : {})
                                          } 
                                        } 
                                      }
                                    : node
                                );
                                return {
                                  ...prev,
                                  [activeWorkflow]: { ...workflow, nodes: updatedNodes }
                                };
                              });
                            }}
                            style={{
                              borderColor: selectedNode.data?.config?.customWebhookUrlError ? '#dc2626' : undefined,
                              borderWidth: selectedNode.data?.config?.customWebhookUrlError ? '2px' : undefined,
                              backgroundColor: selectedNode.data?.config?.customWebhookUrlError ? '#fef2f2' : undefined
                            }}
                          />
                          
                          {/* Inline validation error */}
                          {selectedNode.data?.config?.customWebhookUrlError && (
                            <div style={{ 
                              fontSize: '12px', 
                              color: '#dc2626', 
                              marginTop: '6px',
                              padding: '8px 10px',
                              background: '#fee2e2',
                              borderRadius: '6px',
                              border: '1px solid #fca5a5',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              fontWeight: '500'
                            }}>
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10"/>
                                <line x1="15" y1="9" x2="9" y2="15"/>
                                <line x1="9" y1="9" x2="15" y2="15"/>
                              </svg>
                              {selectedNode.data.config.customWebhookUrlError}
                            </div>
                          )}
                          
                          <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                            Custom URL takes precedence over saved webhook
                          </p>
                        </div>
                      </>
                    )}
                  </>
                )}

                {selectedNode.type === 'delay' && (
                  <div className="config-item">
                    <label className="config-label">Delay Duration</label>
                    <input 
                      type="number"
                      className="config-select"
                      placeholder="Minutes"
                      defaultValue={5}
                    />
                  </div>
                )}

                <button 
                  className="save-test-button"
                  onClick={() => {
                    alert('Configuration saved!');
                  }}
                >
                  <Save size={16} />
                  <span>Save Configuration</span>
                </button>

                <button 
                  className="run-test-button"
                  style={{ marginTop: '12px' }}
                  onClick={() => {
                    setWorkflows(prev => ({
                      ...prev,
                      [activeWorkflow]: {
                        ...prev[activeWorkflow],
                        nodes: prev[activeWorkflow].nodes.filter(n => n.id !== selectedNode.id),
                        connections: prev[activeWorkflow].connections.filter(
                          conn => conn.from !== selectedNode.id && conn.to !== selectedNode.id
                        )
                      }
                    }));
                    setSelectedNodeId(null);
                  }}
                >
                  <X size={16} />
                  <span>Delete Node</span>
                </button>
              </div>
                )}
              </>
            )}

            {activeRightTab === 'setup' && !selectedNode && (
              <div className="empty-state">
                <Settings size={48} className="empty-icon" />
                <div className="empty-title">No node selected</div>
                <div className="empty-text">
                  Click on a node in the canvas to configure it
                </div>
              </div>
            )}

            {activeRightTab === 'configure' && (
              <div className="config-panel">
                <div className="config-item">
                  <label className="toggle-label">
                    <div className="toggle-info">
                      <Bell size={16} />
                      <span>Notification</span>
                    </div>
                    <div className="toggle-switch">
                      <input type="checkbox" defaultChecked />
                      <span className="toggle-slider"></span>
                    </div>
                  </label>
                </div>

                <div className="config-item">
                  <label className="toggle-label">
                    <div className="toggle-info">
                      <Settings size={16} />
                      <span>System</span>
                    </div>
                    <div className="toggle-switch">
                      <input type="checkbox" />
                      <span className="toggle-slider"></span>
                    </div>
                  </label>
                </div>

                <div className="config-item">
                  <label className="toggle-label">
                    <div className="toggle-info">
                      <Zap size={16} />
                      <span>Procedural</span>
                    </div>
                    <div className="toggle-switch">
                      <input type="checkbox" defaultChecked />
                      <span className="toggle-slider"></span>
                    </div>
                  </label>
                </div>

                <div className="config-item">
                  <label className="config-label">Server</label>
                  <select className="config-select">
                    <option>US East (N. Virginia)</option>
                    <option>US West (Oregon)</option>
                    <option>EU (Frankfurt)</option>
                    <option>Asia Pacific (Singapore)</option>
                  </select>
                </div>

                <div className="config-item">
                  <div className="storage-header">
                    <span className="config-label">Storage Usage</span>
                    <span className="storage-value">4.2 GB / 10 GB</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: '42%' }}></div>
                  </div>
                </div>

                <button 
                  className="save-test-button"
                  onClick={handleSaveWorkflow}
                  disabled={isSaving}
                >
                  <Save size={18} />
                  <span>{isSaving ? 'Saving...' : 'Save & Test'}</span>
                </button>
              </div>
            )}

            {activeRightTab === 'test' && (
              <div className="test-panel">
                <div className="test-info">
                  <div className="test-icon-wrapper">
                    <Play size={16} />
                  </div>
                  <div>
                    <h4 className="test-title">Test Your Workflow</h4>
                    <p className="test-description">Simulate or execute your workflow to verify it works correctly.</p>
                  </div>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <button 
                    className="run-test-button"
                    onClick={handleSimulateWorkflow}
                    disabled={isSimulating || isExecuting}
                    style={{ 
                      background: isSimulating ? '#9ca3af' : '#3b82f6',
                      cursor: (isSimulating || isExecuting) ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <Play size={18} />
                    <span>{isSimulating ? 'Simulating...' : 'Simulate (Test Mode)'}</span>
                  </button>
                  
                  <button 
                    className="run-test-button"
                    onClick={handleExecuteWorkflow}
                    disabled={isSimulating || isExecuting}
                    style={{ 
                      background: isExecuting ? '#9ca3af' : '#10b981',
                      cursor: (isSimulating || isExecuting) ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <Zap size={18} />
                    <span>{isExecuting ? 'Executing...' : 'Execute (Live Run)'}</span>
                  </button>
                </div>
                
                {(simulationSummary || executionSummary) && (
                  <div style={{ 
                    marginTop: '16px', 
                    padding: '12px', 
                    background: '#f3f4f6', 
                    borderRadius: '8px',
                    fontSize: '13px'
                  }}>
                    <div style={{ fontWeight: '600', marginBottom: '8px', color: '#374151' }}>
                      Last Run Summary
                    </div>
                    {simulationSummary && (
                      <div style={{ color: '#6b7280' }}>
                        <div>Mode: Simulation</div>
                        <div>Status: {simulationSummary.status}</div>
                        <div>Nodes: {simulationSummary.totalNodes}</div>
                        <div>Duration: {simulationSummary.totalDuration}ms</div>
                      </div>
                    )}
                    {executionSummary && (
                      <div style={{ color: '#6b7280' }}>
                        <div>Mode: Live Execution</div>
                        <div>Status: {executionSummary.status || 'completed'}</div>
                        <div>Nodes: {executionSummary.nodesCompleted}/{executionSummary.totalNodes}</div>
                        <div>Duration: {executionSummary.duration}ms</div>
                        {executionSummary.creditsConsumed > 0 && (
                          <div>Credits Used: {executionSummary.creditsConsumed}</div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeRightTab === 'history' && (
              <RunHistory 
                workflowId={currentWorkflow?.supabaseId}
                onRetryRun={handleSimulateWorkflow}
              />
            )}
          </div>
        </div>
      </div>

      {/* Simulation/Execution Log Panel */}
      <SimulationLogPanel 
        timeline={executionTimeline || simulationTimeline}
        summary={executionSummary || simulationSummary}
        isRunning={isExecuting || isSimulating}
        executionMode={executionTimeline ? 'live' : 'simulation'}
        executionId={executionId}
        onClose={() => {
          setSimulationTimeline(null);
          setSimulationSummary(null);
          setExecutionTimeline(null);
          setExecutionSummary(null);
          setExecutionId(null);
        }}
      />

      {/* Share Modal */}
      {showShareModal && (
        <div 
          className="modal-overlay" 
          onClick={() => setShowShareModal(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000
          }}
        >
          <div 
            className="share-modal"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'white',
              borderRadius: '16px',
              padding: '32px',
              width: '500px',
              maxWidth: '90%',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
            }}
          >
            {/* Header */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '24px'
            }}>
              <h2 style={{ 
                fontSize: '24px', 
                fontWeight: '700',
                color: '#1f2937',
                margin: 0
              }}>
                Share Workflow
              </h2>
              <button 
                onClick={() => setShowShareModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '8px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={20} color="#6b7280" />
              </button>
            </div>

            {/* Description */}
            <p style={{
              fontSize: '14px',
              color: '#6b7280',
              marginBottom: '24px',
              lineHeight: '1.5'
            }}>
              Share this workflow with others. Anyone with the link can view and copy it.
            </p>

            {/* Share Link */}
            {isGeneratingLink ? (
              <div style={{
                padding: '16px',
                background: '#f3f4f6',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '20px'
              }}>
                <div className="spinner" style={{
                  width: '20px',
                  height: '20px',
                  border: '2px solid #3b82f6',
                  borderTopColor: 'transparent',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}></div>
                <span style={{ color: '#6b7280', fontSize: '14px' }}>
                  Generating share link...
                </span>
              </div>
            ) : shareLink ? (
              <>
                <div style={{
                  display: 'flex',
                  gap: '12px',
                  marginBottom: '20px'
                }}>
                  <input 
                    type="text"
                    value={shareLink}
                    readOnly
                    style={{
                      flex: 1,
                      padding: '12px 16px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px',
                      background: '#f9fafb',
                      color: '#374151'
                    }}
                  />
                  <button
                    onClick={handleCopyLink}
                    style={{
                      padding: '12px 24px',
                      background: linkCopied ? '#10b981' : 'linear-gradient(135deg, #60a5fa, #a78bfa)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {linkCopied ? '✓ Copied!' : 'Copy Link'}
                  </button>
                </div>

                {/* Share Options */}
                <div style={{ 
                  borderTop: '1px solid #e5e7eb',
                  paddingTop: '20px'
                }}>
                  <p style={{
                    fontSize: '12px',
                    color: '#6b7280',
                    marginBottom: '12px',
                    fontWeight: '500'
                  }}>
                    SHARE VIA
                  </p>
                  <div style={{
                    display: 'flex',
                    gap: '12px',
                    flexWrap: 'wrap'
                  }}>
                    <a
                      href={`mailto:?subject=Check out this workflow&body=I want to share this workflow with you: ${shareLink}`}
                      style={{
                        padding: '10px 20px',
                        background: '#f3f4f6',
                        color: '#374151',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '14px',
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: 'pointer'
                      }}
                    >
                      <Mail size={16} />
                      Email
                    </a>
                    <a
                      href={`https://twitter.com/intent/tweet?text=Check out this workflow&url=${encodeURIComponent(shareLink)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        padding: '10px 20px',
                        background: '#f3f4f6',
                        color: '#374151',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '14px',
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: 'pointer'
                      }}
                    >
                      <MessageSquare size={16} />
                      Twitter
                    </a>
                  </div>
                </div>
              </>
            ) : null}

            {/* Error Message */}
            {shareError && (
              <div style={{
                padding: '12px 16px',
                background: '#fee2e2',
                color: '#dc2626',
                borderRadius: '8px',
                fontSize: '14px',
                marginTop: '16px'
              }}>
                ⚠️ {shareError}
              </div>
            )}

            {/* Close Button */}
            <button
              onClick={() => setShowShareModal(false)}
              style={{
                width: '100%',
                padding: '12px',
                background: '#f3f4f6',
                color: '#374151',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                marginTop: '20px'
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* AI Helper Chat - Floating assistant */}
      <AIHelperChat 
        currentWorkflow={workflows[activeWorkflow]} 
        onWorkflowGenerated={handleWorkflowGenerated}
      />
    </div>
  );
};

export default Builder;
