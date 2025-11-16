import { useCallback, useRef, useState } from 'react';
import {
  useReactFlow,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge as addReactFlowEdge,
  NodeChange,
  EdgeChange,
  Connection,
} from 'reactflow';
import { v4 as uuidv4 } from 'uuid';
import {
  BuilderNode,
  BuilderEdge,
  BuilderAPI,
  FlowExport,
  ValidationResult,
  NodeType,
  ConnectionParams,
  BuilderEvents,
  Analytics,
} from '../types/builder';
import { useUndoRedo } from './useUndoRedo';

interface UseBuilderAPIOptions {
  initialNodes?: BuilderNode[];
  initialEdges?: BuilderEdge[];
  events?: BuilderEvents;
  analytics?: Analytics;
}

export function useBuilderAPI(options: UseBuilderAPIOptions = {}): {
  api: BuilderAPI;
  nodes: BuilderNode[];
  edges: BuilderEdge[];
  selectedNodes: string[];
  selectedEdges: string[];
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  isValidConnection: (params: ConnectionParams) => boolean;
  snapToGrid: boolean;
  toggleSnapToGrid: () => void;
} {
  const reactFlow = useReactFlow();
  const { events, analytics } = options;

  const [nodes, setNodes] = useState<BuilderNode[]>(options.initialNodes || []);
  const [edges, setEdges] = useState<BuilderEdge[]>(options.initialEdges || []);
  const [snapToGrid, setSnapToGrid] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);

  const clipboardRef = useRef<{ nodes: BuilderNode[]; edges: BuilderEdge[] } | null>(null);
  const mousePositionRef = useRef({ x: 0, y: 0 });

  const { pushState, undo: undoHistory, redo: redoHistory, canUndo, canRedo } = useUndoRedo();

  // Track mouse position for paste
  useCallback(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mousePositionRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Validation logic
  const isValidConnection = useCallback((params: ConnectionParams): boolean => {
    const { source, target, sourceNodeType, targetNodeType } = params;

    // No self-loops
    if (source === target) {
      return false;
    }

    // Check for duplicate edges
    const isDuplicate = edges.some(
      edge =>
        edge.source === source &&
        edge.target === target &&
        edge.sourceHandle === params.sourceHandle &&
        edge.targetHandle === params.targetHandle
    );

    if (isDuplicate) {
      return false;
    }

    // TODO: Add custom validation rules based on node types
    // e.g., start nodes can only have outgoing connections

    return true;
  }, [edges]);

  // Node operations
  const addNode = useCallback((
    nodeType: NodeType,
    position: { x: number; y: number },
    data: Partial<BuilderNode['data']>
  ) => {
    const newNode: BuilderNode = {
      id: `${nodeType}-${uuidv4()}`,
      type: nodeType,
      position: snapToGrid
        ? { x: Math.round(position.x / 16) * 16, y: Math.round(position.y / 16) * 16 }
        : position,
      data: {
        label: data.label || `New ${nodeType}`,
        ...data,
      },
    };

    setNodes(nds => {
      const updated = [...nds, newNode];
      pushState(updated, edges);
      return updated;
    });

    events?.onNodeAdd?.(newNode);
    analytics?.track('node_added', { nodeType, nodeId: newNode.id });
  }, [snapToGrid, edges, events, analytics, pushState]);

  const removeNode = useCallback((nodeId: string) => {
    const confirmed = window.confirm('Are you sure you want to delete this node?');
    if (!confirmed) return;

    setNodes(nds => {
      const updated = nds.filter(n => n.id !== nodeId);
      pushState(updated, edges);
      return updated;
    });

    // Remove connected edges
    setEdges(eds => eds.filter(e => e.source !== nodeId && e.target !== nodeId));

    events?.onNodeRemove?.(nodeId);
    analytics?.track('node_removed', { nodeId });
  }, [edges, events, analytics, pushState]);

  const updateNode = useCallback((nodeId: string, partialData: Partial<BuilderNode['data']>) => {
    setNodes(nds => {
      const updated = nds.map(node =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, ...partialData } }
          : node
      );
      pushState(updated, edges);
      return updated;
    });

    events?.onNodeUpdate?.(nodeId, partialData);
    analytics?.track('node_updated', { nodeId });
  }, [edges, events, analytics, pushState]);

  // Edge operations
  const addEdge = useCallback((
    sourceId: string,
    sourceHandle: string | null,
    targetId: string,
    targetHandle: string | null
  ) => {
    const newEdge: BuilderEdge = {
      id: `e-${uuidv4()}`,
      source: sourceId,
      sourceHandle,
      target: targetId,
      targetHandle,
      type: 'smoothstep',
      animated: false,
    };

    setEdges(eds => {
      const updated = [...eds, newEdge];
      pushState(nodes, updated);
      return updated;
    });

    events?.onEdgeAdd?.(newEdge);
    analytics?.track('edge_added', { edgeId: newEdge.id, source: sourceId, target: targetId });
  }, [nodes, events, analytics, pushState]);

  const removeEdge = useCallback((edgeId: string) => {
    setEdges(eds => {
      const updated = eds.filter(e => e.id !== edgeId);
      pushState(nodes, updated);
      return updated;
    });

    events?.onEdgeRemove?.(edgeId);
    analytics?.track('edge_removed', { edgeId });
  }, [nodes, events, analytics, pushState]);

  // Export/Import
  const exportFlow = useCallback((): FlowExport => {
    const flow: FlowExport = {
      meta: {
        name: 'workflow',
        createdAt: new Date().toISOString(),
        version: '1.0',
      },
      nodes,
      edges,
    };

    events?.onExport?.(flow);
    analytics?.track('flow_exported', { nodeCount: nodes.length, edgeCount: edges.length });

    return flow;
  }, [nodes, edges, events, analytics]);

  const importFlow = useCallback((flow: FlowExport): ValidationResult => {
    try {
      // Validate structure
      if (!flow.nodes || !Array.isArray(flow.nodes)) {
        return { valid: false, error: 'Invalid nodes array' };
      }
      if (!flow.edges || !Array.isArray(flow.edges)) {
        return { valid: false, error: 'Invalid edges array' };
      }

      // Validate node IDs are unique
      const nodeIds = new Set(flow.nodes.map(n => n.id));
      if (nodeIds.size !== flow.nodes.length) {
        return { valid: false, error: 'Duplicate node IDs found' };
      }

      setNodes(flow.nodes);
      setEdges(flow.edges);
      pushState(flow.nodes, flow.edges);

      events?.onImport?.(flow);
      analytics?.track('flow_imported', { nodeCount: flow.nodes.length, edgeCount: flow.edges.length });

      return { valid: true };
    } catch (error) {
      return { valid: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }, [events, analytics, pushState]);

  // Canvas operations
  const clearCanvas = useCallback(() => {
    const confirmed = window.confirm('Clear entire canvas? This cannot be undone.');
    if (!confirmed) return;

    setNodes([]);
    setEdges([]);
    pushState([], []);

    analytics?.track('canvas_cleared', {});
  }, [analytics, pushState]);

  const fitView = useCallback(() => {
    reactFlow.fitView({ padding: 0.2, duration: 300 });
    analytics?.track('fit_view', {});
  }, [reactFlow, analytics]);

  const zoomIn = useCallback(() => {
    reactFlow.zoomIn({ duration: 200 });
    analytics?.track('zoom_in', {});
  }, [reactFlow, analytics]);

  const zoomOut = useCallback(() => {
    reactFlow.zoomOut({ duration: 200 });
    analytics?.track('zoom_out', {});
  }, [reactFlow, analytics]);

  // Undo/Redo
  const undo = useCallback(() => {
    const state = undoHistory();
    if (state) {
      setNodes(state.nodes);
      setEdges(state.edges);
      analytics?.track('undo', {});
    }
  }, [undoHistory, analytics]);

  const redo = useCallback(() => {
    const state = redoHistory();
    if (state) {
      setNodes(state.nodes);
      setEdges(state.edges);
      analytics?.track('redo', {});
    }
  }, [redoHistory, analytics]);

  // Copy/Paste
  const copySelected = useCallback(() => {
    const selectedNodeIds = nodes.filter(n => n.selected).map(n => n.id);
    if (selectedNodeIds.length === 0) return;

    const selectedNodesData = nodes.filter(n => selectedNodeIds.includes(n.id));
    const selectedEdgesData = edges.filter(
      e => selectedNodeIds.includes(e.source) && selectedNodeIds.includes(e.target)
    );

    clipboardRef.current = { nodes: selectedNodesData, edges: selectedEdgesData };

    // Try to use Clipboard API
    const clipboardData = JSON.stringify({ nodes: selectedNodesData, edges: selectedEdgesData });
    navigator.clipboard?.writeText(clipboardData).catch(() => {
      console.log('[Copy] Clipboard API not available, using internal clipboard');
    });

    analytics?.track('nodes_copied', { count: selectedNodeIds.length });
  }, [nodes, edges, analytics]);

  const pasteClipboard = useCallback((position?: { x: number; y: number }) => {
    if (!clipboardRef.current) return;

    const { nodes: copiedNodes, edges: copiedEdges } = clipboardRef.current;

    // Generate new IDs and offset positions
    const idMap = new Map<string, string>();
    const pastedNodes = copiedNodes.map((node, index) => {
      const newId = `${node.type}-${uuidv4()}`;
      idMap.set(node.id, newId);

      const offset = position || { x: 30, y: 30 };

      return {
        ...node,
        id: newId,
        position: {
          x: node.position.x + offset.x,
          y: node.position.y + offset.y,
        },
        selected: false,
      };
    });

    const pastedEdges = copiedEdges.map(edge => ({
      ...edge,
      id: `e-${uuidv4()}`,
      source: idMap.get(edge.source) || edge.source,
      target: idMap.get(edge.target) || edge.target,
    }));

    setNodes(nds => {
      const updated = [...nds, ...pastedNodes];
      pushState(updated, [...edges, ...pastedEdges]);
      return updated;
    });
    setEdges(eds => [...eds, ...pastedEdges]);

    analytics?.track('nodes_pasted', { count: pastedNodes.length });
  }, [edges, analytics, pushState]);

  // Simulation
  const simulate = useCallback(() => {
    setIsSimulating(true);
    events?.onSimulateStart?.();
    analytics?.track('simulation_started', {});

    // TODO: Implement visual pulse animation along edges
    // This is a placeholder - actual animation would use CSS keyframes or Canvas API

    setTimeout(() => {
      setIsSimulating(false);
      events?.onSimulateEnd?.();
      analytics?.track('simulation_ended', {});
    }, 3000);
  }, [events, analytics]);

  const stopSimulation = useCallback(() => {
    setIsSimulating(false);
    events?.onSimulateEnd?.();
  }, [events]);

  // React Flow event handlers
  const onNodesChange = useCallback((changes: NodeChange[]) => {
    setNodes(nds => {
      const updated = applyNodeChanges(changes, nds) as BuilderNode[];

      // Push to history on drag stop
      const hasDragStop = changes.some(c => c.type === 'position' && c.dragging === false);
      if (hasDragStop) {
        pushState(updated, edges);
      }

      return updated;
    });
  }, [edges, pushState]);

  const onEdgesChange = useCallback((changes: EdgeChange[]) => {
    setEdges(eds => {
      const updated = applyEdgeChanges(changes, eds) as BuilderEdge[];
      pushState(nodes, updated);
      return updated;
    });
  }, [nodes, pushState]);

  const onConnect = useCallback((connection: Connection) => {
    if (!connection.source || !connection.target) return;

    const sourceNode = nodes.find(n => n.id === connection.source);
    const targetNode = nodes.find(n => n.id === connection.target);

    const valid = isValidConnection({
      source: connection.source,
      sourceHandle: connection.sourceHandle,
      target: connection.target,
      targetHandle: connection.targetHandle,
      sourceNodeType: sourceNode?.type,
      targetNodeType: targetNode?.type,
    });

    if (!valid) {
      // TODO: Show toast notification
      console.warn('[Connection] Invalid connection attempt');
      analytics?.track('connection_invalid', { source: connection.source, target: connection.target });
      return;
    }

    setEdges(eds => {
      const newEdge: BuilderEdge = {
        ...connection,
        id: `e-${uuidv4()}`,
        type: 'smoothstep',
        animated: false,
      } as BuilderEdge;

      const updated = addReactFlowEdge(newEdge, eds) as BuilderEdge[];
      pushState(nodes, updated);

      events?.onEdgeAdd?.(newEdge);
      analytics?.track('edge_connected', { edgeId: newEdge.id });

      return updated;
    });
  }, [nodes, isValidConnection, events, analytics, pushState]);

  const toggleSnapToGrid = useCallback(() => {
    setSnapToGrid(prev => !prev);
  }, []);

  // Selection tracking
  const selectedNodes = nodes.filter(n => n.selected).map(n => n.id);
  const selectedEdges = edges.filter(e => e.selected).map(e => e.id);

  const api: BuilderAPI = {
    addNode,
    removeNode,
    updateNode,
    addEdge,
    removeEdge,
    exportFlow,
    importFlow,
    clearCanvas,
    fitView,
    zoomIn,
    zoomOut,
    undo,
    redo,
    canUndo: () => canUndo,
    canRedo: () => canRedo,
    copySelected,
    pasteClipboard,
    simulate,
    stopSimulation,
  };

  return {
    api,
    nodes,
    edges,
    selectedNodes,
    selectedEdges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    isValidConnection,
    snapToGrid,
    toggleSnapToGrid,
  };
}
