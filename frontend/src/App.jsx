import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { FavoritesProvider } from './context/FavoritesContext';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/layout/Layout';
import DashboardLayout from './components/layout/DashboardLayout';
import AdminLayout from './components/layout/AdminLayout';
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
import MentorshipsPage from './pages/public/MentorshipsPage';
import MentorshipDetailPage from './pages/public/MentorshipDetailPage';
import WorkshopsPage from './pages/public/WorkshopsPage';
import WorkshopDetailPage from './pages/public/WorkshopDetailPage';

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
import BuyerMentorshipsPage from './pages/buyer/BuyerMentorshipsPage';
import BuyerWorkshopsPage from './pages/buyer/BuyerWorkshopsPage';

// Artisan Pages
import ArtisanDashboard from './pages/artisan/ArtisanDashboard';
import MyProductsPage from './pages/artisan/MyProductsPage';
import CreateProductPage from './pages/artisan/CreateProductPage';
import EditProductPage from './pages/artisan/EditProductPage';
import MyPortfolioPage from './pages/artisan/MyPortfolioPage';
import MyApplicationsPage from './pages/artisan/MyApplicationsPage';
import WalletPage from './pages/artisan/WalletPage';
import ArtisanMentorshipsPage from './pages/artisan/ArtisanMentorshipsPage';
import ArtisanWorkshopsPage from './pages/artisan/ArtisanWorkshopsPage';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminProductsPage from './pages/admin/AdminProductsPage';
import AdminOrdersPage from './pages/admin/AdminOrdersPage';
import AdminRequestsPage from './pages/admin/AdminRequestsPage';
import AdminApplicationsPage from './pages/admin/AdminApplicationsPage';
import AdminReviewsPage from './pages/admin/AdminReviewsPage';
import AdminPaymentsPage from './pages/admin/AdminPaymentsPage';
import AdminPortfoliosPage from './pages/admin/AdminPortfoliosPage';
import AdminSettingsPage from './pages/admin/AdminSettingsPage';
import AdminMentorshipsPage from './pages/admin/AdminMentorshipsPage';
import AdminWorkshopsPage from './pages/admin/AdminWorkshopsPage';

// Shared
import ProfilePage from './pages/shared/ProfilePage';
import { useAuth } from './hooks/useAuth';

function DashboardRouter() {
  const { isBuyer, isArtisan, isAdmin } = useAuth();

  // Admin users should use /admin routes, not /dashboard
  if (isAdmin) return <Navigate to="/admin" replace />;

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
        <Route path="/mentorships" element={<BuyerMentorshipsPage />} />
        <Route path="/workshops" element={<BuyerWorkshopsPage />} />

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
        <Route path="/products/edit/:id" element={<EditProductPage />} />
        <Route path="/portfolio" element={<MyPortfolioPage />} />
        <Route path="/applications" element={<MyApplicationsPage />} />
        <Route path="/wallet" element={<WalletPage />} />
        <Route path="/mentorships" element={<ArtisanMentorshipsPage />} />
        <Route path="/workshops" element={<ArtisanWorkshopsPage />} />

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
                <Route path="/mentorships" element={<MentorshipsPage />} />
                <Route path="/mentorships/:id" element={<MentorshipDetailPage />} />
                <Route path="/workshops" element={<WorkshopsPage />} />
                <Route path="/workshops/:id" element={<WorkshopDetailPage />} />
                <Route path="/cart" element={<ProtectedRoute requiredType="Buyer"><CartPage /></ProtectedRoute>} />
                <Route path="/checkout" element={<ProtectedRoute requiredType="Buyer"><CheckoutPage /></ProtectedRoute>} />
              </Route>

              <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
                <Route index element={<DashboardRouter />} />
                <Route path="*" element={<DashboardRouter />} />
              </Route>

              <Route path="/admin" element={<ProtectedRoute requiredType="Admin"><AdminLayout /></ProtectedRoute>}>
                <Route index element={<AdminDashboard />} />
                <Route path="users" element={<AdminUsersPage />} />
                <Route path="products" element={<AdminProductsPage />} />
                <Route path="orders" element={<AdminOrdersPage />} />
                <Route path="requests" element={<AdminRequestsPage />} />
                <Route path="applications" element={<AdminApplicationsPage />} />
                <Route path="reviews" element={<AdminReviewsPage />} />
                <Route path="payments" element={<AdminPaymentsPage />} />
                <Route path="portfolios" element={<AdminPortfoliosPage />} />
                <Route path="mentorships" element={<AdminMentorshipsPage />} />
                <Route path="workshops" element={<AdminWorkshopsPage />} />
                <Route path="settings" element={<AdminSettingsPage />} />
                <Route path="*" element={<Navigate to="/admin" replace />} />
              </Route>
            </Routes>
          </Router>
          </FavoritesProvider>
        </CartProvider>
       </AuthProvider>
    </ThemeProvider>
  );
}
