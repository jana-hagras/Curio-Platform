import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { marketItemService } from '../../services/marketItemService';
import { userService } from '../../services/userService';
import ProductCard from '../../components/cards/ProductCard';
import ArtisanCard from '../../components/cards/ArtisanCard';
import { useAuth } from '../../hooks/useAuth';
import { useCart } from '../../hooks/useCart';
import Button from '../../components/ui/Button';
import { FiArrowRight, FiShield, FiGlobe, FiHeart, FiStar } from 'react-icons/fi';
import toast from 'react-hot-toast';
import curioVideo from '../../assets/curio.mp4';
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
    toast.success(`Added to cart!`);
  };

  return (
    <div>
      {/* Hero */}
      <section className="hero" id="hero-section">
        <video autoPlay loop muted playsInline className="hero-video-bg">
          <source src={curioVideo} type="video/mp4" />
        </video>
        <div className="hero-overlay"></div>
        <div className="container hero-content" style={{ animation: 'fadeInUp 0.6s ease forwards' }}>
          <span className="hero-badge">✦ Authentic Egyptian Craftsmanship</span>
          <h1>
            Discover the Art of<br />
            <span>Ancient Egypt</span>
          </h1>
          <p className="hero-desc">
            Connect with master artisans and bring home unique, handcrafted treasures
            that carry centuries of tradition and cultural heritage.
          </p>
          <div className="hero-actions">
            <Link to="/marketplace">
              <Button size="lg">Explore Marketplace <FiArrowRight /></Button>
            </Link>
            <Link to="/artisans">
              <Button variant="outline" size="lg" style={{ borderColor: 'rgba(255,255,255,0.3)', color: '#fff' }}>Meet Artisans</Button>
            </Link>
          </div>
          <div className="hero-stats">
            <div className="hero-stat">
              <div className="hero-stat-value">500+</div>
              <div className="hero-stat-label">Artisans</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-value">2K+</div>
              <div className="hero-stat-label">Products</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-value">10K+</div>
              <div className="hero-stat-label">Happy Buyers</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="section">
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
              <div key={i} className="feature-card">
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
        <section className="section" style={{ background: 'var(--surface-secondary)' }}>
          <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
              <div>
                <h2 className="section-title" style={{ textAlign: 'left' }}>Featured Products</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: 16, marginTop: 8 }}>Handpicked artisan creations</p>
              </div>
              <Link to="/marketplace" style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, fontSize: 15 }}>
                View All <FiArrowRight />
              </Link>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 24 }}>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
              <div>
                <h2 className="section-title" style={{ textAlign: 'left' }}>Meet Our Artisans</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: 16, marginTop: 8 }}>Talented craftspeople keeping traditions alive</p>
              </div>
              <Link to="/artisans" style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, fontSize: 15 }}>
                View All <FiArrowRight />
              </Link>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 24 }}>
              {artisans.map(a => <ArtisanCard key={a.id} artisan={a} />)}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="cta-section">
        <div className="container cta-content">
          <h2>Ready to Discover Authentic Egyptian Art?</h2>
          <p>Join thousands of buyers and artisans on CURIO</p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
            <Link to="/register"><Button size="lg">Get Started <FiArrowRight /></Button></Link>
            <Link to="/marketplace"><Button variant="outline" size="lg" style={{ borderColor: 'rgba(255,255,255,0.3)', color: '#fff' }}>Browse Products</Button></Link>
          </div>
        </div>
      </section>
    </div>
  );
}
