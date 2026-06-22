import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Package, Plus, DollarSign, MessageCircle, Eye, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useGetMyProductsQuery, useGetMyPaymentsQuery } from '../../services/api';
import { formatPrice, getConditionBadge, timeAgo } from '../../constants';

export default function SellerDashboard() {
  const { user } = useSelector((s) => s.auth);
  const { data: productsData, isLoading } = useGetMyProductsQuery({});
  const { data: paymentsData } = useGetMyPaymentsQuery();

  const products = productsData?.products || [];
  const payments = paymentsData?.payments || [];
  const totalEarnings = payments.filter((p) => p.status === 'confirmed').reduce((sum, p) => sum + p.amount, 0);

  const statusCounts = {
    active: products.filter((p) => p.status === 'active').length,
    pending: products.filter((p) => p.status === 'pending').length,
    sold: products.filter((p) => p.status === 'sold').length,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-fadeIn">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-accent)]" style={{ fontFamily: 'var(--font-heading)' }}>Seller Dashboard</h1>
          <p className="text-sm text-[var(--color-text-muted)]">Welcome back, {user?.name}</p>
        </div>
        <Link to="/seller/post" className="btn-primary">
          <Plus className="w-4 h-4" /> Post Product
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center"><Package className="w-5 h-5 text-blue-500" /></div>
            <div><p className="text-2xl font-bold">{statusCounts.active}</p><p className="text-xs text-[var(--color-text-muted)]">Active Listings</p></div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-yellow-50 flex items-center justify-center"><Clock className="w-5 h-5 text-yellow-500" /></div>
            <div><p className="text-2xl font-bold">{statusCounts.pending}</p><p className="text-xs text-[var(--color-text-muted)]">Pending Approval</p></div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center"><CheckCircle className="w-5 h-5 text-green-500" /></div>
            <div><p className="text-2xl font-bold">{statusCounts.sold}</p><p className="text-xs text-[var(--color-text-muted)]">Sold</p></div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center"><DollarSign className="w-5 h-5 text-purple-500" /></div>
            <div><p className="text-2xl font-bold">{formatPrice(totalEarnings)}</p><p className="text-xs text-[var(--color-text-muted)]">Listing Fees Paid</p></div>
          </div>
        </div>
      </div>

      {/* Product List */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-[var(--color-border-light)]">
          <h3 className="font-bold">My Listings</h3>
        </div>
        {isLoading ? (
          <div className="p-10 text-center"><div className="spinner-dark mx-auto" style={{ width: 24, height: 24 }} /></div>
        ) : products.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-4xl mb-3">📦</p>
            <p className="text-[var(--color-text-muted)]">No listings yet</p>
            <Link to="/seller/post" className="btn-primary mt-4 inline-flex">Post Your First Product</Link>
          </div>
        ) : (
          <div className="divide-y divide-[var(--color-border-light)]">
            {products.map((p) => {
              const cond = getConditionBadge(p.condition);
              return (
                <div key={p.id} className="flex items-center gap-4 p-4 hover:bg-[var(--color-bg)] transition-colors">
                  <div className="w-16 h-16 rounded-xl bg-[var(--color-bg)] overflow-hidden shrink-0">
                    {p.images?.[0] ? <img src={p.images[0]} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link to={`/product/${p.slug}`} className="font-medium text-sm hover:text-[var(--color-primary)] truncate block">{p.title}</Link>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm font-bold text-[var(--color-primary)]">{formatPrice(p.price)}</span>
                      <span className={`badge ${cond.color}`}>{cond.label}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${p.status === 'active' ? 'bg-green-50 text-green-600' : p.status === 'pending' ? 'bg-yellow-50 text-yellow-600' : p.status === 'sold' ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600'}`}>{p.status}</span>
                    <p className="text-xs text-[var(--color-text-muted)] mt-1">{timeAgo(p.created_at)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="h-20 md:h-0" />
    </div>
  );
}
