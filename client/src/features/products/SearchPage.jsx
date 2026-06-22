import { useSearchParams } from 'react-router-dom';
import { useGetProductsQuery } from '../../services/api';
import ProductCard, { ProductCardSkeleton } from '../../components/shared/ProductCard';
import { SORT_OPTIONS } from '../../constants';

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const sort = searchParams.get('sort') || 'newest';

  // Use products endpoint with search in title via filtering
  const { data, isLoading } = useGetProductsQuery({ sort, page: '1', limit: '40' });

  // Client-side filter for now (could be improved with backend search)
  const filtered = data?.products?.filter((p) =>
    p.title.toLowerCase().includes(query.toLowerCase()) ||
    p.description?.toLowerCase().includes(query.toLowerCase())
  ) || [];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-fadeIn">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-accent)]">
            Search results for "<span className="text-[var(--color-primary)]">{query}</span>"
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">{filtered.length} results found</p>
        </div>
        <select value={sort} onChange={(e) => { const p = new URLSearchParams(searchParams); p.set('sort', e.target.value); setSearchParams(p); }} className="input py-2 px-3 text-sm w-auto bg-white">
          {SORT_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => <ProductCardSkeleton key={i} />)}
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filtered.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      ) : (
        <div className="text-center py-20">
          <p className="text-5xl mb-4">🔍</p>
          <h3 className="text-lg font-bold mb-2">No results found</h3>
          <p className="text-[var(--color-text-muted)]">Try different keywords or browse categories</p>
        </div>
      )}
      <div className="h-20 md:h-0" />
    </div>
  );
}
