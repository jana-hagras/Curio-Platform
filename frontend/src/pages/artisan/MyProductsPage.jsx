import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { marketItemService } from '../../services/marketItemService';
import DataTable from '../../components/ui/DataTable';
import Button from '../../components/ui/Button';
import { formatCurrency } from '../../utils/formatCurrency';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function MyProductsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

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
    try {
      await marketItemService.delete(id);
      toast.success('Product deleted');
      fetchProducts();
    } catch { toast.error('Failed to delete product'); }
  };

  const columns = [
    { header: 'Item', accessor: 'item' },
    { header: 'Category', accessor: 'category' },
    { header: 'Price', accessor: 'price', render: r => formatCurrency(r.price) },
    { header: 'Stock', accessor: 'availQuantity' },
    { header: 'Action', render: r => <Button size="sm" variant="danger" onClick={() => handleDelete(r.id)}><FiTrash2 /></Button> }
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
