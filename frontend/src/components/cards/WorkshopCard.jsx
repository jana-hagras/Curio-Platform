import { useNavigate } from 'react-router-dom';
import { FiClock, FiUsers, FiCalendar } from 'react-icons/fi';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import Badge from '../ui/Badge';
import './WorkshopCard.css';

export default function WorkshopCard({ workshop }) {
  const navigate = useNavigate();
  const {
    id,
    artisanName,
    artisanProfileImage,
    title,
    description,
    workshopDate,
    duration,
    price,
    category,
    maxParticipants,
    registrationCount,
    status,
  } = workshop;

  const avatarSrc = artisanProfileImage
    ? artisanProfileImage.startsWith('/')
      ? `http://localhost:3000${artisanProfileImage}`
      : artisanProfileImage
    : null;

  const spotsLeft = (maxParticipants || 20) - (registrationCount || 0);
  const capacityPct = Math.min(100, ((registrationCount || 0) / (maxParticipants || 20)) * 100);
  const isFree = !price || Number(price) === 0;

  return (
    <div
      className="workshop-card"
      id={`workshop-card-${id}`}
      onClick={() => navigate(`/workshops/${id}`)}
    >
      <div className="workshop-card-banner" />

      {status && status !== 'Upcoming' && (
        <div className="workshop-card-status">
          <Badge status={status}>{status}</Badge>
        </div>
      )}

      <div className="workshop-card-body">
        {category && (
          <div className="workshop-card-category">{category}</div>
        )}

        <h3 className="workshop-card-title">{title}</h3>

        {workshopDate && (
          <div className="workshop-card-date">
            <FiCalendar size={14} />
            {formatDate(workshopDate)}
          </div>
        )}

        {description && (
          <p className="workshop-card-desc">{description}</p>
        )}

        <div className="workshop-card-host">
          <div className="workshop-card-host-avatar">
            {avatarSrc ? (
              <img src={avatarSrc} alt={artisanName} />
            ) : (
              artisanName?.charAt(0) || 'A'
            )}
          </div>
          <div className="workshop-card-host-name">
            Hosted by <strong>{artisanName || 'Artisan'}</strong>
          </div>
        </div>

        <div className="workshop-card-capacity">
          <div
            className="workshop-card-capacity-fill"
            style={{ width: `${capacityPct}%` }}
          />
        </div>
      </div>

      <div className="workshop-card-footer">
        <div className="workshop-card-meta">
          {duration && (
            <div className="workshop-card-meta-item">
              <FiClock size={14} />
              <span>{duration} min</span>
            </div>
          )}
          <div className="workshop-card-meta-item">
            <FiUsers size={14} />
            <span>{spotsLeft} spots left</span>
          </div>
        </div>
        <div className={`workshop-card-price ${isFree ? 'free' : ''}`}>
          {isFree ? 'Free' : formatCurrency(price)}
        </div>
      </div>
    </div>
  );
}
