import React, { useState, useEffect } from 'react';
import * as insumoLogic from '../../logic/insumoLogic.js';
import Notification from '../Common/Notification';

const PurchasesList = ({ onAddClick }) => {
  const [compras, setCompras] = useState([]);
  const [insumos, setInsumos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [notification, setNotification] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  
  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };
  const [proveedor, setProveedor] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [items, setItems] = useState([]);
  const [saving, setSaving] = useState(false);

  const [selectedInsumo, setSelectedInsumo] = useState('');
  const [cantidad, setCantidad] = useState(1);
  const [costoUnitario, setCostoUnitario] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [comprasData, insumosData] = await Promise.all([
        insumoLogic.getAllCompras(),
        insumoLogic.getInsumos()
      ]);
      setCompras(comprasData);
      setInsumos(insumosData);
    } catch (err) {
      console.error('Error loading data:', err);
    }
    setLoading(false);
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
  };

  const addItem = () => {
    if (!selectedInsumo || !cantidad || !costoUnitario) {
      showNotification('Complete todos los campos del ítem', 'error');
      return;
    }
    const insumo = insumos.find(i => Number(i.id) === Number(selectedInsumo));
    if (!insumo) return;

    setItems([...items, {
      id_insumo: Number(selectedInsumo),
      insumo_nombre: insumo.nombre,
      insumo_codigo: insumo.codigo,
      cantidad: Number(cantidad),
      costo_unitario_usd: Number(costoUnitario)
    }]);
    
    setSelectedInsumo('');
    setCantidad(1);
    setCostoUnitario('');
  };

  const removeItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!proveedor || items.length === 0) {
      showNotification('Proveedor y al menos un ítem son requeridos', 'error');
      return;
    }

    setSaving(true);
    try {
      const result = await insumoLogic.registrarCompra({
        proveedor,
        observaciones,
        items
      });

      if (result.success) {
        showNotification(`Compra #${result.compraId} registrada correctamente`);
        setProveedor('');
        setObservaciones('');
        setItems([]);
        setShowForm(false);
        loadData();
      } else {
        showNotification(result.message || 'Error al registrar', 'error');
      }
    } catch (err) {
      showNotification('Error al registrar la compra', 'error');
    }
    setSaving(false);
  };

  const totalUSD = items.reduce((sum, item) => sum + (item.cantidad * item.costo_unitario_usd), 0);

  const formatCurrency = (value) => Number(value || 0).toFixed(2);
  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-VE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  if (loading) return <div className="patient-list">Cargando...</div>;

  return (
    <div className="patient-list animate-in">
      {notification && (
        <Notification 
          message={notification.message} 
          type={notification.type} 
          onClose={() => setNotification(null)} 
        />
      )}

      {!showForm ? (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 style={{ margin: 0 }}>Registro de Compras</h3>
              <p style={{ margin: '5px 0', color: '#888', fontSize: '0.9rem' }}>
                Historial de abastecimiento de inventario
              </p>
            </div>
            <button className="btn-primary" onClick={() => setShowForm(true)}>
              ➕ Nueva Compra
            </button>
          </div>

          {compras.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
              <p>No hay compras registradas</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Fecha</th>
                  <th>Proveedor</th>
                  <th>Items</th>
                  <th>Total USD</th>
                </tr>
              </thead>
              <tbody>
                {compras.map(compra => (
                  <React.Fragment key={compra.id}>
                    <tr 
                      onClick={() => toggleExpand(compra.id)}
                      style={{ 
                        cursor: 'pointer', 
                        backgroundColor: expandedId === compra.id ? 'var(--bg-secondary, #f8fafc)' : 'transparent',
                        transition: 'all 0.2s ease',
                      }}
                      className="table-row-hover"
                    >
                      <td style={{ fontWeight: '600' }}>#{compra.id}</td>
                      <td>{formatDate(compra.fecha)}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          📦 <span style={{ fontWeight: '500' }}>{compra.proveedor || '-'}</span>
                        </div>
                      </td>
                      <td><span className="badge" style={{ backgroundColor: 'var(--primary-light, #e0e7ff)', color: 'var(--primary-color, #4338ca)', padding: '4px 8px', borderRadius: '12px', fontSize: '0.85em', fontWeight: 'bold' }}>{compra.num_items || 0} Lotes</span></td>
                      <td style={{ fontWeight: 'bold', color: 'var(--success-color, #10b981)' }}>${formatCurrency(compra.total_usd)}</td>
                    </tr>
                    {expandedId === compra.id && (
                      <tr>
                        <td colSpan="5" style={{ padding: '0' }}>
                          <div style={{ 
                            padding: '20px', 
                            backgroundColor: 'var(--bg-panel, rgba(255,255,255,0.03))', 
                            borderBottom: '1px solid var(--border-color, #334155)',
                            animation: 'fadeIn 0.3s ease'
                          }}>
                            <div style={{ 
                              backgroundColor: 'var(--bg-card, rgba(0,0,0,0.2))', 
                              borderRadius: '12px', 
                              padding: '20px', 
                              border: '1px solid var(--border-color, #334155)',
                              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' 
                            }}>
                              <h4 style={{ margin: '0 0 15px 0', fontSize: '1rem', color: 'var(--text-secondary, #94a3b8)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                📋 Desglose de Insumos Recibidos
                              </h4>
                              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem' }}>
                                <thead>
                                  <tr style={{ borderBottom: '2px solid var(--border-color, #334155)', color: 'var(--text-secondary, #94a3b8)', textAlign: 'left' }}>
                                    <th style={{ padding: '10px 8px' }}>Insumo</th>
                                    <th style={{ padding: '10px 8px' }}>Cantidad</th>
                                    <th style={{ padding: '10px 8px' }}>Costo Unit.</th>
                                    <th style={{ padding: '10px 8px' }}>Subtotal</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {compra.detalles && compra.detalles.length > 0 ? (
                                    compra.detalles.map((det, idx) => (
                                      <tr key={idx} style={{ borderBottom: '1px solid var(--border-color, #334155)', transition: 'background-color 0.2s' }}>
                                        <td style={{ padding: '12px 8px', fontWeight: '500', color: 'var(--text-primary, #fff)' }}>{det.insumo_nombre || det.insumo_codigo}</td>
                                        <td style={{ padding: '12px 8px' }}>{det.cantidad} und.</td>
                                        <td style={{ padding: '12px 8px' }}>${formatCurrency(det.costo_unitario_usd)}</td>
                                        <td style={{ padding: '12px 8px', fontWeight: 'bold' }}>${formatCurrency(det.cantidad * det.costo_unitario_usd)}</td>
                                      </tr>
                                    ))
                                  ) : (
                                    <tr><td colSpan="4" style={{ padding: '15px 8px', textAlign: 'center', color: 'var(--text-muted, #64748b)' }}>Sin detalles registrados en este lote</td></tr>
                                  )}
                                </tbody>
                              </table>
                              {compra.observaciones && (
                                <div style={{ marginTop: '15px', padding: '12px', backgroundColor: 'rgba(56, 189, 248, 0.1)', borderLeft: '3px solid #38bdf8', borderRadius: '4px' }}>
                                  <strong style={{ color: '#38bdf8', fontSize: '0.85em', textTransform: 'uppercase' }}>Notas:</strong>
                                  <p style={{ margin: '5px 0 0 0', fontSize: '0.9em', color: 'var(--text-secondary, #94a3b8)' }}>{compra.observaciones}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          )}
        </>
      ) : (
        <div style={{ maxWidth: '800px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3>Nueva Compra</h3>
            <button className="btn-secondary" onClick={() => setShowForm(false)}>
              ← Volver
            </button>
          </div>

          <div className="form-section">
            <div className="form-group">
              <label>Proveedor *</label>
              <input
                type="text"
                value={proveedor}
                onChange={(e) => setProveedor(e.target.value)}
                placeholder="Nombre del proveedor"
              />
            </div>
            <div className="form-group">
              <label>Observaciones</label>
              <textarea
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Notas adicionales..."
                rows={2}
              />
            </div>
          </div>

          <div className="form-section" style={{ marginTop: '20px' }}>
            <h4>Agregar Insumo</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '10px', alignItems: 'end' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label>Insumo</label>
                <select
                  value={selectedInsumo}
                  onChange={(e) => setSelectedInsumo(e.target.value)}
                >
                  <option value="">Seleccionar...</option>
                  {insumos.map(i => (
                    <option key={i.id} value={i.id}>
                      {i.codigo} - {i.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label>Cantidad</label>
                <input
                  type="number"
                  min="1"
                  value={cantidad}
                  onChange={(e) => setCantidad(e.target.value)}
                />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label>Costo Unit. (USD)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={costoUnitario}
                  onChange={(e) => setCostoUnitario(e.target.value)}
                />
              </div>
              <button className="btn-primary" onClick={addItem} style={{ marginBottom: '0' }}>
                +
              </button>
            </div>
          </div>

          {items.length > 0 && (
            <table className="data-table" style={{ marginTop: '15px' }}>
              <thead>
                <tr>
                  <th>Insumo</th>
                  <th>Cantidad</th>
                  <th>Costo Unit.</th>
                  <th>Subtotal</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={idx}>
                    <td>{item.insumo_codigo} - {item.insumo_nombre}</td>
                    <td>{item.cantidad}</td>
                    <td>${formatCurrency(item.costo_unitario_usd)}</td>
                    <td>${formatCurrency(item.cantidad * item.costo_unitario_usd)}</td>
                    <td>
                      <button
                        className="btn-icon"
                        onClick={() => removeItem(idx)}
                        title="Eliminar"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan="3" style={{ textAlign: 'right', fontWeight: 'bold' }}>
                    Total:
                  </td>
                  <td style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                    ${formatCurrency(totalUSD)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          )}

          <div style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button className="btn-secondary" onClick={() => setShowForm(false)}>
              Cancelar
            </button>
            <button
              className="btn-primary"
              onClick={handleSave}
              disabled={saving || items.length === 0}
            >
              {saving ? 'Guardando...' : 'Registrar Compra'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchasesList;