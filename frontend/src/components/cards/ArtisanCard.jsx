import { Link } from 'react-router-dom';
import { FiCheckCircle } from 'react-icons/fi';
import './ArtisanCard.css';

export default function ArtisanCard({ artisan }) {
  return (
    <Link to={`/artisans/${artisan.id}`} className="artisan-card" id={`artisan-card-${artisan.id}`}>
      <div className="artisan-card-avatar">
        {artisan.profileImage ? (
          <img src={artisan.profileImage} alt={artisan.firstName} />
        ) : (
          <span>{artisan.firstName?.charAt(0)}{artisan.lastName?.charAt(0)}</span>
        )}
        {artisan.verified && <FiCheckCircle className="artisan-card-verified" />}
      </div>
      <h3 className="artisan-card-name">{artisan.firstName} {artisan.lastName}</h3>
      <p className="artisan-card-bio">{artisan.bio?.slice(0, 100) || 'Egyptian Artisan'}{artisan.bio?.length > 100 ? '...' : ''}</p>
      <span className="artisan-card-view">View Profile →</span>
    </Link>
  );
}
