import { Node, Edge } from 'reactflow';

// Node types
export type NodeType = 
  | 'start'
  | 'form'
  | 'action'
  | 'store'
  | 'integration'
  | 'function'
  | 'condition';

// Builder-specific node interface
export interface BuilderNode extends Node {
  id: string;
  type: NodeType;
  position: { x: number; y: number };
  data: {
    label: string;
    description?: string;
    type?: NodeType;
    [key: string]: any;
  };
  selected?: boolean;
}

// Builder-specific edge interface
export interface BuilderEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
  type?: 'smoothstep' | 'step' | 'straight' | 'default';
  animated?: boolean;
  label?: string;
  selected?: boolean;
}

// Canvas state
export interface BuilderState {
  nodes: BuilderNode[];
  edges: BuilderEdge[];
  selectedNodes: string[];
  selectedEdges: string[];
  snapToGrid: boolean;
}

// API interface for canvas operations
export interface BuilderAPI {
  addNode: (type: NodeType, position: { x: number; y: number }, data: Partial<BuilderNode['data']>) => void;
  removeNode: (nodeId: string) => void;
  updateNode: (nodeId: string, data: Partial<BuilderNode['data']>) => void;
  addEdge: (sourceId: string, sourceHandle: string | null, targetId: string, targetHandle: string | null) => void;
  removeEdge: (edgeId: string) => void;
  exportFlow: () => FlowExport;
  importFlow: (flow: FlowExport) => ValidationResult;
  clearCanvas: () => void;
  fitView: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  copySelected: () => void;
  pasteClipboard: (position?: { x: number; y: number }) => void;
  simulate: () => void;
  stopSimulation: () => void;
}

// Flow export/import format
export interface FlowExport {
  meta: {
    name: string;
    createdAt: string;
    version: string;
  };
  nodes: BuilderNode[];
  edges: BuilderEdge[];
}

// Validation result
export interface ValidationResult {
  valid: boolean;
  error?: string;
}

// Connection parameters for validation
export interface ConnectionParams {
  source: string;
  sourceHandle: string | null;
  target: string;
  targetHandle: string | null;
  sourceNodeType?: NodeType;
  targetNodeType?: NodeType;
}

// Event callbacks
export interface BuilderEvents {
  onNodeAdd?: (node: BuilderNode) => void;
  onNodeRemove?: (nodeId: string) => void;
  onNodeUpdate?: (nodeId: string, data: Partial<BuilderNode['data']>) => void;
  onEdgeAdd?: (edge: BuilderEdge) => void;
  onEdgeRemove?: (edgeId: string) => void;
  onSelectionChange?: (selectedNodes: string[], selectedEdges: string[]) => void;
  onImport?: (flow: FlowExport) => void;
  onExport?: (flow: FlowExport) => void;
  onSave?: (flow: FlowExport) => void;
  onSimulateStart?: () => void;
  onSimulateEnd?: () => void;
}

// Analytics tracking
export interface Analytics {
  track: (event: string, properties: Record<string, any>) => void;
}
