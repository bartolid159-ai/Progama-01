import { useState, useEffect, useCallback, useRef } from 'react';
import * as patientService from '../../logic/patientService';
import * as doctorService from '../../logic/doctorService';
import * as serviceLogic from '../../logic/serviceLogic';
import * as billingEngine from '../../logic/billingEngine';
import * as manager from '../../db/manager';
import * as insumoLogic from '../../logic/insumoLogic';
import Notification from '../Common/Notification';
import ConfirmModal from '../Common/ConfirmModal';

const DRAFT_KEY = 'clinica_invoice_draft';

const saveDraft = (data) => {
  try { sessionStorage.setItem(DRAFT_KEY, JSON.stringify(data)); } catch (_) {}
};
const loadDraft = () => {
  try { return JSON.parse(sessionStorage.getItem(DRAFT_KEY) || 'null'); } catch (_) { return null; }
};
const clearDraft = () => {
  try { sessionStorage.removeItem(DRAFT_KEY); } catch (_) {}
};

const InvoiceForm = ({ onProcessComplete }) => {
  const draft = useRef(loadDraft());

  const [doctors, setDoctors] = useState([]);
  const [services, setServices] = useState([]);
  const [serviciosInsumos, setServiciosInsumos] = useState({});
  
  // Datos del borrador o valores por defecto
  const [patientSearch, setPatientSearch] = useState(draft.current?.patientSearch || '');
  const [patientSuggestions, setPatientSuggestions] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(draft.current?.selectedPatient || null);

  const [exchangeRateStr, setExchangeRateStr] = useState(draft.current?.exchangeRateStr || '36');
  const exchangeRate = parseFloat(exchangeRateStr) || 0;

  const [invoiceItems, setInvoiceItems] = useState(draft.current?.invoiceItems || []);
  // Doctor se deriva de los servicios, no se selecciona manualmente.
  // Si hay múltiples servicios con distintos médicos, se toma el del primer servicio.
  const [derivedDoctor, setDerivedDoctor] = useState(draft.current?.derivedDoctor || null);

  const [metodoPago, setMetodoPago] = useState(draft.current?.metodoPago || 'EFECTIVO_USD');
  const [detallePago, setDetallePago] = useState(draft.current?.detallePago || '');

  const [notification, setNotification] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [validationError, setValidationError] = useState(null);

  // Guardar borrador cada vez que cambia algo relevante
  useEffect(() => {
    saveDraft({ patientSearch, selectedPatient, exchangeRateStr, invoiceItems, derivedDoctor, metodoPago, detallePago });
  }, [patientSearch, selectedPatient, exchangeRateStr, invoiceItems, derivedDoctor, metodoPago, detallePago]);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [doctorsData, servicesData] = await Promise.all([
        doctorService.getDoctors(),
        serviceLogic.getServices()
      ]);
      setDoctors(doctorsData);
      setServices(servicesData);

      const insumosMap = {};
      for (const svc of servicesData) {
        const svcId = Number(svc.id);
        let insumos = svc.insumos;
        if (!insumos || insumos.length === 0) {
          try { insumos = await serviceLogic.getInsumosByServicio(svcId); } catch (_) { insumos = []; }
        }
        if (insumos && insumos.length > 0) {
          insumosMap[svcId] = insumos.map(i => ({ id_insumo: Number(i.id_insumo), cantidad: Number(i.cantidad) }));
        }
      }
      setServiciosInsumos(insumosMap);
    } catch (error) {
      console.error('[FACTURA] Error cargando datos:', error);
    }
  };

  const handlePatientSearch = useCallback(async (query) => {
    setPatientSearch(query);
    if (query.length < 2) { setPatientSuggestions([]); return; }
    const results = await patientService.searchPatients(query);
    setPatientSuggestions(results.slice(0, 5));
  }, []);

  const selectPatient = (patient) => {
    setSelectedPatient(patient);
    setPatientSearch(patient.nombre);
    setPatientSuggestions([]);
  };

  const addServiceToInvoice = (svc) => {
    if (!svc) return;
    // Auto-derivar médico del primer servicio agregado
    if (invoiceItems.length === 0 && svc.id_medico_defecto) {
      const doc = doctors.find(d => Number(d.id) === Number(svc.id_medico_defecto));
      if (doc) setDerivedDoctor(doc);
    }

    const existing = invoiceItems.find(item => item.id_servicio === svc.id);
    if (existing) {
      setInvoiceItems(invoiceItems.map(item =>
        item.id_servicio === svc.id ? { ...item, cantidad: item.cantidad + 1 } : item
      ));
    } else {
      setInvoiceItems([...invoiceItems, {
        id_servicio: svc.id,
        id_medico_defecto: svc.id_medico_defecto,
        nombre: svc.nombre,
        cantidad: 1,
        precio_usd: svc.precio_usd,
        es_exento: svc.es_exento
      }]);
    }
  };

  const updateItemQuantity = (id_servicio, delta) => {
    setInvoiceItems(invoiceItems.map(item => {
      if (item.id_servicio === id_servicio) {
        return { ...item, cantidad: Math.max(1, item.cantidad + delta) };
      }
      return item;
    }));
  };

  const removeItem = (id_servicio) => {
    const remaining = invoiceItems.filter(item => item.id_servicio !== id_servicio);
    setInvoiceItems(remaining);
    if (remaining.length === 0) setDerivedDoctor(null);
  };

  const totals = billingEngine.calculateTotals(invoiceItems, exchangeRate);
  const commission = billingEngine.calculateCommission(totals.total_usd, derivedDoctor?.porcentaje_comision || 0);

  const handleProcessInvoice = async () => {
    if (!selectedPatient) { setValidationError('Por favor seleccione un paciente para continuar.'); return; }
    if (invoiceItems.length === 0) { setValidationError('Debe agregar al menos un servicio a la factura.'); return; }
    if (!exchangeRate || isNaN(exchangeRate) || exchangeRate <= 0) { setValidationError('Ingrese una tasa de cambio válida mayor a cero.'); return; }
    if ((metodoPago === 'TRANSFERENCIA' || metodoPago === 'PAGO_MOVIL') && (!detallePago || detallePago.length !== 4)) {
      setValidationError('Debe ingresar los últimos 4 dígitos de la referencia');
      return;
    }
    const requiredInsumos = billingEngine.getRequiredInsumos(invoiceItems, serviciosInsumos);
    if (requiredInsumos.length > 0) {
      try {
        const validacion = await insumoLogic.validarStockInsumos(requiredInsumos);
        if (!validacion.valido) {
          const msg = validacion.faltantes.map(f => `${f.nombre}: requiere ${f.requerido}, disponible ${f.disponible}`).join('\n');
          setValidationError(`⚠️ Stock insuficiente:\n${msg}`);
          return;
        }
      } catch (_) {}
    }
    setShowConfirmModal(true);
  };

  const executeInvoiceProcessing = async () => {
    setShowConfirmModal(false);
    setIsProcessing(true);
    try {
      const requiredInsumos = billingEngine.getRequiredInsumos(invoiceItems, serviciosInsumos);
      // El médico se toma del primer servicio o del derivado
      const medicoId = derivedDoctor?.id || invoiceItems[0]?.id_medico_defecto || null;
      const invoiceData = {
        id_paciente: selectedPatient.id,
        id_medico: medicoId ? Number(medicoId) : null,
        tasa_cambio: exchangeRate,
        items: invoiceItems,
        totals,
        commission,
        requiredInsumos,
        metodo_pago: metodoPago,
        detalle_pago: detallePago
      };
      const result = await manager.processInvoice(invoiceData);
      const facturaId = result.facturaId || result.id_factura;
      setNotification({ message: `✅ Factura #${String(facturaId).padStart(4, '0')} procesada correctamente.`, type: 'success' });
      if (onProcessComplete) onProcessComplete({ ...invoiceData, id_factura: facturaId });
      // Limpiar borrador y formulario
      clearDraft();
      setSelectedPatient(null);
      setPatientSearch('');
      setInvoiceItems([]);
      setDerivedDoctor(null);
      setMetodoPago('EFECTIVO_USD');
      setDetallePago('');
    } catch (error) {
      setNotification({ message: 'Error al procesar factura: ' + error.message, type: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="invoice-layout animate-in">
      {notification && (
        <Notification message={notification.message} type={notification.type} onClose={() => setNotification(null)} />
      )}

      {/* COLUMNA IZQUIERDA: Datos y servicios */}
      <div className="invoice-left glassmorphism">
        <h3 className="invoice-section-title">📋 Datos de la Factura</h3>

        {/* Paciente */}
        <div className="inv-field">
          <label>Paciente <span className="req">*</span></label>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              className="inv-input"
              placeholder="Buscar por nombre o cédula..."
              value={patientSearch}
              onChange={(e) => handlePatientSearch(e.target.value)}
              autoComplete="off"
            />
            {selectedPatient && (
              <span className="patient-chip">
                ✔ {selectedPatient.nombre}
                <button type="button" onClick={() => { setSelectedPatient(null); setPatientSearch(''); }} className="chip-clear">✕</button>
              </span>
            )}
            {patientSuggestions.length > 0 && (
              <ul className="inv-suggestions">
                {patientSuggestions.map(p => (
                  <li key={p.id} onClick={() => selectPatient(p)}>
                    <strong>{p.nombre}</strong>
                    <span>{p.cedula_rif} · {p.telefono}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Tasa */}
        <div className="inv-field">
          <label>Tasa de Cambio USD → VES <span className="req">*</span></label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input
              type="text"
              inputMode="decimal"
              className="inv-input"
              style={{ maxWidth: '160px' }}
              placeholder="Ej: 144.50"
              value={exchangeRateStr}
              onChange={(e) => setExchangeRateStr(e.target.value)}
            />
            {exchangeRate > 0 && (
              <span className="rate-hint">1 USD = {exchangeRate.toFixed(2)} Bs.</span>
            )}
          </div>
        </div>

        {/* Médico auto-derivado */}
        {derivedDoctor && (
          <div className="doctor-pill">
            <span className="dp-icon">👨‍⚕️</span>
            <div>
              <div className="dp-name">{derivedDoctor.nombre}</div>
              <div className="dp-meta">{derivedDoctor.especialidad} · {derivedDoctor.porcentaje_comision}% comisión</div>
            </div>
          </div>
        )}

        {/* Agregar servicio */}
        <div className="inv-field" style={{ marginTop: '14px' }}>
          <label>Agregar Servicios</label>
          <select
            className="inv-input inv-select"
            onChange={(e) => {
              const svc = services.find(s => s.id === Number(e.target.value));
              addServiceToInvoice(svc);
              e.target.value = '';
            }}
            defaultValue=""
          >
            <option value="" disabled>Seleccione un servicio...</option>
            {services.map(s => (
              <option key={s.id} value={s.id}>
                {s.nombre} — ${Number(s.precio_usd).toFixed(2)} {s.es_exento ? '(Exento)' : '(IVA 16%)'}
              </option>
            ))}
          </select>
        </div>

        {/* Tabla de items */}
        {invoiceItems.length > 0 && (
          <div className="inv-items-table">
            <table>
              <thead>
                <tr>
                  <th>Servicio</th>
                  <th>P. Unit.</th>
                  <th>Cant.</th>
                  <th>Total</th>
                  <th>IVA</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {invoiceItems.map(item => {
                  const sub = item.cantidad * item.precio_usd;
                  const iva = item.es_exento ? 0 : sub * 0.16;
                  return (
                    <tr key={item.id_servicio}>
                      <td className="td-name">{item.nombre}</td>
                      <td>${Number(item.precio_usd).toFixed(2)}</td>
                      <td>
                        <div className="qty-ctrl">
                          <button type="button" onClick={() => updateItemQuantity(item.id_servicio, -1)}>−</button>
                          <span>{item.cantidad}</span>
                          <button type="button" onClick={() => updateItemQuantity(item.id_servicio, 1)}>+</button>
                        </div>
                      </td>
                      <td>${(sub + iva).toFixed(2)}</td>
                      <td>
                        {item.es_exento
                          ? <span className="badge-exento">Exento</span>
                          : <span className="badge-iva">${iva.toFixed(2)}</span>}
                      </td>
                      <td>
                        <button type="button" className="btn-delete" onClick={() => removeItem(item.id_servicio)} title="Quitar">🗑️</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* COLUMNA DERECHA: Resumen + Pago + Acción */}
      <div className="invoice-right">

        {/* Resumen de Totales */}
        <div className="inv-summary glassmorphism">
          <h3 className="invoice-section-title">💰 Resumen</h3>
          <div className="summary-row"><span>Subtotal USD</span><span>${totals.subtotal_usd?.toFixed(2) || '0.00'}</span></div>
          <div className="summary-row"><span>IVA (16%)</span><span>${totals.iva_usd?.toFixed(2) || '0.00'}</span></div>
          {commission > 0 && (
            <div className="summary-row accent-yellow">
              <span>Comisión ({derivedDoctor?.porcentaje_comision || 0}%)</span>
              <span>-${commission.toFixed(2)}</span>
            </div>
          )}
          <div className="summary-divider" />
          <div className="summary-row total-usd"><span>TOTAL USD</span><span className="text-cyan">${totals.total_usd?.toFixed(2) || '0.00'}</span></div>
          <div className="summary-row total-ves"><span>TOTAL VES</span><span className="text-cyan">Bs. {totals.total_ves?.toFixed(2) || '0.00'}</span></div>
        </div>

        {/* Información de Pago */}
        <div className="inv-payment glassmorphism">
          <h3 className="invoice-section-title">💳 Método de Pago</h3>
          <div className="pay-methods">
            {[
              { val: 'EFECTIVO_USD', label: '💵 Efectivo USD' },
              { val: 'TRANSFERENCIA', label: '🏦 Transferencia' },
              { val: 'PAGO_MOVIL', label: '📱 Pago Móvil' },
            ].map(m => (
              <button
                key={m.val}
                type="button"
                className={`pay-btn ${metodoPago === m.val ? 'pay-btn--active' : ''}`}
                onClick={() => { setMetodoPago(m.val); setDetallePago(''); }}
              >
                {m.label}
              </button>
            ))}
          </div>

          <div className="inv-field" style={{ marginTop: '12px' }}>
            <label>
              {metodoPago === 'EFECTIVO_USD' ? 'Descripción de billetes (opcional)' : 'Últimos 4 dígitos de referencia *'}
            </label>
            <input
              type="text"
              className="inv-input"
              placeholder={metodoPago === 'EFECTIVO_USD' ? 'Ej: 2×$20, 1×$10' : 'Ej: 1234'}
              value={detallePago}
              onChange={(e) => {
                const val = e.target.value;
                if (metodoPago !== 'EFECTIVO_USD') {
                  if (/^\d*$/.test(val) && val.length <= 4) setDetallePago(val);
                } else {
                  setDetallePago(val);
                }
              }}
            />
          </div>
        </div>

        {/* Botón principal */}
        <button
          className="btn-procesar"
          onClick={handleProcessInvoice}
          disabled={isProcessing}
        >
          {isProcessing ? '⏳ Procesando...' : '💾 Procesar Factura'}
        </button>

        {invoiceItems.length > 0 && (
          <button
            type="button"
            className="btn-limpiar"
            onClick={() => {
              clearDraft();
              setSelectedPatient(null); setPatientSearch('');
              setInvoiceItems([]); setDerivedDoctor(null);
              setMetodoPago('EFECTIVO_USD'); setDetallePago('');
            }}
          >
            🗑 Limpiar borrador
          </button>
        )}
      </div>

      {/* Modales */}
      <ConfirmModal
        isOpen={showConfirmModal}
        title="Registrar Factura"
        message="¿Está seguro de que desea registrar esta factura? Esta acción generará un registro permanente."
        onConfirm={executeInvoiceProcessing}
        onCancel={() => setShowConfirmModal(false)}
        confirmText="Sí, Registrar"
        cancelText="Volver"
        type="warning"
      />
      <ConfirmModal
        isOpen={!!validationError}
        title="Campo Requerido"
        message={validationError}
        onConfirm={() => setValidationError(null)}
        confirmText="Entendido"
        showCancel={false}
        type="danger"
      />

      <style>{`
        .invoice-layout {
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: 20px;
          align-items: start;
        }
        @media (max-width: 900px) {
          .invoice-layout { grid-template-columns: 1fr; }
        }
        .invoice-left, .inv-summary, .inv-payment {
          border-radius: 14px;
          padding: 20px;
        }
        .invoice-left { display: flex; flex-direction: column; gap: 14px; }
        .invoice-right { display: flex; flex-direction: column; gap: 14px; position: sticky; top: 20px; }
        .invoice-section-title {
          font-size: 0.95rem; font-weight: 700; letter-spacing: 0.04em;
          text-transform: uppercase; color: var(--accent-cyan);
          margin: 0 0 14px; padding-bottom: 8px;
          border-bottom: 1px solid var(--border-color);
        }
        .inv-field { display: flex; flex-direction: column; gap: 6px; }
        .inv-field label { font-size: 0.82rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.04em; }
        .req { color: var(--accent-cyan); }
        .inv-input {
          padding: 0.7rem 1rem; border: 1px solid var(--border-color);
          background: var(--bg-secondary); color: var(--text-main);
          border-radius: 10px; font-size: 0.95rem; font-family: inherit;
          outline: none; transition: border-color 0.2s, box-shadow 0.2s;
          width: 100%; box-sizing: border-box;
        }
        .inv-input:focus { border-color: var(--accent-cyan); box-shadow: 0 0 0 2px rgba(6,182,212,0.2); }
        .inv-select {
          appearance: none; -webkit-appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%2306b6d4' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
          background-repeat: no-repeat; background-position: right 1rem center; cursor: pointer;
        }
        .inv-select option { background: var(--bg-dark, #0f172a); color: var(--text-main); }
        .inv-suggestions {
          position: absolute; top: 100%; left: 0; right: 0;
          background: var(--bg-panel); border: 1px solid var(--border-color);
          border-radius: 10px; list-style: none; padding: 0; margin: 4px 0 0;
          z-index: 200; max-height: 180px; overflow-y: auto;
          box-shadow: 0 8px 24px rgba(0,0,0,0.4);
        }
        .inv-suggestions li {
          padding: 10px 14px; cursor: pointer; display: flex; flex-direction: column; gap: 2px;
          border-bottom: 1px solid var(--border-color); transition: background 0.15s;
        }
        .inv-suggestions li:hover { background: rgba(6,182,212,0.08); }
        .inv-suggestions li strong { font-size: 0.95rem; }
        .inv-suggestions li span { font-size: 0.8rem; color: var(--text-muted); }
        .patient-chip {
          display: inline-flex; align-items: center; gap: 6px;
          background: rgba(6,182,212,0.15); color: var(--accent-cyan);
          border-radius: 20px; padding: 4px 12px; font-size: 0.85rem; font-weight: 600;
          margin-top: 6px;
        }
        .chip-clear {
          background: none; border: none; color: var(--accent-cyan);
          cursor: pointer; font-size: 0.9rem; padding: 0; line-height: 1;
        }
        .doctor-pill {
          display: flex; align-items: center; gap: 12px;
          background: rgba(99,102,241,0.12); border: 1px solid rgba(99,102,241,0.3);
          border-radius: 12px; padding: 10px 14px;
        }
        .dp-icon { font-size: 1.4rem; }
        .dp-name { font-weight: 700; font-size: 0.95rem; color: #a5b4fc; }
        .dp-meta { font-size: 0.78rem; color: var(--text-muted); }
        .rate-hint { font-size: 0.82rem; color: var(--accent-cyan); font-weight: 600; white-space: nowrap; }
        /* Tabla de items */
        .inv-items-table { overflow-x: auto; margin-top: 4px; border-radius: 10px; border: 1px solid var(--border-color); }
        .inv-items-table table { width: 100%; border-collapse: collapse; font-size: 0.88rem; }
        .inv-items-table th { padding: 8px 10px; color: var(--text-muted); font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.04em; border-bottom: 1px solid var(--border-color); text-align: left; }
        .inv-items-table td { padding: 8px 10px; border-bottom: 1px solid var(--border-color); vertical-align: middle; }
        .inv-items-table tr:last-child td { border-bottom: none; }
        .td-name { font-weight: 600; max-width: 180px; }
        .qty-ctrl { display: flex; align-items: center; gap: 6px; }
        .qty-ctrl button { width: 26px; height: 26px; border-radius: 6px; border: 1px solid var(--border-color); background: var(--bg-secondary); color: var(--text-main); font-size: 1rem; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background 0.15s; }
        .qty-ctrl button:hover { background: var(--accent-cyan); color: #000; border-color: var(--accent-cyan); }
        .qty-ctrl span { font-weight: 700; min-width: 20px; text-align: center; }
        .badge-exento { background: rgba(16,185,129,0.15); color: #10b981; padding: 2px 8px; border-radius: 20px; font-size: 0.75rem; font-weight: 600; }
        .badge-iva { background: rgba(239,68,68,0.12); color: #f87171; padding: 2px 8px; border-radius: 20px; font-size: 0.75rem; font-weight: 600; }
        /* Resumen */
        .summary-row { display: flex; justify-content: space-between; align-items: center; padding: 6px 0; font-size: 0.92rem; }
        .summary-row.accent-yellow { color: #fbbf24; }
        .summary-divider { border-top: 1px dashed var(--border-color); margin: 8px 0; }
        .summary-row.total-usd span:last-child { font-size: 1.2rem; font-weight: 800; }
        .summary-row.total-ves { font-size: 0.85rem; color: var(--text-muted); }
        /* Pago */
        .pay-methods { display: flex; flex-direction: column; gap: 8px; }
        .pay-btn {
          padding: 9px 14px; border-radius: 10px; border: 1px solid var(--border-color);
          background: var(--bg-secondary); color: var(--text-main); font-size: 0.88rem;
          font-family: inherit; cursor: pointer; text-align: left; transition: all 0.2s;
        }
        .pay-btn:hover { border-color: var(--accent-cyan); background: rgba(6,182,212,0.08); }
        .pay-btn--active { border-color: var(--accent-cyan); background: rgba(6,182,212,0.15); color: var(--accent-cyan); font-weight: 700; }
        /* Botones acción */
        .btn-procesar {
          width: 100%; padding: 13px; border-radius: 12px; border: none;
          background: var(--accent-cyan); color: #000; font-size: 1rem; font-weight: 700;
          font-family: inherit; cursor: pointer; transition: all 0.2s;
        }
        .btn-procesar:hover:not(:disabled) { background: var(--accent-cyan-hover); transform: translateY(-1px); box-shadow: 0 6px 20px rgba(6,182,212,0.35); }
        .btn-procesar:disabled { opacity: 0.5; cursor: not-allowed; }
        .btn-limpiar {
          width: 100%; padding: 9px; border-radius: 10px; border: 1px solid var(--border-color);
          background: transparent; color: var(--text-muted); font-size: 0.85rem; font-family: inherit;
          cursor: pointer; transition: all 0.2s;
        }
        .btn-limpiar:hover { border-color: #ef4444; color: #ef4444; }
      `}</style>
    </div>
  );
};

export default InvoiceForm;
