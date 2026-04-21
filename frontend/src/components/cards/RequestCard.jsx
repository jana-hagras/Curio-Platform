import { Link } from 'react-router-dom';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import Badge from '../ui/Badge';
import { FiCalendar, FiDollarSign, FiTag } from 'react-icons/fi';
import './RequestCard.css';

export default function RequestCard({ request }) {
  return (
    <Link to={`/requests/${request.id}`} className="request-card" id={`request-card-${request.id}`}>
      <div className="request-card-header">
        <h3 className="request-card-title">{request.title}</h3>
        {request.category && <Badge status="Active">{request.category}</Badge>}
      </div>
      <p className="request-card-desc">{request.description?.slice(0, 120)}{request.description?.length > 120 ? '...' : ''}</p>
      <div className="request-card-meta">
        <div className="request-card-meta-item">
          <FiDollarSign />
          <span>Budget: {formatCurrency(request.budget)}</span>
        </div>
        <div className="request-card-meta-item">
          <FiCalendar />
          <span>{formatDate(request.requestDate)}</span>
        </div>
      </div>
      {request.buyerName && (
        <div className="request-card-buyer">By {request.buyerName}</div>
      )}
    </Link>
  );
}
