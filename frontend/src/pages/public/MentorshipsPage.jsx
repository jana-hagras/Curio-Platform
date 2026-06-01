import { useState, useEffect } from 'react';
import { FiSearch, FiBookOpen } from 'react-icons/fi';
import { mentorshipService } from '../../services/mentorshipService';
import { CATEGORIES } from '../../utils/constants';
import MentorshipCard from '../../components/cards/MentorshipCard';
import { useTranslation } from 'react-i18next';
import './MentorshipsPage.css';

export default function MentorshipsPage() {
  const [mentorships, setMentorships] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const { t } = useTranslation(['mentorship', 'common']);

  useEffect(() => {
    mentorshipService.getAll()
      .then(res => {
        const items = res.data?.mentorships || [];
        setMentorships(items);
        setFiltered(items);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let result = mentorships.filter(m => m.status === 'Active');

    if (search) {
      const s = search.toLowerCase();
      result = result.filter(m =>
        (m.artisanName || '').toLowerCase().includes(s) ||
        (m.description || '').toLowerCase().includes(s) ||
        (m.category || '').toLowerCase().includes(s)
      );
    }

    if (category) {
      result = result.filter(m => m.category === category);
    }

    setFiltered(result);
  }, [search, category, mentorships]);

  const activeMentorships = mentorships.filter(m => m.status === 'Active');
  const uniqueArtisans = new Set(activeMentorships.map(m => m.artisan_id)).size;

  return (
    <div className="mentorships-page">
      <div className="container">
        {/* Hero */}
        <div className="mentorships-hero">
          <h1>{t('mentorship:title').split(' ').slice(0, -1).join(' ') || 'Learn from Master'} <span className="gold-text">{t('mentorship:title').split(' ').slice(-1)[0] || 'Artisans'}</span></h1>
          <p>{t('mentorship:subtitle')}</p>
        </div>

        {/* Stats */}
        <div className="mentorships-stats">
          <div className="mentorships-stat">
            <div className="mentorships-stat-value">{activeMentorships.length}</div>
            <div className="mentorships-stat-label">{t('common:nav.adminPanel') === 'Admin Panel' ? 'Available Mentorships' : 'البرامج المتاحة'}</div>
          </div>
          <div className="mentorships-stat">
            <div className="mentorships-stat-value">{uniqueArtisans}</div>
            <div className="mentorships-stat-label">{t('common:nav.adminPanel') === 'Admin Panel' ? 'Expert Mentors' : 'المرشدون الخبراء'}</div>
          </div>
          <div className="mentorships-stat">
            <div className="mentorships-stat-value">{CATEGORIES.length}</div>
            <div className="mentorships-stat-label">{t('common:nav.adminPanel') === 'Admin Panel' ? 'Craft Categories' : 'فئات الحرف الفنية'}</div>
          </div>
        </div>

        {/* Filters */}
        <div className="mentorships-filters">
          <div className="mentorships-search">
            <FiSearch size={16} />
            <input
              type="text"
              placeholder={t('mentorship:search')}
              value={search}
              onChange={e => setSearch(e.target.value)}
              id="mentorships-search-input"
            />
          </div>
          <select
            className="mentorships-filter-select"
            value={category}
            onChange={e => setCategory(e.target.value)}
            id="mentorships-category-filter"
          >
            <option value="">{t('common:empty.noItems') === 'No items found' ? 'All Categories' : 'كل الفئات الفنية'}</option>
            {CATEGORIES.map(c => (
              <option key={c} value={c}>{t('common:categories.' + c, c)}</option>
            ))}
          </select>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="mentorships-skeleton-grid">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="mentorships-skeleton-card">
                <div className="mentorships-skeleton-header">
                  <div className="mentorships-skeleton-avatar" />
                  <div className="mentorships-skeleton-lines">
                    <div className="mentorships-skeleton-line" />
                    <div className="mentorships-skeleton-line" />
                  </div>
                </div>
                <div className="mentorships-skeleton-body" />
                <div className="mentorships-skeleton-footer" />
              </div>
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <div className="mentorships-grid">
            {filtered.map((m, i) => (
              <div key={m.id} style={{ animation: `fadeInUp 0.4s ease ${i * 0.05}s forwards`, opacity: 0 }}>
                <MentorshipCard mentorship={m} />
              </div>
            ))}
          </div>
        ) : (
          <div className="mentorships-empty">
            <div className="mentorships-empty-icon">
              <FiBookOpen />
            </div>
            <h3>{t('mentorship:noMentorships')}</h3>
            <p>
              {search || category
                ? (t('common:empty.noItems') === 'No items found' ? 'Try adjusting your search or filters.' : 'حاول تعديل خيارات البحث أو التصفية.')
                : t('mentorship:noMentorshipsDesc')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

