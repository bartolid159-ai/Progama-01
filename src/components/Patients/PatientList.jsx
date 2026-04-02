import { useState, useEffect } from 'react';
import * as patientService from '../../logic/patientService.js';

const PatientList = ({ onAddClick, onEditClick }) => {
  const [patients, setPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initial fetch
    const fetchPatients = async () => {
      const initialPatients = await patientService.getPatients();
      setPatients(initialPatients);
      setLoading(false);
    };
    fetchPatients();
  }, []);

  useEffect(() => {
    // Search with debounce logic
    const delayDebounceFn = setTimeout(async () => {
      const results = await patientService.searchPatients(searchTerm);
      setPatients(results);
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  return (
    <div className="patient-list animate-fade">
      <div className="search-bar-container">
        <input
          type="text"
          className="search-input glassmorphism"
          placeholder="Buscar por nombre o cédula..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button className="btn-primary" onClick={onAddClick}>+ Nuevo Paciente</button>
      </div>

      <div className="table-wrapper glassmorphism">
        <table className="modern-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Cédula / RIF</th>
              <th>Teléfono</th>
              <th>Correo</th>
              <th>Fecha Nac.</th>
              <th>Sexo</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7">Cargando...</td></tr>
            ) : patients.length === 0 ? (
              <tr><td colSpan="7">No se encontraron pacientes.</td></tr>
            ) : (
              patients.map(p => (
                <tr key={p.id}>
                  <td>{p.nombre}</td>
                  <td>{p.cedula_rif}</td>
                  <td>{p.telefono || '-'}</td>
                  <td>{p.correo || '-'}</td>
                  <td>{p.fecha_nacimiento}</td>
                  <td>{p.sexo}</td>
                  <td><button className="btn-view" title="Editar Paciente" onClick={() => onEditClick(p)}>📄</button></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PatientList;
