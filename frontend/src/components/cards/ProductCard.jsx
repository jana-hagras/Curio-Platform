import { Link } from "react-router-dom";
import { formatCurrency } from "../../utils/formatCurrency";
import { FiShoppingCart, FiUser, FiHeart } from "react-icons/fi";
import { useFavorites } from "../../hooks/useFavorites";
import { useAuth } from "../../hooks/useAuth";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import Image from "../ui/Image";
import "./ProductCard.css";

export default function ProductCard({ product, onAddToCart }) {
  const { isAuthenticated } = useAuth();
  const { t } = useTranslation(['common']);
  let favorites = {
    isFavorite: () => false,
    addFavorite: () => { },
    removeFavorite: () => { },
  };
  try {
    favorites = useFavorites();
  } catch { }
  const { isFavorite, addFavorite, removeFavorite } = favorites;
  const fav = isFavorite(product.id);

  const toggleFav = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (fav) {
      removeFavorite(product.id);
      toast.success(t('common:nav.adminPanel') === 'Admin Panel' ? "Removed from favorites" : "تمت الإزالة من المفضلة");
    } else {
      addFavorite(product);
      toast.success(t('common:nav.adminPanel') === 'Admin Panel' ? "Added to favorites" : "تمت الإضافة إلى المفضلة");
    }
  };

  return (
    <Link to={`/marketplace/${product.id}`} className="product-card" id={`product-card-${product.id}`}>
      <div className="product-card-image">
        <Image 
          src={product.image}
          alt={product.item || product.itemName}
          fallback="https://images.unsplash.com/photo-1581428982868-e410dd047a90?w=800&q=80"
        />
        {product.category && (
          <span className="product-card-category">{t('common:categories.' + product.category, product.category)}</span>
        )}
        {isAuthenticated && (
          <button
            className={`product-card-fav-btn ${fav ? "product-card-fav-active" : ""}`}
            onClick={toggleFav}
            title={fav ? (t('common:nav.adminPanel') === 'Admin Panel' ? "Remove from favorites" : "إزالة من المفضلة") : (t('common:nav.adminPanel') === 'Admin Panel' ? "Add to favorites" : "إضافة إلى المفضلة")}
          >
            <FiHeart />
          </button>
        )}
      </div>
      <div className="product-card-body">
        <h3 className="product-card-title">{product.item || product.itemName}</h3>
        {product.artisanName && (
          <div className="product-card-artisan">
            <FiUser size={12} />
            <span>{product.artisanName}</span>
          </div>
        )}
        <p className="product-card-desc">
          {product.description?.slice(0, 80)}
          {product.description?.length > 80 ? "..." : ""}
        </p>
        <div className="product-card-footer">
          <span className="product-card-price">
            {formatCurrency(product.price)}
          </span>
          <div className="product-card-actions">
            {onAddToCart && product.availQuantity > 0 && (
              <button
                className="product-card-cart-btn"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onAddToCart(product);
                }}
              >
                <FiShoppingCart size={14} />
              </button>
            )}
            {product.availQuantity === 0 && (
              <span className="product-card-sold">{t('common:nav.adminPanel') === 'Admin Panel' ? 'Sold Out' : 'نفذت الكمية'}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

