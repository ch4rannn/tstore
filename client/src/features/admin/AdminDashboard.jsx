import { Link } from 'react-router-dom';
import {
  LayoutDashboard, ShoppingBag, Users, CreditCard, Flag,
  TrendingUp, CheckCircle, Clock, Package, DollarSign,
  BarChart3, MessageSquare, ArrowRight, RefreshCw
} from 'lucide-react';
import { useGetAdminDashboardQuery } from '../../services/api';
import { formatPrice } from '../../constants';

export default function AdminDashboard() {
  const { data, isLoading, refetch, isFetching } = useGetAdminDashboardQuery();
  const stats = data?.stats || {};

  const cards = [
    { label: 'Total Products', value: stats.totalProducts, icon: ShoppingBag, color: 'bg-blue-500', bg: 'bg-blue-50', text: 'text-blue-600' },
    { label: 'Active Listings', value: stats.activeProducts, icon: CheckCircle, color: 'bg-green-500', bg: 'bg-green-50', text: 'text-green-600' },
    { label: 'Pending Approval', value: stats.pendingApprovals, icon: Clock, color: 'bg-amber-500', bg: 'bg-amber-50', text: 'text-amber-600', alert: stats.pendingApprovals > 0 },
    { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'bg-indigo-500', bg: 'bg-indigo-50', text: 'text-indigo-600' },
    { label: 'Confirmed Payments', value: stats.totalPaymentsCount, icon: CreditCard, color: 'bg-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-600' },
    { label: 'Total Revenue', value: formatPrice(stats.totalRevenue || 0), icon: DollarSign, color: 'bg-violet-500', bg: 'bg-violet-50', text: 'text-violet-600', isText: true },
    { label: 'Pending Reports', value: stats.pendingReports, icon: Flag, color: 'bg-red-500', bg: 'bg-red-50', text: 'text-red-600', alert: stats.pendingReports > 0 },
    { label: 'Total Messages', value: stats.totalMessages, icon: MessageSquare, color: 'bg-cyan-500', bg: 'bg-cyan-50', text: 'text-cyan-600' },
  ];

  const monthlyCards = [
    { label: 'Products This Month', value: stats.monthlyProducts, icon: Package, bg: 'bg-blue-50', text: 'text-blue-600' },
    { label: 'Revenue This Month', value: formatPrice(stats.monthlyRevenue || 0), icon: TrendingUp, bg: 'bg-emerald-50', text: 'text-emerald-600', isText: true },
  ];

  const quickLinks = [
    { label: 'Manage Users', path: '/admin/users', icon: Users, desc: 'View, ban, or delete users', color: 'from-indigo-500 to-blue-500' },
    { label: 'Manage Products', path: '/admin/products', icon: ShoppingBag, desc: 'Approve or remove listings', color: 'from-blue-500 to-cyan-500' },
    { label: 'Manage Payments', path: '/admin/payments', icon: CreditCard, desc: 'Confirm payments & export', color: 'from-emerald-500 to-green-500' },
    { label: 'Manage Reports', path: '/admin/reports', icon: Flag, desc: 'Review user reports', color: 'from-red-500 to-orange-500' },
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-accent)]" style={{ fontFamily: 'var(--font-heading)' }}>
            <LayoutDashboard className="w-7 h-7 inline-block mr-2 -mt-1 text-[var(--color-primary)]" />
            Dashboard
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">Overview of your platform's performance</p>
        </div>
        <button onClick={refetch} disabled={isFetching} className="btn-secondary btn-sm self-start sm:self-auto">
          <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className={`bg-white p-5 rounded-2xl shadow-sm border border-[var(--color-border-light)] hover:border-[var(--color-border)] transition-all hover:shadow-md relative overflow-hidden group ${card.alert ? 'ring-2 ring-amber-200' : ''}`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-xl ${card.bg} flex items-center justify-center shrink-0 transition-transform group-hover:scale-110`}>
                  <Icon className={`w-5 h-5 ${card.text}`} />
                </div>
                <p className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider leading-tight">{card.label}</p>
              </div>
              {isLoading ? (
                <div className="skeleton h-9 w-20 rounded-lg" />
              ) : (
                <p className={`text-2xl font-bold ${card.alert ? card.text : ''}`}>{card.isText ? card.value : (card.value ?? 0)}</p>
              )}
              {card.alert && !isLoading && card.value > 0 && (
                <div className={`absolute top-3 right-3 w-2.5 h-2.5 rounded-full ${card.color} animate-pulse-soft`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Monthly Stats */}
      <div>
        <h2 className="text-sm font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-3 flex items-center gap-2">
          <BarChart3 className="w-4 h-4" /> Monthly Overview (Last 30 Days)
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {monthlyCards.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.label} className="bg-white p-5 rounded-2xl shadow-sm border border-[var(--color-border-light)] flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl ${card.bg} flex items-center justify-center shrink-0`}>
                  <Icon className={`w-6 h-6 ${card.text}`} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">{card.label}</p>
                  {isLoading ? (
                    <div className="skeleton h-7 w-24 rounded-lg mt-1" />
                  ) : (
                    <p className="text-xl font-bold mt-0.5">{card.isText ? card.value : (card.value ?? 0)}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-sm font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-3">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.path}
                to={link.path}
                className="group bg-white p-5 rounded-2xl shadow-sm border border-[var(--color-border-light)] hover:shadow-md hover:border-[var(--color-border)] transition-all"
              >
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${link.color} flex items-center justify-center mb-3 transition-transform group-hover:scale-110`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-bold text-sm mb-1">{link.label}</h3>
                <p className="text-xs text-[var(--color-text-muted)] mb-3">{link.desc}</p>
                <span className="text-xs font-semibold text-[var(--color-primary)] flex items-center gap-1 group-hover:gap-2 transition-all">
                  Go to page <ArrowRight className="w-3 h-3" />
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
