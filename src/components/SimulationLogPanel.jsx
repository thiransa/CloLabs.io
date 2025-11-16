import React from 'react';
import './SimulationLogPanel.css';

const SimulationLogPanel = ({ timeline, summary, isRunning, onClose }) => {
  if (!timeline && !isRunning) return null;

  return (
    <div className="simulation-log-panel">
      <div className="simulation-log-header">
        <h3>Simulation Log</h3>
        {onClose && (
          <button className="simulation-close-btn" onClick={onClose}>×</button>
        )}
      </div>

      {isRunning && (
        <div className="simulation-status running">
          <div className="simulation-spinner"></div>
          <span>Running simulation...</span>
        </div>
      )}

      {timeline && timeline.length > 0 && (
        <div className="simulation-timeline">
          {timeline.map((entry, index) => (
            <div key={`${entry.nodeId}-${index}-${entry.timestamp}`} className="timeline-entry">
              <div className="timeline-marker">{index + 1}</div>
              <div className="timeline-content">
                <div className="timeline-header">
                  <span className="timeline-label">{entry.label}</span>
                  <span className="timeline-type">{entry.type}</span>
                  <span className="timeline-duration">{entry.duration}ms</span>
                </div>
                <div className="timeline-result">
                  {entry.result.ok ? (
                    <span className="result-success">✓ Success</span>
                  ) : (
                    <span className="result-error">✗ Failed</span>
                  )}
                  {entry.result.message && (
                    <span className="result-message">{entry.result.message}</span>
                  )}
                  {entry.result.statusCode && (
                    <div className="result-detail">Status: {entry.result.statusCode}</div>
                  )}
                  {entry.result.text && (
                    <div className="result-detail">{entry.result.text}</div>
                  )}
                  {entry.result.url && (
                    <div className="result-detail">URL: {entry.result.url}</div>
                  )}
                  {entry.type === 'condition' && entry.result.passed !== undefined && (
                    <div className="result-detail">
                      Condition: {entry.result.passed ? '✓ Passed' : '✗ Not Met'}
                    </div>
                  )}
                  {/* Debug: Show full result object in development */}
                  {import.meta.env.DEV && (
                    <details className="result-debug">
                      <summary>Debug Info</summary>
                      <pre>{JSON.stringify(entry.result, null, 2)}</pre>
                    </details>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {summary && (
        <div className="simulation-summary">
          <h4>Summary</h4>
          <div className="summary-stats">
            <div className="summary-stat">
              <span className="stat-label">Total Nodes:</span>
              <span className="stat-value">{summary.totalNodes}</span>
            </div>
            <div className="summary-stat">
              <span className="stat-label">Success:</span>
              <span className="stat-value success">{summary.successCount}</span>
            </div>
            {summary.errorCount > 0 && (
              <div className="summary-stat">
                <span className="stat-label">Errors:</span>
                <span className="stat-value error">{summary.errorCount}</span>
              </div>
            )}
            <div className="summary-stat">
              <span className="stat-label">Duration:</span>
              <span className="stat-value">{summary.totalDuration}ms</span>
            </div>
            <div className="summary-stat">
              <span className="stat-label">Status:</span>
              <span className={`stat-value ${summary.status}`}>
                {summary.status === 'success' ? '✓ Complete' : '⚠ Partial'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SimulationLogPanel;
