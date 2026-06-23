import { Link } from 'react-router-dom';
import { Search, ArrowRight, TrendingUp, Clock, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CATEGORIES } from '../../constants';
import { useGetFeaturedProductsQuery } from '../../services/api';
import ProductCard, { ProductCardSkeleton } from '../../components/shared/ProductCard';
import CategoryTile from '../../components/shared/CategoryTile';

export default function HomePage() {
  const [heroSearch, setHeroSearch] = useState('');
  const navigate = useNavigate();
  const { data: featured, isLoading } = useGetFeaturedProductsQuery();

  const handleHeroSearch = (e) => {
    e.preventDefault();
    if (heroSearch.trim()) {
      navigate(`/search?q=${encodeURIComponent(heroSearch)}`);
    }
  };

  return (
    <div className="animate-fadeIn">
      {/* ═══ Hero Section ═══ */}
      <section className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #1E272E 0%, #485460 50%, #E84118 100%)' }}>
        {/* Decorative elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-[var(--color-primary)] rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 py-16 sm:py-24 text-center">
          <div className="animate-slideUp">
            <span className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur text-white text-xs font-medium px-4 py-1.5 rounded-full mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              Nepal's #1 Thrift Fashion Marketplace
            </span>
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white mb-4 leading-tight" style={{ fontFamily: 'var(--font-heading)' }}>
              Thrift Fashion,<br />
              <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(135deg, #ff6348, #fdcb6e)' }}>
                Redefined in Nepal
              </span>
            </h1>
            <p className="text-white/70 text-sm sm:text-lg max-w-xl mx-auto mb-8">
              Discover pre-loved clothing, sneakers, and accessories at unbeatable prices. Look stylish, save money, shop sustainable.
            </p>

            {/* Hero Search */}
            <form onSubmit={handleHeroSearch} className="max-w-lg mx-auto relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search for t-shirts, sneakers, jackets..."
                value={heroSearch}
                onChange={(e) => setHeroSearch(e.target.value)}
                className="w-full pl-12 pr-32 py-4 rounded-2xl text-[var(--color-text)] bg-white shadow-xl text-base focus:ring-4 focus:ring-[var(--color-primary)]/20 outline-none"
              />
              <button type="submit" className="btn-primary absolute right-2 top-1/2 -translate-y-1/2 rounded-xl px-6">
                Search
              </button>
            </form>

            {/* Quick stats */}
            <div className="flex items-center justify-center gap-8 mt-10 text-white/60 text-sm">
              <div><span className="text-white font-bold text-lg">100%</span><br />Secure Payments</div>
              <div className="w-px h-10 bg-white/20" />
              <div><span className="text-white font-bold text-lg">Verified</span><br />Active Sellers</div>
              <div className="w-px h-10 bg-white/20 hidden sm:block" />
              <div className="hidden sm:block"><span className="text-white font-bold text-lg">77</span><br />Districts Covered</div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ Categories Grid ═══ */}
      <section className="max-w-7xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-accent)]">Shop by Category</h2>
          <Link to="/categories" className="text-sm font-medium text-[var(--color-primary)] hover:underline flex items-center gap-1">
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-3">
          {CATEGORIES.map((cat) => (
            <CategoryTile key={cat.id} category={cat} />
          ))}
        </div>
      </section>

      {/* ═══ Shop Clothing — Featured Section ═══ */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        <div className="rounded-2xl overflow-hidden relative" style={{ background: 'linear-gradient(135deg, #2d3436 0%, #636e72 100%)' }}>
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl translate-x-1/3 -translate-y-1/3" />
          </div>
          <div className="relative p-6 sm:p-10">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">👕</span>
              <h2 className="text-xl sm:text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-heading)' }}>Shop Clothing</h2>
            </div>
            <p className="text-white/60 text-sm mb-6 max-w-lg">Browse pre-loved fashion by category — from branded t-shirts and sneakers to traditional Nepali wear.</p>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.find(c => c.id === 'clothes')?.subCategories.slice(0, 10).map((sub) => (
                <Link
                  key={sub.id}
                  to={`/category/clothes?sub=${sub.id}`}
                  className="bg-white/10 hover:bg-white/20 backdrop-blur text-white text-xs sm:text-sm font-medium px-4 py-2 rounded-xl transition-all hover:-translate-y-0.5"
                >
                  {sub.name}
                </Link>
              ))}
              <Link
                to="/category/clothes"
                className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white text-xs sm:text-sm font-semibold px-5 py-2 rounded-xl transition-all hover:-translate-y-0.5 flex items-center gap-1"
              >
                View All <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ Recently Added ═══ */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-[var(--color-primary)]" />
            <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-accent)]">Recently Added</h2>
          </div>
          <Link to="/category/all?sort=newest" className="text-sm font-medium text-[var(--color-primary)] hover:underline flex items-center gap-1">
            See More <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Horizontal Scroll on mobile, Grid on desktop */}
        <div className="flex gap-4 overflow-x-auto hide-scrollbar snap-x snap-mandatory pb-4 md:grid md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 md:overflow-visible">
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="min-w-[200px] snap-start md:min-w-0">
                  <ProductCardSkeleton />
                </div>
              ))
            : featured?.recentlyAdded?.map((product) => (
                <div key={product.id} className="min-w-[200px] snap-start md:min-w-0">
                  <ProductCard product={product} />
                </div>
              ))
          }
          {!isLoading && (!featured?.recentlyAdded || featured.recentlyAdded.length === 0) && (
            <div className="col-span-full text-center py-12">
              <p className="text-4xl mb-3">📦</p>
              <p className="text-[var(--color-text-muted)]">No products yet. Be the first to list!</p>
              <Link to="/seller/post" className="btn-primary mt-4 inline-flex">Start Selling</Link>
            </div>
          )}
        </div>
      </section>

      {/* ═══ Popular Items ═══ */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[var(--color-primary)]" />
            <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-accent)]">Popular Items</h2>
          </div>
          <Link to="/category/all?sort=popular" className="text-sm font-medium text-[var(--color-primary)] hover:underline flex items-center gap-1">
            See More <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => <ProductCardSkeleton key={i} />)
            : featured?.popular?.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))
          }
        </div>
      </section>

      {/* ═══ CTA Banner ═══ */}
      <section className="max-w-7xl mx-auto px-4 py-10">
        <div className="rounded-2xl p-8 sm:p-12 text-center text-white relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #E84118, #c23616)' }}>
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl translate-x-1/3 -translate-y-1/3" />
          </div>
          <div className="relative">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3" style={{ fontFamily: 'var(--font-heading)' }}>
              Closet full of clothes you don't wear?
            </h2>
            <p className="text-white/80 mb-6 max-w-md mx-auto">
              Turn your old wardrobe into cash. List your pre-loved fashion and reach thousands of buyers across Nepal.
            </p>
            <Link to="/seller/post" className="inline-flex items-center gap-2 bg-white text-[var(--color-primary)] font-semibold px-8 py-3 rounded-xl hover:bg-white/90 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5">
              Sell Your Clothes <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Bottom padding for mobile nav */}
      <div className="h-20 md:h-0" />
    </div>
  );
}
