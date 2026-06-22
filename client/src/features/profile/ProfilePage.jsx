import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { User, Star, MapPin, Calendar, Package } from 'lucide-react';
import { useGetMeQuery, useGetUserProfileQuery } from '../../services/api';
import { formatPrice, timeAgo } from '../../constants';

export default function ProfilePage() {
  const { userId } = useParams();
  const { user: currentUser } = useSelector((s) => s.auth);
  const isOwnProfile = !userId || userId === currentUser?.id;

  const { data: meData } = useGetMeQuery(undefined, { skip: !isOwnProfile });
  const { data: otherData } = useGetUserProfileQuery(userId, { skip: isOwnProfile || !userId });

  const profile = isOwnProfile ? meData?.user : otherData?.user;
  const ratings = otherData?.ratings || [];

  if (!profile) {
    return <div className="flex items-center justify-center min-h-[60vh]"><div className="spinner-dark" style={{ width: 32, height: 32 }} /></div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-fadeIn">
      {/* Profile Header */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-light)]" />
        <div className="px-6 pb-6 -mt-12">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
            <div className="w-24 h-24 rounded-2xl bg-white shadow-lg flex items-center justify-center text-3xl font-bold text-[var(--color-primary)] border-4 border-white">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="w-full h-full rounded-xl object-cover" />
              ) : (
                profile.name?.charAt(0)?.toUpperCase()
              )}
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold">{profile.name}</h1>
              <p className="text-sm text-[var(--color-text-muted)] capitalize">{profile.role}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
            {profile.ratings_avg > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                <span className="font-semibold">{profile.ratings_avg}</span>
                <span className="text-[var(--color-text-muted)]">({profile.ratings_count})</span>
              </div>
            )}
            {profile.district && (
              <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
                <MapPin className="w-4 h-4" /> {profile.district}
              </div>
            )}
            <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
              <Calendar className="w-4 h-4" /> Joined {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
            </div>
          </div>
        </div>
      </div>

      {/* Reviews */}
      {ratings.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm p-6 mt-6">
          <h3 className="font-bold mb-4">Reviews ({ratings.length})</h3>
          <div className="space-y-4">
            {ratings.map((r) => (
              <div key={r.id} className="flex gap-3 pb-4 border-b border-[var(--color-border-light)] last:border-0">
                <div className="w-10 h-10 rounded-full bg-[var(--color-bg)] flex items-center justify-center text-sm font-bold">
                  {r.rater_name?.charAt(0)?.toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{r.rater_name}</span>
                    <div className="flex">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`w-3 h-3 ${i < r.stars ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                      ))}
                    </div>
                  </div>
                  {r.comment && <p className="text-sm text-[var(--color-text-secondary)] mt-1">{r.comment}</p>}
                  <span className="text-xs text-[var(--color-text-muted)]">{timeAgo(r.created_at)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="h-20 md:h-0" />
    </div>
  );
}
