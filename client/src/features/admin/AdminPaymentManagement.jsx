import { useState } from 'react';
import {
  CreditCard, Filter, CheckCircle, Clock, XCircle, AlertTriangle,
  Download, Loader2, RefreshCw, ArrowUpRight
} from 'lucide-react';
import { useGetAdminPaymentsQuery, useConfirmPaymentMutation } from '../../services/api';
import { formatPrice, timeAgo } from '../../constants';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'failed', label: 'Failed' },
  { value: 'refunded', label: 'Refunded' },
];

const METHOD_OPTIONS = [
  { value: '', label: 'All Methods' },
  { value: 'esewa', label: 'eSewa' },
  { value: 'khalti', label: 'Khalti' },
  { value: 'bank-transfer', label: 'Bank Transfer' },
];

const STATUS_BADGES = {
  pending: { color: 'bg-amber-100 text-amber-700', icon: Clock },
  confirmed: { color: 'bg-green-100 text-green-700', icon: CheckCircle },
  failed: { color: 'bg-red-100 text-red-700', icon: XCircle },
  refunded: { color: 'bg-purple-100 text-purple-700', icon: AlertTriangle },
};

const METHOD_STYLES = {
  esewa: 'bg-green-100 text-green-700',
  khalti: 'bg-purple-100 text-purple-700',
  'bank-transfer': 'bg-blue-100 text-blue-700',
};

export default function AdminPaymentManagement() {
  const [filters, setFilters] = useState({ status: '', method: '', page: '1' });
  const [confirmTarget, setConfirmTarget] = useState(null);

  const { data, isLoading, isFetching, refetch } = useGetAdminPaymentsQuery(filters);
  const [confirmPayment, { isLoading: confirming }] = useConfirmPaymentMutation();

  const payments = data?.payments || [];

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value, page: '1' });
  };

  const handleConfirm = async () => {
    if (!confirmTarget) return;
    try {
      await confirmPayment(confirmTarget).unwrap();
      toast.success('Payment confirmed');
      setConfirmTarget(null);
    } catch (err) {
      toast.error(err.data?.error || 'Failed to confirm payment');
    }
  };

  const handleExport = () => {
    const token = document.cookie.match(/token=([^;]+)/)?.[1];
    // Use the stored token from localStorage/redux instead
    const a = document.createElement('a');
    a.href = '/api/admin/payments/export';
    a.download = 'thrief-payments.csv';
    a.click();
  };

  // Quick stats from current page data
  const pendingCount = payments.filter(p => p.status === 'pending').length;
  const confirmedTotal = payments.filter(p => p.status === 'confirmed').reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-accent)]" style={{ fontFamily: 'var(--font-heading)' }}>
            <CreditCard className="w-6 h-6 inline-block mr-2 -mt-1 text-[var(--color-primary)]" />
            Payment Management
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">Track and manage all platform payments</p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button onClick={handleExport} className="btn-secondary btn-sm">
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button onClick={refetch} className="btn-secondary btn-sm">
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-[var(--color-border-light)]">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center"><Clock className="w-4 h-4 text-amber-600" /></div>
            <span className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase">Pending</span>
          </div>
          <p className="text-lg font-bold">{pendingCount}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-[var(--color-border-light)]">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-green-50 flex items-center justify-center"><CheckCircle className="w-4 h-4 text-green-600" /></div>
            <span className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase">Confirmed Revenue</span>
          </div>
          <p className="text-lg font-bold">{formatPrice(confirmedTotal)}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-[var(--color-border-light)]">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center"><CreditCard className="w-4 h-4 text-blue-600" /></div>
            <span className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase">On This Page</span>
          </div>
          <p className="text-lg font-bold">{payments.length}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-[var(--color-border-light)]">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center"><XCircle className="w-4 h-4 text-red-600" /></div>
            <span className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase">Failed</span>
          </div>
          <p className="text-lg font-bold">{payments.filter(p => p.status === 'failed').length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl shadow-sm flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full sm:w-auto sm:max-w-[200px]">
          <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="input pl-9 bg-[var(--color-bg)] border-transparent focus:bg-white w-full text-sm"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div className="relative flex-1 w-full sm:w-auto sm:max-w-[200px]">
          <select
            value={filters.method}
            onChange={(e) => handleFilterChange('method', e.target.value)}
            className="input bg-[var(--color-bg)] border-transparent focus:bg-white w-full text-sm"
          >
            {METHOD_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Confirmation Banner */}
      {confirmTarget && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 animate-fadeIn">
          <div>
            <p className="font-bold text-orange-800 text-sm">Confirm Payment</p>
            <p className="text-orange-700 text-xs mt-1">Are you sure you want to manually confirm this payment? This action cannot be undone.</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={() => setConfirmTarget(null)} className="btn-secondary btn-sm bg-white">Cancel</button>
            <button
              onClick={handleConfirm}
              disabled={confirming}
              className="btn-sm font-medium rounded-lg bg-green-600 hover:bg-green-700 text-white px-4 py-2"
            >
              {confirming ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Payment'}
            </button>
          </div>
        </div>
      )}

      {/* Payments Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-[var(--color-bg)] text-[var(--color-text-secondary)] uppercase text-[11px] font-bold tracking-wider">
              <tr>
                <th className="px-6 py-4">Seller</th>
                <th className="px-6 py-4">Product</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Method</th>
                <th className="px-6 py-4">Transaction ID</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border-light)]">
              {isLoading ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-[var(--color-primary)] mx-auto" />
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center">
                    <p className="text-3xl mb-2">💳</p>
                    <p className="text-[var(--color-text-muted)] font-medium">No payments found</p>
                  </td>
                </tr>
              ) : (
                payments.map((payment) => {
                  const statusBadge = STATUS_BADGES[payment.status] || STATUS_BADGES.pending;
                  const StatusIcon = statusBadge.icon;
                  const methodStyle = METHOD_STYLES[payment.method] || 'bg-gray-100 text-gray-700';

                  return (
                    <tr key={payment.id} className="hover:bg-[var(--color-surface-hover)] transition-colors group">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-sm">{payment.seller_name}</p>
                        <p className="text-xs text-[var(--color-text-muted)]">{payment.seller_email || '—'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm truncate max-w-[160px]">{payment.product_title || '—'}</p>
                      </td>
                      <td className="px-6 py-4 font-bold">{formatPrice(payment.amount)}</td>
                      <td className="px-6 py-4">
                        <span className={`badge ${methodStyle}`}>{payment.method}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs text-[var(--color-text-muted)]">
                          {payment.transaction_id || '—'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`badge ${statusBadge.color} gap-1`}>
                          <StatusIcon className="w-3 h-3" /> {payment.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-[var(--color-text-secondary)]">{timeAgo(payment.created_at)}</td>
                      <td className="px-6 py-4 text-right">
                        {payment.status === 'pending' && (
                          <button
                            onClick={() => setConfirmTarget(payment.id)}
                            className="btn-sm text-xs font-medium rounded-lg bg-green-100 text-green-700 hover:bg-green-200 px-3 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <CheckCircle className="w-3 h-3 inline mr-1" /> Confirm
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {payments.length === 20 && (
          <div className="p-4 border-t border-[var(--color-border-light)] flex justify-center gap-2">
            {parseInt(filters.page) > 1 && (
              <button
                onClick={() => handleFilterChange('page', String(parseInt(filters.page) - 1))}
                className="btn-secondary btn-sm"
              >
                Previous
              </button>
            )}
            <button
              onClick={() => handleFilterChange('page', String(parseInt(filters.page) + 1))}
              className="btn-secondary btn-sm"
            >
              Next Page
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
