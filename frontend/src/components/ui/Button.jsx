import './Button.css';
import { FiLoader } from 'react-icons/fi';

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  icon: Icon,
  onClick,
  type = 'button',
  className = '',
  ...props
}) {
  return (
    <button
      type={type}
      className={`btn btn-${variant} btn-${size} ${fullWidth ? 'btn-full' : ''} ${className}`}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading ? (
        <FiLoader className="btn-spinner" />
      ) : Icon ? (
        <Icon className="btn-icon" />
      ) : null}
      <span>{children}</span>
    </button>
  );
}
