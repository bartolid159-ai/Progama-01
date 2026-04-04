import { useState } from 'react';
import * as doctorService from '../../logic/doctorService.js';

const DoctorForm = ({ onSave, onCancel, doctor = null }) => {
  const [formData, setFormData] = useState(doctor || {
    nombre: '',
    cedula_rif: '',
    telefono: '',
    correo: '',
    especialidad: '',
    porcentaje_comision: 0
  });

  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const submissionData = {
      ...formData,
      porcentaje_comision: parseInt(formData.porcentaje_comision, 10)
    };

    let result;
    if (doctor && doctor.id) {
      result = await doctorService.updateDoctor({ ...submissionData, id: doctor.id });
    } else {
      result = await doctorService.registerDoctor(submissionData);
    }

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
        <h3>{doctor ? 'Editar Médico' : 'Registrar Nuevo Médico'}</h3>
        <p className="subtitle">Ingrese los datos completos del profesional.</p>
        
        <form onSubmit={handleSubmit} className="patient-form-grid">
          <div className="form-group full-width">
             <label htmlFor="nombre">Nombre Completo *</label>
             <input 
               type="text" 
               id="nombre" 
               name="nombre" 
               required 
               value={formData.nombre} 
               onChange={handleChange} 
               placeholder="Ej. Dr. Gregory House" 
             />
          </div>

          <div className="form-group">
            <label htmlFor="cedula_rif">Cédula / RIF</label>
            <input 
              type="text" 
              id="cedula_rif" 
              name="cedula_rif" 
              value={formData.cedula_rif || ''} 
              onChange={handleChange} 
              placeholder="Ej. V-12345678" 
            />
          </div>

          <div className="form-group">
            <label htmlFor="especialidad">Especialidad *</label>
            <input 
              type="text" 
              id="especialidad" 
              name="especialidad" 
              required 
              value={formData.especialidad} 
              onChange={handleChange} 
              placeholder="Ej. Cardiología" 
            />
          </div>

          <div className="form-group">
            <label htmlFor="telefono">Teléfono</label>
            <input 
              type="tel" 
              id="telefono" 
              name="telefono" 
              value={formData.telefono || ''} 
              onChange={handleChange} 
              placeholder="Ej. 0412-1234567" 
            />
          </div>

          <div className="form-group">
            <label htmlFor="correo">Correo Electrónico</label>
            <input 
              type="email" 
              id="correo" 
              name="correo" 
              value={formData.correo || ''} 
              onChange={handleChange} 
              placeholder="ejemplo@correo.com" 
            />
          </div>

          <div className="form-group">
            <label htmlFor="porcentaje_comision">Comisión (%) *</label>
            <input 
              type="number" 
              id="porcentaje_comision" 
              name="porcentaje_comision" 
              required 
              min="0"
              max="100"
              value={formData.porcentaje_comision} 
              onChange={handleChange} 
              placeholder="Ej. 30" 
            />
          </div>

          {error && <div className="form-error animate-fade full-width">{error}</div>}

          <div className="form-actions full-width">
            <button type="button" className="btn-secondary" onClick={onCancel}>Cancelar</button>
            <button type="submit" className="btn-primary">
              {doctor ? 'Actualizar Médico' : 'Guardar Médico'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DoctorForm;
