import React, { useState, useEffect } from 'react';
import {
  History,
  ShieldCheck,
  RefreshCw,
  Database,
  Terminal,
  Filter,
  Download,
  Check,
  AlertCircle,
  ExternalLink,
  Eye,
  Trash2,
  X,
  AlertTriangle,
  FileText,
  Clock,
  Cpu,
  CheckCircle2,
} from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import { fetchHistory, deleteHistoryItem } from '../services/api';
import { generateAuditHistoryPDF, generateSingleAuditRecordPDF } from '../utils/historyPdfGenerator';
/**
 * Format timestamp into Indian Standard Time (IST - UTC+05:30)
 * Example: "2026-10-12 06:17:57 PM IST"
 */
export function formatIndiaTime(dateInput) {
  if (!dateInput) return 'N/A';
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return String(dateInput);
    const parts = new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    }).formatToParts(d);
    const map = Object.fromEntries(parts.map((p) => [p.type, p.value]));
    const period = (map.dayPeriod || '').toUpperCase();
    return `${map.year}-${map.month}-${map.day} ${map.hour}:${map.minute}:${map.second} ${period} IST`;
  } catch {
    return String(dateInput);
  }
}

export default function HistoryPage({ dbHealth }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterAlgo, setFilterAlgo] = useState('ALL');
  const [statusMessage, setStatusMessage] = useState('');
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [pdfDownloaded, setPdfDownloaded] = useState(false);
  const [pdfError, setPdfError] = useState('');
  const [lastDownloadedUrl, setLastDownloadedUrl] = useState(null);

  const [viewingItem, setViewingItem] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionNotice, setActionNotice] = useState(null); // { text, type: 'success' | 'error' }
  const [totalCount, setTotalCount] = useState(0);  // actual total records in DB

  const loadHistory = async () => {
    setLoading(true);
    try {
      const data = await fetchHistory(100);
      setItems(data.items || []);
      setStatusMessage(data.message || '');
      setTotalCount(data.total_count ?? data.total ?? 0);
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const filteredItems = items.filter((item) => {
    if (filterAlgo === 'ALL') return true;
    return item.algorithm_name?.toUpperCase().includes(filterAlgo.toUpperCase());
  });

  // Top header: Download All/Filtered Audit Trail PDF
  const handleDownloadPDF = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setPdfError('');
    setPdfGenerating(true);

    try {
      const res = generateAuditHistoryPDF({
        items: filteredItems,
        filterAlgo,
        dbHealth,
        totalMatchingRecords: filteredItems.length,
      });

      if (res && res.blobUrl) {
        setLastDownloadedUrl(res.blobUrl);
      }

      setPdfDownloaded(true);
      setTimeout(() => setPdfDownloaded(false), 4000);
    } catch (err) {
      console.error('Failed to generate audit history PDF:', err);
      setPdfError(err?.message || 'Failed to generate PDF report.');
    } finally {
      setPdfGenerating(false);
    }
  };

  // Row Action 1: Download Single-Record PDF
  const handleDownloadSingleReport = (item) => {
    try {
      generateSingleAuditRecordPDF(item);
      showNotice(`Audit #${item.id} PDF report downloaded successfully.`, 'success');
    } catch (err) {
      console.error('Failed to download single report:', err);
      showNotice(`Failed to generate report for Audit #${item.id}: ${err.message}`, 'error');
    }
  };

  // Row Action 2: Delete Audit Record
  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);

    try {
      await deleteHistoryItem(itemToDelete.id);
      // Remove from local state
      setItems((prev) => prev.filter((i) => i.id !== itemToDelete.id));
      showNotice(`Audit record #${itemToDelete.id} (${itemToDelete.algorithm_name}) deleted permanently.`, 'success');
      setItemToDelete(null);
      if (viewingItem?.id === itemToDelete.id) {
        setViewingItem(null);
      }
    } catch (err) {
      console.error('Failed to delete history record:', err);
      showNotice(err.message || `Failed to delete record #${itemToDelete.id}`, 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const showNotice = (text, type = 'success') => {
    setActionNotice({ text, type });
    setTimeout(() => {
      setActionNotice(null);
    }, 4500);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-emerald-500/20 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-lg bg-[#06180a] border border-emerald-500/30 text-emerald-400">
              <History className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight m-0">
              Operation Audit History
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 m-0">
            Audit logging of cryptographic execution metadata in PostgreSQL
          </p>
        </div>

        <div className="flex flex-col sm:items-end gap-1.5 self-start sm:self-auto">
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleDownloadPDF}
              disabled={loading || pdfGenerating}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all shadow-sm border ${
                pdfDownloaded
                  ? 'bg-emerald-600/30 border-emerald-500/60 text-emerald-200'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold border-emerald-500/80 shadow-emerald-950/40 hover:shadow-indigo-900/50'
              } disabled:opacity-50`}
              title="Download formatted A4 audit history report PDF directly to your device"
            >
              {pdfGenerating ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                  <span>Generating PDF...</span>
                </>
              ) : pdfDownloaded ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Report Downloaded!</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5 text-white" />
                  <span>Download PDF Report</span>
                </>
              )}
            </button>

            {lastDownloadedUrl && (
              <a
                href={lastDownloadedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#040e06] border border-emerald-500/40 hover:border-indigo-400 text-emerald-300 hover:text-emerald-200 text-xs font-medium transition-colors"
                title="View or print the generated PDF report in a new tab"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open in Tab</span>
              </a>
            )}

            <button
              type="button"
              onClick={loadHistory}
              disabled={loading}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#040e06] border border-emerald-500/20 hover:border-emerald-500/25 text-slate-300 hover:text-white text-xs font-medium transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
              <span>Refresh Audit Trail</span>
            </button>
          </div>

          {pdfError && (
            <span className="text-[11px] text-rose-400 flex items-center gap-1">
              <AlertCircle className="w-3 h-3 shrink-0" />
              <span>{pdfError}</span>
            </span>
          )}
        </div>
      </div>

      {/* Action Notification Toast */}
      {actionNotice && (
        <div
          className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-3 animate-fadeIn ${
            actionNotice.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
              : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {actionNotice.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{actionNotice.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionNotice(null)}
            className="text-slate-400 hover:text-white text-xs"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Security Guarantee Banner */}
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div className="text-xs text-emerald-200/90 leading-relaxed">
          <strong className="text-emerald-300">Privacy & Security Guarantee:</strong> In compliance with security standards, the operation history database strictly records only execution audit metadata (Algorithm Name, Operation Type, Execution Duration, Status, Timestamp). Plaintext messages, file contents, passwords, private keys, and symmetric keys are <span className="underline font-semibold">never stored</span>.
        </div>
      </div>

      {/* Database Connectivity Status Notice */}
      <div className="glass-panel rounded-xl p-4 border border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Database className="w-4 h-4 text-emerald-400" />
          <div>
            <div className="text-xs font-semibold text-white">PostgreSQL Backend Connection</div>
            <div className="text-[11px] text-slate-400">
              Host: localhost:5432 | DB: securecipher_db | User: securecipher_user
            </div>
          </div>
        </div>
        <div>
          <StatusBadge
            status={dbHealth?.connected ? 'connected' : dbHealth?.status === 'unconfigured' ? 'unconfigured' : 'disconnected'}
            label={
              dbHealth?.connected
                ? 'Connected & Verified'
                : dbHealth?.status === 'unconfigured'
                ? 'Awaiting .env Config'
                : 'Disconnected'
            }
          />
        </div>
      </div>

      {/* Filters & Table */}
      <div className="glass-panel rounded-xl border border-emerald-500/20 overflow-hidden">
        <div className="p-4 border-b border-emerald-500/20 bg-[#040e06]/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-medium text-slate-300">Filter Algorithm:</span>
            <select
              value={filterAlgo}
              onChange={(e) => setFilterAlgo(e.target.value)}
              className="bg-[#030a04] border border-emerald-500/25 rounded px-2.5 py-1 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
            >
              <option value="ALL">All Algorithms</option>
              <option value="AES">AES</option>
              <option value="RSA">RSA</option>
              <option value="DIFFIE-HELLMAN">Diffie-Hellman</option>
              <option value="SHA-256">SHA-256</option>
              <option value="MD5">MD5</option>
              <option value="DES">DES</option>
            </select>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Showing {filteredItems.length} of {totalCount} total records
            {totalCount > 100 && (
              <span className="ml-1 text-amber-400" title="The history page displays the latest 100 entries. Older records exist in the database.">
                (latest 100 shown)
              </span>
            )}
          </span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-500 animate-pulse">
            Querying PostgreSQL operation history...
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-14 text-center">
            <Terminal className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-300">Audit Trail is Currently Empty</p>
            <p className="text-[11px] text-slate-500 max-w-sm mx-auto mt-1">
              {statusMessage || 'No cryptographic executions have been run yet. Once algorithm executions are triggered, execution durations and timestamps will be logged here.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#030a04]/80 text-slate-400 font-mono border-b border-emerald-500/20">
                <tr>
                  <th className="py-3 px-4">Audit ID</th>
                  <th className="py-3 px-4">Algorithm</th>
                  <th className="py-3 px-4">Operation</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">Timestamp (IST / India)</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono text-emerald-400 font-semibold">#{item.id}</td>
                    <td className="py-3 px-4 font-medium text-white">{item.algorithm_name}</td>
                    <td className="py-3 px-4 text-slate-300 font-mono text-[11px]">{item.operation_type}</td>
                    <td className="py-3 px-4">
                      <StatusBadge status={item.status} label={item.status} size="xs" />
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-300">{item.execution_duration_ms} ms</td>
                    <td className="py-3 px-4 text-slate-300 font-mono text-[11px] whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" title="Indian Standard Time (IST, UTC+05:30)" />
                        <span className="text-slate-200 font-medium">{formatIndiaTime(item.created_at)}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* 1. VIEW FEATURE */}
                        <button
                          type="button"
                          onClick={() => setViewingItem(item)}
                          className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-emerald-500/25 text-[11px] font-medium inline-flex items-center gap-1 transition-colors shadow-sm"
                          title={`View details for Audit #${item.id}`}
                        >
                          <Eye className="w-3 h-3 text-emerald-400" />
                          <span>View</span>
                        </button>

                        {/* 2. DOWNLOAD REPORT FEATURE */}
                        <button
                          type="button"
                          onClick={() => handleDownloadSingleReport(item)}
                          className="px-2.5 py-1 rounded-md bg-[#06180a] hover:bg-emerald-950/70 text-emerald-300 hover:text-emerald-200 border border-indigo-700/50 text-[11px] font-medium inline-flex items-center gap-1 transition-colors shadow-sm"
                          title={`Download PDF Report for Audit #${item.id}`}
                        >
                          <Download className="w-3 h-3 text-emerald-400" />
                          <span>Download Report</span>
                        </button>

                        {/* 3. DELETE FEATURE */}
                        <button
                          type="button"
                          onClick={() => setItemToDelete(item)}
                          className="px-2.5 py-1 rounded-md bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 hover:text-rose-200 border border-rose-800/40 text-[11px] font-medium inline-flex items-center gap-1 transition-colors shadow-sm"
                          title={`Delete Audit #${item.id} from PostgreSQL`}
                        >
                          <Trash2 className="w-3 h-3 text-rose-400" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* MODAL 1: VIEW AUDIT RECORD DETAILS MODAL                       */}
      {/* ============================================================== */}
      {viewingItem && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#040e06] border border-emerald-500/25 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-scaleUp">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-emerald-500/20 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-[#06180a] border border-emerald-500/40 text-emerald-400">
                  <FileText className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-white m-0">
                    Audit Record #{viewingItem.id} Details
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    PostgreSQL Operation Execution Telemetry
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingItem(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Zero-Knowledge Privacy Note */}
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-950/30 p-3 text-[11px] text-emerald-200 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong>Zero-Knowledge Assurance:</strong> This record contains only execution metadata. No plaintext, keys, passwords, or secrets are ever recorded in the database.
              </span>
            </div>

            {/* Parameter Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-[#030a04] border border-emerald-500/20">
                <span className="text-[11px] text-slate-400 block mb-1">Algorithm Name</span>
                <span className="font-semibold text-white">{viewingItem.algorithm_name}</span>
              </div>

              <div className="p-3 rounded-lg bg-[#030a04] border border-emerald-500/20">
                <span className="text-[11px] text-slate-400 block mb-1">Operation Type</span>
                <span className="font-mono text-emerald-300 font-semibold">{viewingItem.operation_type}</span>
              </div>

              <div className="p-3 rounded-lg bg-[#030a04] border border-emerald-500/20">
                <span className="text-[11px] text-slate-400 block mb-1">Execution Status</span>
                <StatusBadge status={viewingItem.status} label={viewingItem.status} size="xs" />
              </div>

              <div className="p-3 rounded-lg bg-[#030a04] border border-emerald-500/20">
                <span className="text-[11px] text-slate-400 block mb-1">Execution Latency</span>
                <span className="font-mono text-emerald-300 font-semibold flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {viewingItem.execution_duration_ms} ms
                </span>
              </div>

              <div className="col-span-2 p-3 rounded-lg bg-[#030a04] border border-emerald-500/20 space-y-1">
                <span className="text-[11px] text-slate-400 block mb-0.5">Execution Timestamp (IST - India Timings)</span>
                <span className="font-mono text-emerald-300 font-semibold text-xs flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-400" />
                  {formatIndiaTime(viewingItem.created_at)}
                </span>
                <span className="text-[10px] text-slate-500 font-mono block">
                  UTC Equivalent: {new Date(viewingItem.created_at).toISOString().replace('T', ' ').substring(0, 19)} UTC
                </span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between gap-2 pt-3 border-t border-emerald-500/20">
              <button
                type="button"
                onClick={() => {
                  setItemToDelete(viewingItem);
                }}
                className="px-3 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 border border-rose-800/40 text-xs font-medium inline-flex items-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Record</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDownloadSingleReport(viewingItem)}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Report</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewingItem(null)}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 2: DELETE CONFIRMATION MODAL                             */}
      {/* ============================================================== */}
      {itemToDelete && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#040e06] border border-rose-900/60 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-scaleUp">
            <div className="flex items-start gap-3">
              <span className="p-2 rounded-lg bg-rose-950/80 border border-rose-700/50 text-rose-400 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-white m-0">
                  Delete Audit Record #{itemToDelete.id}?
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Are you sure you want to permanently delete this audit record for{' '}
                  <strong className="text-white">{itemToDelete.algorithm_name}</strong> (
                  <span className="font-mono text-emerald-300">{itemToDelete.operation_type}</span>
                  ) from the PostgreSQL database?
                </p>
                <p className="text-[11px] text-rose-300 mt-2 font-medium">
                  This action is irreversible and will remove the record from the audit trail.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-emerald-500/20">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                disabled={isDeleting}
                className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Confirm Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
