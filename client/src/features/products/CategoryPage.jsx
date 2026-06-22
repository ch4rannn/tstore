import { useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { Filter, SlidersHorizontal, X } from 'lucide-react';
import { useGetProductsQuery } from '../../services/api';
import { CATEGORIES, CONDITIONS, NEPAL_DISTRICTS, SORT_OPTIONS, getCategoryName } from '../../constants';
import ProductCard, { ProductCardSkeleton } from '../../components/shared/ProductCard';

export default function CategoryPage() {
  const { categoryId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);

  const filters = {
    category: categoryId === 'all' ? '' : categoryId,
    condition: searchParams.get('condition') || '',
    district: searchParams.get('district') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    sort: searchParams.get('sort') || 'newest',
    page: searchParams.get('page') || '1',
  };

  const { data, isLoading } = useGetProductsQuery(filters);
  const category = CATEGORIES.find((c) => c.id === categoryId);

  const updateFilter = (key, value) => {
    const params = new URLSearchParams(searchParams);
    if (value) params.set(key, value);
    else params.delete(key);
    params.set('page', '1');
    setSearchParams(params);
  };

  const clearFilters = () => setSearchParams({});

  const activeFilterCount = [filters.condition, filters.district, filters.minPrice, filters.maxPrice].filter(Boolean).length;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <nav className="flex items-center gap-2 text-sm text-[var(--color-text-muted)] mb-1">
            <Link to="/" className="hover:text-[var(--color-primary)]">Home</Link>
            <span>/</span>
            <span className="text-[var(--color-text)]">{category ? category.name : 'All Products'}</span>
          </nav>
          <h1 className="text-2xl font-bold text-[var(--color-accent)]" style={{ fontFamily: 'var(--font-heading)' }}>
            {category ? `${category.icon} ${category.name}` : '📦 All Products'}
          </h1>
          {data && <p className="text-sm text-[var(--color-text-muted)] mt-1">{data.pagination.total} products found</p>}
        </div>

        <div className="flex items-center gap-2">
          {/* Sort */}
          <select
            value={filters.sort}
            onChange={(e) => updateFilter('sort', e.target.value)}
            className="input py-2 px-3 text-sm bg-white w-auto"
          >
            {SORT_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>

          {/* Filter Toggle (mobile) */}
          <button onClick={() => setShowFilters(!showFilters)} className="btn-secondary btn-sm lg:hidden relative">
            <SlidersHorizontal className="w-4 h-4" />
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[var(--color-primary)] text-white text-[10px] flex items-center justify-center">{activeFilterCount}</span>
            )}
          </button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Filter Sidebar */}
        <aside className={`${showFilters ? 'fixed inset-0 z-50 bg-black/50 lg:relative lg:bg-transparent' : 'hidden lg:block'} lg:w-64 shrink-0`}>
          <div className={`${showFilters ? 'absolute right-0 top-0 h-full w-72 bg-white shadow-xl p-5 overflow-y-auto' : ''} lg:relative lg:w-auto lg:shadow-none lg:p-0`}>
            {showFilters && (
              <div className="flex items-center justify-between mb-4 lg:hidden">
                <h3 className="font-bold">Filters</h3>
                <button onClick={() => setShowFilters(false)}><X className="w-5 h-5" /></button>
              </div>
            )}

            <div className="space-y-6 lg:bg-white lg:rounded-2xl lg:p-5 lg:shadow-sm">
              <h3 className="font-semibold text-sm flex items-center gap-2 hidden lg:flex">
                <Filter className="w-4 h-4" /> Filters
                {activeFilterCount > 0 && (
                  <button onClick={clearFilters} className="ml-auto text-xs text-[var(--color-primary)] hover:underline">Clear all</button>
                )}
              </h3>

              {/* Condition */}
              <div>
                <label className="input-label mb-2 block">Condition</label>
                <div className="space-y-1.5">
                  {CONDITIONS.map((c) => (
                    <label key={c.id} className="flex items-center gap-2 cursor-pointer text-sm">
                      <input
                        type="radio"
                        name="condition"
                        checked={filters.condition === c.id}
                        onChange={() => updateFilter('condition', filters.condition === c.id ? '' : c.id)}
                        className="accent-[var(--color-primary)]"
                      />
                      <span className={`badge ${c.color}`}>{c.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div>
                <label className="input-label mb-2 block">Price Range (Rs)</label>
                <div className="flex gap-2">
                  <input type="number" placeholder="Min" value={filters.minPrice} onChange={(e) => updateFilter('minPrice', e.target.value)} className="input py-2 text-sm" />
                  <input type="number" placeholder="Max" value={filters.maxPrice} onChange={(e) => updateFilter('maxPrice', e.target.value)} className="input py-2 text-sm" />
                </div>
              </div>

              {/* District */}
              <div>
                <label className="input-label mb-2 block">Location</label>
                <select value={filters.district} onChange={(e) => updateFilter('district', e.target.value)} className="input py-2 text-sm">
                  <option value="">All Districts</option>
                  {NEPAL_DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              {showFilters && (
                <button onClick={() => setShowFilters(false)} className="btn-primary w-full lg:hidden">Apply Filters</button>
              )}
            </div>
          </div>
        </aside>

        {/* Product Grid */}
        <main className="flex-1 min-w-0">
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 12 }).map((_, i) => <ProductCardSkeleton key={i} />)}
            </div>
          ) : data?.products?.length > 0 ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                {data.products.map((p) => <ProductCard key={p.id} product={p} />)}
              </div>

              {/* Pagination */}
              {data.pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  {Array.from({ length: Math.min(5, data.pagination.totalPages) }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => updateFilter('page', String(page))}
                      className={`w-10 h-10 rounded-xl text-sm font-medium transition-all ${
                        parseInt(filters.page) === page
                          ? 'bg-[var(--color-primary)] text-white'
                          : 'bg-white text-[var(--color-text)] hover:bg-[var(--color-bg)]'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-20">
              <p className="text-5xl mb-4">🔍</p>
              <h3 className="text-lg font-bold mb-2">No products found</h3>
              <p className="text-[var(--color-text-muted)] mb-4">Try adjusting your filters</p>
              <button onClick={clearFilters} className="btn-outline btn-sm">Clear Filters</button>
            </div>
          )}
        </main>
      </div>

      <div className="h-20 md:h-0" />
    </div>
  );
}
