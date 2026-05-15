import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { marketItemService } from '../../services/marketItemService';
import DataTable from '../../components/ui/DataTable';
import Button from '../../components/ui/Button';
import { formatCurrency } from '../../utils/formatCurrency';
import { FiPlus, FiTrash2, FiEdit3 } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function MyProductsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  const fetchProducts = () => {
    setLoading(true);
    marketItemService.getByArtisan(user.id)
      .then(res => setProducts(res.data.items || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchProducts(); }, [user.id]);

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    setDeletingId(id);
    try {
      await marketItemService.delete(id);
      toast.success('Product deleted');
      fetchProducts();
    } catch { toast.error('Failed to delete product'); }
    finally { setDeletingId(null); }
  };

  const columns = [
    { header: 'Item', accessor: 'item' },
    { header: 'Category', accessor: 'category' },
    { header: 'Price', accessor: 'price', render: r => formatCurrency(r.price) },
    { header: 'Stock', accessor: 'availQuantity' },
    {
      header: 'Actions',
      render: r => (
        <div style={{ display: 'flex', gap: 8 }}>
          <Button size="sm" variant="ghost" onClick={() => navigate(`/dashboard/products/edit/${r.id}`)} title="Edit">
            <FiEdit3 size={14} />
          </Button>
          <Button size="sm" variant="danger" onClick={() => handleDelete(r.id)} title="Delete" loading={deletingId === r.id}>
            <FiTrash2 size={14} />
          </Button>
        </div>
      )
    }
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1>My Products</h1>
        <Button icon={FiPlus} onClick={() => navigate('/dashboard/products/new')}>Add Product</Button>
      </div>
      <DataTable columns={columns} data={products} loading={loading} emptyMessage="You haven't listed any products yet." />
    </div>
  );
}
