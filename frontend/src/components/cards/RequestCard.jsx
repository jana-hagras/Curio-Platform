import { Link } from 'react-router-dom';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import Badge from '../ui/Badge';
import Image from '../ui/Image';
import { useTranslation } from 'react-i18next';
import { FiCalendar, FiDollarSign, FiImage, FiCpu } from 'react-icons/fi';
import './RequestCard.css';

export default function RequestCard({ request }) {
  const { t } = useTranslation(['common']);
  // Preferred AI image first, then first completed AI image
  const thumbnailUrl = request.preferredImage
    || (request.aiImages && request.aiImages.length > 0 ? request.aiImages[0] : null);

  const getFullImageUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
      return path;
    }
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:7000';
    return `${apiBase}${path}`;
  };

  const resolvedThumbnailUrl = thumbnailUrl ? getFullImageUrl(thumbnailUrl) : null;

  const aiStatus = request.aiStatus || 'None';

  const aiBadgeClass =
    aiStatus === 'Completed' ? 'ai-completed' :
    aiStatus === 'Processing' ? 'ai-processing' :
    aiStatus === 'Failed' ? 'ai-failed' : '';

  return (
    <Link to={`/requests/${request.id}`} className="request-card" id={`request-card-${request.id}`}>
      {/* ── Thumbnail ── */}
      <div className="request-card-thumbnail">
        {resolvedThumbnailUrl ? (
          <Image
            src={resolvedThumbnailUrl}
            alt={request.title}
            fallback=""
          />
        ) : (
          <div className="request-card-thumbnail-fallback">
            <FiImage className="request-card-thumbnail-fallback-icon" />
            <span className="request-card-thumbnail-fallback-text">
              {aiStatus === 'Processing' ? (t('common:nav.adminPanel') === 'Admin Panel' ? 'Generating preview…' : 'جاري توليد المعاينة...') : (t('common:nav.adminPanel') === 'Admin Panel' ? 'Custom Request' : 'طلب مخصص')}
            </span>
          </div>
        )}

        {/* Category pill */}
        {request.category && (
          <span className="request-card-category">{t('common:categories.' + request.category, request.category)}</span>
        )}

        {/* AI status overlay */}
        {aiStatus !== 'None' && aiBadgeClass && (
          <span className={`request-card-ai-badge ${aiBadgeClass}`}>
            <FiCpu size={11} />
            {aiStatus === 'Processing' ? (t('common:nav.adminPanel') === 'Admin Panel' ? 'AI Generating' : 'توليد ذكاء اصطناعي') : `AI ${aiStatus}`}
          </span>
        )}
      </div>

      {/* ── Body ── */}
      <div className="request-card-body">
        <div className="request-card-header">
          <h3 className="request-card-title">{request.title}</h3>
          {request.status && (
            <Badge status={request.status === 'Open' ? 'Active' : request.status}>
              {request.status === 'Open' ? (t('common:nav.adminPanel') === 'Admin Panel' ? 'Open' : 'مفتوح') : request.status}
            </Badge>
          )}
        </div>

        <p className="request-card-desc">
          {request.description?.slice(0, 120)}{request.description?.length > 120 ? '…' : ''}
        </p>

        <div className="request-card-meta">
          <div className="request-card-meta-item">
            <FiDollarSign />
            <span>{formatCurrency(request.budget)}</span>
          </div>
          <div className="request-card-meta-item">
            <FiCalendar />
            <span>{formatDate(request.requestDate)}</span>
          </div>
        </div>

        {request.buyerName && (
          <div className="request-card-buyer">{t('common:nav.adminPanel') === 'Admin Panel' ? 'By' : 'بواسطة'} {request.buyerName}</div>
        )}
      </div>
    </Link>
  );
}

