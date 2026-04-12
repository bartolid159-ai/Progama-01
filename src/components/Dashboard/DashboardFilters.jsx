function DashboardFilters({ dateRange, doctorFilter, serviceFilter, onFilterChange }) {
  const doctors = [
    { id: 'all', name: 'Todos los Médicos' },
    { id: 'dr1', name: 'Dr. García - Cardiología' },
    { id: 'dr2', name: 'Dra. López - Pediatría' },
    { id: 'dr3', name: 'Dr. Martínez - Ortopedia' },
    { id: 'dr4', name: 'Dra. Hernández - Ginecología' }
  ];

  const services = [
    { id: 'all', name: 'Todos los Servicios' },
    { id: 'consulta', name: 'Consulta General' },
    { id: 'laboratorio', name: 'Laboratorio' },
    { id: 'rayos', name: 'Rayos X' },
    { id: 'ultrasonido', name: 'Ultrasonido' },
    { id: 'especialista', name: 'Especialista' }
  ];

  const dateRanges = [
    { id: '7', label: 'Últimos 7 días' },
    { id: '30', label: 'Últimos 30 días' },
    { id: '90', label: 'Últimos 3 meses' },
    { id: '365', label: 'Último año' }
  ];

  return (
    <div className="dashboard-filters">
      <div className="filter-group">
        <label className="filter-label">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
          Período
        </label>
        <select 
          className="filter-select"
          value={dateRange}
          onChange={(e) => onFilterChange('dateRange', e.target.value)}
        >
          {dateRanges.map(range => (
            <option key={range.id} value={range.id}>{range.label}</option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <label className="filter-label">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
          Médico
        </label>
        <select 
          className="filter-select"
          value={doctorFilter}
          onChange={(e) => onFilterChange('doctor', e.target.value)}
        >
          {doctors.map(doctor => (
            <option key={doctor.id} value={doctor.id}>{doctor.name}</option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <label className="filter-label">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
          </svg>
          Servicio
        </label>
        <select 
          className="filter-select"
          value={serviceFilter}
          onChange={(e) => onFilterChange('service', e.target.value)}
        >
          {services.map(service => (
            <option key={service.id} value={service.id}>{service.name}</option>
          ))}
        </select>
      </div>

      <button 
        className="filter-reset"
        onClick={() => {
          onFilterChange('dateRange', '30');
          onFilterChange('doctor', 'all');
          onFilterChange('service', 'all');
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="1 4 1 10 7 10"></polyline>
          <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
        </svg>
        Restablecer
      </button>
    </div>
  );
}

export default DashboardFilters;