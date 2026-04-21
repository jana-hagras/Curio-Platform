import { useState, useEffect } from 'react';
import { requestService } from '../../services/requestService';
import RequestCard from '../../components/cards/RequestCard';
import SearchBar from '../../components/ui/SearchBar';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import { useDebounce } from '../../hooks/useDebounce';
import { CATEGORIES } from '../../utils/constants';
import { FiFileText } from 'react-icons/fi';

export default function RequestsPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const debouncedSearch = useDebounce(search);

  useEffect(() => {
    setLoading(true);
    const fetch = debouncedSearch ? requestService.search(debouncedSearch) : requestService.getAll();
    fetch.then(res => setRequests(res.data?.requests || []))
      .catch(() => {}).finally(() => setLoading(false));
  }, [debouncedSearch]);

  const filtered = requests.filter(r => !category || r.category === category);

  return (
    <div>
      <div style={{ background: 'var(--navy-deep)', color: '#fff', padding: '48px 0', textAlign: 'center' }}>
        <div className="container">
          <h1 style={{ fontSize: 40, marginBottom: 8 }}>Custom Requests</h1>
          <p style={{ color: 'rgba(255,255,255,.6)', fontSize: 18 }}>Browse buyer requests and offer your craftsmanship</p>
        </div>
      </div>
      <div className="container" style={{ padding: '32px 24px' }}>
        <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
          <SearchBar value={search} onChange={setSearch} placeholder="Search requests..." />
          <select className="select-field" value={category} onChange={e => setCategory(e.target.value)} style={{ maxWidth: 180 }}>
            <option value="">All Categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        {loading ? <Spinner /> : filtered.length === 0 ? (
          <EmptyState icon={FiFileText} title="No requests found" message="Try adjusting your search." />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 24 }}>
            {filtered.map(r => <RequestCard key={r.id} request={r} />)}
          </div>
        )}
      </div>
    </div>
  );
}
