import { useState, useEffect } from 'react';
import * as doctorService from '../../logic/doctorService.js';

const DoctorList = ({ onAddClick, onEditClick, onDeleteClick }) => {
  const [doctors, setDoctors] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchDoctors = async () => {
    setLoading(true);
    const results = await doctorService.getDoctors();
    setDoctors(results);
    setLoading(false);
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      const results = await doctorService.searchDoctors(searchTerm);
      setDoctors(results);
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const handleDelete = async (id) => {
    if (window.confirm('¿Está seguro de que desea eliminar este médico?')) {
      const result = await doctorService.deleteDoctor(id);
      if (result.success) {
        fetchDoctors();
      } else {
        alert(result.message);
      }
    }
  };

  return (
    <div className="doctor-list animate-fade">
      <div className="search-bar-container">
        <input
          type="text"
          className="search-input glassmorphism"
          placeholder="Buscar por nombre, cédula o especialidad..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button className="btn-primary" onClick={onAddClick}>+ Nuevo Médico</button>
      </div>

      <div className="table-wrapper glassmorphism">
        <table className="modern-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Cédula / RIF</th>
              <th>Especialidad</th>
              <th>Teléfono</th>
              <th>Comisión</th>
              <th>Estatus</th>
              <th style={{ textAlign: 'center' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7">Cargando...</td></tr>
            ) : doctors.length === 0 ? (
              <tr><td colSpan="7">No se encontraron médicos.</td></tr>
            ) : (
              doctors.map(d => (
                <tr key={d.id}>
                  <td>
                    <div style={{ fontWeight: '500' }}>{d.nombre}</div>
                    <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>{d.correo || 'Sin correo'}</div>
                  </td>
                  <td>{d.cedula_rif || 'N/A'}</td>
                  <td>{d.especialidad}</td>
                  <td>{d.telefono || 'N/A'}</td>
                  <td><span className="commission-badge">{d.porcentaje_comision}%</span></td>
                  <td>
                    <span className={`status-badge ${d.activo ? 'active' : 'inactive'}`}>
                      {d.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons" style={{ justifyContent: 'center' }}>
                      <button 
                        className="btn-view" 
                        title="Editar Médico" 
                        onClick={() => onEditClick(d)}
                      >
                        ✏️
                      </button>
                      <button 
                        className="btn-delete" 
                        title="Eliminar Médico" 
                        onClick={() => handleDelete(d.id)}
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DoctorList;
