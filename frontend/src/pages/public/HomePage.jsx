import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { marketItemService } from "../../services/marketItemService";
import { userService } from "../../services/userService";
import ProductCard from "../../components/cards/ProductCard";
import { API_BASE } from "../../services/api";
import { useAuth } from "../../hooks/useAuth";
import { useCart } from "../../hooks/useCart";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import curioVideo from "../../assets/curio.mp4";
import { ShimmerSimpleGallery, ShimmerCategoryItem } from "react-shimmer-effects";
import "./HomePage.css";

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [artisans, setArtisans] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isBuyer } = useAuth();
  const { addItem } = useCart();
  const { t } = useTranslation(['home', 'common']);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      marketItemService.getAll().catch(() => ({ data: { items: [] } })),
      userService.getAll().catch(() => ({ data: { users: [] } })),
    ])
      .then(([productRes, userRes]) => {
        setProducts((productRes.data?.items || []).slice(0, 4));
        const arts = (userRes.data?.users || [])
          .filter((u) => u.type === "Artisan")
          .slice(0, 3);
        setArtisans(arts);
      })
      .catch(() => {
        // fallback to empty lists
      })
      .finally(() => setLoading(false));
  }, []);

  const handleAddToCart = (product) => {
    addItem(product);
    toast.success(t('common:actions.addedToCart'));
  };

  return (
    <div className="luxury-homepage">
      {/* 1. HERO SECTION (Lando Norris & Oryzo AI cinematic video backdrop + high-tech HUD overlays) */}
      <section className="luxury-hero" id="hero-section">
        <video autoPlay loop muted playsInline className="hero-video-backdrop">
          <source src={curioVideo} type="video/mp4" />
        </video>
        <div className="hero-glass-overlay"></div>
        <div className="hero-neon-frame-glow"></div>
        
        {/* Oryzo-style ruler lines */}
        <div className="hero-ruler left-ruler">
          <span className="ruler-tick">10%</span>
          <span className="ruler-tick">20%</span>
          <span className="ruler-tick">30%</span>
          <span className="ruler-tick">40%</span>
          <span className="ruler-tick">50%</span>
          <span className="ruler-tick">60%</span>
        </div>
        <div className="hero-ruler right-ruler">
          <span className="ruler-tick">01</span>
          <span className="ruler-tick">02</span>
          <span className="ruler-tick">03</span>
          <span className="ruler-tick">04</span>
          <span className="ruler-tick">05</span>
          <span className="ruler-tick">06</span>
        </div>

        {/* Oryzo-style vertical badge */}
        <div className="hero-vertical-capsule">
          <div className="capsule-indicator-dot"></div>
          <span>CURIO — COLLECTIVE 2026</span>
        </div>

        {/* Massive back outline typography (Lando / Oryzo style) */}
        <div className="hero-huge-bg-text">CURIO</div>

        <div className="hero-main-container">
          <span className="hero-meta-badge">{t('hero.badge') || "AUTHENTIC EGYPTIAN CRAFTSMANSHIP"}</span>
          <h1 className="hero-luxury-title">{t('luxury.title')}</h1>
          <p className="hero-luxury-subtitle">
            {t('hero.desc') || "A global multi-vendor sanctuary of bespoke timepieces, fine jewelry, and artisanal craftsmanship."}
          </p>
          <div className="hero-luxury-actions">
            <Link to="/marketplace" className="luxury-btn-primary">
              {t('hero.explore') || "EXPLORE MARKETPLACE"}
            </Link>
            <Link to="/artisans" className="luxury-btn-secondary">
              {t('hero.meetArtisans') || "THE MAKERS"}
            </Link>
          </div>
        </div>

        {/* Oryzo Tech Specs HUD Panel */}
        <div className="hero-tech-hud">
          <div className="hud-header">{t('luxury.hudHeader')}</div>
          <div className="hud-divider"></div>
          <div className="hud-body">
            {t('luxury.hudBody')}
          </div>
        </div>

        <div className="hero-scroll-indicator">
          <div className="scroll-gold-line"></div>
        </div>
      </section>

      {/* 2. VENDOR HIGHLIGHT (Mily Group + Penelope Care 3-column asymmetric layout) */}
      {(loading || artisans.length > 0) && (
        <section className="vendor-highlight-section">
          <div className="luxury-container">
            <div className="editorial-header">
              <span className="section-meta-label">{t('luxury.artisansMeta')}</span>
              <h2 className="editorial-section-title">{t('luxury.artisansTitle')}</h2>
              <p className="editorial-section-subtitle">{t('featured.artisansSubtitle')}</p>
            </div>
            
            {loading ? (
              <div className="vendor-shimmer-grid">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="vendor-shimmer-card">
                    <ShimmerCategoryItem hasImage imageType="circular" imageHeight={64} imageWidth={64} title titleLine={2} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="vendor-staggered-grid">
                {artisans.map((artisan, index) => (
                  <div key={artisan.id} className={`vendor-editorial-card card-stagger-${index}`}>
                    <div className="vendor-card-glow"></div>
                    <div className="vendor-avatar-frame">
                      {artisan.profileImage ? (
                        <img 
                          src={artisan.profileImage.startsWith('/') ? `${API_BASE}${artisan.profileImage}` : artisan.profileImage} 
                          alt={artisan.firstName} 
                        />
                      ) : (
                        <div className="avatar-placeholder">
                          {artisan.firstName?.charAt(0)}{artisan.lastName?.charAt(0)}
                        </div>
                      )}
                    </div>
                    <h3 className="vendor-card-name">{artisan.firstName} {artisan.lastName}</h3>
                    <span className="vendor-card-meta">{artisan.businessName || t('luxury.masterArtisan')}</span>
                    <p className="vendor-card-bio">
                      {artisan.bio?.slice(0, 100) || t('luxury.defaultBio')}
                      {artisan.bio?.length > 100 ? "..." : ""}
                    </p>
                    <Link to={`/artisans/${artisan.id}`} className="vendor-explore-link">
                      {t('luxury.exploreCollection')} <span className="arrow-accent">→</span>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* 3. LIFESTYLE CURATION BANNER (Penelope Care story banner) */}
      <section className="lifestyle-curation-banner">
        <div className="banner-image-overlay"></div>
        <div className="banner-content">
          <blockquote className="lifestyle-quote">
            "{t('luxury.quote')}"
          </blockquote>
          <cite className="lifestyle-author">{t('luxury.author')}</cite>
        </div>
      </section>

      {/* 4. THE "ANTI-GRAVITY" MARKETPLACE SHOWCASE (Floema staggered gallery cards in void) */}
      {(loading || products.length > 0) && (
        <section className="anti-gravity-showcase-section">
          <div className="luxury-container">
            <div className="editorial-header text-center">
              <span className="section-meta-label">{t('luxury.masterpieceMeta')}</span>
              <h2 className="editorial-section-title">{t('luxury.masterpieceTitle')}</h2>
              <p className="editorial-section-subtitle">{t('featured.productsSubtitle')}</p>
            </div>
            
            {loading ? (
              <div className="showcase-shimmer">
                <ShimmerSimpleGallery card imageHeight={280} caption />
              </div>
            ) : (
              <div className="anti-gravity-staggered-gallery">
                {products.map((product) => (
                  <div key={product.id} className="anti-gravity-gallery-item">
                    <ProductCard 
                      product={product} 
                      onAddToCart={isBuyer ? handleAddToCart : null} 
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
