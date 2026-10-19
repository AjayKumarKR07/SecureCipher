/**
 * Security & Performance Analytics API Service
 * Handles authenticated requests for metrics, charts, performance, security events, and audit exports.
 */
import { getAuthHeaders, API_BASE_URL } from './api';

/**
 * Convert an object of parameters into a clean URL query string.
 */
function buildQueryString(params = {}) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '' && value !== 'ALL') {
      query.append(key, value);
    }
  }
  const str = query.toString();
  return str ? `?${str}` : '';
}

/**
 * Fetch top-level KPI summary (total, success, failed, verification failures, latency).
 */
export async function fetchAnalyticsSummary(params = {}) {
  const qs = buildQueryString({
    start_time: params.startTime,
    end_time: params.endTime,
    algorithm: params.algorithm,
    operation_type: params.operationType,
    status: params.status,
  });
  const res = await fetch(`${API_BASE_URL}/analytics/summary${qs}`, {
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch analytics summary (HTTP ${res.status})`);
  }
  return res.json();
}

/**
 * Fetch time-series operation buckets for trend charts.
 */
export async function fetchOperationsOverTime(params = {}) {
  const qs = buildQueryString({
    start_time: params.startTime,
    end_time: params.endTime,
    algorithm: params.algorithm,
    operation_type: params.operationType,
  });
  const res = await fetch(`${API_BASE_URL}/analytics/operations-over-time${qs}`, {
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch operations over time (HTTP ${res.status})`);
  }
  return res.json();
}

/**
 * Fetch categorical distribution by algorithm and operation type.
 */
export async function fetchDistribution(params = {}) {
  const qs = buildQueryString({
    start_time: params.startTime,
    end_time: params.endTime,
  });
  const res = await fetch(`${API_BASE_URL}/analytics/distribution${qs}`, {
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch distribution metrics (HTTP ${res.status})`);
  }
  return res.json();
}

/**
 * Fetch performance percentiles and duration statistics.
 */
export async function fetchPerformance(params = {}) {
  const qs = buildQueryString({
    start_time: params.startTime,
    end_time: params.endTime,
  });
  const res = await fetch(`${API_BASE_URL}/analytics/performance${qs}`, {
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch performance metrics (HTTP ${res.status})`);
  }
  return res.json();
}

/**
 * Fetch heuristic security events & anomaly indicators.
 */
export async function fetchSecurityEvents(params = {}) {
  const qs = buildQueryString({
    start_time: params.startTime,
    end_time: params.endTime,
    page: params.page || 1,
    page_size: params.pageSize || 20,
  });
  const res = await fetch(`${API_BASE_URL}/analytics/security-events${qs}`, {
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch security events (HTTP ${res.status})`);
  }
  return res.json();
}

/**
 * Trigger file download of sanitized audit records in CSV or JSON format.
 */
export async function downloadAuditExport(params = {}) {
  const format = (params.format || 'csv').toLowerCase();
  const qs = buildQueryString({
    format,
    start_time: params.startTime,
    end_time: params.endTime,
    algorithm: params.algorithm,
    operation_type: params.operationType,
    status: params.status,
  });
  const res = await fetch(`${API_BASE_URL}/analytics/export${qs}`, {
    headers: {
      ...getAuthHeaders(),
    },
  });
  if (!res.ok) {
    throw new Error(`Failed to export audit records (HTTP ${res.status})`);
  }

  const blob = await res.blob();
  const disposition = res.headers.get('content-disposition');
  let filename = `securecipher_audit_${new Date().toISOString().slice(0, 10)}.${format}`;
  if (disposition && disposition.includes('filename=')) {
    const match = disposition.match(/filename="?([^";]+)"?/);
    if (match && match[1]) {
      filename = match[1];
    }
  }

  const blobUrl = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(blobUrl);
  return { success: true, filename };
}
