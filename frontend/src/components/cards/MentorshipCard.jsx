import { useNavigate } from 'react-router-dom';
import { FiClock, FiUsers, FiCheckCircle } from 'react-icons/fi';
import { formatCurrency } from '../../utils/formatCurrency';
import Badge from '../ui/Badge';
import './MentorshipCard.css';

export default function MentorshipCard({ mentorship }) {
  const navigate = useNavigate();
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
    maxStudents,
  } = mentorship;

  const avatarSrc = artisanProfileImage
    ? artisanProfileImage.startsWith('/')
      ? `http://localhost:3000${artisanProfileImage}`
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
          <Badge status={status}>{status}</Badge>
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
            {category}
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
            <span>{duration} min</span>
          </div>
          <div className="mentorship-card-meta-item">
            <FiUsers size={14} />
            <span>{applicationCount || 0}/{maxStudents || 10}</span>
          </div>
        </div>
        <div className="mentorship-card-price">
          {formatCurrency(sessionPrice)}
          <span>/session</span>
        </div>
      </div>
    </div>
  );
}
