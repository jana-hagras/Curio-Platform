import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { FavoritesProvider } from './context/FavoritesContext';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/layout/Layout';
import DashboardLayout from './components/layout/DashboardLayout';
import ProtectedRoute from './components/layout/ProtectedRoute';

// Public Pages
import HomePage from './pages/public/HomePage';
import LoginPage from './pages/public/LoginPage';
import RegisterPage from './pages/public/RegisterPage';
import MarketplacePage from './pages/public/MarketplacePage';
import ProductDetailPage from './pages/public/ProductDetailPage';
import ArtisansPage from './pages/public/ArtisansPage';
import ArtisanProfilePage from './pages/public/ArtisanProfilePage';
import RequestsPage from './pages/public/RequestsPage';
import RequestDetailPage from './pages/public/RequestDetailPage';

// Buyer Pages
import CartPage from './pages/buyer/CartPage';
import CheckoutPage from './pages/buyer/CheckoutPage';
import BuyerDashboard from './pages/buyer/BuyerDashboard';
import MyOrdersPage from './pages/buyer/MyOrdersPage';
import MyRequestsPage from './pages/buyer/MyRequestsPage';
import CreateRequestPage from './pages/buyer/CreateRequestPage';
import MyPaymentsPage from './pages/buyer/MyPaymentsPage';
import FavoritesPage from './pages/buyer/FavoritesPage';
import ProposalsPage from './pages/buyer/ProposalsPage';

// Artisan Pages
import ArtisanDashboard from './pages/artisan/ArtisanDashboard';
import MyProductsPage from './pages/artisan/MyProductsPage';
import CreateProductPage from './pages/artisan/CreateProductPage';
import MyPortfolioPage from './pages/artisan/MyPortfolioPage';
import MyApplicationsPage from './pages/artisan/MyApplicationsPage';

// Shared
import ProfilePage from './pages/shared/ProfilePage';
import ChatPage from './pages/shared/ChatPage';
import { useAuth } from './hooks/useAuth';

function DashboardRouter() {
  const { isBuyer, isArtisan } = useAuth();

  if (isBuyer) {
    return (
      <Routes>
        <Route path="/" element={<BuyerDashboard />} />
        <Route path="/orders" element={<MyOrdersPage />} />
        <Route path="/requests" element={<MyRequestsPage />} />
        <Route path="/requests/new" element={<CreateRequestPage />} />
        <Route path="/payments" element={<MyPaymentsPage />} />
        <Route path="/favorites" element={<FavoritesPage />} />
        <Route path="/proposals" element={<ProposalsPage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    );
  }

  if (isArtisan) {
    return (
      <Routes>
        <Route path="/" element={<ArtisanDashboard />} />
        <Route path="/products" element={<MyProductsPage />} />
        <Route path="/products/new" element={<CreateProductPage />} />
        <Route path="/portfolio" element={<MyPortfolioPage />} />
        <Route path="/applications" element={<MyApplicationsPage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    );
  }

  return <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <FavoritesProvider>
            <Router>
            <Toaster position="top-right" toastOptions={{
              style: {
                fontFamily: 'var(--font-body)',
                borderRadius: '12px',
                background: 'var(--surface-primary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--surface-border)',
              }
            }} />
            <Routes>
              <Route element={<Layout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/marketplace" element={<MarketplacePage />} />
                <Route path="/marketplace/:id" element={<ProductDetailPage />} />
                <Route path="/artisans" element={<ArtisansPage />} />
                <Route path="/artisans/:id" element={<ArtisanProfilePage />} />
                <Route path="/requests" element={<RequestsPage />} />
                <Route path="/requests/:id" element={<RequestDetailPage />} />
                <Route path="/cart" element={<ProtectedRoute requiredType="Buyer"><CartPage /></ProtectedRoute>} />
                <Route path="/checkout" element={<ProtectedRoute requiredType="Buyer"><CheckoutPage /></ProtectedRoute>} />
              </Route>

              <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
                <Route path="*" element={<DashboardRouter />} />
              </Route>
            </Routes>
          </Router>
          </FavoritesProvider>
        </CartProvider>
       </AuthProvider>
    </ThemeProvider>
  );
}
