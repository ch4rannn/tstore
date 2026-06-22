import { Link } from 'react-router-dom';
import { Heart, Trash2 } from 'lucide-react';
import { useGetWishlistQuery, useToggleWishlistMutation } from '../../services/api';
import ProductCard, { ProductCardSkeleton } from '../../components/shared/ProductCard';

export default function WishlistPage() {
  const { data, isLoading } = useGetWishlistQuery();
  const products = data?.products || [];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-fadeIn">
      <div className="flex items-center gap-3 mb-6">
        <Heart className="w-6 h-6 text-[var(--color-primary)]" />
        <h1 className="text-2xl font-bold text-[var(--color-accent)]">My Wishlist</h1>
        {products.length > 0 && (
          <span className="bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-sm font-semibold px-3 py-0.5 rounded-full">{products.length}</span>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)}
        </div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {products.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      ) : (
        <div className="text-center py-20">
          <p className="text-5xl mb-4">💝</p>
          <h3 className="text-lg font-bold mb-2">Your wishlist is empty</h3>
          <p className="text-[var(--color-text-muted)] mb-6">Save products you love to find them later</p>
          <Link to="/" className="btn-primary">Browse Products</Link>
        </div>
      )}
      <div className="h-20 md:h-0" />
    </div>
  );
}
