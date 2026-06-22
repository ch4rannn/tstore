import { Link } from 'react-router-dom';

export default function CategoryTile({ category }) {
  return (
    <Link
      to={`/category/${category.id}`}
      className="card-flat group flex flex-col items-center justify-center gap-3 p-5 sm:p-6 text-center hover:border-[var(--color-primary)]/30 cursor-pointer"
      id={`category-${category.id}`}
    >
      <div className="text-3xl sm:text-4xl transition-transform duration-300 group-hover:scale-110 group-hover:-translate-y-1">
        {category.icon}
      </div>
      <span className="text-xs sm:text-sm font-semibold text-[var(--color-accent)] group-hover:text-[var(--color-primary)] transition-colors">
        {category.name}
      </span>
    </Link>
  );
}
