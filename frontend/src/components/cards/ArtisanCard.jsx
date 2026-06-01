import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { API_BASE } from '../../services/api';
import './ArtisanCard.css';

export default function ArtisanCard({ artisan }) {
  const { t } = useTranslation(['common']);
  return (
    <Link to={`/artisans/${artisan.id}`} className="artisan-card" id={`artisan-card-${artisan.id}`}>
      <div className="artisan-card-avatar-wrapper">
        <div className="artisan-card-avatar">
          {artisan.profileImage ? (
            <img src={artisan.profileImage.startsWith('/') ? `${API_BASE}${artisan.profileImage}` : artisan.profileImage} alt={artisan.firstName} />
          ) : (
            <span>{artisan.firstName?.charAt(0)}{artisan.lastName?.charAt(0)}</span>
          )}
        </div>
        <div className="artisan-card-status-indicator" title={t('common:nav.adminPanel') === 'Admin Panel' ? 'Active' : 'نشط'}></div>
      </div>
      <h3 className="artisan-card-name">{artisan.firstName} {artisan.lastName}</h3>
      <p className="artisan-card-bio">{artisan.bio?.slice(0, 100) || (t('common:nav.adminPanel') === 'Admin Panel' ? 'Egyptian Artisan' : 'حرفي مصري')}{artisan.bio?.length > 100 ? '...' : ''}</p>
      <span className="artisan-card-view">{t('common:nav.adminPanel') === 'Admin Panel' ? 'View Profile →' : 'عرض الملف الشخصي ←'}</span>
    </Link>
  );
}

