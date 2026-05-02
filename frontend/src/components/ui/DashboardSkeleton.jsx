import { ShimmerTitle, ShimmerPostItem, ShimmerCategoryItem } from 'react-shimmer-effects';

export default function DashboardSkeleton() {
  return (
    <div style={{ animation: 'fadeInUp 0.4s ease forwards' }}>
      <div style={{ marginBottom: 32 }}>
        <ShimmerTitle line={2} gap={10} variant="primary" />
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 20,
        marginBottom: 32
      }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} style={{ background: 'var(--surface-primary)', padding: 24, borderRadius: 'var(--radius-lg)', border: '1px solid var(--surface-border)' }}>
            <ShimmerCategoryItem hasImage imageType="circular" imageHeight={48} imageWidth={48} title titleLine={2} />
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ background: 'var(--surface-primary)', padding: 24, borderRadius: 'var(--radius-lg)', border: '1px solid var(--surface-border)' }}>
            <ShimmerTitle line={1} gap={10} variant="secondary" />
            <ShimmerPostItem card title cta />
            <ShimmerPostItem card title cta />
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ background: 'var(--surface-primary)', padding: 24, borderRadius: 'var(--radius-lg)', border: '1px solid var(--surface-border)' }}>
            <ShimmerTitle line={1} gap={10} variant="secondary" />
            <ShimmerPostItem card title cta />
          </div>
        </div>
      </div>
    </div>
  );
}
