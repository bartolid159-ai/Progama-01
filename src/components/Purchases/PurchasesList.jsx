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
  const [searchTerm, setSearchTerm] = useState('');
  const [searchFecha, setSearchFecha] = useState('');

  const [proveedor, setProveedor] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [items, setItems] = useState([]);
  const [saving, setSaving] = useState(false);

  const [selectedInsumo, setSelectedInsumo] = useState('');
  const [cantidad, setCantidad] = useState(1);
  const [costoTotal, setCostoTotal] = useState('');

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

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const addItem = () => {
    if (!selectedInsumo || !cantidad || !costoTotal) {
      showNotification('Complete todos los campos del ítem', 'error');
      return;
    }
    const cantNum = Number(cantidad);
    const totalNum = Number(costoTotal);
    if (cantNum <= 0 || totalNum <= 0) {
      showNotification('Cantidad y costo deben ser mayores a 0', 'error');
      return;
    }
    const insumo = insumos.find(i => Number(i.id) === Number(selectedInsumo));
    if (!insumo) return;

    // Costo unitario calculado automáticamente
    const costo_unitario_usd = Math.round((totalNum / cantNum) * 10000) / 10000;

    setItems([...items, {
      id_insumo: Number(selectedInsumo),
      insumo_nombre: insumo.nombre,
      insumo_codigo: insumo.codigo,
      cantidad: cantNum,
      costo_total_usd: totalNum,
      costo_unitario_usd
    }]);

    setSelectedInsumo('');
    setCantidad(1);
    setCostoTotal('');
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
      const result = await insumoLogic.registrarCompra({ proveedor, observaciones, items });
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
    return new Date(dateStr).toLocaleDateString('es-VE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const filteredCompras = compras.filter(c => {
    // Filtro por proveedor o insumo
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchProveedor = c.proveedor && c.proveedor.toLowerCase().includes(q);
      // Buscar dentro de los insumos del lote
      const matchInsumo = c.detalles && c.detalles.some(d =>
        (d.insumo_nombre && d.insumo_nombre.toLowerCase().includes(q)) ||
        (d.insumo_codigo && d.insumo_codigo.toLowerCase().includes(q))
      );
      if (!matchProveedor && !matchInsumo) return false;
    }
    // Filtro por fecha
    if (searchFecha) {
      const fechaCompra = c.fecha ? c.fecha.split('T')[0] : '';
      if (fechaCompra !== searchFecha) return false;
    }
    return true;
  });

  const getProveedorInitials = (name) => {
    if (!name) return '?';
    const words = name.trim().split(' ');
    return words.length >= 2
      ? (words[0][0] + words[1][0]).toUpperCase()
      : name.substring(0, 2).toUpperCase();
  };

  if (loading && !showForm) return (
    <div className="patient-list animate-in">
      <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
        Cargando compras...
      </div>
    </div>
  );

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
          {/* Barra de búsqueda con 3 criterios */}
          <div className="search-bar-container" style={{ gap: '10px', flexWrap: 'wrap' }}>
            {/* Búsqueda texto: proveedor o insumo */}
            <div className="search-input-wrapper" style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
              <input
                type="text"
                className="search-input glassmorphism"
                placeholder="🔍 Buscar por proveedor o insumo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: '100%', borderRadius: '12px' }}
              />
            </div>

            {/* Búsqueda por fecha */}
            <div style={{ position: 'relative' }}>
              <input
                type="date"
                className="search-input glassmorphism"
                value={searchFecha}
                onChange={(e) => setSearchFecha(e.target.value)}
                style={{
                  borderRadius: '12px',
                  minWidth: '170px',
                  cursor: 'pointer',
                  colorScheme: 'dark',
                }}
                title="Filtrar por fecha"
              />
            </div>

            {/* Limpiar filtros */}
            {(searchTerm || searchFecha) && (
              <button
                className="btn-secondary"
                onClick={() => { setSearchTerm(''); setSearchFecha(''); }}
                title="Limpiar filtros"
                style={{ whiteSpace: 'nowrap' }}
              >
                ✕ Limpiar
              </button>
            )}

            <button className="btn-primary" onClick={() => setShowForm(true)} style={{ whiteSpace: 'nowrap' }}>
              <span>+</span> Nueva Compra
            </button>
          </div>

          {/* Tabla con el mismo wrapper que SuppliesList */}
          <div className="table-wrapper glassmorphism">
            <table className="modern-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Proveedor</th>
                  <th>Fecha</th>
                  <th>Lotes</th>
                  <th>Total USD</th>
                  <th>Detalle</th>
                </tr>
              </thead>
              <tbody>
                {filteredCompras.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>
                      No se encontraron compras registradas.
                    </td>
                  </tr>
                ) : filteredCompras.map(compra => (
                  <React.Fragment key={compra.id}>
                    <tr>
                      {/* ID */}
                      <td>
                        <span className="code-badge">#{String(compra.id).slice(-6)}</span>
                      </td>

                      {/* Proveedor con avatar */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div className="avatar" style={{ width: '32px', height: '32px', fontSize: '0.8rem' }}>
                            {getProveedorInitials(compra.proveedor)}
                          </div>
                          <span style={{ fontWeight: '600' }}>{compra.proveedor || '—'}</span>
                        </div>
                      </td>

                      {/* Fecha */}
                      <td>{formatDate(compra.fecha)}</td>

                      {/* Badge de lotes — como category-badge */}
                      <td>
                        <span className="category-badge">
                          {compra.num_items || (compra.detalles ? compra.detalles.length : 0)} Lote{(compra.num_items || 0) !== 1 ? 's' : ''}
                        </span>
                      </td>

                      {/* Total */}
                      <td>
                        <span className="text-green" style={{ fontWeight: '700' }}>
                          ${formatCurrency(compra.total_usd)}
                        </span>
                      </td>

                      {/* Botón expandir */}
                      <td>
                        <div className="action-buttons">
                          <button
                            className="btn-view"
                            title={expandedId === compra.id ? 'Cerrar detalle' : 'Ver detalle'}
                            onClick={() => toggleExpand(compra.id)}
                          >
                            {expandedId === compra.id ? '▲' : '▼'}
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Fila expandida con desglose de insumos */}
                    {expandedId === compra.id && (
                      <tr>
                        <td colSpan="6" style={{ padding: '0', background: 'rgba(6, 182, 212, 0.04)' }}>
                          <div style={{ padding: '20px 28px', borderTop: '1px solid var(--border-color)' }}>
                            {/* Sub-encabezado */}
                            <p style={{ margin: '0 0 14px', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--accent-cyan)' }}>
                              📋 Insumos del lote
                            </p>

                            <table className="modern-table" style={{ marginBottom: 0 }}>
                              <thead>
                                <tr>
                                  <th>Insumo</th>
                                  <th>Cantidad</th>
                                  <th>Costo Unitario</th>
                                  <th>Subtotal</th>
                                </tr>
                              </thead>
                              <tbody>
                                {compra.detalles && compra.detalles.length > 0 ? (
                                  compra.detalles.map((det, idx) => (
                                    <tr key={idx}>
                                      <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                          <div className="avatar" style={{ width: '28px', height: '28px', fontSize: '0.7rem' }}>
                                            {(det.insumo_nombre || det.insumo_codigo || '?').substring(0, 2).toUpperCase()}
                                          </div>
                                          <span style={{ fontWeight: '600' }}>{det.insumo_nombre || det.insumo_codigo}</span>
                                        </div>
                                      </td>
                                      <td>{det.cantidad} und.</td>
                                      <td>
                                        <span className="text-cyan" style={{ fontWeight: '700' }}>
                                          ${formatCurrency(det.costo_unitario_usd)}
                                        </span>
                                      </td>
                                      <td>
                                        <span className="text-green" style={{ fontWeight: '600' }}>
                                          ${formatCurrency(det.cantidad * det.costo_unitario_usd)}
                                        </span>
                                      </td>
                                    </tr>
                                  ))
                                ) : (
                                  <tr>
                                    <td colSpan="4" style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)' }}>
                                      Sin detalles disponibles para este lote.
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>

                            {compra.observaciones && (
                              <div style={{ marginTop: '14px', padding: '10px 14px', background: 'rgba(6,182,212,0.08)', borderLeft: '3px solid var(--accent-cyan)', borderRadius: '6px' }}>
                                <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--accent-cyan)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Notas: </span>
                                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{compra.observaciones}</span>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        /* ── Formulario Nueva Compra ── */
        <div style={{ maxWidth: '800px' }}>
          <div className="search-bar-container" style={{ marginBottom: '24px' }}>
            <h3 style={{ margin: 0 }}>Nueva Compra</h3>
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
            <h4 style={{ margin: '0 0 16px', color: 'var(--accent-cyan)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Agregar Insumo al Lote
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '10px', alignItems: 'end' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label>Insumo</label>
                <select
                  className="custom-select"
                  value={selectedInsumo}
                  onChange={(e) => setSelectedInsumo(e.target.value)}
                  style={{ width: '100%' }}
                >
                  <option value="">Seleccionar...</option>
                  {insumos.map(i => (
                    <option key={i.id} value={i.id}>
                      {i.codigo} — {i.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label>Cantidad</label>
                <input type="number" min="1" value={cantidad} onChange={(e) => setCantidad(e.target.value)} />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label>Costo Total (USD)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={costoTotal}
                  onChange={(e) => setCostoTotal(e.target.value)}
                  placeholder="Ej: 50.00"
                />
                {/* Muestra el costo unitario calculado en tiempo real */}
                {costoTotal && cantidad > 0 && (
                  <small style={{ color: 'var(--accent-cyan)', marginTop: '4px', display: 'block', fontSize: '0.78rem' }}>
                    Costo unit.: ${formatCurrency(Number(costoTotal) / Number(cantidad))} / und.
                  </small>
                )}
              </div>
              <button className="btn-primary" onClick={addItem} style={{ marginBottom: '0' }}>+</button>
            </div>
          </div>

          {items.length > 0 && (
            <div className="table-wrapper glassmorphism" style={{ marginTop: '20px' }}>
              <table className="modern-table">
                <thead>
                  <tr>
                    <th>Insumo</th>
                    <th>Cantidad</th>
                    <th>Costo Unit. (calc.)</th>
                    <th>Total</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr key={idx}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div className="avatar" style={{ width: '28px', height: '28px', fontSize: '0.7rem' }}>
                            {item.insumo_nombre.substring(0, 2).toUpperCase()}
                          </div>
                          <span style={{ fontWeight: '600' }}>{item.insumo_codigo} — {item.insumo_nombre}</span>
                        </div>
                      </td>
                      <td>{item.cantidad}</td>
                      <td>
                        <span className="text-cyan" style={{ fontWeight: '700' }}>${formatCurrency(item.costo_unitario_usd)}</span>
                        <small style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.75rem' }}>por unidad</small>
                      </td>
                      <td><span className="text-green" style={{ fontWeight: '600' }}>${formatCurrency(item.costo_total_usd ?? item.cantidad * item.costo_unitario_usd)}</span></td>
                      <td>
                        <div className="action-buttons">
                          <button className="btn-delete" onClick={() => removeItem(idx)} title="Eliminar">🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan="3" style={{ textAlign: 'right', fontWeight: '700', color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase' }}>
                      Total del Lote:
                    </td>
                    <td colSpan="2">
                      <span className="text-green" style={{ fontWeight: '700', fontSize: '1.1rem' }}>
                        ${formatCurrency(totalUSD)}
                      </span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          <div style={{ marginTop: '24px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button className="btn-secondary" onClick={() => setShowForm(false)}>Cancelar</button>
            <button
              className="btn-primary"
              onClick={handleSave}
              disabled={saving || items.length === 0}
            >
              {saving ? 'Guardando...' : '✅ Registrar Compra'}
            </button>
          </div>
        </div>
      )}

      {/* Estilos locales que heredan del módulo de inventario */}
      <style>{`
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
          min-width: 100%;
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

export default PurchasesList;