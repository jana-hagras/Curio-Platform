import { FiStar } from 'react-icons/fi';
import { useState } from 'react';

export default function StarRating({ rating = 0, onRate, size = 20, readonly = false }) {
  const [hovered, setHovered] = useState(0);

  return (
    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          style={{
            cursor: readonly ? 'default' : 'pointer',
            color: star <= (hovered || rating) ? '#F59E0B' : '#D1D5DB',
            fontSize: size,
            transition: 'color 150ms, transform 150ms',
            transform: !readonly && star <= hovered ? 'scale(1.2)' : 'scale(1)',
            display: 'flex',
          }}
          onClick={() => !readonly && onRate?.(star)}
          onMouseEnter={() => !readonly && setHovered(star)}
          onMouseLeave={() => !readonly && setHovered(0)}
        >
          <FiStar fill={star <= (hovered || rating) ? '#F59E0B' : 'none'} />
        </span>
      ))}
      {readonly && rating > 0 && (
        <span style={{ fontSize: 14, color: 'var(--text-secondary)', marginLeft: 4 }}>
          ({rating})
        </span>
      )}
    </div>
  );
}
