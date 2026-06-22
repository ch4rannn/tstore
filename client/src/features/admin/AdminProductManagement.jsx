import { useState } from 'react';
import {
  Search, Filter, ShoppingBag, Eye, CheckCircle, XCircle, Clock,
  Trash2, Loader2, RefreshCw, ExternalLink
} from 'lucide-react';
import { useGetAdminProductsQuery, useUpdateProductStatusMutation } from '../../services/api';
import { formatPrice, getCategoryName, getConditionBadge, timeAgo } from '../../constants';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'active', label: 'Active' },
  { value: 'sold', label: 'Sold' },
  { value: 'removed', label: 'Removed' },
];

const STATUS_BADGES = {
  pending: { color: 'bg-amber-100 text-amber-700', icon: Clock },
  active: { color: 'bg-green-100 text-green-700', icon: CheckCircle },
  sold: { color: 'bg-blue-100 text-blue-700', icon: CheckCircle },
  removed: { color: 'bg-red-100 text-red-700', icon: XCircle },
};

export default function AdminProductManagement() {
  const [filters, setFilters] = useState({ status: '', category: '', search: '', page: '1' });
  const [searchDraft, setSearchDraft] = useState('');
  const [actionTarget, setActionTarget] = useState(null); // { id, action }

  const { data, isLoading, isFetching, refetch } = useGetAdminProductsQuery(filters);
  const [updateStatus, { isLoading: updating }] = useUpdateProductStatusMutation();

  const products = data?.products || [];
  const total = data?.total || 0;

  const handleSearch = (e) => {
    e.preventDefault();
    setFilters({ ...filters, search: searchDraft, page: '1' });
  };

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value, page: '1' });
  };

  const handleStatusUpdate = async () => {
    if (!actionTarget) return;
    try {
      await updateStatus({ id: actionTarget.id, status: actionTarget.action }).unwrap();
      toast.success(`Product ${actionTarget.action === 'active' ? 'approved' : actionTarget.action === 'removed' ? 'removed' : 'updated'}`);
      setActionTarget(null);
    } catch (err) {
      toast.error(err.data?.error || 'Failed to update status');
    }
  };

  const statusCounts = {
    pending: products.filter(p => p.status === 'pending').length,
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-accent)]" style={{ fontFamily: 'var(--font-heading)' }}>
            <ShoppingBag className="w-6 h-6 inline-block mr-2 -mt-1 text-[var(--color-primary)]" />
            Product Management
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">{total} total products</p>
        </div>
        <button onClick={refetch} className="btn-secondary btn-sm self-start sm:self-auto">
          <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <form onSubmit={handleSearch} className="flex-1 w-full relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
          <input
            type="text"
            placeholder="Search by title or seller name..."
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
            className="input pl-10 w-full md:max-w-md bg-[var(--color-bg)] border-transparent focus:bg-white"
          />
        </form>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-44">
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
          <div className="relative flex-1 md:w-44">
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="input bg-[var(--color-bg)] border-transparent focus:bg-white w-full text-sm"
            >
              <option value="">All Categories</option>
              {['clothes', 'electronics', 'skincare-beauty', 'furniture-home', 'books-stationery', 'sports-fitness', 'toys-games', 'vehicles', 'others'].map((c) => (
                <option key={c} value={c}>{getCategoryName(c)}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Confirmation Banner */}
      {actionTarget && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 animate-fadeIn">
          <div>
            <p className="font-bold text-orange-800 text-sm">Confirm Status Change</p>
            <p className="text-orange-700 text-xs mt-1">
              Set product to <span className="font-bold">{actionTarget.action}</span>?
              {actionTarget.action === 'removed' && ' This will hide the product from all listings.'}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={() => setActionTarget(null)} className="btn-secondary btn-sm bg-white">Cancel</button>
            <button
              onClick={handleStatusUpdate}
              disabled={updating}
              className={`btn-sm font-medium rounded-lg text-white px-4 py-2 ${actionTarget.action === 'removed' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
            >
              {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm'}
            </button>
          </div>
        </div>
      )}

      {/* Products Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-[var(--color-bg)] text-[var(--color-text-secondary)] uppercase text-[11px] font-bold tracking-wider">
              <tr>
                <th className="px-6 py-4">Product</th>
                <th className="px-6 py-4">Seller</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Price</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Listed</th>
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
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <p className="text-3xl mb-2">📦</p>
                    <p className="text-[var(--color-text-muted)] font-medium">No products found</p>
                  </td>
                </tr>
              ) : (
                products.map((product) => {
                  const statusBadge = STATUS_BADGES[product.status] || STATUS_BADGES.pending;
                  const StatusIcon = statusBadge.icon;
                  const conditionBadge = getConditionBadge(product.condition);
                  const image = product.images?.[0];

                  return (
                    <tr key={product.id} className="hover:bg-[var(--color-surface-hover)] transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-[var(--color-bg)] shrink-0 overflow-hidden">
                            {image ? (
                              <img src={image} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-lg">📷</div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold truncate max-w-[200px]">{product.title}</p>
                            <span className={`badge ${conditionBadge.color} text-[10px]`}>{conditionBadge.label}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium">{product.seller_name}</p>
                        <p className="text-xs text-[var(--color-text-muted)]">{product.seller_email || '—'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="badge bg-gray-100 text-gray-700">{getCategoryName(product.category)}</span>
                      </td>
                      <td className="px-6 py-4 font-semibold">{formatPrice(product.price)}</td>
                      <td className="px-6 py-4">
                        <span className={`badge ${statusBadge.color} gap-1`}>
                          <StatusIcon className="w-3 h-3" /> {product.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-[var(--color-text-secondary)]">{timeAgo(product.created_at)}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <a href={`/product/${product.slug}`} target="_blank" rel="noopener noreferrer" className="btn-ghost btn-sm p-1.5" title="View">
                            <ExternalLink className="w-4 h-4" />
                          </a>
                          {product.status === 'pending' && (
                            <button onClick={() => setActionTarget({ id: product.id, action: 'active' })} className="btn-sm text-xs font-medium rounded-lg bg-green-100 text-green-700 hover:bg-green-200 px-3 py-1.5">
                              Approve
                            </button>
                          )}
                          {product.status !== 'removed' && (
                            <button onClick={() => setActionTarget({ id: product.id, action: 'removed' })} className="btn-ghost btn-sm p-1.5 text-red-500 hover:bg-red-50" title="Remove">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {products.length === 20 && (
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
