import './DataTable.css';
import Spinner from './Spinner';

export default function DataTable({ columns, data, loading, emptyMessage = "No data available." }) {
  if (loading) return <div style={{ padding: '40px 0' }}><Spinner /></div>;
  if (!data || data.length === 0) return <div className="data-table-empty">{emptyMessage}</div>;

  return (
    <div className="data-table-container">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((col, i) => (
              <th key={i} style={{ textAlign: col.align || 'left', width: col.width }}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr key={row.id || rowIndex}>
              {columns.map((col, colIndex) => (
                <td key={colIndex} style={{ textAlign: col.align || 'left' }}>
                  {col.render ? col.render(row) : row[col.accessor]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
