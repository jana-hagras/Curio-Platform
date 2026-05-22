import { useState, useEffect } from 'react';
import { FiSearch, FiBookOpen } from 'react-icons/fi';
import { mentorshipService } from '../../services/mentorshipService';
import { CATEGORIES } from '../../utils/constants';
import MentorshipCard from '../../components/cards/MentorshipCard';
import './MentorshipsPage.css';

export default function MentorshipsPage() {
  const [mentorships, setMentorships] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');

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
          <h1>Learn from Master <span className="gold-text">Artisans</span></h1>
          <p>Book one-on-one mentorship sessions with verified craftsmen. Master traditional techniques and elevate your skills.</p>
        </div>

        {/* Stats */}
        <div className="mentorships-stats">
          <div className="mentorships-stat">
            <div className="mentorships-stat-value">{activeMentorships.length}</div>
            <div className="mentorships-stat-label">Available Mentorships</div>
          </div>
          <div className="mentorships-stat">
            <div className="mentorships-stat-value">{uniqueArtisans}</div>
            <div className="mentorships-stat-label">Expert Mentors</div>
          </div>
          <div className="mentorships-stat">
            <div className="mentorships-stat-value">{CATEGORIES.length}</div>
            <div className="mentorships-stat-label">Craft Categories</div>
          </div>
        </div>

        {/* Filters */}
        <div className="mentorships-filters">
          <div className="mentorships-search">
            <FiSearch size={16} />
            <input
              type="text"
              placeholder="Search mentors, skills, or categories..."
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
            <option value="">All Categories</option>
            {CATEGORIES.map(c => (
              <option key={c} value={c}>{c}</option>
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
            <h3>No Mentorships Found</h3>
            <p>
              {search || category
                ? 'Try adjusting your search or filters.'
                : 'No mentorship offerings are available yet. Check back soon!'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
