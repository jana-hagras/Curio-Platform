import { useState, useEffect } from 'react';
import { FiSearch, FiCalendar } from 'react-icons/fi';
import { workshopService } from '../../services/workshopService';
import { CATEGORIES } from '../../utils/constants';
import WorkshopCard from '../../components/cards/WorkshopCard';
import { useTranslation } from 'react-i18next';
import './MentorshipsPage.css'; /* reuse same page layout styles */

export default function WorkshopsPage() {
  const [workshops, setWorkshops] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const { t } = useTranslation(['workshop', 'common']);

  useEffect(() => {
    workshopService.getAll()
      .then(res => {
        const items = res.data?.workshops || [];
        setWorkshops(items);
        setFiltered(items);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let result = workshops.filter(w => w.status !== 'Cancelled');

    if (search) {
      const s = search.toLowerCase();
      result = result.filter(w =>
        (w.title || '').toLowerCase().includes(s) ||
        (w.artisanName || '').toLowerCase().includes(s) ||
        (w.description || '').toLowerCase().includes(s) ||
        (w.category || '').toLowerCase().includes(s)
      );
    }

    if (category) {
      result = result.filter(w => w.category === category);
    }

    setFiltered(result);
  }, [search, category, workshops]);

  const activeWorkshops = workshops.filter(w => w.status === 'Upcoming' || w.status === 'Ongoing');
  const uniqueHosts = new Set(activeWorkshops.map(w => w.artisan_id)).size;

  return (
    <div className="mentorships-page">
      <div className="container">
        {/* Hero */}
        <div className="mentorships-hero">
          <h1>{t('workshop:title').split(' ').slice(0, -1).join(' ') || 'Hands-On'} <span className="gold-text">{t('workshop:title').split(' ').slice(-1)[0] || 'Workshops'}</span></h1>
          <p>{t('workshop:subtitle')}</p>
        </div>

        {/* Stats */}
        <div className="mentorships-stats">
          <div className="mentorships-stat">
            <div className="mentorships-stat-value">{activeWorkshops.length}</div>
            <div className="mentorships-stat-label">{t('workshop:upcomingWorkshops', 'Active Workshops')}</div>
          </div>
          <div className="mentorships-stat">
            <div className="mentorships-stat-value">{uniqueHosts}</div>
            <div className="mentorships-stat-label">{t('workshop:instructor', 'Expert Hosts')}</div>
          </div>
        </div>

        {/* Filters */}
        <div className="mentorships-filters">
          <div className="mentorships-search">
            <FiSearch size={16} />
            <input
              type="text"
              placeholder={t('workshop:search')}
              value={search}
              onChange={e => setSearch(e.target.value)}
              id="workshops-search-input"
            />
          </div>
          <select
            className="mentorships-filter-select"
            value={category}
            onChange={e => setCategory(e.target.value)}
            id="workshops-category-filter"
          >
            <option value="">{t('common:empty.noItems') === 'No items found' ? 'All Categories' : 'كل الفئات الفنية'}</option>
            {CATEGORIES.map(c => (
              <option key={c} value={c}>{t('common:categories.' + c)}</option>
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
            {filtered.map((w, i) => (
              <div key={w.id} style={{ animation: `fadeInUp 0.4s ease ${i * 0.05}s forwards`, opacity: 0 }}>
                <WorkshopCard workshop={w} />
              </div>
            ))}
          </div>
        ) : (
          <div className="mentorships-empty">
            <div className="mentorships-empty-icon">
              <FiCalendar />
            </div>
            <h3>{t('workshop:noWorkshops')}</h3>
            <p>
              {search || category
                ? (t('common:empty.noItems') === 'No items found' ? 'Try adjusting your search or filters.' : 'حاول تعديل خيارات البحث أو التصفية.')
                : t('workshop:noWorkshopsDesc')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

