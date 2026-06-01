import { useNavigate } from 'react-router-dom';
import { API_BASE } from '../../services/api';
import { FiClock, FiUsers, FiCalendar } from 'react-icons/fi';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import { useTranslation } from 'react-i18next';
import Badge from '../ui/Badge';
import { API_BASE } from '../../services/api';
import './WorkshopCard.css';

export default function WorkshopCard({ workshop }) {
  const navigate = useNavigate();
  const { t } = useTranslation(['workshop', 'common']);
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
      ? `${API_BASE}${artisanProfileImage}`
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

      {status && (
        <div className="workshop-card-status">
          <Badge status={status}>{t('common:status.' + status.charAt(0).toLowerCase() + status.slice(1), status)}</Badge>
        </div>
      )}

      <div className="workshop-card-body">
        {category && (
          <div className="workshop-card-category">{t('common:categories.' + category, category)}</div>
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
            {t('common:nav.adminPanel') === 'Admin Panel' ? 'Hosted by' : 'بإشراف'} <strong>{artisanName || 'Artisan'}</strong>
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
              <span>{duration} {t('common:nav.adminPanel') === 'Admin Panel' ? 'min' : 'دقيقة'}</span>
            </div>
          )}
          <div className="workshop-card-meta-item">
            <FiUsers size={14} />
            <span>{t('workshop:spotsLeft', { count: spotsLeft })}</span>
          </div>
        </div>
        <div className={`workshop-card-price ${isFree ? 'free' : ''}`}>
          {isFree ? (t('common:nav.adminPanel') === 'Admin Panel' ? 'Free' : 'مجاني') : formatCurrency(price)}
        </div>
      </div>
    </div>
  );
}

