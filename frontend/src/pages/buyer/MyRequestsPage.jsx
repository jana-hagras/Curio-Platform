import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { requestService } from '../../services/requestService';
import DataTable from '../../components/ui/DataTable';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import { FiPlus } from 'react-icons/fi';

export default function MyRequestsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    requestService.getByBuyer(user.id)
      .then(res => setRequests(res.data.requests || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user.id]);

  const columns = [
    { header: 'Title', accessor: 'title' },
    { header: 'Category', accessor: 'category', render: r => <Badge status="Active">{r.category}</Badge> },
    { header: 'Budget', accessor: 'budget', render: r => formatCurrency(r.budget) },
    { header: 'Date', accessor: 'requestDate', render: r => formatDate(r.requestDate) },
    { header: 'Action', render: r => <Button size="sm" variant="outline" onClick={() => navigate(`/requests/${r.id}`)}>View</Button> }
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1>My Requests</h1>
        <Button icon={FiPlus} onClick={() => navigate('/dashboard/requests/new')}>New Request</Button>
      </div>
      <DataTable columns={columns} data={requests} loading={loading} emptyMessage="You have no custom requests." />
    </div>
  );
}
