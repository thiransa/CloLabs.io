import React, { useCallback, useEffect, useRef, DragEvent, KeyboardEvent, useMemo } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
  useReactFlow,
  SelectionMode,
  Panel,
  NodeTypes,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useBuilderAPI } from '../hooks/useBuilderAPI';
import { useAutoSave } from '../hooks/useAutoSave';
import { BuilderNode, BuilderEdge, NodeType, BuilderEvents, Analytics } from '../types/builder';

// Custom node components
import CustomNode from './CustomNode.tsx';

// Initial sample nodes - defined outside to prevent re-creation
const initialNodes: BuilderNode[] = [
  {
    id: 'start-1',
    type: 'start',
    position: { x: 250, y: 50 },
    data: { label: 'Start', description: 'Form submission trigger' }
  },
  {
    id: 'action-1',
    type: 'action',
    position: { x: 250, y: 180 },
    data: { label: 'Generate Summary', description: 'ChatGPT AI analysis' }
  },
  {
    id: 'store-1',
    type: 'store',
    position: { x: 250, y: 310 },
    data: { label: 'Store Data', description: 'Save to database' }
  }
];

const initialEdges: BuilderEdge[] = [
  {
    id: 'e1-2',
    source: 'start-1',
    target: 'action-1',
    type: 'smoothstep',
    animated: true
  },
  {
    id: 'e2-3',
    source: 'action-1',
    target: 'store-1',
    type: 'smoothstep',
    animated: true
  }
];

interface CanvasAreaProps {
  events?: BuilderEvents;
  analytics?: Analytics;
}

function CanvasAreaInner({ events, analytics }: CanvasAreaProps) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { project } = useReactFlow();

  // Memoize nodeTypes to prevent React Flow warning
  const nodeTypes: NodeTypes = useMemo(() => ({
    start: CustomNode,
    form: CustomNode,
    action: CustomNode,
    store: CustomNode,
    integration: CustomNode,
    function: CustomNode,
    condition: CustomNode,
  }), []);

  const {
    api,
    nodes,
    edges,
    selectedNodes,
    onNodesChange,
    onEdgesChange,
    onConnect,
    isValidConnection,
    snapToGrid,
    toggleSnapToGrid,
  } = useBuilderAPI({ 
    initialNodes, 
    initialEdges, 
    events, 
    analytics 
  });

  // Debug logging
  console.log('CanvasArea rendering - Nodes:', nodes.length, 'Edges:', edges.length);

  // Autosave
  useAutoSave(nodes, edges);

  // Selection tracking
  useEffect(() => {
    events?.onSelectionChange?.(selectedNodes, []);
  }, [selectedNodes, events]);

  // Drag and drop from sidebar
  const onDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow') as NodeType;
      if (!type) return;

      const position = project({
        x: event.clientX - (reactFlowWrapper.current?.getBoundingClientRect().left || 0),
        y: event.clientY - (reactFlowWrapper.current?.getBoundingClientRect().top || 0),
      });

      const label = type.charAt(0).toUpperCase() + type.slice(1);
      api.addNode(type, position, { label });
    },
    [project, api]
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      // Delete selected nodes
      if (event.key === 'Delete' || event.key === 'Backspace') {
        const selected = nodes.filter(n => n.selected);
        if (selected.length > 0) {
          event.preventDefault();
          selected.forEach(node => api.removeNode(node.id));
        }
      }

      // Undo
      if ((event.metaKey || event.ctrlKey) && event.key === 'z' && !event.shiftKey) {
        event.preventDefault();
        api.undo();
      }

      // Redo
      if ((event.metaKey || event.ctrlKey) && (event.key === 'y' || (event.key === 'z' && event.shiftKey))) {
        event.preventDefault();
        api.redo();
      }

      // Copy
      if ((event.metaKey || event.ctrlKey) && event.key === 'c') {
        const hasSelection = nodes.some(n => n.selected);
        if (hasSelection) {
          event.preventDefault();
          api.copySelected();
        }
      }

      // Paste
      if ((event.metaKey || event.ctrlKey) && event.key === 'v') {
        event.preventDefault();
        api.pasteClipboard();
      }

      // Nudge with arrow keys
      if (event.key.startsWith('Arrow')) {
        const selected = nodes.filter(n => n.selected);
        if (selected.length > 0) {
          event.preventDefault();
          const delta = event.shiftKey ? 10 : 1;
          const dx = event.key === 'ArrowLeft' ? -delta : event.key === 'ArrowRight' ? delta : 0;
          const dy = event.key === 'ArrowUp' ? -delta : event.key === 'ArrowDown' ? delta : 0;

          selected.forEach(node => {
            const newPosition = {
              x: node.position.x + dx,
              y: node.position.y + dy,
            };
            // Update node position via React Flow internals
            // Note: This is a simplified approach; proper implementation would use setNodes
          });
        }
      }

      // Fit view
      if ((event.metaKey || event.ctrlKey) && event.key === '0') {
        event.preventDefault();
        api.fitView();
      }

      // Select all
      if ((event.metaKey || event.ctrlKey) && event.key === 'a') {
        const flowElement = reactFlowWrapper.current?.querySelector('.react-flow__viewport');
        if (flowElement && document.activeElement === flowElement) {
          event.preventDefault();
          // Select all nodes - would need to update nodes state
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nodes, api]);

  // Accessibility
  const handleNodeKeyDown = useCallback((event: KeyboardEvent<HTMLDivElement>, nodeId: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      // Toggle node selection or open config panel
      analytics?.track('node_activated_keyboard', { nodeId });
    }
  }, [analytics]);

  return (
    <div
      ref={reactFlowWrapper}
      className="canvas-area"
      style={{ 
        display: 'flex',
        flexDirection: 'column'
      }}
      role="region"
      aria-label="Workflow canvas"
    >
      <div style={{ width: '100%', height: '100%', flex: 1 }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          isValidConnection={(connection) => {
            const sourceNode = nodes.find(n => n.id === connection.source);
            const targetNode = nodes.find(n => n.id === connection.target);
            return isValidConnection({
              source: connection.source!,
              sourceHandle: connection.sourceHandle,
              target: connection.target!,
              targetHandle: connection.targetHandle,
              sourceNodeType: sourceNode?.type,
              targetNodeType: targetNode?.type,
            });
          }}
          nodeTypes={nodeTypes}
          onDragOver={onDragOver}
          onDrop={onDrop}
          snapToGrid={snapToGrid}
          snapGrid={[16, 16]}
          selectionMode={SelectionMode.Partial}
          multiSelectionKeyCode={['Shift', 'Meta', 'Control']}
          deleteKeyCode={['Delete', 'Backspace']}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          attributionPosition="bottom-left"
          role="application"
          aria-label="Interactive workflow builder"
          tabIndex={0}
        >
        <Background
          color="#e5e7eb"
          gap={24}
          size={1}
          style={{ backgroundColor: '#fafafa' }}
        />
        
        <Controls
          showInteractive={false}
          position="bottom-right"
          style={{ display: 'none' }} // Hidden - we use custom controls
        />

        <MiniMap
          nodeColor={(node) => {
            const typeColors: Record<string, string> = {
              start: '#10b981',
              form: '#3b82f6',
              action: '#f59e0b',
              store: '#8b5cf6',
              integration: '#ec4899',
              function: '#06b6d4',
              condition: '#f97316',
            };
            return typeColors[node.type as string] || '#6b7280';
          }}
          style={{ display: 'none' }} // Hidden by default - can be toggled
          position="bottom-left"
        />

        <Panel position="top-right" style={{ display: 'flex', gap: '8px', margin: '12px' }}>
          <button
            onClick={toggleSnapToGrid}
            className={`canvas-control-btn ${snapToGrid ? 'active' : ''}`}
            aria-label="Toggle snap to grid"
            title={`Snap to grid: ${snapToGrid ? 'ON' : 'OFF'}`}
            style={{
              padding: '6px 12px',
              background: snapToGrid ? '#3b82f6' : 'white',
              color: snapToGrid ? 'white' : '#374151',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '13px',
              cursor: 'pointer',
              fontWeight: '500',
            }}
          >
            {snapToGrid ? '🔲 Grid ON' : '⬜ Grid OFF'}
          </button>
        </Panel>
      </ReactFlow>
      </div>
    </div>
  );
}

// Export wrapped component
export default function CanvasArea(props: CanvasAreaProps) {
  return (
    <ReactFlowProvider>
      <CanvasAreaInner {...props} />
    </ReactFlowProvider>
  );
}

// Export API hook for external use
export { useBuilderAPI } from '../hooks/useBuilderAPI';
