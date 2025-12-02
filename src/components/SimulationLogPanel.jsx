import React from 'react';
import './SimulationLogPanel.css';

const SimulationLogPanel = ({ timeline, summary, isRunning, onClose, executionMode = 'simulation', executionId }) => {
  if (!timeline && !isRunning) return null;

  const isLiveExecution = executionMode === 'live';

  return (
    <div className="simulation-log-panel">
      <div className="simulation-log-header">
        <h3>{isLiveExecution ? 'Live Execution Log' : 'Simulation Log'}</h3>
        {executionId && (
          <span style={{ fontSize: '12px', color: '#6b7280', marginLeft: '8px' }}>
            ID: {executionId.substring(0, 8)}...
          </span>
        )}
        {onClose && (
          <button className="simulation-close-btn" onClick={onClose}>×</button>
        )}
      </div>

      {isRunning && (
        <div className="simulation-status running">
          <div className="simulation-spinner"></div>
          <span>{isLiveExecution ? 'Executing workflow...' : 'Running simulation...'}</span>
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
                  {(entry.result?.ok || entry.status === 'completed') ? (
                    <span className="result-success">✓ Success</span>
                  ) : (entry.status === 'failed' || entry.result?.ok === false) ? (
                    <span className="result-error">✗ Failed</span>
                  ) : (
                    <span className="result-pending">⋯ {entry.status || 'pending'}</span>
                  )}
                  {(entry.result?.message || entry.error) && (
                    <span className="result-message">{entry.result?.message || entry.error}</span>
                  )}
                  {entry.result?.statusCode && (
                    <div className="result-detail">Status: {entry.result.statusCode}</div>
                  )}
                  {entry.result?.text && (
                    <div className="result-detail">{entry.result.text}</div>
                  )}
                  {entry.result?.url && (
                    <div className="result-detail">URL: {entry.result.url}</div>
                  )}
                  {entry.type === 'condition' && entry.result?.passed !== undefined && (
                    <div className="result-detail">
                      Condition: {entry.result.passed ? '✓ Passed' : '✗ Not Met'}
                    </div>
                  )}
                  {entry.retriesUsed > 0 && (
                    <div className="result-detail" style={{ color: '#f59e0b' }}>
                      Retries: {entry.retriesUsed}
                    </div>
                  )}
                  {/* Debug: Show full result object in development */}
                  {import.meta.env.DEV && (entry.result || entry.error) && (
                    <details className="result-debug">
                      <summary>Debug Info</summary>
                      <pre>{JSON.stringify(entry.result || { error: entry.error }, null, 2)}</pre>
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
              <span className="stat-value success">{summary.successCount || summary.nodesCompleted || 0}</span>
            </div>
            {(summary.errorCount > 0 || summary.nodesFailed > 0) && (
              <div className="summary-stat">
                <span className="stat-label">Errors:</span>
                <span className="stat-value error">{summary.errorCount || summary.nodesFailed}</span>
              </div>
            )}
            <div className="summary-stat">
              <span className="stat-label">Duration:</span>
              <span className="stat-value">{summary.totalDuration || summary.duration}ms</span>
            </div>
            <div className="summary-stat">
              <span className="stat-label">Status:</span>
              <span className={`stat-value ${summary.status}`}>
                {summary.status === 'success' || summary.status === 'completed' ? '✓ Complete' : '⚠ Partial'}
              </span>
            </div>
            {isLiveExecution && summary.creditsConsumed > 0 && (
              <div className="summary-stat">
                <span className="stat-label">Credits Used:</span>
                <span className="stat-value">{summary.creditsConsumed}</span>
              </div>
            )}
            {isLiveExecution && summary.apiCallsMade > 0 && (
              <div className="summary-stat">
                <span className="stat-label">API Calls:</span>
                <span className="stat-value">{summary.apiCallsMade}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SimulationLogPanel;
