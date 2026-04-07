import { useState, useEffect } from 'react';
import * as serviceLogic from '../../logic/serviceLogic';
import * as doctorService from '../../logic/doctorService';
import ConfirmModal from '../Common/ConfirmModal';
import Notification from '../Common/Notification';

const ServiceList = ({ onAddClick, onEditClick }) => {
  const [services, setServices] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // UI States
  const [modalOpen, setModalOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState(null);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [servicesData, doctorsData] = await Promise.all([
      serviceLogic.getServices(),
      doctorService.getDoctors()
    ]);
    setServices(servicesData);
    setDoctors(doctorsData);
    setLoading(false);
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
  };

  const getDoctorName = (service) => {
    if (service.medico_nombre) return service.medico_nombre;
    if (!service.id_medico_defecto) return 'No asignado';
    
    const doctor = doctors.find(d => Number(d.id) === Number(service.id_medico_defecto));
    return doctor ? doctor.nombre : `ID: ${service.id_medico_defecto}`;
  };

  const handleDeleteClick = (service) => {
    setServiceToDelete(service);
    setModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!serviceToDelete) return;
    
    const result = await serviceLogic.deleteService(serviceToDelete.id);
    if (result.success) {
      showNotification('Servicio eliminado correctamente');
      loadData();
    } else {
      showNotification(result.message, 'error');
    }
    setModalOpen(false);
    setServiceToDelete(null);
  };

  const filteredServices = services.filter(s => {
    const doctorName = getDoctorName(s).toLowerCase();
    const nameMatch = s.nombre.toLowerCase().includes(searchTerm.toLowerCase());
    const doctorMatch = doctorName.includes(searchTerm.toLowerCase());
    return nameMatch || doctorMatch;
  });

  return (
    <div className="patient-list animate-in">
      {notification && (
        <Notification 
          message={notification.message} 
          type={notification.type} 
          onClose={() => setNotification(null)} 
        />
      )}

      <ConfirmModal 
        isOpen={modalOpen}
        title="Eliminar Servicio"
        message={`¿Está seguro de eliminar el servicio "${serviceToDelete?.nombre}"? Esta acción no se puede deshacer.`}
        onConfirm={handleConfirmDelete}
        onCancel={() => setModalOpen(false)}
      />

      <div className="search-bar-container">
        <div className="search-input-wrapper" style={{ flex: 1, position: 'relative' }}>
          <input 
            type="text" 
            className="search-input glassmorphism"
            placeholder="Buscar por servicio o médico..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', borderRadius: '12px' }}
          />
        </div>
        <button className="btn-primary" onClick={onAddClick}>
          <span>+</span> Nuevo Servicio
        </button>
      </div>

      <div className="table-wrapper glassmorphism">
        <table className="modern-table">
          <thead>
            <tr>
              <th>Servicio</th>
              <th>Precio (USD)</th>
              <th>Estatus IVA</th>
              <th>Médico Defecto</th>
              <th>Insumos</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" style={{textAlign: 'center', padding: '2rem'}}>Cargando servicios...</td></tr>
            ) : filteredServices.length === 0 ? (
              <tr><td colSpan="6" style={{textAlign: 'center', padding: '2rem'}}>No se encontraron servicios registrados.</td></tr>
            ) : filteredServices.map(service => (
              <tr key={service.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div className="avatar" style={{ width: '32px', height: '32px', fontSize: '0.8rem' }}>
                      {service.nombre.substring(0,2).toUpperCase()}
                    </div>
                    <span style={{ fontWeight: '600' }}>{service.nombre}</span>
                  </div>
                </td>
                <td><span className="text-cyan" style={{ fontWeight: '700' }}>${Number(service.precio_usd).toFixed(2)}</span></td>
                <td>
                  <span className={`status-badge ${service.es_exento ? 'active' : 'inactive'}`}>
                    {service.es_exento ? 'Exento' : 'IVA 16%'}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.9rem' }}>{getDoctorName(service)}</span>
                    {service.id_medico_defecto && !service.medico_nombre && (
                      <span className="subtitle" style={{ fontSize: '0.7rem', opacity: 0.6 }}>ID: {service.id_medico_defecto}</span>
                    )}
                  </div>
                </td>
                <td>
                  <div className="tooltip-container">
                    <span className="commission-badge">
                      {service.insumos ? service.insumos.length : 0} ítems
                    </span>
                    {service.insumos && service.insumos.length > 0 && (
                      <div className="tooltip-content glassmorphism">
                        <div style={{ fontWeight: 'bold', borderBottom: '1px solid var(--border-color)', marginBottom: '5px', paddingBottom: '3px' }}>
                          Receta Técnica
                        </div>
                        {service.insumos.map((i, idx) => (
                          <div key={idx} style={{ fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
                            <span>{i.nombre}</span>
                            <span style={{ fontWeight: 'bold', color: 'var(--accent-cyan)' }}>x{i.cantidad}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </td>
                <td>
                  <div className="action-buttons">
                    <button className="btn-view" title="Editar" onClick={() => onEditClick(service)}>✏️</button>
                    <button className="btn-delete" title="Eliminar" onClick={() => handleDeleteClick(service)}>🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <style>{`
        .tooltip-container {
          position: relative;
          display: inline-block;
          cursor: help;
        }
        .tooltip-content {
          visibility: hidden;
          width: 200px;
          bottom: 125%;
          left: 50%;
          transform: translateX(-50%);
          position: absolute;
          z-index: 1001;
          padding: 12px;
          opacity: 0;
          transition: opacity 0.3s;
          pointer-events: none;
        }
        .tooltip-container:hover .tooltip-content {
          visibility: visible;
          opacity: 1;
        }
      `}</style>
    </div>
  );
};

export default ServiceList;
