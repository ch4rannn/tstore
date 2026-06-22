import { useState } from 'react';
import {
  Flag, Filter, CheckCircle, Clock, Eye, Search as SearchIcon,
  XCircle, AlertTriangle, Loader2, RefreshCw, X, MessageSquare
} from 'lucide-react';
import { useGetAdminReportsQuery, useUpdateReportMutation } from '../../services/api';
import { timeAgo } from '../../constants';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'reviewed', label: 'Reviewed' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'dismissed', label: 'Dismissed' },
];

const STATUS_BADGES = {
  pending: { color: 'bg-amber-100 text-amber-700', icon: Clock },
  reviewed: { color: 'bg-blue-100 text-blue-700', icon: Eye },
  resolved: { color: 'bg-green-100 text-green-700', icon: CheckCircle },
  dismissed: { color: 'bg-gray-100 text-gray-600', icon: XCircle },
};

const REASON_BADGES = {
  spam: 'bg-yellow-100 text-yellow-700',
  fake: 'bg-orange-100 text-orange-700',
  inappropriate: 'bg-red-100 text-red-700',
  scam: 'bg-red-100 text-red-700',
  other: 'bg-gray-100 text-gray-700',
};

const TARGET_BADGES = {
  product: 'bg-blue-100 text-blue-700',
  user: 'bg-purple-100 text-purple-700',
};

export default function AdminReportManagement() {
  const [statusFilter, setStatusFilter] = useState('pending');
  const [page, setPage] = useState('1');
  const [actionModal, setActionModal] = useState(null); // report object
  const [actionForm, setActionForm] = useState({ status: '', adminNote: '' });

  const { data, isLoading, isFetching, refetch } = useGetAdminReportsQuery({ status: statusFilter, page });
  const [updateReport, { isLoading: updating }] = useUpdateReportMutation();

  const reports = data?.reports || [];

  const handleStatusFilter = (status) => {
    setStatusFilter(status);
    setPage('1');
  };

  const openActionModal = (report) => {
    setActionModal(report);
    setActionForm({ status: report.status === 'pending' ? 'reviewed' : report.status, adminNote: report.admin_note || '' });
  };

  const handleUpdate = async () => {
    if (!actionModal) return;
    try {
      await updateReport({ id: actionModal.id, status: actionForm.status, adminNote: actionForm.adminNote }).unwrap();
      toast.success('Report updated');
      setActionModal(null);
    } catch (err) {
      toast.error(err.data?.error || 'Failed to update report');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-accent)]" style={{ fontFamily: 'var(--font-heading)' }}>
            <Flag className="w-6 h-6 inline-block mr-2 -mt-1 text-[var(--color-primary)]" />
            Report Management
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">Review and resolve user-submitted reports</p>
        </div>
        <button onClick={refetch} className="btn-secondary btn-sm self-start sm:self-auto">
          <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* Status Filter Tabs */}
      <div className="bg-white p-2 rounded-2xl shadow-sm flex flex-wrap gap-1">
        {STATUS_OPTIONS.map((opt) => {
          const isActive = statusFilter === opt.value;
          const badge = STATUS_BADGES[opt.value];
          const Icon = badge?.icon || Clock;
          return (
            <button
              key={opt.value}
              onClick={() => handleStatusFilter(opt.value)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-[var(--color-primary)] text-white shadow-sm'
                  : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg)]'
              }`}
            >
              <Icon className="w-4 h-4" />
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* Reports Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-[var(--color-bg)] text-[var(--color-text-secondary)] uppercase text-[11px] font-bold tracking-wider">
              <tr>
                <th className="px-6 py-4">Reporter</th>
                <th className="px-6 py-4">Target</th>
                <th className="px-6 py-4">Reason</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Reported</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border-light)]">
              {isLoading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-[var(--color-primary)] mx-auto" />
                  </td>
                </tr>
              ) : reports.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <p className="text-3xl mb-2">🎉</p>
                    <p className="text-[var(--color-text-muted)] font-medium">
                      {statusFilter === 'pending' ? 'No pending reports — all clear!' : 'No reports in this category'}
                    </p>
                  </td>
                </tr>
              ) : (
                reports.map((report) => {
                  const statusBadge = STATUS_BADGES[report.status] || STATUS_BADGES.pending;
                  const StatusIcon = statusBadge.icon;
                  const reasonColor = REASON_BADGES[report.reason] || REASON_BADGES.other;
                  const targetColor = TARGET_BADGES[report.target_type] || TARGET_BADGES.product;

                  return (
                    <tr key={report.id} className="hover:bg-[var(--color-surface-hover)] transition-colors group">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-sm">{report.reporter_name}</p>
                        <p className="text-[10px] text-[var(--color-text-muted)] font-mono">{report.reporter_id?.substring(0, 8)}...</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`badge ${targetColor}`}>{report.target_type}</span>
                          <span className="font-mono text-[10px] text-[var(--color-text-muted)]">{report.target_id?.substring(0, 8)}...</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`badge ${reasonColor}`}>{report.reason}</span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-[var(--color-text-secondary)] truncate max-w-[200px]" title={report.description}>
                          {report.description || '—'}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`badge ${statusBadge.color} gap-1`}>
                          <StatusIcon className="w-3 h-3" /> {report.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-[var(--color-text-secondary)]">{timeAgo(report.created_at)}</td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => openActionModal(report)}
                          className="btn-secondary btn-sm opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MessageSquare className="w-4 h-4 mr-1" /> Review
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {reports.length === 20 && (
          <div className="p-4 border-t border-[var(--color-border-light)] flex justify-center gap-2">
            {parseInt(page) > 1 && (
              <button onClick={() => setPage(String(parseInt(page) - 1))} className="btn-secondary btn-sm">
                Previous
              </button>
            )}
            <button onClick={() => setPage(String(parseInt(page) + 1))} className="btn-secondary btn-sm">
              Next Page
            </button>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {actionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl animate-scaleIn overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-light)] p-5 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Flag className="w-5 h-5" /> Review Report
              </h3>
              <button onClick={() => setActionModal(null)} className="w-8 h-8 rounded-full bg-black/20 text-white flex items-center justify-center hover:bg-black/40 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Report Summary */}
              <div className="bg-[var(--color-bg)] rounded-xl p-4 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-secondary)]">Reporter</span>
                  <span className="font-medium">{actionModal.reporter_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-secondary)]">Target</span>
                  <div className="flex items-center gap-2">
                    <span className={`badge ${TARGET_BADGES[actionModal.target_type]}`}>{actionModal.target_type}</span>
                    <span className="font-mono text-xs">{actionModal.target_id?.substring(0, 12)}...</span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-secondary)]">Reason</span>
                  <span className={`badge ${REASON_BADGES[actionModal.reason]}`}>{actionModal.reason}</span>
                </div>
                {actionModal.description && (
                  <div className="border-t border-[var(--color-border)] pt-3">
                    <p className="text-[var(--color-text-secondary)] text-xs mb-1">Description</p>
                    <p className="text-sm">{actionModal.description}</p>
                  </div>
                )}
              </div>

              {/* Update Form */}
              <div className="space-y-4">
                <div className="input-group">
                  <label className="input-label">Update Status</label>
                  <select
                    value={actionForm.status}
                    onChange={(e) => setActionForm({ ...actionForm, status: e.target.value })}
                    className="input text-sm"
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <div className="input-group">
                  <label className="input-label">Admin Note</label>
                  <textarea
                    value={actionForm.adminNote}
                    onChange={(e) => setActionForm({ ...actionForm, adminNote: e.target.value })}
                    placeholder="Add a note about this report resolution..."
                    rows={3}
                    className="input text-sm resize-none"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button onClick={() => setActionModal(null)} className="btn-secondary">Cancel</button>
                <button
                  onClick={handleUpdate}
                  disabled={updating}
                  className="btn-primary"
                >
                  {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update Report'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
