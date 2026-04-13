import { useState, useEffect } from 'react';
import * as serviceLogic from '../../logic/serviceLogic';
import * as doctorService from '../../logic/doctorService';

const ServiceForm = ({ onSave, onCancel, service = null }) => {
  const [formData, setFormData] = useState(service || {
    nombre: '',
    precio_usd: '',
    es_exento: true,
    id_medico_defecto: ''
  });

  const [insumosList, setInsumosList] = useState(service?.insumos || []);
  const [availableDoctors, setAvailableDoctors] = useState([]);
  const [availableInsumos, setAvailableInsumos] = useState([]);
  
  const [selectedInsumoId, setSelectedInsumoId] = useState('');
  const [selectedInsumoQty, setSelectedInsumoQty] = useState(1);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const doctors = await doctorService.getDoctors();
    const insumos = await serviceLogic.getInsumos();
    setAvailableDoctors(doctors);
    setAvailableInsumos(insumos);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  const handleAddInsumo = () => {
    if (!selectedInsumoId) return;
    
    const insumo = availableInsumos.find(i => i.id === Number(selectedInsumoId));
    if (!insumo) return;

    if (insumosList.some(item => item.id_insumo === insumo.id)) {
      setError('Este insumo ya está en la lista.');
      return;
    }

    setInsumosList(prev => [
      ...prev, 
      { id_insumo: insumo.id, nombre: insumo.nombre, cantidad: selectedInsumoQty }
    ]);
    setSelectedInsumoId('');
    setSelectedInsumoQty(1);
    setError(null);
  };

  const handleRemoveInsumo = (id) => {
    setInsumosList(prev => prev.filter(item => item.id_insumo !== id));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nombre || !formData.precio_usd) {
      setError('Por favor complete los campos obligatorios.');
      return;
    }

    const payload = {
      ...formData,
      precio_usd: Number(formData.precio_usd),
      id_medico_defecto: formData.id_medico_defecto ? Number(formData.id_medico_defecto) : null,
      insumos: insumosList
    };

    let result;
    if (service && service.id) {
      result = await serviceLogic.updateService({ ...payload, id: service.id });
    } else {
      result = await serviceLogic.registerService(payload);
    }

    if (result.success) {
      onSave(result.message);
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="patient-form-overlay glassmorphism animate-in">
      <div className="patient-form-modal container-card" style={{ maxWidth: '700px' }}>
        <h3>{service ? 'Editar Servicio' : 'Nuevo Servicio Médico'}</h3>
        <p className="subtitle">Configure el precio y la receta técnica del servicio.</p>

        <form onSubmit={handleSubmit} className="patient-form-grid">
          {/* Sección 1: Datos Básicos */}
          <div className="form-group full-width">
            <label>Nombre del Servicio *</label>
            <input 
              type="text" 
              name="nombre" 
              value={formData.nombre} 
              onChange={handleChange} 
              placeholder="Ej. Consulta Especializada"
              required 
            />
          </div>

          <div className="form-group">
            <label>Precio (USD) *</label>
            <input 
              type="number" 
              step="0.01" 
              name="precio_usd" 
              value={formData.precio_usd} 
              onChange={handleChange} 
              placeholder="0.00"
              required 
            />
          </div>

          <div className="form-group">
            <label>Médico por defecto</label>
            <select name="id_medico_defecto" value={formData.id_medico_defecto} onChange={handleChange}>
              <option value="">Seleccione un médico...</option>
              {availableDoctors.map(doc => (
                <option key={doc.id} value={doc.id}>{doc.nombre}</option>
              ))}
            </select>
          </div>

          <div className="form-group full-width" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input 
              type="checkbox" 
              id="es_exento" 
              name="es_exento" 
              checked={formData.es_exento} 
              onChange={handleChange} 
            />
            <label htmlFor="es_exento" style={{ cursor: 'pointer', marginBottom: 0 }}>Servicio Exento de IVA</label>
          </div>

          <hr className="full-width" style={{ margin: '15px 0', border: '0', borderTop: '1px solid var(--border-color)' }} />

          {/* Sección 2: Receta de Insumos */}
          <div className="full-width">
            <h4>Insumos Asociados (Receta Técnica)</h4>
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <select 
                style={{ flex: 2 }}
                value={selectedInsumoId} 
                onChange={(e) => setSelectedInsumoId(e.target.value)}
              >
                <option value="">Seleccionar Insumo...</option>
                {availableInsumos.map(i => (
                  <option key={i.id} value={i.id}>{i.nombre} ({i.unidad_medida})</option>
                ))}
              </select>
              <input 
                style={{ flex: 1 }}
                type="number" 
                min="1" 
                value={selectedInsumoQty} 
                onChange={(e) => setSelectedInsumoQty(Number(e.target.value))}
                placeholder="Cant."
              />
              <button type="button" className="btn-secondary" onClick={handleAddInsumo}>Añadir</button>
            </div>

            <div className="insumos-tags" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '15px' }}>
              {insumosList.length === 0 && <p className="subtitle full-width">No hay insumos añadidos a la receta técnica.</p>}
              {insumosList.map(item => (
                <div key={item.id_insumo} className="glassmorphism" style={{ padding: '10px 15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: '3px solid var(--accent-cyan)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>{item.nombre}</span>
                    <span className="subtitle" style={{ fontSize: '0.8rem' }}>Cantidad: {item.cantidad}</span>
                  </div>
                  <button 
                    type="button"
                    className="btn-delete" 
                    style={{ width: '24px', height: '24px', borderRadius: '4px' }}
                    onClick={() => handleRemoveInsumo(item.id_insumo)}
                  >×</button>
                </div>
              ))}
            </div>
          </div>

          {error && <div className="form-error full-width animate-fade">{error}</div>}

          <div className="form-actions full-width" style={{ marginTop: '20px' }}>
            <button type="button" className="btn-secondary" onClick={onCancel}>Cancelar</button>
            <button type="submit" className="btn-primary">Guardar Servicio</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ServiceForm;
