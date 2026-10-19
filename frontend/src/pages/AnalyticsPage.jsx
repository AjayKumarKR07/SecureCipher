import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Activity,
  Shield,
  ShieldAlert,
  ShieldCheck,
  PenLine,
  CheckCircle2,
  AlertTriangle,
  Clock,
  RefreshCw,
  Calendar,
  Layers,
  BarChart3,
  TrendingUp,
  AlertCircle,
  Info,
  Printer,
  FileJson,
  FileSpreadsheet,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import {
  fetchAnalyticsSummary,
  fetchOperationsOverTime,
  fetchDistribution,
  fetchPerformance,
  fetchSecurityEvents,
  downloadAuditExport,
} from '../services/analyticsService';
import { formatIndiaTime } from './HistoryPage';

// Color palette for charts
const COLORS = {
  emerald: '#10b981',
  emeraldDark: '#047857',
  rose: '#f43f5e',
  amber: '#f59e0b',
  cyan: '#06b6d4',
  violet: '#8b5cf6',
  indigo: '#6366f1',
  slate: '#64748b',
};

const PIE_COLORS = [
  '#10b981', // Emerald
  '#06b6d4', // Cyan
  '#8b5cf6', // Violet
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#3b82f6', // Blue
  '#14b8a6', // Teal
];

// Preset time ranges
const TIME_RANGES = [
  { label: '24 Hours', days: 1 },
  { label: '7 Days', days: 7 },
  { label: '30 Days', days: 30 },
  { label: '90 Days', days: 90 },
  { label: 'Custom', days: 'custom' },
];

export default function AnalyticsPage() {
  // Filter state
  const [selectedRange, setSelectedRange] = useState(7); // days
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [filterAlgo, setFilterAlgo] = useState('ALL');
  const [filterOpType, setFilterOpType] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');

  // Loading & refresh state
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [exporting, setExporting] = useState(null); // 'csv' | 'json' | null
  const [errorMsg, setErrorMsg] = useState(null);

  // Data state
  const [summary, setSummary] = useState(null);
  const [timeSeries, setTimeSeries] = useState([]);
  const [granularity, setGranularity] = useState('day');
  const [distribution, setDistribution] = useState({ by_algorithm: [], by_operation_type: [] });
  const [performanceData, setPerformanceData] = useState({ by_algorithm: [], by_operation_type: [] });
  const [securityEvents, setSecurityEvents] = useState([]);
  const [activeTab, setActiveTab] = useState('algorithms'); // 'algorithms' | 'operations'

  // Compute ISO start/end based on selection
  const computedDateRange = useMemo(() => {
    if (selectedRange === 'custom') {
      return {
        startTime: customStart ? new Date(customStart).toISOString() : undefined,
        endTime: customEnd ? new Date(customEnd).toISOString() : undefined,
      };
    }
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - Number(selectedRange));
    return {
      startTime: start.toISOString(),
      endTime: end.toISOString(),
    };
  }, [selectedRange, customStart, customEnd]);

  // Load all analytics data
  const loadAnalytics = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setIsRefreshing(true);
    setErrorMsg(null);

    const queryParams = {
      startTime: computedDateRange.startTime,
      endTime: computedDateRange.endTime,
      algorithm: filterAlgo,
      operationType: filterOpType,
      status: filterStatus,
    };

    try {
      const [sumRes, timeRes, distRes, perfRes, secRes] = await Promise.all([
        fetchAnalyticsSummary(queryParams),
        fetchOperationsOverTime(queryParams),
        fetchDistribution({ startTime: queryParams.startTime, endTime: queryParams.endTime }),
        fetchPerformance({ startTime: queryParams.startTime, endTime: queryParams.endTime }),
        fetchSecurityEvents({ startTime: queryParams.startTime, endTime: queryParams.endTime, page: 1, pageSize: 20 }),
      ]);

      setSummary(sumRes);
      setTimeSeries(timeRes.buckets || []);
      setGranularity(timeRes.granularity || 'day');
      setDistribution({
        by_algorithm: distRes.by_algorithm || [],
        by_operation_type: distRes.by_operation_type || [],
      });
      setPerformanceData({
        by_algorithm: perfRes.by_algorithm || [],
        by_operation_type: perfRes.by_operation_type || [],
      });
      setSecurityEvents(secRes.events || []);
    } catch (err) {
      console.error('Failed to load analytics:', err);
      setErrorMsg(err.message || 'Failed to load analytics data.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [computedDateRange, filterAlgo, filterOpType, filterStatus]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  // Auto-refresh interval (30 seconds)
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      loadAnalytics(false);
    }, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh, loadAnalytics]);

  // Export handler
  const handleExport = async (format) => {
    try {
      setExporting(format);
      await downloadAuditExport({
        format,
        startTime: computedDateRange.startTime,
        endTime: computedDateRange.endTime,
        algorithm: filterAlgo,
        operationType: filterOpType,
        status: filterStatus,
      });
    } catch (err) {
      alert(`Export failed: ${err.message}`);
    } finally {
      setExporting(null);
    }
  };

  // Formatted chart data
  const formattedTimeSeries = useMemo(() => {
    return timeSeries.map((item) => {
      let label = item.bucket;
      try {
        const d = new Date(item.bucket);
        if (granularity === 'hour') {
          label = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else {
          label = d.toLocaleDateString([], { month: 'short', day: 'numeric' });
        }
      } catch {
        // fallback
      }
      return {
        ...item,
        label,
      };
    });
  }, [timeSeries, granularity]);

  return (
    <div className="space-y-6">
      {/* ─── Header & Top Controls ────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-emerald-500/15 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h1 className="text-xl md:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
              Security & Performance <span className="text-emerald-400">Analytics</span>
            </h1>
          </div>
          <p className="text-xs text-slate-400 max-w-2xl">
            Real-time telemetry, cryptographic operation volumes, signature verification audits, latency percentiles, and heuristic security indicators scoped strictly to your account.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Auto refresh button */}
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all ${
              autoRefresh
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-sm shadow-emerald-500/20'
                : 'bg-[#06180a] text-slate-400 border-emerald-500/20 hover:text-white'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
            Auto-refresh {autoRefresh ? 'ON' : 'OFF'}
          </button>

          {/* Manual refresh button */}
          <button
            onClick={() => loadAnalytics(true)}
            disabled={isRefreshing}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#06180a] text-emerald-400 border border-emerald-500/30 hover:bg-emerald-950/40 hover:text-emerald-300 transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          {/* Export Dropdown */}
          <div className="flex items-center gap-1 bg-[#06180a] border border-emerald-500/30 rounded-lg p-0.5">
            <button
              onClick={() => handleExport('csv')}
              disabled={exporting !== null}
              title="Download sanitized CSV"
              className="px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-md transition-all flex items-center gap-1"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              {exporting === 'csv' ? 'Exporting...' : 'CSV'}
            </button>
            <span className="text-slate-700">|</span>
            <button
              onClick={() => handleExport('json')}
              disabled={exporting !== null}
              title="Download sanitized JSON"
              className="px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-md transition-all flex items-center gap-1"
            >
              <FileJson className="w-3.5 h-3.5 text-emerald-400" />
              {exporting === 'json' ? 'Exporting...' : 'JSON'}
            </button>
            <span className="text-slate-700">|</span>
            <button
              onClick={() => window.print()}
              title="Print Analytics Report"
              className="px-2 py-1 text-xs font-medium text-slate-300 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-md transition-all"
            >
              <Printer className="w-3.5 h-3.5 text-slate-400 hover:text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* ─── Filter & Range Toolbar ────────────────────────────────────────── */}
      <div className="bg-[#030a04]/90 border border-emerald-500/15 rounded-2xl p-4 shadow-lg backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Time range selector pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-slate-400 flex items-center gap-1 mr-1">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" /> Range:
            </span>
            {TIME_RANGES.map((r) => (
              <button
                key={r.label}
                onClick={() => setSelectedRange(r.days)}
                className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
                  selectedRange === r.days
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-xs'
                    : 'bg-[#06180a] text-slate-400 border border-emerald-500/10 hover:text-slate-200 hover:bg-[#08200d]'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          {/* Granular filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Algorithm Filter */}
            <div className="flex items-center gap-1">
              <label className="text-[11px] text-slate-400 font-mono">Algorithm:</label>
              <select
                value={filterAlgo}
                onChange={(e) => setFilterAlgo(e.target.value)}
                className="bg-[#06180a] border border-emerald-500/20 text-slate-200 text-xs rounded-lg px-2 py-1 focus:outline-hidden focus:border-emerald-400"
              >
                <option value="ALL">All Algorithms</option>
                <option value="AES">AES</option>
                <option value="RSA-PSS">RSA-PSS</option>
                <option value="RSA">RSA (OAEP)</option>
                <option value="Diffie-Hellman">Diffie-Hellman</option>
                <option value="SHA-256">SHA-256</option>
                <option value="MD5">MD5</option>
                <option value="DES">DES</option>
              </select>
            </div>

            {/* Operation Type Filter */}
            <div className="flex items-center gap-1">
              <label className="text-[11px] text-slate-400 font-mono">Operation:</label>
              <select
                value={filterOpType}
                onChange={(e) => setFilterOpType(e.target.value)}
                className="bg-[#06180a] border border-emerald-500/20 text-slate-200 text-xs rounded-lg px-2 py-1 focus:outline-hidden focus:border-emerald-400"
              >
                <option value="ALL">All Types</option>
                <option value="encryption">Encryption</option>
                <option value="decryption">Decryption</option>
                <option value="signature">Signature</option>
                <option value="signature_verification">Signature Verification</option>
                <option value="hash">Hash</option>
                <option value="key_exchange">Key Exchange</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1">
              <label className="text-[11px] text-slate-400 font-mono">Status:</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-[#06180a] border border-emerald-500/20 text-slate-200 text-xs rounded-lg px-2 py-1 focus:outline-hidden focus:border-emerald-400"
              >
                <option value="ALL">All Statuses</option>
                <option value="success">Success</option>
                <option value="failure">Failure</option>
              </select>
            </div>
          </div>
        </div>

        {/* Custom Date Pickers (if Custom is chosen) */}
        {selectedRange === 'custom' && (
          <div className="mt-3 pt-3 border-t border-emerald-500/10 flex flex-wrap items-center gap-3 text-xs">
            <span className="text-slate-400 font-medium">Custom Window:</span>
            <div className="flex items-center gap-1.5">
              <label className="text-slate-500">From:</label>
              <input
                type="datetime-local"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="bg-[#06180a] border border-emerald-500/20 rounded-lg px-2 py-1 text-slate-200 text-xs focus:outline-hidden focus:border-emerald-400"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <label className="text-slate-500">To:</label>
              <input
                type="datetime-local"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="bg-[#06180a] border border-emerald-500/20 rounded-lg px-2 py-1 text-slate-200 text-xs focus:outline-hidden focus:border-emerald-400"
              />
            </div>
          </div>
        )}
      </div>

      {/* Database connection warning */}
      {summary && !summary.database_connected && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
          <div>
            <p className="font-semibold">Database Disconnected / Inactive</p>
            <p className="text-amber-400/80">
              Audit logging requires PostgreSQL. Historical metrics cannot be queried while the database is offline.
            </p>
          </div>
        </div>
      )}

      {/* Error message banner */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <div>
            <p className="font-semibold">Failed to load analytics</p>
            <p className="text-rose-400/80">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* Initial loading state */}
      {loading && !summary && (
        <div className="p-8 rounded-2xl bg-[#040e06]/80 border border-emerald-500/15 flex items-center justify-center gap-3 text-xs text-emerald-400 font-mono">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span>Aggregating audit telemetry & latency metrics...</span>
        </div>
      )}

      {/* ─── Top KPI Metric Cards ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Total Operations */}
        <div className="bg-[#040e06]/90 border border-emerald-500/20 rounded-2xl p-4 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider font-mono">Total Operations</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-white tracking-tight">
              {summary ? summary.total_operations.toLocaleString() : '—'}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
              <span className="text-emerald-400 font-semibold">{summary?.successful_operations || 0} ok</span>
              <span>·</span>
              <span className={summary?.failed_operations ? 'text-rose-400 font-semibold' : 'text-slate-500'}>
                {summary?.failed_operations || 0} failed
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Success Rate */}
        <div className="bg-[#040e06]/90 border border-emerald-500/20 rounded-2xl p-4 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider font-mono">Success Rate</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black tracking-tight flex items-baseline gap-1">
              <span
                className={
                  summary?.success_rate === null
                    ? 'text-slate-500'
                    : summary?.success_rate >= 95
                    ? 'text-emerald-400'
                    : summary?.success_rate >= 80
                    ? 'text-amber-400'
                    : 'text-rose-400'
                }
              >
                {summary?.success_rate !== null ? `${summary?.success_rate}%` : 'N/A'}
              </span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="h-full bg-emerald-400 transition-all duration-500"
                style={{ width: `${summary?.success_rate || 0}%` }}
              />
            </div>
          </div>
        </div>

        {/* Card 3: Failed Operations */}
        <div className="bg-[#040e06]/90 border border-emerald-500/20 rounded-2xl p-4 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider font-mono">Failed Operations</span>
            <div
              className={`p-1.5 rounded-lg ${
                summary?.failed_operations > 0 ? 'bg-rose-500/10 text-rose-400' : 'bg-slate-800 text-slate-400'
              }`}
            >
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div
              className={`text-2xl font-black tracking-tight ${
                summary?.failed_operations > 0 ? 'text-rose-400' : 'text-slate-400'
              }`}
            >
              {summary ? summary.failed_operations.toLocaleString() : '—'}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {summary?.failed_operations > 0 ? (
                <span className="text-rose-400 font-medium">Anomalies or bad inputs logged</span>
              ) : (
                <span className="text-emerald-500/80">Zero failures in period</span>
              )}
            </div>
          </div>
        </div>

        {/* Card 4: Signature Verification Failures */}
        <div className="bg-[#040e06]/90 border border-emerald-500/20 rounded-2xl p-4 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider font-mono">Sig Failures (RSA-PSS)</span>
            <div
              className={`p-1.5 rounded-lg ${
                summary?.signature_verification_failures > 0
                  ? 'bg-rose-500/10 text-rose-400'
                  : 'bg-emerald-500/10 text-emerald-400'
              }`}
            >
              <PenLine className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div
              className={`text-2xl font-black tracking-tight ${
                summary?.signature_verification_failures > 0 ? 'text-rose-400' : 'text-emerald-400'
              }`}
            >
              {summary ? summary.signature_verification_failures.toLocaleString() : '—'}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {summary?.signature_verification_failures > 0 ? (
                <span className="text-rose-400 font-medium">Tampered data or wrong key</span>
              ) : (
                <span className="text-slate-400">All signatures authentic</span>
              )}
            </div>
          </div>
        </div>

        {/* Card 5: Average Latency */}
        <div className="bg-[#040e06]/90 border border-emerald-500/20 rounded-2xl p-4 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider font-mono">Avg Execution Latency</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-white tracking-tight">
              {summary?.avg_duration_ms !== null && summary?.avg_duration_ms !== undefined
                ? `${summary.avg_duration_ms} ms`
                : '—'}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {summary?.min_duration_ms !== null && summary?.max_duration_ms !== null ? (
                <span>
                  Range: <span className="text-emerald-400">{summary.min_duration_ms}</span> –{' '}
                  <span className="text-amber-400">{summary.max_duration_ms} ms</span>
                </span>
              ) : (
                <span>No duration samples</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Operations Over Time Chart ────────────────────────────────────── */}
      <div className="bg-[#040e06]/90 border border-emerald-500/15 rounded-2xl p-5 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              Cryptographic Operations Volume Over Time
            </h2>
            <p className="text-xs text-slate-400">
              Aggregated in {granularity === 'hour' ? 'hourly' : 'daily'} intervals showing successful vs failed executions.
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> Successful
            </div>
            <div className="flex items-center gap-1.5 text-rose-400">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Failed
            </div>
          </div>
        </div>

        {formattedTimeSeries.length > 0 ? (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={formattedTimeSeries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="successGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.emerald} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={COLORS.emerald} stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="failureGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.rose} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={COLORS.rose} stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#062510" vertical={false} />
                <XAxis dataKey="label" stroke="#64748b" tick={{ fontSize: 11 }} tickLine={false} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} tickLine={false} allowDecimals={false} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-[#030a04] border border-emerald-500/30 rounded-xl p-3 shadow-xl text-xs space-y-1">
                          <p className="font-mono text-slate-300 font-semibold border-b border-emerald-500/20 pb-1">
                            {formatIndiaTime(data.bucket)}
                          </p>
                          <p className="text-emerald-400 flex justify-between gap-4">
                            <span>Successful:</span> <span className="font-mono font-bold">{data.successful}</span>
                          </p>
                          <p className="text-rose-400 flex justify-between gap-4">
                            <span>Failed:</span> <span className="font-mono font-bold">{data.failed}</span>
                          </p>
                          <p className="text-white font-bold flex justify-between gap-4 pt-1 border-t border-slate-800">
                            <span>Total Operations:</span> <span className="font-mono">{data.total}</span>
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="successful"
                  stroke={COLORS.emerald}
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#successGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="failed"
                  stroke={COLORS.rose}
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#failureGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-48 flex flex-col items-center justify-center text-center text-slate-400 text-xs">
            <Activity className="w-8 h-8 text-slate-600 mb-2" />
            <p>No cryptographic operations logged during this date window.</p>
            <p className="text-slate-500 text-[11px] mt-0.5">
              Execute encryption, signing, or hashing operations to view activity trends.
            </p>
          </div>
        )}
      </div>

      {/* ─── Two-Column Distribution Section ─────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Algorithm Breakdown */}
        <div className="bg-[#040e06]/90 border border-emerald-500/15 rounded-2xl p-5 shadow-lg flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                Algorithm Usage Distribution
              </h2>
              <p className="text-xs text-slate-400">Volume and success rate per cryptographic algorithm.</p>
            </div>
          </div>

          {distribution.by_algorithm.length > 0 ? (
            <div className="space-y-3 flex-1 flex flex-col justify-center">
              {distribution.by_algorithm.map((algo, idx) => {
                const totalInWindow = summary?.total_operations || 1;
                const pct = Math.round((algo.total / totalInWindow) * 100);
                const successPct = algo.total > 0 ? Math.round((algo.successful / algo.total) * 100) : 0;
                return (
                  <div key={algo.algorithm} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-white flex items-center gap-1.5 font-mono">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                        />
                        {algo.algorithm}
                      </span>
                      <span className="text-slate-400 font-mono">
                        <span className="text-white font-bold">{algo.total}</span> ops ({pct}%) ·{' '}
                        <span className={successPct === 100 ? 'text-emerald-400' : 'text-amber-400'}>
                          {successPct}% ok
                        </span>
                      </span>
                    </div>
                    <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden flex">
                      <div
                        className="h-full transition-all duration-500"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: PIE_COLORS[idx % PIE_COLORS.length],
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center text-slate-500 text-xs">
              No algorithm activity recorded in this range.
            </div>
          )}
        </div>

        {/* Right: Operation Type Breakdown */}
        <div className="bg-[#040e06]/90 border border-emerald-500/15 rounded-2xl p-5 shadow-lg flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-400" />
                Operation Type Breakdown
              </h2>
              <p className="text-xs text-slate-400">Activity categorized by functional operation type.</p>
            </div>
          </div>

          {distribution.by_operation_type.length > 0 ? (
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={distribution.by_operation_type}
                  layout="vertical"
                  margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#062510" horizontal={false} />
                  <XAxis type="number" stroke="#64748b" tick={{ fontSize: 10 }} />
                  <YAxis
                    type="category"
                    dataKey="operation_type"
                    stroke="#94a3b8"
                    tick={{ fontSize: 11 }}
                    width={110}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="bg-[#030a04] border border-emerald-500/30 rounded-xl p-2.5 shadow-xl text-xs space-y-1">
                            <p className="font-semibold text-white capitalize">{d.operation_type}</p>
                            <p className="text-emerald-400">Success: {d.successful}</p>
                            <p className="text-rose-400">Failure: {d.failed}</p>
                            <p className="text-slate-300 font-bold">Total: {d.total}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="successful" stackId="a" fill={COLORS.emerald} radius={[0, 0, 0, 0]} />
                  <Bar dataKey="failed" stackId="a" fill={COLORS.rose} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="py-12 text-center text-slate-500 text-xs">
              No operation types recorded in this range.
            </div>
          )}
        </div>
      </div>

      {/* ─── Latency & Performance Breakdown Table ─────────────────────────── */}
      <div className="bg-[#040e06]/90 border border-emerald-500/15 rounded-2xl p-5 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              Cryptographic Execution Latency & Percentiles
            </h2>
            <p className="text-xs text-slate-400">
              Measured duration distributions. Percentiles require minimum samples (p50: ≥5, p95: ≥20, p99: ≥100) to ensure statistical validity.
            </p>
          </div>
          <div className="flex items-center gap-1 bg-[#06180a] p-1 rounded-xl border border-emerald-500/20 text-xs">
            <button
              onClick={() => setActiveTab('algorithms')}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                activeTab === 'algorithms'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              By Algorithm
            </button>
            <button
              onClick={() => setActiveTab('operations')}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                activeTab === 'operations'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              By Operation Type
            </button>
          </div>
        </div>

        {/* Performance Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-emerald-500/15 text-slate-400 font-mono text-[11px]">
                <th className="pb-2 font-semibold">Target</th>
                <th className="pb-2 font-semibold">Samples</th>
                <th className="pb-2 font-semibold">Avg (ms)</th>
                <th className="pb-2 font-semibold">Min (ms)</th>
                <th className="pb-2 font-semibold">Max (ms)</th>
                <th className="pb-2 font-semibold">p50 (Median)</th>
                <th className="pb-2 font-semibold">p95</th>
                <th className="pb-2 font-semibold">p99</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-500/10 font-mono">
              {(activeTab === 'algorithms'
                ? performanceData.by_algorithm
                : performanceData.by_operation_type
              ).map((row) => (
                <tr key={row.group_label} className="hover:bg-emerald-500/5 transition-colors">
                  <td className="py-2.5 font-semibold text-white">{row.group_label}</td>
                  <td className="py-2.5 text-slate-300">{row.count}</td>
                  <td className="py-2.5 text-emerald-400 font-bold">{row.avg_ms} ms</td>
                  <td className="py-2.5 text-slate-400">{row.min_ms} ms</td>
                  <td className="py-2.5 text-amber-400">{row.max_ms} ms</td>
                  <td className="py-2.5 text-slate-300">
                    {row.p50_ms !== null ? (
                      `${row.p50_ms} ms`
                    ) : (
                      <span className="text-slate-600 text-[10px]">&lt;5 samples</span>
                    )}
                  </td>
                  <td className="py-2.5 text-slate-300">
                    {row.p95_ms !== null ? (
                      `${row.p95_ms} ms`
                    ) : (
                      <span className="text-slate-600 text-[10px]">&lt;20 samples</span>
                    )}
                  </td>
                  <td className="py-2.5 text-slate-300">
                    {row.p99_ms !== null ? (
                      `${row.p99_ms} ms`
                    ) : (
                      <span className="text-slate-600 text-[10px]">&lt;100 samples</span>
                    )}
                  </td>
                </tr>
              ))}

              {(activeTab === 'algorithms'
                ? performanceData.by_algorithm
                : performanceData.by_operation_type
              ).length === 0 && (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-slate-500 font-sans">
                    No latency measurements recorded in this time range.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Methodology note */}
        <div className="mt-3 pt-3 border-t border-emerald-500/10 flex items-start gap-2 text-[11px] text-slate-400">
          <Info className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
          <span>
            <strong>Methodology Note:</strong> Execution times are measured server-side in milliseconds during cryptographic dispatch. Large file encryption and hashing operations naturally reflect higher execution durations compared to small text inputs; do not compare file-level timings directly to lightweight text operations.
          </span>
        </div>
      </div>

      {/* ─── Security Events & Anomaly Heuristics Feed ─────────────────────── */}
      <div className="bg-[#040e06]/90 border border-emerald-500/15 rounded-2xl p-5 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-emerald-400" />
              Security Anomalies & Heuristic Indicators
            </h2>
            <p className="text-xs text-slate-400">
              Rule-based indicators detected from your audit log (e.g., repeated signature verification failures or error bursts).
            </p>
          </div>
          <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            {securityEvents.length} detected
          </span>
        </div>

        {securityEvents.length > 0 ? (
          <div className="space-y-3">
            {securityEvents.map((evt) => (
              <div
                key={evt.event_id}
                className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-start justify-between gap-3 ${
                  evt.severity === 'alert'
                    ? 'bg-rose-950/20 border-rose-500/40 text-rose-300'
                    : evt.severity === 'warning'
                    ? 'bg-amber-950/20 border-amber-500/40 text-amber-300'
                    : 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md font-mono ${
                        evt.severity === 'alert'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                          : evt.severity === 'warning'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      }`}
                    >
                      {evt.severity}
                    </span>
                    <h3 className="text-xs font-bold text-white">{evt.title}</h3>
                  </div>
                  <p className="text-xs text-slate-300">{evt.description}</p>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Triggered rule: <span className="text-slate-300">{evt.rule}</span>
                  </p>
                </div>

                <div className="sm:text-right shrink-0">
                  <span className="text-[11px] text-slate-400 font-mono block">
                    {formatIndiaTime(evt.window_start)}
                  </span>
                  <span className="text-xs font-bold font-mono text-white">
                    {evt.count} record{evt.count === 1 ? '' : 's'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 rounded-xl bg-[#030a04] border border-emerald-500/10 text-center text-xs text-slate-400">
            <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
            <p className="font-semibold text-white">No Security Anomalies Detected</p>
            <p className="text-slate-400 text-[11px] mt-0.5">
              No signature verification failure bursts or high error ratios were detected within the selected timeframe.
            </p>
          </div>
        )}

        {/* Scope disclaimer */}
        <div className="mt-4 p-3 rounded-xl bg-[#020603] border border-emerald-500/10 text-[11px] text-slate-400 flex items-start gap-2">
          <Info className="w-4 h-4 text-emerald-500/70 shrink-0 mt-0.5" />
          <p>
            <strong>Instrumentation Boundary:</strong> These security indicators are computed from cryptographic operation records in your audit log. This is an audit visualization and heuristic indicator system, not a perimeter IDS/IPS. Failed login attempts, invalid OTPs, and authorization blocks are handled at the authentication boundary and are not currently recorded in the operation_history table.
          </p>
        </div>
      </div>
    </div>
  );
}
