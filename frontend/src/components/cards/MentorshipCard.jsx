import { useNavigate } from 'react-router-dom';
import { API_BASE } from '../../services/api';
import { FiClock, FiUsers, FiCheckCircle } from 'react-icons/fi';
import { formatCurrency } from '../../utils/formatCurrency';
import { useTranslation } from 'react-i18next';
import Badge from '../ui/Badge';
import { API_BASE } from '../../services/api';
import './MentorshipCard.css';

export default function MentorshipCard({ mentorship }) {
  const navigate = useNavigate();
  const { t } = useTranslation(['mentorship', 'common']);
  const {
    id,
    artisanName,
    artisanBio,
    artisanVerified,
    artisanProfileImage,
    category,
    sessionPrice,
    duration,
    description,
    status,
    applicationCount,
  } = mentorship;

  const avatarSrc = artisanProfileImage
    ? artisanProfileImage.startsWith('/')
      ? `${API_BASE}${artisanProfileImage}`
      : artisanProfileImage
    : null;

  return (
    <div
      className="mentorship-card"
      id={`mentorship-card-${id}`}
      onClick={() => navigate(`/mentorships/${id}`)}
    >
      {status && status !== 'Active' && (
        <div className="mentorship-card-status">
          <Badge status={status}>{t('common:status.' + status.charAt(0).toLowerCase() + status.slice(1), status)}</Badge>
        </div>
      )}

      <div className="mentorship-card-header">
        <div className="mentorship-card-avatar">
          {avatarSrc ? (
            <img src={avatarSrc} alt={artisanName || 'Mentor'} />
          ) : (
            artisanName?.charAt(0) || 'M'
          )}
          {artisanVerified && (
            <div className="mentorship-card-verified">
              <FiCheckCircle size={10} />
            </div>
          )}
        </div>
        <div className="mentorship-card-artisan">
          <p className="mentorship-card-artisan-name">{artisanName || 'Artisan Mentor'}</p>
          {artisanBio && <p className="mentorship-card-artisan-bio">{artisanBio}</p>}
        </div>
      </div>

      <div className="mentorship-card-body">
        {category && (
          <div className="mentorship-card-category">
            {t('common:categories.' + category, category)}
          </div>
        )}
        {description && (
          <p className="mentorship-card-desc">{description}</p>
        )}
      </div>

      <div className="mentorship-card-footer">
        <div className="mentorship-card-meta">
          <div className="mentorship-card-meta-item">
            <FiClock size={14} />
            <span>{duration} {t('common:nav.adminPanel') === 'Admin Panel' ? 'min' : 'دقيقة'}</span>
          </div>
          <div className="mentorship-card-meta-item">
            <FiUsers size={14} />
            <span>{t('mentorship:oneOnOne')}</span>
          </div>
        </div>
        <div className="mentorship-card-price">
          {formatCurrency(sessionPrice)}
          <span style={{ fontSize: 11, color: 'var(--text-secondary)', marginLeft: 4 }}>
            {t('mentorship:perSession') ? ` / ${t('mentorship:perSession')}` : ' / session'}
          </span>
        </div>
      </div>
    </div>
  );
}

