import { useState, useEffect } from 'react';
import * as insumoLogic from '../../logic/insumoLogic';
import ConfirmModal from '../Common/ConfirmModal';
import Notification from '../Common/Notification';

const SuppliesList = ({ onAddClick, onEditClick }) => {
  const [insumos, setInsumos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoriaFilter, setCategoriaFilter] = useState('');
  
  const [modalOpen, setModalOpen] = useState(false);
  const [insumoToDelete, setInsumoToDelete] = useState(null);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [insumosData, categoriasData] = await Promise.all([
      insumoLogic.getInsumos(),
      insumoLogic.getCategorias()
    ]);
    setInsumos(insumosData);
    setCategorias(categoriasData);
    setLoading(false);
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
  };

  const getCategoriaNombre = (idCategoria) => {
    if (!idCategoria) return 'Sin categoría';
    const cat = categorias.find(c => Number(c.id) === Number(idCategoria));
    return cat ? cat.nombre : `ID: ${idCategoria}`;
  };

  const handleDeleteClick = (insumo) => {
    setInsumoToDelete(insumo);
    setModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!insumoToDelete) return;
    
    const result = await insumoLogic.deleteInsumo(insumoToDelete.id);
    if (result.success) {
      showNotification('Insumo eliminado correctamente');
      loadData();
    } else {
      showNotification(result.message, 'error');
    }
    setModalOpen(false);
    setInsumoToDelete(null);
  };

  const filteredInsumos = insumos.filter(i => {
    const matchSearch = !searchTerm || 
      i.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.codigo?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategoria = !categoriaFilter || Number(i.id_categoria) === Number(categoriaFilter);
    return matchSearch && matchCategoria;
  });

  const isStockBajo = (insumo) => {
    return Number(insumo.stock_actual) <= Number(insumo.stock_minimo);
  };

  const formatCurrency = (value) => {
    return Number(value || 0).toFixed(2);
  };

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
        title="Eliminar Insumo"
        message={`¿Está seguro de eliminar el insumo "${insumoToDelete?.nombre}"? Esta acción no se puede deshacer.`}
        onConfirm={handleConfirmDelete}
        onCancel={() => setModalOpen(false)}
      />

      <div className="search-bar-container">
        <div className="search-input-wrapper" style={{ flex: 1, position: 'relative' }}>
          <input 
            type="text" 
            className="search-input glassmorphism"
            placeholder="Buscar por código o nombre..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', borderRadius: '12px' }}
          />
        </div>
        <select 
          className="custom-select"
          value={categoriaFilter}
          onChange={(e) => setCategoriaFilter(e.target.value)}
        >
          <option value="">Todas las categorías</option>
          {categorias.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.nombre}</option>
          ))}
        </select>
        <button className="btn-primary" onClick={onAddClick}>
          <span>+</span> Nuevo Insumo
        </button>
      </div>

      <div className="table-wrapper glassmorphism">
        <table className="modern-table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Nombre</th>
              <th>Categoría</th>
              <th>Stock</th>
              <th>Mín.</th>
              <th>Costo Unit.</th>
              <th>Costo Total</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="8" style={{textAlign: 'center', padding: '2rem'}}>Cargando insumos...</td></tr>
            ) : filteredInsumos.length === 0 ? (
              <tr><td colSpan="8" style={{textAlign: 'center', padding: '2rem'}}>No se encontraron insumos registrados.</td></tr>
            ) : filteredInsumos.map(insumo => (
              <tr key={insumo.id} className={isStockBajo(insumo) ? 'row-critical' : ''}>
                <td>
                  <span className="code-badge">{insumo.codigo}</span>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div className="avatar" style={{ width: '32px', height: '32px', fontSize: '0.8rem' }}>
                      {insumo.nombre.substring(0,2).toUpperCase()}
                    </div>
                    <span style={{ fontWeight: '600' }}>{insumo.nombre}</span>
                  </div>
                </td>
                <td>
                  <span className="category-badge">
                    {getCategoriaNombre(insumo.id_categoria)}
                  </span>
                </td>
                <td>
                  <span className={isStockBajo(insumo) ? 'stock-critical' : 'stock-ok'}>
                    {insumo.stock_actual} {insumo.unidad_medida}
                  </span>
                </td>
                <td>{insumo.stock_minimo}</td>
                <td><span className="text-cyan" style={{ fontWeight: '700' }}>${formatCurrency(insumo.costo_unitario_usd)}</span></td>
                <td><span className="text-green" style={{ fontWeight: '600' }}>${formatCurrency(insumo.stock_actual * insumo.costo_unitario_usd)}</span></td>
                <td>
                  <div className="action-buttons">
                    <button className="btn-view" title="Editar" onClick={() => onEditClick(insumo)}>✏️</button>
                    <button className="btn-delete" title="Eliminar" onClick={() => handleDeleteClick(insumo)}>🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <style>{`
        .row-critical {
          background-color: rgba(239, 68, 68, 0.1) !important;
        }
        .stock-critical {
          color: #ef4444;
          font-weight: 700;
        }
        .stock-ok {
          color: #22c55e;
          font-weight: 600;
        }
        .code-badge {
          background: var(--accent-cyan);
          color: var(--bg-dark);
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 700;
        }
        .category-badge {
          background: rgba(99, 102, 241, 0.2);
          color: #818cf8;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 0.8rem;
        }
        .custom-select {
          min-width: 220px;
          padding: 0.85rem 3rem 0.85rem 1.5rem;
          border: 1px solid var(--border-color);
          background-color: var(--bg-secondary);
          color: var(--text-main);
          font-size: 1rem;
          font-family: inherit;
          border-radius: 12px;
          outline: none;
          transition: all 0.3s ease;
          appearance: none;
          -webkit-appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2306b6d4' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 1.25rem center;
          cursor: pointer;
          backdrop-filter: blur(10px);
        }
        .custom-select:focus {
          border-color: var(--accent-cyan);
          box-shadow: 0 0 0 2px rgba(6, 182, 212, 0.2);
        }
        .custom-select option {
          background-color: var(--bg-dark, #0f172a);
          color: var(--text-main, #f8fafc);
          padding: 12px;
          font-size: 1rem;
        }
      `}</style>
    </div>
  );
};

export default SuppliesList;