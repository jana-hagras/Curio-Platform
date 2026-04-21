import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { applicationService } from '../../services/applicationService';
import DataTable from '../../components/ui/DataTable';
import Badge from '../../components/ui/Badge';
import { formatDate } from '../../utils/formatDate';

export default function MyApplicationsPage() {
  const { user } = useAuth();
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    applicationService.getByArtisan(user.id)
      .then(res => setApps(res.data.applications || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user.id]);

  const columns = [
    { header: 'Request ID', accessor: 'request_id' },
    { header: 'Proposal', accessor: 'proposal' },
    { header: 'Date', accessor: 'applicationDate', render: r => formatDate(r.applicationDate) },
    { header: 'Status', accessor: 'status', render: r => <Badge status={r.status} /> }
  ];

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>My Applications</h1>
      <DataTable columns={columns} data={apps} loading={loading} emptyMessage="You haven't sent any applications yet." />
    </div>
  );
}
