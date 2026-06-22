import { useState } from 'react';
import { Search, Filter, ShieldAlert, UserCheck, UserX, UserMinus, Eye, Loader2, RefreshCw } from 'lucide-react';
import { useGetAdminUserStatsQuery, useGetAdminUsersQuery } from '../../services/api';
import { timeAgo } from '../../constants';
import UserDetailModal from './UserDetailModal';

export default function AdminUserManagement() {
  const [filters, setFilters] = useState({ search: '', role: '', page: '1' });
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [searchDraft, setSearchDraft] = useState('');

  const { data: statsData, isLoading: statsLoading, refetch: refetchStats } = useGetAdminUserStatsQuery();
  const { data: usersData, isLoading: usersLoading, isFetching } = useGetAdminUsersQuery(filters);

  const stats = statsData?.stats || {};
  const users = usersData?.users || [];

  const handleSearch = (e) => {
    e.preventDefault();
    setFilters({ ...filters, search: searchDraft, page: '1' });
  };

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value, page: '1' });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-accent)]" style={{ fontFamily: 'var(--font-heading)' }}>User Management</h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">Manage buyers, sellers, and account statuses</p>
        </div>
        <button onClick={() => refetchStats()} className="btn-secondary btn-sm self-start sm:self-auto">
          <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard title="Total Users" value={stats.total} icon={<UserCheck className="w-5 h-5 text-blue-500" />} bg="bg-blue-50" loading={statsLoading} />
        <StatCard title="Buyers" value={stats.buyers} icon={<UserCheck className="w-5 h-5 text-indigo-500" />} bg="bg-indigo-50" loading={statsLoading} />
        <StatCard title="Sellers" value={stats.sellers} icon={<UserCheck className="w-5 h-5 text-purple-500" />} bg="bg-purple-50" loading={statsLoading} />
        <StatCard title="Active" value={stats.active} icon={<UserCheck className="w-5 h-5 text-green-500" />} bg="bg-green-50" loading={statsLoading} />
        <StatCard title="Suspended" value={stats.banned} icon={<UserX className="w-5 h-5 text-red-500" />} bg="bg-red-50" loading={statsLoading} />
        <StatCard title="Unverified" value={stats.unverified} icon={<UserMinus className="w-5 h-5 text-orange-500" />} bg="bg-orange-50" loading={statsLoading} />
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-2xl shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <form onSubmit={handleSearch} className="flex-1 w-full relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
          <input 
            type="text" 
            placeholder="Search by name, email, or phone..." 
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
            className="input pl-10 w-full md:max-w-md bg-[var(--color-bg)] border-transparent focus:bg-white"
          />
        </form>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-48">
            <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
            <select 
              value={filters.role} 
              onChange={(e) => handleFilterChange('role', e.target.value)}
              className="input pl-9 bg-[var(--color-bg)] border-transparent focus:bg-white w-full text-sm"
            >
              <option value="">All Roles</option>
              <option value="buyer">Buyers Only</option>
              <option value="seller">Sellers Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-[var(--color-bg)] text-[var(--color-text-secondary)] uppercase text-[11px] font-bold tracking-wider">
              <tr>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Joined</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border-light)]">
              {usersLoading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-[var(--color-primary)] mx-auto" />
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <p className="text-3xl mb-2">👻</p>
                    <p className="text-[var(--color-text-muted)] font-medium">No users found</p>
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-[var(--color-surface-hover)] transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-light)] text-white flex items-center justify-center font-bold overflow-hidden shrink-0">
                          {user.avatar_url ? <img src={user.avatar_url} className="w-full h-full object-cover" /> : user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold">{user.name}</p>
                          <p className="text-[10px] text-[var(--color-text-muted)] font-mono">{user.id.substring(0,8)}...</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm">{user.email || '—'}</p>
                      <p className="text-xs text-[var(--color-text-muted)]">{user.phone || '—'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`badge ${user.role === 'seller' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {user.is_banned ? (
                        <span className="badge bg-red-100 text-red-700 gap-1"><ShieldAlert className="w-3 h-3" /> Banned</span>
                      ) : !user.is_verified ? (
                        <span className="badge bg-orange-100 text-orange-700">Unverified</span>
                      ) : (
                        <span className="badge bg-green-100 text-green-700">Active</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-[var(--color-text-secondary)]">
                      {timeAgo(user.created_at)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => setSelectedUserId(user.id)} 
                        className="btn-secondary btn-sm bg-white opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Eye className="w-4 h-4 mr-1" /> View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Simple Pagination Footer */}
        {users.length === 20 && (
          <div className="p-4 border-t border-[var(--color-border-light)] flex justify-center">
            <button 
              onClick={() => handleFilterChange('page', String(parseInt(filters.page) + 1))}
              className="btn-secondary btn-sm"
            >
              Load Next Page
            </button>
          </div>
        )}
      </div>

      {selectedUserId && <UserDetailModal userId={selectedUserId} onClose={() => setSelectedUserId(null)} />}
    </div>
  );
}

function StatCard({ title, value, icon, bg, loading }) {
  return (
    <div className="bg-white p-4 rounded-2xl shadow-sm border border-[var(--color-border-light)] hover:border-[var(--color-border)] transition-colors">
      <div className="flex items-center gap-3 mb-2">
        <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center shrink-0`}>
          {icon}
        </div>
        <p className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider truncate">{title}</p>
      </div>
      {loading ? (
        <div className="skeleton h-8 w-16 rounded mt-1" />
      ) : (
        <p className="text-2xl font-bold">{value || 0}</p>
      )}
    </div>
  );
}
