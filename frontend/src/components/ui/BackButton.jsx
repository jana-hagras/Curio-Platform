import { useNavigate, useLocation } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import Button from './Button';

export default function BackButton() {
  const navigate = useNavigate();
  const location = useLocation();

  const noBackRoutes = ['/', '/dashboard', '/login', '/register', '/marketplace', '/artisans', '/requests'];
  
  // Exact match for main routes, allow on inner pages like /marketplace/123
  if (noBackRoutes.includes(location.pathname)) {
    return null;
  }

  return (
    <div style={{ marginBottom: 16 }}>
      <Button 
        variant="ghost" 
        onClick={() => navigate(-1)} 
        style={{ padding: '8px 0', color: 'var(--text-secondary)' }}
      >
        <FiArrowLeft style={{ marginRight: 8 }} /> Back
      </Button>
    </div>
  );
}
