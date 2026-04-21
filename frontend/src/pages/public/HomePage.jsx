import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { marketItemService } from '../../services/marketItemService';
import { userService } from '../../services/userService';
import ProductCard from '../../components/cards/ProductCard';
import ArtisanCard from '../../components/cards/ArtisanCard';
import { useAuth } from '../../hooks/useAuth';
import { useCart } from '../../hooks/useCart';
import { FiArrowRight, FiShield, FiGlobe, FiHeart, FiStar } from 'react-icons/fi';
import toast from 'react-hot-toast';
import './HomePage.css';

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [artisans, setArtisans] = useState([]);
  const { isBuyer } = useAuth();
  const { addItem } = useCart();

  useEffect(() => {
    marketItemService.getAll().then(res => setProducts((res.data?.items || []).slice(0, 4))).catch(() => {});
    userService.getAll().then(res => {
      const arts = (res.data?.users || []).filter(u => u.type === 'Artisan').slice(0, 4);
      setArtisans(arts);
    }).catch(() => {});
  }, []);

  const handleAddToCart = (product) => {
    addItem(product);
    toast.success(`${product.item} added to cart!`);
  };

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero" id="hero-section">
        <div className="hero-overlay" />
        <div className="hero-pattern" />
        <div className="container hero-content">
          <div className="hero-text animate-fadeInUp">
            <span className="hero-badge">✦ Authentic Egyptian Craftsmanship</span>
            <h1 className="hero-title">
              Discover the Art of<br />
              <span className="gold-gradient-text">Ancient Egypt</span>
            </h1>
            <p className="hero-subtitle">
              Connect with master artisans and bring home unique, handcrafted treasures 
              that carry centuries of tradition and cultural heritage.
            </p>
            <div className="hero-btns">
              <Link to="/marketplace" className="hero-btn-primary">
                Explore Marketplace <FiArrowRight />
              </Link>
              <Link to="/artisans" className="hero-btn-secondary">
                Meet Artisans
              </Link>
            </div>
            <div className="hero-stats">
              <div className="hero-stat">
                <span className="hero-stat-number">500+</span>
                <span className="hero-stat-label">Artisans</span>
              </div>
              <div className="hero-stat-divider" />
              <div className="hero-stat">
                <span className="hero-stat-number">2K+</span>
                <span className="hero-stat-label">Products</span>
              </div>
              <div className="hero-stat-divider" />
              <div className="hero-stat">
                <span className="hero-stat-number">10K+</span>
                <span className="hero-stat-label">Happy Buyers</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="section features-section">
        <div className="container">
          <h2 className="section-title">Why Choose <span className="gold-text">CURIO</span></h2>
          <p className="section-subtitle">We bridge the gap between Egypt's finest artisans and global buyers</p>
          <div className="features-grid">
            {[
              { icon: FiShield, title: 'Verified Artisans', desc: 'Every artisan is vetted to ensure authentic, quality craftsmanship.' },
              { icon: FiGlobe, title: 'Global Shipping', desc: 'From Cairo to your doorstep — worldwide delivery of handmade treasures.' },
              { icon: FiHeart, title: 'Custom Orders', desc: 'Request bespoke pieces tailored exactly to your vision and needs.' },
              { icon: FiStar, title: 'Secure Payments', desc: 'Protected transactions with escrow milestones for custom projects.' },
            ].map((f, i) => (
              <div key={i} className="feature-card" style={{ animationDelay: `${i * 100}ms` }}>
                <div className="feature-icon"><f.icon /></div>
                <h3 className="feature-title">{f.title}</h3>
                <p className="feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      {products.length > 0 && (
        <section className="section" style={{ background: 'var(--cream)' }}>
          <div className="container">
            <div className="section-header-row">
              <div>
                <h2 className="section-title text-left">Featured Products</h2>
                <p className="section-subtitle text-left" style={{ marginLeft: 0 }}>Handpicked artisan creations</p>
              </div>
              <Link to="/marketplace" className="section-view-all">View All <FiArrowRight /></Link>
            </div>
            <div className="products-grid">
              {products.map(p => (
                <ProductCard key={p.id} product={p} onAddToCart={isBuyer ? handleAddToCart : null} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Artisans */}
      {artisans.length > 0 && (
        <section className="section">
          <div className="container">
            <div className="section-header-row">
              <div>
                <h2 className="section-title text-left">Meet Our Artisans</h2>
                <p className="section-subtitle text-left" style={{ marginLeft: 0 }}>Talented craftspeople keeping traditions alive</p>
              </div>
              <Link to="/artisans" className="section-view-all">View All <FiArrowRight /></Link>
            </div>
            <div className="artisans-grid">
              {artisans.map(a => <ArtisanCard key={a.id} artisan={a} />)}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-card">
            <h2 className="cta-title">Ready to Discover Authentic Egyptian Art?</h2>
            <p className="cta-desc">Join thousands of buyers and artisans on CURIO</p>
            <div className="hero-btns" style={{ justifyContent: 'center' }}>
              <Link to="/register" className="hero-btn-primary">Get Started <FiArrowRight /></Link>
              <Link to="/marketplace" className="hero-btn-secondary">Browse Products</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
