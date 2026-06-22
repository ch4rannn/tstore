import { Link } from 'react-router-dom';
import { CATEGORIES } from '../../constants';

export default function CategoriesPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-fadeIn">
      <h1 className="text-2xl font-bold text-[var(--color-accent)] mb-6" style={{ fontFamily: 'var(--font-heading)' }}>
        All Categories
      </h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {CATEGORIES.map((cat) => (
          <Link
            key={cat.id}
            to={`/category/${cat.id}`}
            className="card-flat p-6 flex flex-col items-center gap-3 text-center group hover:border-[var(--color-primary)]/30"
          >
            <span className="text-4xl transition-transform duration-300 group-hover:scale-110">{cat.icon}</span>
            <h3 className="font-semibold text-[var(--color-accent)] group-hover:text-[var(--color-primary)] transition-colors">{cat.name}</h3>
            {cat.subCategories.length > 0 && (
              <div className="flex flex-wrap gap-1 justify-center">
                {cat.subCategories.map((sub) => (
                  <span key={sub.id} className="text-[10px] bg-[var(--color-bg)] text-[var(--color-text-muted)] px-2 py-0.5 rounded-full">{sub.name}</span>
                ))}
              </div>
            )}
          </Link>
        ))}
      </div>
      <div className="h-20 md:h-0" />
    </div>
  );
}
