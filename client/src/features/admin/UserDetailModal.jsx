import { useState } from 'react';
import { ShieldAlert, MapPin, Calendar, Star, X, CheckCircle, Package, MessageSquare, Flag } from 'lucide-react';
import { useGetAdminUserDetailsQuery, useAdminResetPasswordMutation, useAdminDeleteUserMutation, useBanUserMutation } from '../../services/api';
import { timeAgo } from '../../constants';
import toast from 'react-hot-toast';

export default function UserDetailModal({ userId, onClose }) {
  const { data, isLoading, error } = useGetAdminUserDetailsQuery(userId, { skip: !userId });
  const [resetPassword, { isLoading: resetting }] = useAdminResetPasswordMutation();
  const [deleteUser, { isLoading: deleting }] = useAdminDeleteUserMutation();
  const [banUser, { isLoading: banning }] = useBanUserMutation();
  
  const [confirmAction, setConfirmAction] = useState(null); // 'ban', 'unban', 'reset', 'delete'

  if (!userId) return null;

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
        <div className="bg-white rounded-2xl p-10 flex flex-col items-center">
          <div className="spinner-dark w-10 h-10 mb-4" />
          <p className="text-sm font-medium">Loading user data...</p>
        </div>
      </div>
    );
  }

  if (error || !data?.user) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <X className="w-6 h-6 text-red-500" />
          </div>
          <h3 className="text-lg font-bold mb-2">Error Loading User</h3>
          <p className="text-sm text-[var(--color-text-muted)] mb-6">The user details could not be found.</p>
          <button onClick={onClose} className="btn-secondary w-full">Close</button>
        </div>
      </div>
    );
  }

  const { user, activity } = data;

  const handleAction = async () => {
    try {
      if (confirmAction === 'ban') {
        await banUser({ id: user.id, banned: true, reason: 'Violation of Terms of Service' }).unwrap();
        toast.success('User suspended');
      } else if (confirmAction === 'unban') {
        await banUser({ id: user.id, banned: false }).unwrap();
        toast.success('User restored');
      } else if (confirmAction === 'reset') {
        const res = await resetPassword(user.id).unwrap();
        toast.success(`Password reset to: ${res.tempPassword}`, { duration: 8000 });
      } else if (confirmAction === 'delete') {
        await deleteUser(user.id).unwrap();
        toast.success('User deleted and anonymized');
        onClose(); // Close modal on delete
      }
      setConfirmAction(null);
    } catch (err) {
      toast.error(err.data?.error || 'Action failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-2xl my-8 relative overflow-hidden shadow-2xl animate-scaleIn">
        {/* Header Background */}
        <div className={`h-24 ${user.is_banned ? 'bg-red-500' : 'bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-light)]'}`} />
        
        {/* Close Button */}
        <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/20 text-white flex items-center justify-center hover:bg-black/40 transition-colors">
          <X className="w-5 h-5" />
        </button>

        <div className="px-8 pb-8">
          {/* Profile Section */}
          <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-end -mt-10 mb-8">
            <div className="w-24 h-24 rounded-2xl bg-white shadow-lg border-4 border-white flex items-center justify-center text-3xl font-bold text-[var(--color-primary)] shrink-0 overflow-hidden relative">
              {user.avatar_url ? (
                <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                user.name.charAt(0).toUpperCase()
              )}
              {user.is_verified === 1 && (
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-blue-500" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold">{user.name}</h2>
                <span className={`badge ${user.role === 'seller' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                  {user.role}
                </span>
                {user.is_banned === 1 && <span className="badge bg-red-100 text-red-700">Banned</span>}
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[var(--color-text-secondary)] mt-2">
                <span>{user.email || 'No email'}</span> • 
                <span>{user.phone || 'No phone'}</span> • 
                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {user.district || 'N/A'}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Stats */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm text-[var(--color-text-muted)] uppercase tracking-wider">Activity Metrics</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[var(--color-bg)] p-3 rounded-xl flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center"><Package className="w-4 h-4" /></div>
                  <div><p className="text-xl font-bold leading-none">{activity.totalListings}</p><p className="text-[10px] text-[var(--color-text-muted)] mt-1 uppercase">Listings</p></div>
                </div>
                <div className="bg-[var(--color-bg)] p-3 rounded-xl flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-green-100 text-green-600 flex items-center justify-center"><MessageSquare className="w-4 h-4" /></div>
                  <div><p className="text-xl font-bold leading-none">{activity.totalChats}</p><p className="text-[10px] text-[var(--color-text-muted)] mt-1 uppercase">Chats</p></div>
                </div>
                <div className="bg-[var(--color-bg)] p-3 rounded-xl flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-yellow-100 text-yellow-600 flex items-center justify-center"><Star className="w-4 h-4" /></div>
                  <div>
                    <p className="text-xl font-bold leading-none flex items-baseline gap-1">
                      {user.ratings_avg || 0} <span className="text-xs font-normal text-[var(--color-text-muted)]">({user.ratings_count})</span>
                    </p>
                    <p className="text-[10px] text-[var(--color-text-muted)] mt-1 uppercase">Rating</p>
                  </div>
                </div>
                <div className={`p-3 rounded-xl flex items-center gap-3 ${activity.reportsAgainst > 0 ? 'bg-red-50' : 'bg-[var(--color-bg)]'}`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${activity.reportsAgainst > 0 ? 'bg-red-100 text-red-600' : 'bg-gray-200 text-gray-500'}`}><Flag className="w-4 h-4" /></div>
                  <div><p className={`text-xl font-bold leading-none ${activity.reportsAgainst > 0 ? 'text-red-600' : ''}`}>{activity.reportsAgainst}</p><p className="text-[10px] text-[var(--color-text-muted)] mt-1 uppercase">Reports</p></div>
                </div>
              </div>
            </div>

            {/* Meta Info */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm text-[var(--color-text-muted)] uppercase tracking-wider">Account Details</h4>
              <div className="bg-[var(--color-bg)] rounded-xl p-4 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-secondary)]">User ID</span>
                  <span className="font-mono text-xs">{user.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-secondary)]">Joined</span>
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(user.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-secondary)]">Verification</span>
                  <span className={user.is_verified ? 'text-green-600 font-medium' : 'text-yellow-600 font-medium'}>{user.is_verified ? 'Verified' : 'Unverified'}</span>
                </div>
                {user.is_banned === 1 && (
                  <div className="flex justify-between border-t border-[var(--color-border)] pt-3 mt-3">
                    <span className="text-red-500 flex items-center gap-1"><ShieldAlert className="w-4 h-4" /> Ban Reason</span>
                    <span className="text-red-600 font-medium text-right max-w-[60%] truncate" title={user.ban_reason}>{user.ban_reason || 'N/A'}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Admin Actions */}
          <div className="border-t border-[var(--color-border-light)] pt-6">
            <h4 className="font-semibold text-sm mb-4">Administrative Actions</h4>
            
            {confirmAction ? (
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 animate-fadeIn">
                <div>
                  <p className="font-bold text-orange-800 text-sm">Confirm Action</p>
                  <p className="text-orange-700 text-xs mt-1">
                    Are you sure you want to {confirmAction} this user? 
                    {confirmAction === 'delete' && ' This will anonymize their profile and remove active listings.'}
                    {confirmAction === 'reset' && ' This will change their password and log them out.'}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => setConfirmAction(null)} className="btn-secondary btn-sm bg-white">Cancel</button>
                  <button 
                    onClick={handleAction} 
                    disabled={resetting || deleting || banning} 
                    className={`btn-sm font-medium rounded-lg text-white px-4 py-2 ${confirmAction === 'delete' || confirmAction === 'ban' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                  >
                    Confirm {confirmAction}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-3">
                {user.is_banned ? (
                  <button onClick={() => setConfirmAction('unban')} className="btn-secondary border-green-200 text-green-700 hover:bg-green-50">Restore Access (Unban)</button>
                ) : (
                  <button onClick={() => setConfirmAction('ban')} className="btn-secondary border-orange-200 text-orange-700 hover:bg-orange-50">Suspend User</button>
                )}
                <button onClick={() => setConfirmAction('reset')} className="btn-secondary">Reset Password</button>
                <div className="flex-1 min-w-[20px]" />
                <button onClick={() => setConfirmAction('delete')} className="btn-ghost text-red-500 hover:bg-red-50 hover:text-red-600">Delete User Data</button>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
