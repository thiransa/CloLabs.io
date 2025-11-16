import { useEffect, useRef } from 'react';
import { BuilderNode, BuilderEdge, FlowExport } from '../types/builder';

const STORAGE_KEY = 'builder_flow_autosave';
const AUTOSAVE_DELAY = 2000; // 2 seconds

export function useAutoSave(nodes: BuilderNode[], edges: BuilderEdge[]) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasLoadedRef = useRef(false);

  // Load from storage on mount
  useEffect(() => {
    if (!hasLoadedRef.current) {
      hasLoadedRef.current = true;
      // Loading would be done by the parent component
      // This hook only handles saving
    }
  }, []);

  // Save to storage when nodes/edges change
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      const data: FlowExport = {
        meta: {
          name: 'workflow',
          createdAt: new Date().toISOString(),
          version: '1.0',
        },
        nodes,
        edges,
      };
      
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        console.log('[AutoSave] Saved to localStorage');
      } catch (error) {
        console.error('[AutoSave] Failed to save:', error);
      }
    }, AUTOSAVE_DELAY);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [nodes, edges]);
}

export function loadFromStorage(): FlowExport | null {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('[AutoSave] Failed to load:', error);
  }
  return null;
}

export function clearStorage() {
  localStorage.removeItem(STORAGE_KEY);
}
