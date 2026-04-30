import { Link } from "react-router-dom";
import { formatCurrency } from "../../utils/formatCurrency";
import { FiShoppingCart, FiUser, FiHeart } from "react-icons/fi";
import { useFavorites } from "../../hooks/useFavorites";
import { useAuth } from "../../hooks/useAuth";
import toast from "react-hot-toast";
import "./ProductCard.css";

export default function ProductCard({ product, onAddToCart }) {
  const { isAuthenticated } = useAuth();
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
      toast.success("Removed from favorites");
    } else {
      addFavorite(product);
      toast.success("Added to favorites");
    }
  };

  return (
    <Link to={`/marketplace/${product.id}`} className="product-card" id={`product-card-${product.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
        <div className="product-card-image">
          {product.image ? (
            <img
              src={product.image}
              alt={product.item || product.itemName}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "https://images.unsplash.com/photo-1581428982868-e410dd047a90?w=800&q=80";
              }}
            />
          ) : (
            <div className="product-card-placeholder">
              <FiShoppingCart />
            </div>
          )}
          {product.category && (
            <span className="product-card-category">{product.category}</span>
          )}
          {isAuthenticated && (
            <button
              className={`product-card-fav-btn ${fav ? "product-card-fav-active" : ""}`}
              onClick={toggleFav}
              title={fav ? "Remove from favorites" : "Add to favorites"}
            >
              <FiHeart />
            </button>
          )}
        </div>
        <div className="product-card-body">
          {product.item || product.itemName}
          {product.artisanName && (
            <div className="product-card-artisan">
              <FiUser size={14} />
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
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {onAddToCart && product.availQuantity > 0 && (
                <button
                  className="product-card-cart-btn"
                  onClick={() => onAddToCart(product)}
                >
                  <FiShoppingCart size={16} />
                </button>
              )}
              {product.availQuantity === 0 && (
                <span className="product-card-sold">Sold Out</span>
              )}
            </div>
          </div>
        </div>
    </Link>
  );
}
