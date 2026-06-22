import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Heart, Share2, MessageCircle, MapPin, Clock, Eye, ChevronLeft, ChevronRight, Star, Flag, Loader2, X } from 'lucide-react';
import { useGetProductQuery, useToggleWishlistMutation, useCreateChatMutation, useSubmitReportMutation } from '../../services/api';
import { formatPrice, getConditionBadge, timeAgo, getCategoryName } from '../../constants';
import ProductCard, { ProductCardSkeleton } from '../../components/shared/ProductCard';
import toast from 'react-hot-toast';

const REPORT_REASONS = [
  { id: 'spam', label: 'Spam / Duplicated listing' },
  { id: 'fake', label: 'Fake / Misleading product' },
  { id: 'inappropriate', label: 'Inappropriate content' },
  { id: 'scam', label: 'Suspected scam' },
  { id: 'other', label: 'Other' },
];

export default function ProductDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useSelector((s) => s.auth);
  const { data, isLoading, error } = useGetProductQuery(slug);
  const [toggleWishlist] = useToggleWishlistMutation();
  const [createChat, { isLoading: creatingChat }] = useCreateChatMutation();
  const [submitReport, { isLoading: reporting }] = useSubmitReportMutation();
  const [currentImage, setCurrentImage] = useState(0);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDescription, setReportDescription] = useState('');

  if (isLoading) return <ProductDetailSkeleton />;
  if (error || !data?.product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <p className="text-5xl mb-4">😕</p>
        <h2 className="text-xl font-bold mb-2">Product Not Found</h2>
        <p className="text-[var(--color-text-muted)] mb-6">This product may have been removed or doesn't exist.</p>
        <Link to="/" className="btn-primary">Back to Home</Link>
      </div>
    );
  }

  const { product, isWishlisted, similarProducts } = data;
  const condition = getConditionBadge(product.condition);
  const images = product.images?.length > 0 ? product.images : [];

  const handleWishlist = async () => {
    if (!isAuthenticated) { navigate('/login'); return; }
    try { await toggleWishlist(product.id); toast.success(isWishlisted ? 'Removed from wishlist' : 'Added to wishlist'); } catch {}
  };

  const handleMessageSeller = async () => {
    if (!isAuthenticated) { navigate('/login'); return; }
    try {
      const result = await createChat({ sellerId: product.seller_id, productId: product.id }).unwrap();
      navigate(`/chat/${result.chat.id}`);
    } catch (err) {
      toast.error('Failed to start chat');
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: product.title, text: `Check out ${product.title} on Thrief`, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied!');
    }
  };

  const handleReport = async () => {
    if (!reportReason) { toast.error('Please select a reason'); return; }
    try {
      await submitReport({
        targetType: 'product',
        targetId: product.id,
        reason: reportReason,
        description: reportDescription,
      }).unwrap();
      toast.success('Report submitted. We\u2019ll review it shortly.');
      setShowReportModal(false);
      setReportReason('');
      setReportDescription('');
    } catch (err) {
      toast.error(err?.data?.error || 'Failed to submit report');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 animate-fadeIn">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-[var(--color-text-muted)] mb-4">
        <Link to="/" className="hover:text-[var(--color-primary)]">Home</Link>
        <span>/</span>
        <Link to={`/category/${product.category}`} className="hover:text-[var(--color-primary)]">{getCategoryName(product.category)}</Link>
        <span>/</span>
        <span className="text-[var(--color-text)] truncate">{product.title}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Image Gallery — Left */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
            <div className="relative aspect-square bg-[var(--color-bg)]">
              {images.length > 0 ? (
                <img src={images[currentImage]} alt={product.title} className="w-full h-full object-contain" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-7xl">📦</div>
              )}

              {images.length > 1 && (
                <>
                  <button onClick={() => setCurrentImage((i) => (i > 0 ? i - 1 : images.length - 1))} className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 shadow flex items-center justify-center hover:bg-white">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button onClick={() => setCurrentImage((i) => (i < images.length - 1 ? i + 1 : 0))} className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 shadow flex items-center justify-center hover:bg-white">
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}

              <span className={`badge ${condition.color} absolute top-4 left-4`}>{condition.label}</span>
            </div>

            {images.length > 1 && (
              <div className="flex gap-2 p-3 overflow-x-auto hide-scrollbar">
                {images.map((img, i) => (
                  <button key={i} onClick={() => setCurrentImage(i)} className={`w-16 h-16 rounded-lg overflow-hidden shrink-0 border-2 transition-all ${i === currentImage ? 'border-[var(--color-primary)]' : 'border-transparent opacity-60 hover:opacity-100'}`}>
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Product Info — Right */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h1 className="text-xl sm:text-2xl font-bold text-[var(--color-accent)] mb-2" style={{ fontFamily: 'var(--font-heading)' }}>{product.title}</h1>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl sm:text-3xl font-bold text-[var(--color-primary)]">{formatPrice(product.price)}</span>
              {product.negotiable ? <span className="badge bg-green-50 text-green-600">Negotiable</span> : null}
            </div>

            <div className="flex flex-wrap gap-3 text-sm text-[var(--color-text-muted)]">
              <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {product.district}</span>
              <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {timeAgo(product.created_at)}</span>
              <span className="flex items-center gap-1"><Eye className="w-4 h-4" /> {product.view_count} views</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            {user?.id !== product.seller_id && (
              <button onClick={handleMessageSeller} disabled={creatingChat} className="btn-primary flex-1 py-3">
                {creatingChat ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageCircle className="w-4 h-4" />}
                Message Seller
              </button>
            )}
            <button onClick={handleWishlist} className={`btn-secondary py-3 px-4 ${isWishlisted ? 'text-[var(--color-primary)] border-[var(--color-primary)]' : ''}`}>
              <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />
            </button>
            <button onClick={handleShare} className="btn-secondary py-3 px-4">
              <Share2 className="w-5 h-5" />
            </button>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h3 className="font-semibold mb-3">Description</h3>
            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed whitespace-pre-line">{product.description}</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h3 className="font-semibold mb-3">Seller</h3>
            <Link to={`/user/${product.seller_id}`} className="flex items-center gap-3 group">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-light)] flex items-center justify-center text-white font-bold text-lg">
                {product.seller_name?.charAt(0)?.toUpperCase()}
              </div>
              <div>
                <p className="font-semibold group-hover:text-[var(--color-primary)] transition-colors">{product.seller_name}</p>
                <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
                  {product.seller_rating > 0 && (
                    <span className="flex items-center gap-0.5"><Star className="w-3 h-3 fill-yellow-400 text-yellow-400" /> {product.seller_rating}</span>
                  )}
                  <span>Member since {new Date(product.seller_joined).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                </div>
              </div>
            </Link>
          </div>

          <button onClick={() => setShowReportModal(true)} className="flex items-center gap-2 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-danger)] transition-colors">
            <Flag className="w-3 h-3" /> Report this listing
          </button>
        </div>
      </div>

      {similarProducts?.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xl font-bold text-[var(--color-accent)] mb-6">Similar Products</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {similarProducts.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-2xl w-full max-w-md p-6 animate-scaleIn">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Report Listing</h3>
              <button onClick={() => setShowReportModal(false)} className="btn-ghost btn-icon"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-sm text-[var(--color-text-muted)] mb-4">Why are you reporting this listing?</p>
            <div className="space-y-2 mb-4">
              {REPORT_REASONS.map((r) => (
                <label key={r.id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${reportReason === r.id ? 'border-[var(--color-primary)] bg-red-50' : 'border-[var(--color-border-light)] hover:border-[var(--color-border)]'}`}>
                  <input type="radio" name="reason" value={r.id} checked={reportReason === r.id} onChange={() => setReportReason(r.id)} className="accent-[var(--color-primary)]" />
                  <span className="text-sm">{r.label}</span>
                </label>
              ))}
            </div>
            <textarea placeholder="Additional details (optional)" value={reportDescription} onChange={(e) => setReportDescription(e.target.value)} className="input min-h-[80px] resize-y mb-4" maxLength={500} />
            <div className="flex gap-3">
              <button onClick={() => setShowReportModal(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleReport} disabled={reporting || !reportReason} className="btn-danger flex-1">
                {reporting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit Report'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="h-20 md:h-0" />
    </div>
  );
}

function ProductDetailSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3"><div className="skeleton aspect-square rounded-2xl" /></div>
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl p-6 space-y-3">
            <div className="skeleton h-6 w-3/4 rounded" />
            <div className="skeleton h-8 w-1/3 rounded" />
            <div className="skeleton h-4 w-1/2 rounded" />
          </div>
          <div className="skeleton h-12 rounded-xl" />
          <div className="bg-white rounded-2xl p-6 space-y-2">
            <div className="skeleton h-4 w-full rounded" />
            <div className="skeleton h-4 w-full rounded" />
            <div className="skeleton h-4 w-2/3 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}
