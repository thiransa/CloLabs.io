import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, AlertCircle, ChevronDown, ChevronRight, RefreshCw } from 'lucide-react';
import { fetchWorkflowRuns } from '../lib/runApi.js';
import './RunHistory.css';

const RunHistory = ({ workflowId, onRetryRun }) => {
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedRunId, setExpandedRunId] = useState(null);

  useEffect(() => {
    console.log('[RunHistory] Component mounted/updated, workflowId:', workflowId);
    if (workflowId) {
      loadRuns();
    } else {
      console.log('[RunHistory] No workflowId provided, workflow not saved yet');
    }
  }, [workflowId]);

  const loadRuns = async () => {
    console.log('[RunHistory] loadRuns called, workflowId:', workflowId);
    
    if (!workflowId) {
      console.log('[RunHistory] No workflowId, setting error');
      setError('Workflow not saved yet');
      return;
    }

    setLoading(true);
    setError(null);

    console.log('[RunHistory] Fetching runs for workflowId:', workflowId);
    const result = await fetchWorkflowRuns(workflowId, 20);
    console.log('[RunHistory] Fetch result:', result);

    if (result.error) {
      console.error('[RunHistory] Error loading runs:', result.error);
      setError(result.error.message || 'Failed to load runs');
    } else {
      console.log('[RunHistory] Runs loaded successfully, count:', result.data?.length || 0);
      setRuns(result.data || []);
    }

    setLoading(false);
  };

  const toggleExpand = (runId) => {
    setExpandedRunId(expandedRunId === runId ? null : runId);
  };

  const handleRetry = (run) => {
    if (onRetryRun) {
      onRetryRun(run);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const badges = {
      success: { icon: CheckCircle, label: 'Success', className: 'status-success' },
      partial: { icon: AlertCircle, label: 'Partial', className: 'status-partial' },
      failed: { icon: AlertCircle, label: 'Failed', className: 'status-failed' }
    };

    const badge = badges[status] || badges.failed;
    const Icon = badge.icon;

    return (
      <span className={`status-badge ${badge.className}`}>
        <Icon size={12} />
        {badge.label}
      </span>
    );
  };

  if (!workflowId) {
    return (
      <div className="run-history-empty">
        <Clock size={48} opacity={0.3} />
        <p>Save your workflow first to see run history</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="run-history-loading">
        <div className="loading-spinner"></div>
        <p>Loading run history...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="run-history-error">
        <AlertCircle size={24} />
        <p>{error}</p>
        <button onClick={loadRuns} className="retry-load-btn">
          Try Again
        </button>
      </div>
    );
  }

  if (runs.length === 0) {
    return (
      <div className="run-history-empty">
        <Clock size={48} opacity={0.3} />
        <p>No runs yet</p>
        <span className="empty-hint">Click "Run Test" to execute your workflow</span>
      </div>
    );
  }

  return (
    <div className="run-history-container">
      <div className="run-history-header">
        <h4>Recent Runs</h4>
        <button onClick={loadRuns} className="refresh-btn" title="Refresh">
          <RefreshCw size={14} />
        </button>
      </div>

      <div className="runs-list">
        {runs.map((run) => {
          const isExpanded = expandedRunId === run.id;
          const summary = run.summary || {};

          return (
            <div key={run.id} className="run-item">
              <div className="run-header" onClick={() => toggleExpand(run.id)}>
                <div className="run-header-left">
                  {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  <span className="run-time">{formatDate(run.created_at)}</span>
                  {getStatusBadge(run.status)}
                </div>
                <div className="run-header-right">
                  <span className="run-stats">
                    {summary.totalNodes || 0} nodes · {summary.totalDuration || 0}ms
                  </span>
                  <button
                    className="retry-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRetry(run);
                    }}
                    title="Retry this run"
                  >
                    <RefreshCw size={14} />
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div className="run-details">
                  <div className="run-summary">
                    <div className="summary-item">
                      <span className="summary-label">Total Nodes:</span>
                      <span className="summary-value">{summary.totalNodes || 0}</span>
                    </div>
                    <div className="summary-item">
                      <span className="summary-label">Success:</span>
                      <span className="summary-value success">{summary.successCount || 0}</span>
                    </div>
                    {summary.errorCount > 0 && (
                      <div className="summary-item">
                        <span className="summary-label">Errors:</span>
                        <span className="summary-value error">{summary.errorCount}</span>
                      </div>
                    )}
                    <div className="summary-item">
                      <span className="summary-label">Duration:</span>
                      <span className="summary-value">{summary.totalDuration || 0}ms</span>
                    </div>
                  </div>

                  {run.timeline && run.timeline.length > 0 && (
                    <div className="run-timeline">
                      <h5>Execution Timeline</h5>
                      {run.timeline.map((entry, index) => (
                        <div key={index} className="timeline-item">
                          <div className="timeline-marker">{index + 1}</div>
                          <div className="timeline-content">
                            <div className="timeline-header">
                              <span className="timeline-label">{entry.label}</span>
                              <span className="timeline-type">{entry.type}</span>
                            </div>
                            <div className="timeline-result">
                              {entry.result?.ok ? (
                                <span className="result-ok">✓ Success</span>
                              ) : (
                                <span className="result-fail">✗ Failed</span>
                              )}
                              <span className="result-duration">{entry.duration}ms</span>
                            </div>
                            {entry.result?.message && (
                              <div className="result-message">{entry.result.message}</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RunHistory;
