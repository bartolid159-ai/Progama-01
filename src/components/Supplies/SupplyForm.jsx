import { useState, useEffect } from 'react';
import * as insumoLogic from '../../logic/insumoLogic';

const SupplyForm = ({ onSave, onCancel, insumo = null }) => {
  const [formData, setFormData] = useState(insumo || {
    codigo: '',
    nombre: '',
    descripcion: '',
    id_categoria: '',
    stock_actual: 0,
    stock_minimo: 0,
    unidad_medida: '',
    costo_unitario_usd: ''
  });

  const [categorias, setCategorias] = useState([]);
  const [showNewCategoria, setShowNewCategoria] = useState(false);
  const [newCategoria, setNewCategoria] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const categoriasData = await insumoLogic.getCategorias();
    setCategorias(categoriasData);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  const handleAddCategoria = async () => {
    if (!newCategoria.trim()) {
      setError('Ingrese el nombre de la categoría.');
      return;
    }
    
    const result = await insumoLogic.registerCategoria(newCategoria.trim());
    if (result.success) {
      await loadData();
      setFormData(prev => ({ ...prev, id_categoria: result.id }));
      setShowNewCategoria(false);
      setNewCategoria('');
      setError(null);
    } else {
      setError(result.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.codigo || !formData.nombre) {
      setError('Código y nombre son obligatorios.');
      return;
    }

    const payload = {
      ...formData,
      id_categoria: formData.id_categoria ? Number(formData.id_categoria) : null,
      stock_actual: Number(formData.stock_actual) || 0,
      stock_minimo: Number(formData.stock_minimo) || 0,
      costo_unitario_usd: Number(formData.costo_unitario_usd) || 0
    };

    let result;
    if (insumo && insumo.id) {
      result = await insumoLogic.updateInsumo({ ...payload, id: insumo.id });
    } else {
      result = await insumoLogic.registerInsumo(payload);
    }

    if (result.success) {
      onSave(result.message);
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="patient-form-overlay glassmorphism animate-in">
      <div className="patient-form-modal container-card" style={{ maxWidth: '600px' }}>
        <h3>{insumo ? 'Editar Insumo' : 'Nuevo Insumo'}</h3>
        <p className="subtitle">Configure los datos del insumo o material.</p>

        <form onSubmit={handleSubmit} className="patient-form-grid">
          <div className="form-group">
            <label>Código / SKU *</label>
            <input 
              type="text" 
              name="codigo" 
              value={formData.codigo} 
              onChange={handleChange} 
              placeholder="Ej. G-001"
              required 
            />
          </div>

          <div className="form-group">
            <label>Nombre *</label>
            <input 
              type="text" 
              name="nombre" 
              value={formData.nombre} 
              onChange={handleChange} 
              placeholder="Ej. Guantes de Látex"
              required 
            />
          </div>

          <div className="form-group full-width">
            <label>Descripción</label>
            <textarea 
              name="descripcion" 
              value={formData.descripcion} 
              onChange={handleChange} 
              placeholder="Descripción adicional del insumo..."
              rows={2}
            />
          </div>

          <div className="form-group">
            <label>Categoría</label>
            {!showNewCategoria ? (
              <div style={{ display: 'flex', gap: '8px' }}>
                <select 
                  name="id_categoria" 
                  value={formData.id_categoria} 
                  onChange={handleChange}
                  style={{ flex: 1 }}
                >
                  <option value="">Seleccionar...</option>
                  {categorias.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                  ))}
                </select>
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={() => setShowNewCategoria(true)}
                  style={{ padding: '8px 12px' }}
                >+</button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '8px' }}>
                <input 
                  type="text" 
                  value={newCategoria} 
                  onChange={(e) => setNewCategoria(e.target.value)}
                  placeholder="Nueva categoría..."
                  style={{ flex: 1 }}
                />
                <button type="button" className="btn-primary" onClick={handleAddCategoria}>✓</button>
                <button type="button" className="btn-secondary" onClick={() => setShowNewCategoria(false)}>×</button>
              </div>
            )}
          </div>

          <div className="form-group">
            <label>Stock Actual</label>
            <input 
              type="number" 
              name="stock_actual" 
              value={formData.stock_actual} 
              onChange={handleChange} 
              min="0"
            />
          </div>

          <div className="form-group">
            <label>Stock Mínimo</label>
            <input 
              type="number" 
              name="stock_minimo" 
              value={formData.stock_minimo} 
              onChange={handleChange} 
              min="0"
            />
          </div>

          <div className="form-group">
            <label>Unidad de Medida</label>
            <input 
              type="text" 
              name="unidad_medida" 
              value={formData.unidad_medida} 
              onChange={handleChange} 
              placeholder="Ej. Par, Caja, Litro"
            />
          </div>

          <div className="form-group">
            <label>Costo Unitario (USD)</label>
            <input 
              type="number" 
              name="costo_unitario_usd" 
              value={formData.costo_unitario_usd} 
              onChange={handleChange} 
              step="0.01"
              min="0"
              placeholder="0.00"
            />
          </div>

          {error && <div className="form-error full-width animate-fade">{error}</div>}

          <div className="form-actions full-width" style={{ marginTop: '20px' }}>
            <button type="button" className="btn-secondary" onClick={onCancel}>Cancelar</button>
            <button type="submit" className="btn-primary">Guardar Insumo</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SupplyForm;