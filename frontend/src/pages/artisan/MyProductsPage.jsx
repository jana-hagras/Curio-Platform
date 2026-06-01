import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { marketItemService } from '../../services/marketItemService';
import DataTable from '../../components/ui/DataTable';
import Button from '../../components/ui/Button';
import { formatCurrency } from '../../utils/formatCurrency';
import { FiPlus, FiTrash2, FiEdit3 } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

export default function MyProductsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation(['dashboard']);
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
    if (!confirm(t('dashboard:products.deleteConfirm', 'Are you sure you want to delete this product?'))) return;
    setDeletingId(id);
    try {
      await marketItemService.delete(id);
      toast.success(t('dashboard:products.deleted', 'Product deleted'));
      fetchProducts();
    } catch { toast.error(t('dashboard:products.failedDelete', 'Failed to delete product')); }
    finally { setDeletingId(null); }
  };

  const columns = [
    { header: t('dashboard:products.columnItem', 'Item'), accessor: 'item' },
    { header: t('dashboard:products.columnCategory', 'Category'), accessor: 'category' },
    { header: t('dashboard:products.columnPrice', 'Price'), accessor: 'price', render: r => formatCurrency(r.price) },
    { header: t('dashboard:products.columnStock', 'Stock'), accessor: 'availQuantity' },
    {
      header: t('dashboard:products.columnActions', 'Actions'),
      render: r => (
        <div style={{ display: 'flex', gap: 8 }}>
          <Button size="sm" variant="ghost" onClick={() => navigate(`/dashboard/products/edit/${r.id}`)} title={t('dashboard:products.actionEdit', 'Edit')}>
            <FiEdit3 size={14} />
          </Button>
          <Button size="sm" variant="danger" onClick={() => handleDelete(r.id)} title={t('dashboard:products.actionDelete', 'Delete')} loading={deletingId === r.id}>
            <FiTrash2 size={14} />
          </Button>
        </div>
      )
    }
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1>{t('dashboard:products.myProducts', 'My Products')}</h1>
        <Button icon={FiPlus} onClick={() => navigate('/dashboard/products/new')}>{t('dashboard:products.addProduct', 'Add Product')}</Button>
      </div>
      <DataTable columns={columns} data={products} loading={loading} emptyMessage={t('dashboard:products.emptyMessage', "You haven't listed any products yet.")} />
    </div>
  );
}
