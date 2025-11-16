import React from 'react';
import ReactFlow, { Background, Controls } from 'reactflow';
import 'reactflow/dist/style.css';

const nodes = [
  {
    id: '1',
    type: 'default',
    position: { x: 250, y: 100 },
    data: { label: 'Test Node' }
  }
];

function TestCanvas() {
  return (
    <div style={{ width: '100%', height: '600px' }}>
      <ReactFlow 
        nodes={nodes}
        fitView
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}

export default TestCanvas;
