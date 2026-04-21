import { Link } from "react-router-dom";
import { formatCurrency } from "../../utils/formatCurrency";
import { FiShoppingCart, FiUser } from "react-icons/fi";
import "./ProductCard.css";

export default function ProductCard({ product, onAddToCart }) {
  return (
    <div className="product-card" id={`product-card-${product.id}`}>
      <Link
        to={`/marketplace/${product.id}`}
        className="product-card-image-link"
      >
        <div className="product-card-image">
          {product.image ? (
            <img src={product.image} alt={product.item} onError={(e) => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1581428982868-e410dd047a90?w=800&q=80'; }} />
          ) : (
            <div className="product-card-placeholder">
              <FiShoppingCart />
            </div>
          )}
          {product.category && (
            <span className="product-card-category">{product.category}</span>
          )}
        </div>
      </Link>
      <div className="product-card-body">
        <Link to={`/marketplace/${product.id}`} className="product-card-title">
          {product.item}
        </Link>
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
  );
}
