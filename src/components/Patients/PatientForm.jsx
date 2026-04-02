import { useState } from 'react';
import * as patientService from '../../logic/patientService.js';

const PatientForm = ({ onSave, onCancel, patient = null }) => {
  const [formData, setFormData] = useState(patient || {
    cedula_rif: '',
    nombre: '',
    sexo: 'F',
    fecha_nacimiento: '',
    telefono: '',
    correo: '',
    direccion: ''
  });

  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await patientService.registerPatient(formData);
    if (result.success) {
      onSave(result.message);
    } else {
      setError(result.message);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError(null);
  };

  return (
    <div className="patient-form-overlay glassmorphism animate-in">
      <div className="patient-form-modal container-card">
        <h3>Registrar Nuevo Paciente</h3>
        <p className="subtitle">Ingrese los datos para la ficha administrativa.</p>
        
        <form onSubmit={handleSubmit} className="patient-form-grid">
          <div className="form-group full-width">
             <label htmlFor="nombre">Nombre Completo *</label>
             <input type="text" id="nombre" name="nombre" required value={formData.nombre} onChange={handleChange} placeholder="Ej. Juan Pérez" />
          </div>

          <div className="form-group">
            <label htmlFor="cedula_rif">Cédula / RIF *</label>
            <input type="text" id="cedula_rif" name="cedula_rif" required value={formData.cedula_rif} onChange={handleChange} placeholder="Ej. V-12345678" />
          </div>

          <div className="form-group">
            <label htmlFor="fecha_nacimiento">Fecha de Nacimiento *</label>
            <input type="date" id="fecha_nacimiento" name="fecha_nacimiento" required value={formData.fecha_nacimiento} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label htmlFor="sexo">Sexo *</label>
            <select id="sexo" name="sexo" required value={formData.sexo} onChange={handleChange}>
              <option value="F">Femenino</option>
              <option value="M">Masculino</option>
              <option value="O">Otro</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="telefono">Teléfono</label>
            <input type="tel" id="telefono" name="telefono" value={formData.telefono} onChange={handleChange} placeholder="+58 412..." />
          </div>

          <div className="form-group">
            <label htmlFor="correo">Correo Electrónico</label>
            <input type="email" id="correo" name="correo" value={formData.correo} onChange={handleChange} placeholder="ejemplo@email.com" />
          </div>

          <div className="form-group full-width">
            <label htmlFor="direccion">Dirección</label>
            <textarea id="direccion" name="direccion" rows="2" value={formData.direccion} onChange={handleChange} placeholder="Av. Principal, Edificio..."></textarea>
          </div>

          {error && <div className="form-error animate-fade">{error}</div>}

          <div className="form-actions full-width">
            <button type="button" className="btn-secondary" onClick={onCancel}>Cancelar</button>
            <button type="submit" className="btn-primary">Guardar Paciente</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PatientForm;
