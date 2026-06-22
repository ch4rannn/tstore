import { Link } from 'react-router-dom';
import { CATEGORIES } from '../../constants';

export default function Footer() {
  return (
    <footer className="bg-[var(--color-accent)] text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-lg" style={{ background: 'linear-gradient(135deg, #E84118, #ff6348)' }}>
                T
              </div>
              <span className="text-xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>Thrief</span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              Nepal's premier marketplace for second-hand goods. Buy and sell used products safely and affordably.
            </p>
          </div>

          {/* Categories */}
          <div>
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider text-gray-300">Categories</h4>
            <ul className="space-y-2">
              {CATEGORIES.slice(0, 6).map((cat) => (
                <li key={cat.id}>
                  <Link to={`/category/${cat.id}`} className="text-sm text-gray-400 hover:text-white transition-colors">
                    {cat.icon} {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider text-gray-300">Quick Links</h4>
            <ul className="space-y-2">
              <li><Link to="/about" className="text-sm text-gray-400 hover:text-white transition-colors">About Us</Link></li>
              <li><Link to="/how-it-works" className="text-sm text-gray-400 hover:text-white transition-colors">How It Works</Link></li>
              <li><Link to="/safety" className="text-sm text-gray-400 hover:text-white transition-colors">Safety Tips</Link></li>
              <li><Link to="/contact" className="text-sm text-gray-400 hover:text-white transition-colors">Contact Us</Link></li>
              <li><Link to="/terms" className="text-sm text-gray-400 hover:text-white transition-colors">Terms & Conditions</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider text-gray-300">Contact</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>📍 Kathmandu, Nepal</li>
              <li>📧 support@thrief.com</li>
              <li>📞 +977-9800000000</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-gray-500">© {new Date().getFullYear()} Thrief. All rights reserved.</p>
          <div className="flex gap-4">
            <a href="#" className="text-gray-500 hover:text-white transition-colors text-sm">Privacy</a>
            <a href="#" className="text-gray-500 hover:text-white transition-colors text-sm">Terms</a>
            <a href="#" className="text-gray-500 hover:text-white transition-colors text-sm">Help</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
