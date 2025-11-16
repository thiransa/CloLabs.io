import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

const CustomNode = memo(({ data, selected, type }: NodeProps) => {
  const nodeIcons: Record<string, string> = {
    start: '▶️',
    form: '📝',
    action: '⚡',
    store: '💾',
    integration: '🔌',
    function: '⚙️',
    condition: '🔀',
  };

  const nodeColors: Record<string, string> = {
    start: '#10b981',
    form: '#3b82f6',
    action: '#f59e0b',
    store: '#8b5cf6',
    integration: '#ec4899',
    function: '#06b6d4',
    condition: '#f97316',
  };

  const nodeType = (type || data.type || 'action') as string;
  const icon = nodeIcons[nodeType] || '📦';
  const color = nodeColors[nodeType] || '#6b7280';

  return (
    <div
      className={`workflow-node ${selected ? 'selected' : ''}`}
      style={{
        padding: '12px 16px',
        borderRadius: '8px',
        background: 'white',
        border: `2px solid ${selected ? color : '#e5e7eb'}`,
        boxShadow: selected
          ? `0 4px 12px ${color}40`
          : '0 2px 4px rgba(0, 0, 0, 0.1)',
        minWidth: '150px',
        transition: 'all 0.2s ease',
      }}
      role="button"
      aria-label={`${nodeType} node: ${data.label}`}
      tabIndex={0}
    >
      <Handle
        type="target"
        position={Position.Top}
        style={{
          background: color,
          width: '10px',
          height: '10px',
          border: '2px solid white',
        }}
        aria-label="Input connection point"
      />
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '6px',
            background: `linear-gradient(135deg, ${color}, ${color}dd)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px',
          }}
        >
          {icon}
        </div>
        <div>
          <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>
            {data.label}
          </div>
          {data.description && (
            <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
              {data.description}
            </div>
          )}
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        style={{
          background: color,
          width: '10px',
          height: '10px',
          border: '2px solid white',
        }}
        aria-label="Output connection point"
      />
    </div>
  );
});

CustomNode.displayName = 'CustomNode';

export default CustomNode;
