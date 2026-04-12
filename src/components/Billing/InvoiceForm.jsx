import { useState, useEffect, useCallback } from 'react';
import * as patientService from '../../logic/patientService';
import * as doctorService from '../../logic/doctorService';
import * as serviceLogic from '../../logic/serviceLogic';
import * as billingEngine from '../../logic/billingEngine';
import * as manager from '../../db/manager';
import Notification from '../Common/Notification';
import ConfirmModal from '../Common/ConfirmModal';

const InvoiceForm = ({ onProcessComplete }) => {
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [services, setServices] = useState([]);
  const [serviciosInsumos, setServiciosInsumos] = useState({});
  
  const [patientSearch, setPatientSearch] = useState('');
  const [patientSuggestions, setPatientSuggestions] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  
  const [selectedDoctor, setSelectedDoctor] = useState('');
  // Manejamos la tasa como string para permitir edición libre sin el '0' automático
  const [exchangeRateStr, setExchangeRateStr] = useState('36');
  const exchangeRate = parseFloat(exchangeRateStr) || 0;
  
  const [invoiceItems, setInvoiceItems] = useState([]);
  const [availableServices, setAvailableServices] = useState([]);
  
  const [notification, setNotification] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Modales UI
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [validationError, setValidationError] = useState(null);

  // Pago
  const [metodoPago, setMetodoPago] = useState('EFECTIVO_USD');
  const [detallePago, setDetallePago] = useState('');

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    const [doctorsData, servicesData] = await Promise.all([
      doctorService.getDoctors(),
      serviceLogic.getServices()
    ]);
    setDoctors(doctorsData);
    setServices(servicesData);
    
    const insumosMap = {};
    for (const svc of servicesData) {
      const insumos = await serviceLogic.getInsumosByServicio(svc.id);
      if (insumos && insumos.length > 0) {
        insumosMap[svc.id] = insumos;
      }
    }
    setServiciosInsumos(insumosMap);
  };

  const handlePatientSearch = useCallback(async (query) => {
    setPatientSearch(query);
    if (query.length < 2) {
      setPatientSuggestions([]);
      return;
    }
    const results = await patientService.searchPatients(query);
    setPatientSuggestions(results.slice(0, 5));
  }, []);

  const selectPatient = (patient) => {
    setSelectedPatient(patient);
    setPatientSearch(patient.nombre);
    setPatientSuggestions([]);
  };

  const addServiceToInvoice = (service) => {
    if (!service) return;
    
    const existing = invoiceItems.find(item => item.id_servicio === service.id);
    if (existing) {
      setInvoiceItems(invoiceItems.map(item => 
        item.id_servicio === service.id 
          ? { ...item, cantidad: item.cantidad + 1 }
          : item
      ));
    } else {
      setInvoiceItems([...invoiceItems, {
        id_servicio: service.id,
        nombre: service.nombre,
        cantidad: 1,
        precio_usd: service.precio_usd,
        es_exento: service.es_exento
      }]);
    }
    setAvailableServices([]);
  };

  const updateItemQuantity = (id_servicio, delta) => {
    setInvoiceItems(invoiceItems.map(item => {
      if (item.id_servicio === id_servicio) {
        const newQty = Math.max(1, item.cantidad + delta);
        return { ...item, cantidad: newQty };
      }
      return item;
    }));
  };

  const removeItem = (id_servicio) => {
    setInvoiceItems(invoiceItems.filter(item => item.id_servicio !== id_servicio));
  };

  const calculateTotals = useCallback(() => {
    return billingEngine.calculateTotals(invoiceItems, exchangeRate);
  }, [invoiceItems, exchangeRate]);

  const handleProcessInvoice = async () => {
    if (!selectedPatient) {
      setValidationError('Por favor seleccione un paciente para continuar.');
      return;
    }
    if (!selectedDoctor) {
      setValidationError('Por favor seleccione un médico tratante.');
      return;
    }
    if (invoiceItems.length === 0) {
      setValidationError('Debe agregar al menos un servicio a la factura.');
      return;
    }
    if (!exchangeRate || isNaN(exchangeRate) || exchangeRate <= 0) {
      setValidationError('Ingrese una tasa de cambio válida mayor a cero.');
      return;
    }

    // Validación de Pago
    if ((metodoPago === 'TRANSFERENCIA' || metodoPago === 'PAGO_MOVIL')) {
      if (!detallePago || detallePago.length !== 4) {
        setValidationError('Debe ingresar los últimos 4 dígitos de la referencia');
        return;
      }
    }

    setShowConfirmModal(true);
  };

  const executeInvoiceProcessing = async () => {
    setShowConfirmModal(false);
    setIsProcessing(true);

    try {
      const totals = billingEngine.calculateTotals(invoiceItems, exchangeRate);
      const doctor = doctors.find(d => Number(d.id) === Number(selectedDoctor));
      const commission = billingEngine.calculateCommission(totals.total_usd, doctor?.porcentaje_comision || 0);
      const requiredInsumos = billingEngine.getRequiredInsumos(invoiceItems, serviciosInsumos);

      const invoiceData = {
        id_paciente: selectedPatient.id,
        id_medico: Number(selectedDoctor),
        tasa_cambio: exchangeRate,
        items: invoiceItems,
        totals,
        commission,
        requiredInsumos,
        metodo_pago: metodoPago,
        detalle_pago: detallePago
      };

      // Persistencia real en SQLite
      const result = await manager.processInvoice(invoiceData);
      const facturaId = result.facturaId || result.id_factura;

      setNotification({
        message: `✅ Factura #${String(facturaId).padStart(4, '0')} procesada y guardada correctamente`,
        type: 'success'
      });

      if (onProcessComplete) {
        onProcessComplete({ ...invoiceData, id_factura: facturaId });
      }

      // Limpiar formulario
      setSelectedPatient(null);
      setPatientSearch('');
      setSelectedDoctor('');
      setInvoiceItems([]);
      setMetodoPago('EFECTIVO_USD');
      setDetallePago('');
    } catch (error) {
      setNotification({ message: 'Error al procesar factura: ' + error.message, type: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  const totals = calculateTotals();
  const doctor = doctors.find(d => Number(d.id) === Number(selectedDoctor));
  const commission = billingEngine.calculateCommission(totals.total_usd, doctor?.porcentaje_comision || 0);

  return (
    <div className="patient-list animate-in">
      {notification && (
        <Notification 
          message={notification.message} 
          type={notification.type} 
          onClose={() => setNotification(null)} 
        />
      )}

      <div className="patient-form-grid" style={{ marginTop: '0', marginBottom: '20px' }}>
        <div className="form-group full-width">
          <label>Paciente *</label>
          <div style={{ position: 'relative' }}>
            <input 
              type="text"
              placeholder="Buscar paciente por nombre o cédula..."
              value={patientSearch}
              onChange={(e) => handlePatientSearch(e.target.value)}
              autoComplete="off"
            />
            {patientSuggestions.length > 0 && (
              <ul className="suggestions-list" style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                listStyle: 'none',
                padding: 0,
                margin: '4px 0 0',
                zIndex: 100,
                maxHeight: '200px',
                overflowY: 'auto'
              }}>
                {patientSuggestions.map(p => (
                  <li 
                    key={p.id}
                    onClick={() => selectPatient(p)}
                    style={{
                      padding: '10px 12px',
                      cursor: 'pointer',
                      borderBottom: '1px solid var(--border-color)'
                    }}
                  >
                    <div style={{ fontWeight: 600 }}>{p.nombre}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {p.cedula_rif} • {p.telefono}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="select-medico">Médico Tratante *</label>
          <select 
            id="select-medico"
            value={selectedDoctor}
            onChange={(e) => setSelectedDoctor(e.target.value)}
          >
            <option value="">Seleccione un médico...</option>
            {doctors.map(d => (
              <option key={d.id} value={d.id}>
                {d.nombre} ({d.especialidad}) - {d.porcentaje_comision}% comisión
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Tasa de Cambio (USD → VES) *</label>
          <input
            type="text"
            inputMode="decimal"
            placeholder="Ej: 144.50"
            value={exchangeRateStr}
            onChange={(e) => setExchangeRateStr(e.target.value)}
            id="exchange-rate-input"
          />
          {parseFloat(exchangeRateStr) > 0 && (
            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '4px', display: 'block' }}>
              1 USD = {parseFloat(exchangeRateStr).toFixed(2)} VES
            </span>
          )}
        </div>
      </div>

      <hr style={{ margin: '20px 0', borderColor: 'var(--border-color)' }} />

      <div className="form-group">
        <label htmlFor="select-servicio">Agregar Servicios</label>
        <div style={{ display: 'flex', gap: '10px' }}>
          <select 
            id="select-servicio"
            className="form-input"
            style={{ flex: 2 }}
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
                {s.nombre} - ${Number(s.precio_usd).toFixed(2)} ({s.es_exento ? 'Exento' : 'IVA 16%'})
              </option>
            ))}
          </select>
        </div>
      </div>

      {invoiceItems.length > 0 && (
        <div className="table-wrapper glassmorphism" style={{ marginTop: '15px' }}>
          <table className="modern-table">
            <thead>
              <tr>
                <th>Servicio</th>
                <th>Precio Unit.</th>
                <th>Cantidad</th>
                <th>Subtotal</th>
                <th>IVA</th>
                <th>Total</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {invoiceItems.map(item => {
                const lineaTotal = item.cantidad * item.precio_usd;
                const lineaIva = item.es_exento ? 0 : lineaTotal * 0.16;
                return (
                  <tr key={item.id_servicio}>
                    <td>{item.nombre}</td>
                    <td>${Number(item.precio_usd).toFixed(2)}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button 
                          type="button"
                          className="btn-view"
                          style={{ width: '28px', height: '28px' }}
                          onClick={() => updateItemQuantity(item.id_servicio, -1)}
                        >-</button>
                        <span style={{ fontWeight: 'bold', width: '20px', textAlign: 'center' }}>{item.cantidad}</span>
                        <button 
                          type="button"
                          className="btn-view"
                          style={{ width: '28px', height: '28px' }}
                          onClick={() => updateItemQuantity(item.id_servicio, 1)}
                        >+</button>
                      </div>
                    </td>
                    <td>${lineaTotal.toFixed(2)}</td>
                    <td>
                      <span className={`status-badge ${item.es_exento ? 'active' : 'inactive'}`}>
                        {item.es_exento ? 'Exento' : `$${lineaIva.toFixed(2)}`}
                      </span>
                    </td>
                    <td>${(lineaTotal + lineaIva).toFixed(2)}</td>
                    <td>
                      <button 
                         type="button"
                        className="btn-delete"
                        onClick={() => removeItem(item.id_servicio)}
                        title="Eliminar"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="totals-panel glassmorphism" style={{ 
        marginTop: '20px', 
        padding: '20px', 
        borderRadius: '12px',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)'
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
          <div>
            <h4 style={{ marginBottom: '15px' }}>Resumen en USD</h4>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span>Subtotal:</span>
              <span>${totals.subtotal_usd?.toFixed(2) || '0.00'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span>IVA (16%):</span>
              <span>${totals.iva_usd?.toFixed(2) || '0.00'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontWeight: 700, fontSize: '1.1rem' }}>
              <span>Total USD:</span>
              <span className="text-cyan">${totals.total_usd?.toFixed(2) || '0.00'}</span>
            </div>
            {commission > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: 'var(--accent-yellow)' }}>
                <span>Comisión ({doctor?.porcentaje_comision || 0}%):</span>
                <span>${commission.toFixed(2)}</span>
              </div>
            )}
          </div>
          <div>
            <h4 style={{ marginBottom: '15px' }}>Total en VES</h4>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1.3rem' }}>
              <span>Total:</span>
              <span className="text-cyan">Bs. {totals.total_ves?.toFixed(2) || '0.00'}</span>
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '5px' }}>
              Tasa: {exchangeRate} VES/USD
            </div>
          </div>
        </div>
        
        {/* Sección de Pago */}
        <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px dashed var(--border-color)' }}>
          <h4 style={{ marginBottom: '15px' }}>Información de Pago</h4>
          <div className="patient-form-grid" style={{ marginTop: '0' }}>
            <div className="form-group">
              <label htmlFor="metodo-pago-select">Método de Pago *</label>
              <select 
                id="metodo-pago-select"
                value={metodoPago}
                onChange={(e) => {
                  setMetodoPago(e.target.value);
                  setDetallePago(''); // Reset al cambiar
                }}
              >
                <option value="EFECTIVO_USD">💵 Efectivo USD</option>
                <option value="TRANSFERENCIA">🏦 Transferencia Bancaria</option>
                <option value="PAGO_MOVIL">📱 Pago Móvil</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>
                {metodoPago === 'EFECTIVO_USD' 
                  ? 'Descripción de Billetes (Opcional)' 
                  : 'Últimos 4 Dígitos de Referencia *'}
              </label>
              <input 
                type="text"
                placeholder={metodoPago === 'EFECTIVO_USD' ? 'Ej: 2x$20, 1x$10' : 'Ej: 1234'}
                value={detallePago}
                onChange={(e) => {
                  const val = e.target.value;
                  if (metodoPago !== 'EFECTIVO_USD') {
                    if (/^\d*$/.test(val) && val.length <= 4) {
                      setDetallePago(val);
                    }
                  } else {
                    setDetallePago(val);
                  }
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="form-actions" style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
        <button 
          className="btn-primary"
          onClick={handleProcessInvoice}
          disabled={isProcessing}
        >
          {isProcessing ? 'Procesando...' : '💾 Procesar Factura'}
        </button>
      </div>
      {/* Modal de Confirmación Estilizado */}
      <ConfirmModal 
        isOpen={showConfirmModal}
        title="Registrar Factura"
        message="¿Está seguro de que desea registrar esta factura? Esta acción generará un registro permanente en el historial."
        onConfirm={executeInvoiceProcessing}
        onCancel={() => setShowConfirmModal(false)}
        confirmText="Sí, Registrar"
        cancelText="Volver"
        type="warning"
      />

      {/* Modal de Error de Validación */}
      <ConfirmModal 
        isOpen={!!validationError}
        title="Campo Requerido"
        message={validationError}
        onConfirm={() => setValidationError(null)}
        confirmText="Entendido"
        showCancel={false}
        type="danger"
      />
    </div>
  );
};

export default InvoiceForm;
