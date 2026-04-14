import React, { useState, useEffect, useCallback, useRef } from 'react';
import * as liquidacionService from '../../logic/liquidacionService';
import * as doctorService from '../../logic/doctorService';
import { getTasaDelDia } from '../../logic/rateService';
import Notification from '../Common/Notification';
import ConfirmModal from '../Common/ConfirmModal';

const LIQ_DRAFT_KEY = 'clinica_liquidacion_draft';

const saveDraft = (data) => {
  try { sessionStorage.setItem(LIQ_DRAFT_KEY, JSON.stringify(data)); } catch (_) {}
};
const loadDraft = () => {
  try { return JSON.parse(sessionStorage.getItem(LIQ_DRAFT_KEY) || 'null'); } catch (_) { return null; }
};
const clearDraft = () => {
  try { sessionStorage.removeItem(LIQ_DRAFT_KEY); } catch (_) {}
};

const LiquidacionPanel = ({ onShowBanner }) => {
  const draft = useRef(loadDraft());
  const [tabActivo, setTabActivo] = useState(draft.current?.tabActivo || 'liquidar');
  const [loading, setLoading] = useState(true);
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(draft.current?.selectedDoctor || null);
  const [doctorSearch, setDoctorSearch] = useState(draft.current?.doctorSearch || '');
  const [doctorSuggestions, setDoctorSuggestions] = useState([]);
  
  const [detalle, setDetalle] = useState(null);
  const [historialGlobal, setHistorialGlobal] = useState([]);
  const [busquedaHistorial, setBusquedaHistorial] = useState('');
  const [filtroFechaDesde, setFiltroFechaDesde] = useState('');
  const [filtroFechaHasta, setFiltroFechaHasta] = useState('');

  const [montoPagar, setMontoPagar] = useState(draft.current?.montoPagar || '');
  const [tasaCambio, setTasaCambio] = useState(36);
  const [metodoPago, setMetodoPago] = useState(draft.current?.metodoPago || 'EFECTIVO_USD');
  const [notas, setNotas] = useState(draft.current?.notas || '');
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [notification, setNotification] = useState(null);
  const [ultimoPago, setUltimoPago] = useState(null);
  const [verRecibo, setVerRecibo] = useState(false);

  // Persistencia de borrador (Draft)
  useEffect(() => {
    saveDraft({ 
      tabActivo,
      selectedDoctor, 
      doctorSearch, 
      montoPagar, 
      metodoPago, 
      notas 
    });
  }, [tabActivo, selectedDoctor, doctorSearch, montoPagar, metodoPago, notas]);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [docs, historial, tasa] = await Promise.all([
        doctorService.getDoctors(),
        liquidacionService.getHistorialGlobalLiquidaciones(),
        getTasaDelDia()
      ]);
      setDoctors(docs.filter(d => d.activo));
      setHistorialGlobal(historial);
      if (tasa) setTasaCambio(tasa);

      // Si había un doctor seleccionado en el borrador, cargar su detalle
      if (draft.current?.selectedDoctor) {
        const data = await liquidacionService.getDetalleLiquidacion(draft.current.selectedDoctor.id, null, null);
        setDetalle(data);
      }
    } catch (err) {
      console.error('Error loading initial data:', err);
    }
    setLoading(false);
  };

  const handleDoctorSearch = (query) => {
    setDoctorSearch(query);
    if (query.length < 1) {
      setDoctorSuggestions([]);
      return;
    }
    const filtered = doctors.filter(d => 
      d.nombre.toLowerCase().includes(query.toLowerCase()) ||
      d.especialidad.toLowerCase().includes(query.toLowerCase())
    );
    setDoctorSuggestions(filtered.slice(0, 5));
  };

  const selectDoctor = async (doc) => {
    setSelectedDoctor(doc);
    setDoctorSearch(doc.nombre);
    setDoctorSuggestions([]);
    
    try {
      const data = await liquidacionService.getDetalleLiquidacion(doc.id, null, null);
      setDetalle(data);
      if (data.resumen && data.resumen.saldo_pendiente_usd > 0) {
        setMontoPagar(data.resumen.saldo_pendiente_usd.toFixed(2));
      } else {
        setMontoPagar('0');
      }
    } catch (err) {
      console.error('Error loading doctor detail:', err);
    }
  };

  const handleProcessPayment = async () => {
    const montoNum = parseFloat(montoPagar);
    if (!montoNum || montoNum <= 0) {
      setNotification({ message: 'El monto a pagar debe ser mayor a 0', type: 'error' });
      return;
    }
    if (detalle && montoNum > (detalle.resumen.saldo_pendiente_usd + 0.01)) {
      setNotification({ message: 'El monto supera el saldo pendiente', type: 'error' });
      return;
    }
    setShowConfirmModal(true);
  };

  const executePayment = async () => {
    setShowConfirmModal(false);
    setIsProcessing(true);
    try {
      const montoNum = parseFloat(montoPagar);
      const pagoData = {
        id_medico: selectedDoctor.id,
        monto_pagado_usd: montoNum,
        tasa_cambio: tasaCambio,
        metodo_pago: metodoPago,
        notas: notas,
        fecha_pago: new Date().toISOString().split('T')[0]
      };
      
      const result = await liquidacionService.registrarPago(pagoData);
      
      if (result.success) {
        setNotification({ message: '✅ Pago registrado con éxito', type: 'success' });
        
        const idTransaccion = result.id;
        setUltimoPago({
          id: idTransaccion,
          monto_pagado_usd: montoNum,
          tasa_cambio: tasaCambio,
          monto_pagado_ves: montoNum * tasaCambio,
          metodo_pago: metodoPago,
          notas: notas,
          fecha_pago: new Date().toISOString(),
          medico: selectedDoctor.nombre,
          especialidad: selectedDoctor.especialidad
        });
        setVerRecibo(true);
        
        clearDraft();
        setMontoPagar('0');
        setNotas('');
        const [nuevoHistorial, nuevoDetalle] = await Promise.all([
          liquidacionService.getHistorialGlobalLiquidaciones(),
          liquidacionService.getDetalleLiquidacion(selectedDoctor.id, null, null)
        ]);
        setHistorialGlobal(nuevoHistorial);
        setDetalle(nuevoDetalle);
      } else {
        setNotification({ message: result.message || 'Error al procesar pago', type: 'error' });
      }
    } catch (err) {
      setNotification({ message: 'Error de red al procesar pago', type: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  const filtrarHistorial = () => {
    return historialGlobal.filter(l => {
      if (busquedaHistorial) {
        const query = busquedaHistorial.toLowerCase();
        const matchId = String(l.id).includes(query);
        const matchNombre = l.nombre_medico?.toLowerCase().includes(query);
        if (!matchId && !matchNombre) return false;
      }
      if (filtroFechaDesde && new Date(l.fecha_pago) < new Date(filtroFechaDesde)) return false;
      if (filtroFechaHasta && new Date(l.fecha_pago) > new Date(filtroFechaHasta + ' 23:59:59')) return false;
      return true;
    });
  };

  const getMetodoLabel = (metodo) => {
    const labels = {
      'EFECTIVO_USD': 'Efectivo USD',
      'EFECTIVO_VES': 'Efectivo VES',
      'TRANSFERENCIA_VES': 'Transferencia VES',
      'TRANSFERENCIA_USD': 'Transferencia USD',
      'PAGO_MOVIL': 'Pago Móvil'
    };
    return labels[metodo] || metodo;
  };

  if (loading) return <div className="loading-container">Cargando Módulo de Liquidación...</div>;

  return (
    <div className="liquidacion-container animate-in">
      {notification && (
        <Notification message={notification.message} type={notification.type} onClose={() => setNotification(null)} />
      )}

      {/* HEADER TABS */}
      <div className="liquidacion-tabs-wrapper">
        <div className="tabs-premium">
          <button 
            className={`tab-item ${tabActivo === 'liquidar' ? 'active' : ''}`}
            onClick={() => setTabActivo('liquidar')}
          >
            Liquidar Médico
          </button>
          <button 
            className={`tab-item ${tabActivo === 'historial' ? 'active' : ''}`}
            onClick={() => setTabActivo('historial')}
          >
            Historial de Pagos
          </button>
        </div>
      </div>

      {tabActivo === 'liquidar' ? (
        <div className="invoice-layout" style={{ marginTop: '20px' }}>
          {/* COLUMNA IZQUIERDA: Selección y Detalles */}
          <div className="invoice-left glassmorphism">
            <h3 className="invoice-section-title">Selección de Médico</h3>
            
            <div className="inv-field">
              {!selectedDoctor ? (
                <>
                  <label>Buscar Médico por nombre o especialidad</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      className="inv-input"
                      placeholder="Ej: Allison Cameron o Cardiología..."
                      value={doctorSearch}
                      onChange={(e) => handleDoctorSearch(e.target.value)}
                      autoComplete="off"
                    />
                    {doctorSuggestions.length > 0 && (
                      <ul className="inv-suggestions">
                        {doctorSuggestions.map(d => (
                          <li key={d.id} onClick={() => selectDoctor(d)}>
                            <strong>{d.nombre}</strong>
                            <span>{d.especialidad} · {d.porcentaje_comision}%</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </>
              ) : (
                <div className="selected-doctor-card animate-in">
                  <div className="doctor-info">
                    <span className="doctor-avatar">👨‍⚕️</span>
                    <div>
                      <div className="doctor-name">{selectedDoctor.nombre}</div>
                      <div className="doctor-specialty">{selectedDoctor.especialidad}</div>
                    </div>
                  </div>
                  <button 
                    type="button" 
                    className="btn-change-doctor"
                    onClick={() => { setSelectedDoctor(null); setDoctorSearch(''); setDetalle(null); }}
                  >
                    Cambiar Médico
                  </button>
                </div>
              )}
            </div>

            {selectedDoctor && detalle && (
              <div style={{ marginTop: '30px', display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
                <h3 className="invoice-section-title">Comisiones Pendientes</h3>
                <div className="inv-items-table scrollable-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Fecha</th>
                        <th>Paciente</th>
                        <th>Total Factura</th>
                        <th>Comisión</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detalle.facturas.length > 0 ? (
                        detalle.facturas.map((f, i) => (
                          <tr key={i}>
                            <td>{new Date(f.fecha).toLocaleDateString()}</td>
                            <td className="td-name">{f.paciente_nombre || 'N/A'}</td>
                            <td>${Number(f.total_usd).toFixed(2)}</td>
                            <td style={{ color: 'var(--accent-cyan)', fontWeight: 700, fontSize: '0.95rem' }}>
                              ${Number(f.comision_calculada).toFixed(2)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr><td colSpan="4" style={{ textAlign: 'center', padding: '30px' }}>No hay facturas pendientes</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* COLUMNA DERECHA: Resumen y Pago */}
          <div className="invoice-right">
            <div className="inv-summary glassmorphism">
              <h3 className="invoice-section-title">Resumen Financiero</h3>
              
              {/* INDICADOR DE FACTURACIÓN DIARIA */}
              {detalle && (
                <div className="stat-card gold" style={{ marginBottom: '20px' }}>
                  <div className="stat-label">Comisión del Día ({new Date().toLocaleDateString()})</div>
                  <div className="stat-value">
                    ${detalle.facturas
                      .filter(f => f.fecha.startsWith(new Date().toISOString().split('T')[0]))
                      .reduce((sum, f) => sum + f.comision_calculada, 0)
                      .toFixed(2)}
                  </div>
                </div>
              )}

              <div className="summary-row">
                <span>Comisión Generada</span>
                <span>${detalle?.resumen?.total_generado_usd?.toFixed(2) || '0.00'}</span>
              </div>
              <div className="summary-row">
                <span>Total Liquidado</span>
                <span>${detalle?.resumen?.total_pagado_usd?.toFixed(2) || '0.00'}</span>
              </div>
              <div className="summary-divider" />
              <div className="summary-row total-usd">
                <span>SALDO PENDIENTE</span>
                <span className="text-cyan" style={{ fontSize: '1.4rem' }}>${detalle?.resumen?.saldo_pendiente_usd?.toFixed(2) || '0.00'}</span>
              </div>
              {detalle?.resumen?.saldo_pendiente_usd > 0 && (
                <div className="summary-row total-ves">
                  <span>Equivalente</span>
                  <span>Bs. {(detalle.resumen.saldo_pendiente_usd * tasaCambio).toFixed(2)}</span>
                </div>
              )}
            </div>

            <div className="inv-payment glassmorphism" style={{ marginTop: '20px' }}>
              <h3 className="invoice-section-title">Registrar Pago</h3>
              <div className="inv-field">
                <label>Monto a Pagar (USD)</label>
                <input 
                  type="number" 
                  className="inv-input"
                  value={montoPagar}
                  onChange={(e) => setMontoPagar(e.target.value)}
                  disabled={!selectedDoctor || detalle?.resumen?.saldo_pendiente_usd <= 0}
                />
              </div>

              <div className="inv-field" style={{ marginTop: '20px' }}>
                <label>Método de Pago</label>
                <div className="pay-methods">
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    {['EFECTIVO_USD', 'PAGO_MOVIL', 'TRANSFERENCIA_VES', 'EFECTIVO_VES'].map(m => (
                      <button
                        key={m}
                        type="button"
                        className={`pay-btn ${metodoPago === m ? 'pay-btn--active' : ''}`}
                        onClick={() => setMetodoPago(m)}
                        style={{ fontSize: '0.85rem', padding: '10px' }}
                      >
                        {getMetodoLabel(m)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="inv-field" style={{ marginTop: '20px' }}>
                <label>Notas de la Operación</label>
                <textarea 
                  className="inv-input" 
                  rows="3" 
                  placeholder="Ej: Pago móvil Banesco..."
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  style={{ resize: 'none' }}
                />
              </div>

              <button
                className="btn-procesar"
                style={{ marginTop: '25px', padding: '15px' }}
                onClick={handleProcessPayment}
                disabled={isProcessing || !selectedDoctor || parseFloat(montoPagar) <= 0}
              >
                {isProcessing ? 'Procesando...' : 'Confirmar y Registrar Pago'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* VISTA DE HISTORIAL */
        <div style={{ marginTop: '20px' }} className="glassmorphism p-20">
          <div className="filters-row" style={{ display: 'flex', gap: '15px', marginBottom: '25px' }}>
             <div className="form-group" style={{ flex: 1 }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '5px', display: 'block' }}>BUSCAR RECIBO O MÉDICO</label>
                <input
                  type="text"
                  className="inv-input"
                  placeholder="🔍 Buscar..."
                  value={busquedaHistorial}
                  onChange={(e) => setBusquedaHistorial(e.target.value)}
                />
             </div>
             <div className="form-group">
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '5px', display: 'block' }}>DESDE</label>
                <input type="date" className="inv-input" style={{ width: '180px' }} value={filtroFechaDesde} onChange={e => setFiltroFechaDesde(e.target.value)} />
             </div>
             <div className="form-group">
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '5px', display: 'block' }}>HASTA</label>
                <input type="date" className="inv-input" style={{ width: '180px' }} value={filtroFechaHasta} onChange={e => setFiltroFechaHasta(e.target.value)} />
             </div>
          </div>

          <div className="table-wrapper">
             <table className="modern-table">
                <thead>
                  <tr>
                    <th>Recibo N°</th>
                    <th>Fecha</th>
                    <th>Médico</th>
                    <th>Monto USD</th>
                    <th>Monto VES</th>
                    <th>Método</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrarHistorial().map(l => (
                    <tr key={l.id}>
                      <td style={{ color: 'var(--accent-cyan)', fontWeight: 700 }}>#{String(l.id).padStart(4, '0')}</td>
                      <td>{new Date(l.fecha_pago).toLocaleDateString()}</td>
                      <td style={{ fontWeight: 600 }}>{l.nombre_medico}</td>
                      <td style={{ color: 'var(--accent-cyan)' }}>${l.monto_pagado_usd?.toFixed(2)}</td>
                      <td>Bs. {l.monto_pagado_ves?.toFixed(2)}</td>
                      <td>
                        <span className="status-badge" style={{ background: 'rgba(6, 182, 212, 0.1)', color: 'var(--accent-cyan)', border: '1px solid var(--accent-cyan)', fontSize: '0.7rem' }}>
                          {getMetodoLabel(l.metodo_pago)}
                        </span>
                      </td>
                      <td>
                        <button 
                          className="btn-view" 
                          style={{ background: 'rgba(6, 182, 212, 0.1)', color: 'var(--accent-cyan)' }}
                          onClick={() => {
                            setUltimoPago({
                              ...l,
                              medico: l.nombre_medico,
                              fecha_pago: l.fecha_pago
                            });
                            setVerRecibo(true);
                          }}
                        >
                          📄
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filtrarHistorial().length === 0 && (
                    <tr><td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No se encontraron registros de liquidación</td></tr>
                  )}
                </tbody>
             </table>
          </div>
        </div>
      )}

      {/* MODAL RECIBO (AESTHETIC) */}
      {verRecibo && ultimoPago && (
        <div className="modal-overlay" style={{ zIndex: 1000 }}>
          <div className="modal-content recibo-modal glassmorphism" style={{ maxWidth: '450px', background: 'var(--bg-panel)', padding: '30px' }}>
            <div className="recibo-container-printable">
              <div style={{ textAlign: 'center', marginBottom: '25px' }}>
                <h1 style={{ fontSize: '1.4rem', color: 'var(--accent-cyan)', margin: 0, letterSpacing: '2px' }}>RECIBO DE PAGO</h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '5px' }}>MédicaERP · Gestión Contable</p>
                <div style={{ marginTop: '15px', fontWeight: '800', fontSize: '1.1rem' }}>COMPROBANTE #{String(ultimoPago.id).padStart(5, '0')}</div>
              </div>

              <div className="recibo-body" style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', borderBottom: '1px solid var(--border-color)', paddingBottom: '5px' }}>
                   <span style={{ color: 'var(--text-muted)' }}>Fecha de Pago</span>
                   <span>{new Date(ultimoPago.fecha_pago).toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', borderBottom: '1px solid var(--border-color)', paddingBottom: '5px' }}>
                   <span style={{ color: 'var(--text-muted)' }}>Beneficiario</span>
                   <span style={{ fontWeight: 600 }}>{ultimoPago.medico}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', borderBottom: '1px solid var(--border-color)', paddingBottom: '5px' }}>
                   <span style={{ color: 'var(--text-muted)' }}>Especialidad</span>
                   <span>{ultimoPago.especialidad || 'General'}</span>
                </div>
                
                <div style={{ margin: '25px 0', padding: '20px', background: 'rgba(6, 182, 212, 0.05)', borderRadius: '12px', border: '1px solid rgba(6, 182, 212, 0.2)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontWeight: '500' }}>Monto Liquidado:</span>
                    <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>${ultimoPago.monto_pagado_usd.toFixed(2)} USD</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <span>Tasa Ref: {ultimoPago.tasa_cambio}</span>
                    <span>Total VES: Bs. {ultimoPago.monto_pagado_ves.toFixed(2)}</span>
                  </div>
                </div>

                <div style={{ marginBottom: '15px' }}>
                   <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '5px' }}>Forma de Pago</div>
                   <div style={{ fontWeight: 600 }}>{getMetodoLabel(ultimoPago.metodo_pago)}</div>
                </div>

                {ultimoPago.notas && (
                  <div style={{ marginBottom: '25px' }}>
                     <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '5px' }}>Observaciones</div>
                     <div style={{ fontStyle: 'italic', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{ultimoPago.notas}</div>
                  </div>
                )}
                
                <div style={{ textAlign: 'center', marginTop: '30px', borderTop: '1px dashed var(--border-color)', paddingTop: '15px', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  Este documento certifica el pago de honorarios médicos por servicios prestados.
                </div>
              </div>
            </div>

            <div className="modal-footer" style={{ display: 'flex', gap: '12px', marginTop: '25px' }}>
               <button className="btn-primary" style={{ flex: 1, padding: '12px' }} onClick={() => window.print()}>Imprimir Comprobante</button>
               <button className="btn-secondary" style={{ padding: '12px' }} onClick={() => setVerRecibo(false)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMACIÓN */}
      <ConfirmModal
        isOpen={showConfirmModal}
        title="Confirmar Operación"
        message={`¿Desea registrar el pago por $${montoPagar} USD al Dr(a). ${selectedDoctor?.nombre}?`}
        onConfirm={executePayment}
        onCancel={() => setShowConfirmModal(false)}
        confirmText="Confirmar Pago"
        cancelText="Cancelar"
        type="warning"
      />

      <style>{`
        .liquidacion-container {
          padding: 10px;
        }
        .liquidacion-tabs-wrapper {
          display: flex;
          justify-content: center;
          margin-bottom: 10px;
        }
        .tabs-premium {
          display: flex;
          gap: 5px;
          background: rgba(255,255,255,0.03);
          padding: 6px;
          border-radius: 14px;
          border: 1px solid var(--border-color);
        }
        .tab-item {
          padding: 10px 25px;
          border: none;
          background: none;
          color: var(--text-muted);
          cursor: pointer;
          border-radius: 10px;
          font-weight: 600;
          font-size: 0.9rem;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .tab-item.active {
          background: var(--accent-cyan);
          color: #000;
          box-shadow: 0 4px 12px rgba(6, 182, 212, 0.3);
        }
        .tab-item:hover:not(.active) {
          background: rgba(255,255,255,0.06);
          color: var(--text-main);
        }
        .p-20 { padding: 25px; }

        .invoice-layout {
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: 20px;
          height: calc(100vh - 130px);
          overflow: hidden;
        }
        .invoice-left, .invoice-right {
          display: flex;
          flex-direction: column;
          height: 100%;
        }
        .invoice-left { 
          min-width: 0; 
          padding: 25px; 
          background: rgba(15, 23, 42, 0.2);
          border-radius: 16px;
          border: 1px solid var(--border-color);
          overflow: hidden; 
        }
        .invoice-right { 
          overflow-y: auto; 
          display: flex; 
          flex-direction: column; 
          gap: 20px;
          padding-right: 5px;
        }
        
        .scrollable-table {
          flex: 1;
          overflow-y: auto;
          margin-top: 15px;
          min-height: 0;
        }

        .stat-card.gold {
          background: linear-gradient(135deg, rgba(251, 191, 36, 0.12) 0%, rgba(251, 191, 36, 0.04) 100%);
          border: 1px solid rgba(251, 191, 36, 0.25);
          padding: 16px;
          border-radius: 12px;
          text-align: center;
          margin-bottom: 20px;
        }
        .stat-card.gold .stat-label {
          color: #fbbf24;
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 6px;
        }
        .stat-card.gold .stat-value {
          color: #fff;
          font-size: 1.6rem;
          font-weight: 800;
        }

        .invoice-section-title {
          font-size: 0.82rem;
          font-weight: 800;
          color: var(--accent-cyan);
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 15px;
          border-bottom: 1px solid rgba(6, 182, 212, 0.2);
          padding-bottom: 8px;
        }
        
        .summary-divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, var(--border-color), transparent);
          margin: 15px 0;
        }

        .inv-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .inv-field label {
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .inv-input {
          background: rgba(15, 23, 42, 0.4);
          border: 1px solid var(--border-color);
          border-radius: 10px;
          padding: 12px 15px;
          color: var(--text-main);
          font-size: 0.95rem;
          transition: all 0.2s;
        }
        .inv-input:focus {
          border-color: var(--accent-cyan);
          outline: none;
          box-shadow: 0 0 0 2px rgba(6, 182, 212, 0.2);
        }
        .inv-suggestions {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: #1e293b;
          border: 1px solid var(--border-color);
          border-radius: 12px;
          margin-top: 8px;
          list-style: none;
          padding: 8px;
          z-index: 50;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
        }
        .inv-suggestions li {
          padding: 12px 15px;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          gap: 4px;
          transition: background 0.2s;
        }
        .inv-suggestions li:hover {
          background: rgba(6, 182, 212, 0.1);
        }
        .inv-suggestions li strong {
          color: var(--text-main);
          font-size: 0.95rem;
        }
        .inv-suggestions li span {
          color: var(--text-muted);
          font-size: 0.8rem;
        }
        .inv-summary, .inv-payment {
          padding: 18px;
          border-radius: 16px;
        }
        .inv-items-table {
          margin-top: 15px;
          border-radius: 12px;
          border: 1px solid var(--border-color);
          overflow: hidden;
          background: rgba(15, 23, 42, 0.2);
        }
        .inv-items-table table {
          width: 100%;
          border-collapse: collapse;
        }
        .inv-items-table th {
          padding: 15px;
          background: rgba(255, 255, 255, 0.02);
          text-align: left;
          font-size: 0.75rem;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border-bottom: 1px solid var(--border-color);
        }
        .inv-items-table td {
          padding: 15px;
          border-bottom: 1px solid var(--border-color);
          font-size: 0.9rem;
        }
        .inv-items-table tr:hover {
          background: rgba(6, 182, 212, 0.02);
        }

        .selected-doctor-card {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: rgba(6, 182, 212, 0.08);
          border: 1px solid rgba(6, 182, 212, 0.3);
          padding: 15px 20px;
          border-radius: 12px;
          margin-bottom: 15px;
        }
        .doctor-info {
          display: flex;
          align-items: center;
          gap: 15px;
        }
        .doctor-avatar {
          font-size: 1.5rem;
          background: rgba(6, 182, 212, 0.2);
          width: 45px;
          height: 45px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
        }
        .doctor-name {
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--text-main);
        }
        .doctor-specialty {
          font-size: 0.8rem;
          color: var(--text-muted);
        }
        .btn-change-doctor {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--border-color);
          color: var(--text-main);
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 0.8rem;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-change-doctor:hover {
          background: #ef4444;
          border-color: #ef4444;
          color: white;
        }

        .summary-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          font-size: 0.95rem;
        }
        .total-usd {
          font-weight: 800;
          margin-top: 5px;
        }
        .pay-methods {
          margin-top: 10px;
        }
        .pay-btn {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--border-color);
          border-radius: 10px;
          color: var(--text-main);
          cursor: pointer;
          transition: all 0.2s;
        }
        .pay-btn:hover {
          border-color: var(--accent-cyan);
          background: rgba(6, 182, 212, 0.05);
        }
        .pay-btn--active {
          background: var(--accent-cyan) !important;
          color: #000 !important;
          border-color: var(--accent-cyan) !important;
          font-weight: 700;
        }
        .btn-procesar {
          background: var(--accent-cyan);
          color: #000;
          border: none;
          border-radius: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-procesar:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(6, 182, 212, 0.3);
        }
        .btn-procesar:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        
        @media print {
          body * { visibility: hidden; }
          .recibo-container-printable, .recibo-container-printable * { visibility: visible; }
          .recibo-container-printable {
             position: absolute;
             left: 0;
             top: 0;
             width: 100%;
             padding: 40px;
             color: #000 !important;
             background: #fff !important;
          }
          .recibo-container-printable * { color: #000 !important; }
          .modal-overlay, .liquidacion-container, .invoice-layout { background: none !important; }
          .modal-footer { display: none !important; }
        }
      `}</style>
    </div>
  );
};

export default LiquidacionPanel;