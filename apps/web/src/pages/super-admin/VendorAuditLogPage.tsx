import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { IVendorAuditLog } from '@smart-school/shared-types';
import { schoolService } from '../../services/schoolService.js';
import { LoadingSpinner } from '../../components/common/LoadingSpinner.js';
import { Clock, ArrowLeft, Shield, AlertTriangle, RefreshCw } from 'lucide-react';

export const VendorAuditLogPage: React.FC = () => {
  const [logs, setLogs] = useState<IVendorAuditLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [total, setTotal] = useState<number>(0);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await schoolService.listAuditLogs({ page: currentPage, limit: 25 });
      setLogs(res.items);
      setTotal(res.pagination.total);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch audit logs');
    } finally {
      setLoading(false);
    }
  }, [currentPage]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          to="/super-admin"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Super Admin Console
        </Link>
        <button
          onClick={fetchLogs}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Platform Security & Operational Audit Trail</h1>
            <p className="text-xs text-slate-500">
              Immutable log of vendor administrative events, subscription updates, custom domain operations, and support access grants.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="p-12 flex justify-center">
            <LoadingSpinner size="md" label="Loading audit logs..." />
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-600 text-xs">
            <AlertTriangle className="w-5 h-5 mx-auto mb-2" />
            {error}
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">No audit events recorded yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase text-slate-500">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Action Event</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Target School</th>
                  <th className="py-3 px-4">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 text-slate-500 text-[11px] whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{log.action}</td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800">{log.actorEmail}</div>
                      <div className="text-[10px] text-slate-400 uppercase">{log.actorRole}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      {log.targetSchoolName || log.targetSchoolId || 'Global / Unscoped'}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500 max-w-xs truncate">
                      {log.details ? JSON.stringify(log.details) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
