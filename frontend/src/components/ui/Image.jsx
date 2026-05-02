import { useState } from 'react';

export default function Image({ src, alt, fallback = 'https://via.placeholder.com/400x300?text=No+Image', className, style, ...props }) {
  const [error, setError] = useState(false);

  return (
    <img
      src={error || !src ? fallback : src}
      alt={alt || 'Image'}
      className={className}
      style={{ ...style, objectFit: style?.objectFit || 'cover' }}
      onError={() => setError(true)}
      {...props}
    />
  );
}
