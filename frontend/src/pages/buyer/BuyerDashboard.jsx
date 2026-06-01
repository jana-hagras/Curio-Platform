import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { orderService } from "../../services/orderService";
import { requestService } from "../../services/requestService";
import { useTranslation } from "react-i18next";
import {
  FiShoppingBag,
  FiFileText,
  FiTrendingUp,
  FiArrowRight,
  FiPlus,
  FiHeart,
  FiClock,
  FiStar,
} from "react-icons/fi";
import DashboardSkeleton from "../../components/ui/DashboardSkeleton";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import { formatCurrency } from "../../utils/formatCurrency";
import { formatDate } from "../../utils/formatDate";
import "../shared/Dashboard.css";

export default function BuyerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation(["dashboard", "request", "common", "order"]);
  const [stats, setStats] = useState({
    orders: 0,
    requests: 0,
    totalSpent: 0,
    activeRequests: 0,
  });
  const [orders, setOrders] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const isRtl = i18n.language === 'ar';

  useEffect(() => {
    setLoading(true);
    const timeoutId = setTimeout(() => {
      Promise.all([
        orderService
          .getByBuyer(user.id)
          .catch(() => ({ data: { orders: [] } })),
        requestService
          .getByBuyer(user.id)
          .catch(() => ({ data: { requests: [] } })),
      ]).then(([oRes, rRes]) => {
        const ords = oRes.data?.orders || [];
        const reqs = rRes.data?.requests || [];
        const totalSpent = ords.reduce(
          (sum, o) => sum + Number(o.totalAmount || 0),
          0,
        );

        setOrders(ords);
        setRequests(reqs);
        setStats({
          orders: ords.length,
          requests: reqs.length,
          totalSpent,
          activeRequests: reqs.filter((r) => r.status !== "Completed").length,
        });
        setLoading(false);
      });
    }, 800);

    return () => clearTimeout(timeoutId);
  }, [user.id]);

  if (loading) return <DashboardSkeleton />;

  const statCards = [
    {
      label: t("dashboard:buyer.totalOrders", "Total Orders"),
      value: stats.orders,
      icon: FiShoppingBag,
      color: "#D4A843",
    },
    {
      label: t("request:title", "Custom Requests"),
      value: stats.requests,
      icon: FiFileText,
      color: "#3B82F6",
    },
    {
      label: t("dashboard:buyer.totalSpent", "Total Spent"),
      value: formatCurrency(stats.totalSpent),
      icon: FiTrendingUp,
      color: "#10B981",
    },
    {
      label: t("dashboard:buyer.activeRequests", "Active Requests"),
      value: stats.activeRequests,
      icon: FiClock,
      color: "#F59E0B",
    },
  ];

  const suggestedWorkshops = [
    {
      title: t("dashboard:buyer.potteryMaking", "Pottery Making"),
      desc: t("dashboard:buyer.potteryDesc", "Learn traditional Egyptian pottery"),
      icon: "🏺",
    },
    {
      title: t("dashboard:buyer.jewelryCraft", "Jewelry Craft"),
      desc: t("dashboard:buyer.jewelryDesc", "Create stunning handmade jewelry"),
      icon: "💍",
    },
    {
      title: t("dashboard:buyer.textileWeaving", "Textile Weaving"),
      desc: t("dashboard:buyer.textileDesc", "Master the art of weaving"),
      icon: "🧶",
    },
  ];

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <div className="dashboard-header-text">
          <h1>{t("dashboard:buyer.welcome", { name: user.firstName })}</h1>
          <p>{t("dashboard:buyer.overview", "Discover artisan craftsmanship")}</p>
        </div>
        <Button
          icon={FiPlus}
          onClick={() => navigate("/dashboard/requests/new")}
        >
          {t("request:create", "New Request")}
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="dashboard-stats-grid">
        {statCards.map((card, i) => (
          <div
            key={i}
            className="dashboard-stat-card"
            style={{ animationDelay: `${i * 0.1}s`, opacity: 1 }}
          >
            <div
              className="dashboard-stat-icon-wrapper"
              style={{
                background: `${card.color}15`,
                color: card.color,
              }}
            >
              <card.icon />
            </div>
            <div className="dashboard-stat-info">
              <p>{card.label}</p>
              <h3>{card.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content — Full Width */}
      <div className="dashboard-content-grid">
        {/* Recent Orders */}
        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <h3>{t("dashboard:buyer.recentOrders", "Recent Orders")}</h3>
            <button
              onClick={() => navigate("/dashboard/orders")}
              className="dashboard-card-action"
            >
              {t("common:actions.viewAll", "View All")}{" "}
              <FiArrowRight size={14} className={isRtl ? "rtl-flip" : ""} />
            </button>
          </div>
          <div className="dashboard-card-body">
            {orders.length === 0 ? (
              <p className="dashboard-empty-text">
                {t("dashboard:buyer.noOrdersDesc", "No orders yet. Explore the marketplace!")}
              </p>
            ) : (
              orders.slice(0, 4).map((order) => (
                <div
                  key={order.id}
                  className="dashboard-row-item"
                  onClick={() => navigate(`/dashboard/orders`)}
                >
                  <div className="dashboard-item-meta">
                    <div className="dashboard-item-icon">
                      <FiShoppingBag />
                    </div>
                    <div className="dashboard-item-details">
                      <p className="dashboard-item-title">
                        {t("order:order", "Order")} #{order.id}
                      </p>
                      <p className="dashboard-item-subtitle">
                        {formatDate(order.orderDate)}
                      </p>
                    </div>
                  </div>
                  <div className="dashboard-item-value-badge">
                    <span className="dashboard-item-price">
                      {formatCurrency(order.totalAmount)}
                    </span>
                    <Badge status={order.status} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* My Requests — Full Width */}
        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <h3>{t("dashboard:buyer.activeRequests", "Active Requests")}</h3>
            <button
              onClick={() => navigate("/dashboard/requests")}
              className="dashboard-card-action"
            >
              {t("common:actions.viewAll", "View All")}{" "}
              <FiArrowRight size={14} className={isRtl ? "rtl-flip" : ""} />
            </button>
          </div>
          <div className="dashboard-card-body">
            {requests.length === 0 ? (
              <p className="dashboard-empty-text">
                {t("request:noRequestsDesc", "No custom requests. Create one to find artisans!")}
              </p>
            ) : (
              requests.slice(0, 4).map((req) => (
                <div
                  key={req.id}
                  className="dashboard-row-item"
                  onClick={() => navigate(`/requests/${req.id}`)}
                >
                  <div className="dashboard-item-meta">
                    <div className="dashboard-item-icon">
                      <FiFileText />
                    </div>
                    <div className="dashboard-item-details">
                      <p className="dashboard-item-title">{req.title}</p>
                      <p className="dashboard-item-subtitle">
                        {t("common:categories." + req.category, req.category)} · {formatCurrency(req.budget)}
                      </p>
                    </div>
                  </div>
                  <Badge status={req.status || "Pending"} />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Secondary Row — Explore & Quick Actions side by side */}
        <div className="dashboard-content-grid two-cols">
          {/* Workshop Suggestions */}
          <div className="dashboard-card">
            <div className="dashboard-card-header">
              <h3>{t("dashboard:buyer.exploreCrafts", "Explore Crafts")}</h3>
            </div>
            <div className="dashboard-card-body">
              {suggestedWorkshops.map((ws, i) => (
                <div
                  key={i}
                  className="dashboard-row-item"
                  onClick={() => navigate("/marketplace")}
                >
                  <div className="dashboard-item-meta">
                    <span style={{ fontSize: 28, flexShrink: 0 }}>{ws.icon}</span>
                    <div className="dashboard-item-details">
                      <p className="dashboard-item-title">{ws.title}</p>
                      <p className="dashboard-item-subtitle">{ws.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="dashboard-card" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 18, fontFamily: "var(--font-body)", fontWeight: 600, marginBottom: 16 }}>
              {t("dashboard:buyer.quickActions", "Quick Actions")}
            </h3>
            <div className="dashboard-quick-actions">
              {[
                {
                  label: t("dashboard:buyer.browseMarketplace", "Browse Marketplace"),
                  icon: FiShoppingBag,
                  path: "/marketplace",
                },
                {
                  label: t("dashboard:buyer.favorites", "View Favorites"),
                  icon: FiHeart,
                  path: "/dashboard/favorites",
                },
                {
                  label: t("dashboard:buyer.findArtisans", "Find Artisans"),
                  icon: FiStar,
                  path: "/artisans",
                },
              ].map((link, i) => (
                <button
                  key={i}
                  onClick={() => navigate(link.path)}
                  className="dashboard-quick-action-btn"
                >
                  <link.icon />
                  <span>{link.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
