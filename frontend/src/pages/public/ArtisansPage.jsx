import { useState, useEffect } from 'react';
import { userService } from '../../services/userService';
import ArtisanCard from '../../components/cards/ArtisanCard';
import SearchBar from '../../components/ui/SearchBar';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import { useDebounce } from '../../hooks/useDebounce';
import { FiUsers } from 'react-icons/fi';

export default function ArtisansPage() {
  const [artisans, setArtisans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);

  useEffect(() => {
    setLoading(true);
    const fetch = debouncedSearch ? userService.search(debouncedSearch) : userService.getAll();
    fetch.then(res => {
      const users = res.data?.users || [];
      setArtisans(users.filter(u => u.type === 'Artisan'));
    }).catch(() => {}).finally(() => setLoading(false));
  }, [debouncedSearch]);

  return (
    <div>
      <div style={{ background: 'var(--navy-deep)', color: '#fff', padding: '48px 0', textAlign: 'center' }}>
        <div className="container"><h1 style={{ fontSize: 40, marginBottom: 8, color: '#fff' }}>Our Artisans</h1><p style={{ color: 'rgba(255,255,255,.6)', fontSize: 18 }}>Meet the talented craftspeople behind every creation</p></div>
      </div>
      <div className="container" style={{ padding: '32px 24px' }}>
        <div style={{ marginBottom: 24 }}><SearchBar value={search} onChange={setSearch} placeholder="Search artisans..." /></div>
        {loading ? <Spinner /> : artisans.length === 0 ? (
          <EmptyState icon={FiUsers} title="No artisans found" message="Try a different search." />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 24 }}>
            {artisans.map(a => <ArtisanCard key={a.id} artisan={a} />)}
          </div>
        )}
      </div>
    </div>
  );
}
