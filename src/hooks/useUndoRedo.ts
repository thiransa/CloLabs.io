import { useCallback, useRef } from 'react';
import { produce } from 'immer';
import { BuilderNode, BuilderEdge } from '../types/builder';

interface HistoryState {
  nodes: BuilderNode[];
  edges: BuilderEdge[];
}

interface UndoRedoHook {
  pushState: (nodes: BuilderNode[], edges: BuilderEdge[]) => void;
  undo: () => HistoryState | null;
  redo: () => HistoryState | null;
  canUndo: boolean;
  canRedo: boolean;
  clear: () => void;
}

const MAX_HISTORY_SIZE = 50;

export function useUndoRedo(): UndoRedoHook {
  const historyRef = useRef<HistoryState[]>([]);
  const currentIndexRef = useRef<number>(-1);
  const lastPushTimeRef = useRef<number>(0);

  const pushState = useCallback((nodes: BuilderNode[], edges: BuilderEdge[]) => {
    const now = Date.now();
    // Debounce: don't push if less than 300ms since last push (avoids spam during drags)
    if (now - lastPushTimeRef.current < 300) {
      return;
    }
    lastPushTimeRef.current = now;

    // Create deep copy using immer
    const state = produce({ nodes, edges }, draft => draft);

    // Remove any redo history after current index
    historyRef.current = historyRef.current.slice(0, currentIndexRef.current + 1);

    // Add new state
    historyRef.current.push(state);

    // Limit history size
    if (historyRef.current.length > MAX_HISTORY_SIZE) {
      historyRef.current.shift();
    } else {
      currentIndexRef.current++;
    }
  }, []);

  const undo = useCallback((): HistoryState | null => {
    if (currentIndexRef.current > 0) {
      currentIndexRef.current--;
      return historyRef.current[currentIndexRef.current];
    }
    return null;
  }, []);

  const redo = useCallback((): HistoryState | null => {
    if (currentIndexRef.current < historyRef.current.length - 1) {
      currentIndexRef.current++;
      return historyRef.current[currentIndexRef.current];
    }
    return null;
  }, []);

  const clear = useCallback(() => {
    historyRef.current = [];
    currentIndexRef.current = -1;
  }, []);

  return {
    pushState,
    undo,
    redo,
    canUndo: currentIndexRef.current > 0,
    canRedo: currentIndexRef.current < historyRef.current.length - 1,
    clear,
  };
}
