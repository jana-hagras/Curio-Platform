import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { marketItemService } from "../../services/marketItemService";
import { userService } from "../../services/userService";
import ProductCard from "../../components/cards/ProductCard";
import ArtisanCard from "../../components/cards/ArtisanCard";
import { useAuth } from "../../hooks/useAuth";
import { useCart } from "../../hooks/useCart";
import Button from "../../components/ui/Button";
import {
  ShimmerSimpleGallery,
  ShimmerCategoryItem,
} from "react-shimmer-effects";
import {
  FiArrowRight,
  FiShield,
  FiGlobe,
  FiHeart,
  FiStar,
} from "react-icons/fi";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import curioVideo from "../../assets/curio.mp4";
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
          .slice(0, 4);
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
    <div className="home-page-container">
      {/* Hero */}
      <section className="hero" id="hero-section">
        <video autoPlay loop muted playsInline className="hero-video-bg">
          <source src={curioVideo} type="video/mp4" />
        </video>
        <div className="hero-overlay"></div>
        <div className="container hero-content">
          <span className="hero-badge">{t('hero.badge')}</span>
          <h1>
            {t('hero.title1')}
            <br />
            <span>{t('hero.title2')}</span>
          </h1>
          <p className="hero-desc">
            {t('hero.desc')}
          </p>
          <div className="hero-actions">
            <Link to="/marketplace">
              <Button size="lg">
                {t('hero.explore')} <FiArrowRight className="rtl-flip" />
              </Button>
            </Link>
            <Link to="/artisans">
              <Button
                variant="outline"
                size="lg"
                className="hero-outline-btn"
              >
                {t('hero.meetArtisans')}
              </Button>
            </Link>
          </div>
          <div className="hero-stats">
            <div className="hero-stat">
              <div className="hero-stat-value">500+</div>
              <div className="hero-stat-label">{t('stats.artisans')}</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-value">2K+</div>
              <div className="hero-stat-label">{t('stats.products')}</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-value">10K+</div>
              <div className="hero-stat-label">{t('stats.happyBuyers')}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="section features-section">
        <div className="container">
          <h2 className="section-title">
            {t('features.title').split(' ')[0]} <span className="gold-text">{t('features.title').split(' ').slice(1).join(' ') || 'CURIO'}</span>
          </h2>
          <p className="section-subtitle">
            {t('features.subtitle')}
          </p>
          <div className="features-grid">
            {[
              {
                icon: FiShield,
                title: t('features.verified'),
                desc: t('features.verifiedDesc'),
              },
              {
                icon: FiGlobe,
                title: t('features.shipping'),
                desc: t('features.shippingDesc'),
              },
              {
                icon: FiHeart,
                title: t('features.custom'),
                desc: t('features.customDesc'),
              },
              {
                icon: FiStar,
                title: t('features.secure'),
                desc: t('features.secureDesc'),
              },
            ].map((f, i) => (
              <div key={i} className="feature-card">
                <div className="feature-icon">
                  <f.icon />
                </div>
                <h3 className="feature-title">{f.title}</h3>
                <p className="feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      {(loading || products.length > 0) && (
        <section className="section featured-products-section">
          <div className="container">
            <div className="home-section-header">
              <div>
                <h2 className="section-title left-aligned">
                  {t('featured.products')}
                </h2>
                <p className="section-subtitle-small">
                  {t('featured.productsSubtitle')}
                </p>
              </div>
              <Link to="/marketplace" className="home-view-all-link">
                {t('common:actions.viewAll')} <FiArrowRight className="rtl-flip" />
              </Link>
            </div>
            {loading ? (
              <div className="home-shimmer-wrapper">
                <ShimmerSimpleGallery card imageHeight={200} caption />
              </div>
            ) : (
              <div className="home-products-grid">
                {products.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    onAddToCart={isBuyer ? handleAddToCart : null}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Featured Artisans */}
      {(loading || artisans.length > 0) && (
        <section className="section featured-artisans-section">
          <div className="container">
            <div className="home-section-header">
              <div>
                <h2 className="section-title left-aligned">
                  {t('featured.artisans')}
                </h2>
                <p className="section-subtitle-small">
                  {t('featured.artisansSubtitle')}
                </p>
              </div>
              <Link to="/artisans" className="home-view-all-link">
                {t('common:actions.viewAll')} <FiArrowRight className="rtl-flip" />
              </Link>
            </div>
            {loading ? (
              <div className="home-artisans-grid">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="home-shimmer-card">
                    <ShimmerCategoryItem
                      hasImage
                      imageType="circular"
                      imageHeight={48}
                      imageWidth={48}
                      title
                      titleLine={2}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="home-artisans-grid">
                {artisans.map((a) => (
                  <ArtisanCard key={a.id} artisan={a} />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="cta-section">
        <div className="container cta-content">
          <h2>{t('cta.title')}</h2>
          <p>{t('cta.subtitle')}</p>
          <div className="home-cta-actions">
            <Link to="/register">
              <Button size="lg">
                {t('cta.getStarted')} <FiArrowRight className="rtl-flip" />
              </Button>
            </Link>
            <Link to="/marketplace">
              <Button
                variant="outline"
                size="lg"
                className="cta-outline-btn"
              >
                {t('cta.browse')}
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
