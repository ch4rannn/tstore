import { Link } from 'react-router-dom';
import { Heart, MapPin } from 'lucide-react';
import { useSelector } from 'react-redux';
import { useToggleWishlistMutation } from '../../services/api';
import { formatPrice, getConditionBadge, timeAgo } from '../../constants';

export default function ProductCard({ product }) {
  const { isAuthenticated } = useSelector((s) => s.auth);
  const [toggleWishlist] = useToggleWishlistMutation();
  const condition = getConditionBadge(product.condition);
  const image = product.images?.[0];

  const handleWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isAuthenticated) {
      try { await toggleWishlist(product.id); } catch {}
    }
  };

  return (
    <Link to={`/product/${product.slug}`} className="card group block" id={`product-${product.id}`}>
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-[var(--color-bg)]">
        {image ? (
          <img
            src={image}
            alt={product.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl bg-gradient-to-br from-[var(--color-bg)] to-[var(--color-bg-dark)]">
            📦
          </div>
        )}

        {/* Condition Badge */}
        <span className={`badge ${condition.color} absolute top-2.5 left-2.5 shadow-sm`}>
          {condition.label}
        </span>

        {/* Wishlist Button */}
        {isAuthenticated && (
          <button
            onClick={handleWishlist}
            className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-white hover:scale-110"
          >
            <Heart className="w-4 h-4 text-[var(--color-text-muted)] hover:text-[var(--color-primary)]" />
          </button>
        )}

        {/* Negotiable tag */}
        {product.negotiable ? (
          <span className="absolute bottom-2.5 right-2.5 text-[10px] font-semibold bg-[var(--color-accent)]/80 text-white px-2 py-0.5 rounded-full backdrop-blur">
            Negotiable
          </span>
        ) : null}
      </div>

      {/* Info */}
      <div className="p-3.5">
        <h3 className="text-sm font-medium line-clamp-2 leading-snug text-[var(--color-accent)] mb-1.5 min-h-[2.5em]">
          {product.title}
        </h3>
        <p className="text-base font-bold text-[var(--color-primary)]">
          {formatPrice(product.price)}
        </p>
        <div className="flex items-center justify-between mt-2">
          <span className="flex items-center gap-1 text-xs text-[var(--color-text-muted)]">
            <MapPin className="w-3 h-3" />
            {product.district}
          </span>
          <span className="text-xs text-[var(--color-text-muted)]">
            {timeAgo(product.created_at)}
          </span>
        </div>
      </div>
    </Link>
  );
}

// Skeleton variant
export function ProductCardSkeleton() {
  return (
    <div className="card">
      <div className="aspect-square skeleton" />
      <div className="p-3.5 space-y-2.5">
        <div className="skeleton h-4 w-full rounded" />
        <div className="skeleton h-4 w-2/3 rounded" />
        <div className="skeleton h-5 w-1/3 rounded" />
        <div className="flex justify-between">
          <div className="skeleton h-3 w-20 rounded" />
          <div className="skeleton h-3 w-12 rounded" />
        </div>
      </div>
    </div>
  );
}
