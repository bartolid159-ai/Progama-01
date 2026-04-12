import { useState, useEffect } from 'react';

function ServicePerformance({ serviceFilter }) {
  const [services, setServices] = useState([]);

  useEffect(() => {
    loadServiceData();
  }, [serviceFilter]);

  const loadServiceData = () => {
    const mockServices = [
      { name: 'Consulta General', count: 245, revenue: 36750, color: '#3b82f6' },
      { name: 'Laboratorio', count: 189, revenue: 28350, color: '#10b981' },
      { name: 'Rayos X', count: 156, revenue: 23400, color: '#f59e0b' },
      { name: 'Ultrasonido', count: 134, revenue: 20100, color: '#8b5cf6' },
      { name: 'Especialista', count: 123, revenue: 18450, color: '#ef4444' }
    ];

    const filteredServices = serviceFilter === 'all' 
      ? mockServices 
      : mockServices.filter(s => s.name.toLowerCase().includes(serviceFilter.toLowerCase()));

    setServices(filteredServices);
  };

  const maxCount = Math.max(...services.map(s => s.count));
  const totalServices = services.reduce((sum, s) => sum + s.count, 0);

  return (
    <div className="chart-card service-performance-card">
      <h3 className="chart-title">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
          <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
          <line x1="12" y1="22.08" x2="12" y2="12"></line>
        </svg>
        Servicios más Demandados
      </h3>
      <div className="service-list">
        {services.map((service, index) => (
          <div key={index} className="service-item">
            <div className="service-info">
              <span 
                className="service-indicator"
                style={{ backgroundColor: service.color }}
              ></span>
              <span className="service-name">{service.name}</span>
              <span className="service-count">{service.count}</span>
            </div>
            <div className="service-bar-container">
              <div 
                className="service-bar"
                style={{ 
                  width: `${(service.count / maxCount) * 100}%`,
                  backgroundColor: service.color
                }}
              ></div>
            </div>
          </div>
        ))}
      </div>
      <div className="service-summary">
        <span>Total de servicios: {totalServices}</span>
      </div>
    </div>
  );
}

export default ServicePerformance;