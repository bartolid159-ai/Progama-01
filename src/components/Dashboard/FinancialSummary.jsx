function FinancialSummary({ revenue, growth }) {
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0
    }).format(value);
  };

  const getGrowthClass = () => {
    return growth >= 0 ? 'positive' : 'negative';
  };

  const getGrowthIcon = () => {
    return growth >= 0 ? (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
        <polyline points="17 6 23 6 23 12"></polyline>
      </svg>
    ) : (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline>
        <polyline points="17 18 23 18 23 12"></polyline>
      </svg>
    );
  };

  return (
    <div className="metric-card financial-summary-card">
      <div className="metric-header">
        <div className="metric-icon revenue-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
          </svg>
        </div>
        <span className={`growth-badge ${getGrowthClass()}`}>
          {getGrowthIcon()}
          {growth}%
        </span>
      </div>
      <div className="metric-content">
        <h3>Ingresos Mensuales</h3>
        <p className="metric-value">{formatCurrency(revenue)}</p>
        <p className="metric-period">Últimos 30 días</p>
      </div>
    </div>
  );
}

export default FinancialSummary;