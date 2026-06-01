import { useState, useEffect } from "react";
import { userService } from "../../services/userService";
import ArtisanCard from "../../components/cards/ArtisanCard";
import SearchBar from "../../components/ui/SearchBar";
import EmptyState from "../../components/ui/EmptyState";
import { useDebounce } from "../../hooks/useDebounce";
import { useTranslation } from "react-i18next";
import { ShimmerCategoryItem } from "react-shimmer-effects";
import { FiUsers } from "react-icons/fi";

export default function ArtisansPage() {
  const [artisans, setArtisans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search);
  const { t } = useTranslation(['common']);

  useEffect(() => {
    setLoading(true);
    const fetch = debouncedSearch
      ? userService.search(debouncedSearch)
      : userService.getAll();
    fetch
      .then((res) => {
        const users = res.data?.users || [];
        setArtisans(users.filter((u) => u.type === "Artisan"));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [debouncedSearch]);

  return (
    <div>
      <div
        style={{
          background: "var(--navy-deep)",
          color: "#fff",
          padding: "48px 0",
          textAlign: "center",
        }}
      >
        <div className="container">
          <h1 style={{ fontSize: 40, marginBottom: 8, color: "#fff" }}>
            {t('common:nav.adminPanel') === 'Admin Panel' ? 'Our Artisans' : 'حرفيينا المبدعين'}
          </h1>
          <p style={{ color: "rgba(255,255,255,.6)", fontSize: 18 }}>
            {t('common:nav.adminPanel') === 'Admin Panel' ? 'Meet the talented craftspeople behind every creation' : 'تعرف على الحرفيين الموهوبين وراء كل تحفة فنية'}
          </p>
        </div>
      </div>
      <div className="container" style={{ padding: "32px 24px" }}>
        <div style={{ marginBottom: 24 }}>
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder={t('common:nav.adminPanel') === 'Admin Panel' ? "Search artisans..." : "ابحث عن الحرفيين..."}
          />
        </div>
        {loading ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
              gap: 24,
            }}
          >
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                style={{
                  background: "var(--surface-primary)",
                  padding: 24,
                  borderRadius: "var(--radius-lg)",
                  border: "1px solid var(--surface-border)",
                }}
              >
                <ShimmerCategoryItem
                  hasImage
                  imageType="circular"
                  imageHeight={48}
                  imageWidth={48}
                  title
                  titleLine={2}
                />
              </div>
            ))}
          </div>
        ) : artisans.length === 0 ? (
          <EmptyState
            icon={FiUsers}
            title={t('common:nav.adminPanel') === 'Admin Panel' ? "No artisans found" : "لم يتم العثور على حرفيين"}
            message={t('common:nav.adminPanel') === 'Admin Panel' ? "Try a different search." : "حاول البحث بكلمات مختلفة."}
          />
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
              gap: 24,
            }}
          >
            {artisans.map((a) => (
              <ArtisanCard key={a.id} artisan={a} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

