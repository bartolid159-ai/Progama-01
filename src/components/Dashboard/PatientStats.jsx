function PatientStats({ activePatients }) {
  const formatNumber = (value) => {
    return new Intl.NumberFormat('es-MX').format(value);
  };

  return (
    <div className="metric-card patient-stats-card">
      <div className="metric-icon patient-icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
          <circle cx="9" cy="7" r="4"></circle>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
        </svg>
      </div>
      <div className="metric-content">
        <h3>Pacientes Activos</h3>
        <p className="metric-value">{formatNumber(activePatients)}</p>
        <p className="metric-subtitle">Registrados en el sistema</p>
      </div>
      <div className="patient-chart-mini">
        <div className="mini-bar" style={{ height: '40%' }}></div>
        <div className="mini-bar" style={{ height: '60%' }}></div>
        <div className="mini-bar" style={{ height: '80%' }}></div>
        <div className="mini-bar" style={{ height: '70%' }}></div>
        <div className="mini-bar" style={{ height: '90%' }}></div>
        <div className="mini-bar" style={{ height: '85%' }}></div>
        <div className="mini-bar active" style={{ height: '100%' }}></div>
      </div>
    </div>
  );
}

export default PatientStats;