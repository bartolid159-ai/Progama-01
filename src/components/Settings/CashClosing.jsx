import { useState } from 'react';
import { getTeoricoCaja, guardarCierreCaja } from '../../db/manager';
import { calcularDiferenciaCaja } from '../../logic/reportService';

const CashClosing = () => {
  const [step, setStep] = useState(1); // 1: Declaration, 2: Reveal, 3: Success
  const [declaration, setDeclaration] = useState({
    efectivoUsd: '',
    efectivoVes: '',
    transferenciaVes: '',
    transferenciaUsd: '',
    pagoMovil: ''
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    // Permitimos strings vacíos para que el usuario pueda borrar todo el campo
    setDeclaration(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCloseBox = async () => {
    setLoading(true);
    try {
      const hoy = new Date().toISOString().split('T')[0];
      const teorico = getTeoricoCaja(hoy);
      
      const val = (v) => parseFloat(v) || 0;

      const totalDeclaradoUsd = val(declaration.efectivoUsd) + val(declaration.transferenciaUsd) + 
                                (val(declaration.efectivoVes) / 1) + 
                                (val(declaration.transferenciaVes) / 1) + 
                                (val(declaration.pagoMovil) / 1);

      const { diferencia, estado } = calcularDiferenciaCaja(totalDeclaradoUsd, teorico);

      const cierreData = {
        fecha: hoy,
        declarado_usd: totalDeclaradoUsd,
        teorico_usd: teorico,
        diferencia_usd: diferencia,
        estado: estado
      };

      setResult(cierreData);
      setStep(2);
    } catch (error) {
      console.error("Error al cerrar caja:", error);
      alert("Error al procesar el cierre de caja.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmCierre = async () => {
    setLoading(true);
    try {
      await guardarCierreCaja(result);
      setStep(3);
    } catch (error) {
      console.error("Error al guardar cierre:", error);
      alert("Error al guardar el registro final.");
    } finally {
      setLoading(false);
    }
  };

  // Iconos SVG simples para mejorar el aspecto
  const IconDollar = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>;
  const IconCreditCard = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>;
  const IconSmartphone = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>;

  return (
    <div className="cash-closing-view animate-fade">
      <div className="dashboard-header">
        <div className="dashboard-title">
          <h1>Cierre de Caja Ciego</h1>
          <p className="dashboard-subtitle">Control de flujo local: Declare los montos físicos antes de la conciliación.</p>
        </div>
      </div>

      {step === 1 && (
        <div className="cash-closing-card glassmorphism animate-in">
          <div className="internal-grid">
            <div className="form-group">
              <label><IconDollar /> Efectivo USD</label>
              <input 
                type="number" 
                name="efectivoUsd" 
                placeholder="0.00"
                value={declaration.efectivoUsd} 
                onChange={handleInputChange}
                autoFocus
              />
            </div>
            <div className="form-group">
              <label><IconDollar /> Efectivo VES</label>
              <input 
                type="number" 
                name="efectivoVes" 
                placeholder="0.00"
                value={declaration.efectivoVes} 
                onChange={handleInputChange}
              />
            </div>
            <div className="form-group">
              <label><IconCreditCard /> Transferencia VES</label>
              <input 
                type="number" 
                name="transferenciaVes" 
                placeholder="0.00"
                value={declaration.transferenciaVes} 
                onChange={handleInputChange}
              />
            </div>
            <div className="form-group">
              <label><IconSmartphone /> Pago Móvil VES</label>
              <input 
                type="number" 
                name="pagoMovil" 
                placeholder="0.00"
                value={declaration.pagoMovil} 
                onChange={handleInputChange}
              />
            </div>
          </div>
          
          <div className="form-actions-center">
            <button 
              className="btn-primary large-btn" 
              onClick={handleCloseBox}
              disabled={loading}
            >
              <span className="btn-content">
                {loading ? 'Procesando...' : '💰 Proceder al Cierre'}
              </span>
            </button>
          </div>
        </div>
      )}

      {step === 2 && result && (
        <div className="card glassmorphism p-5 mt-4 animate-in reveal-card">
          <h2 className="text-center mb-5">Conciliación de Turno</h2>
          
          <div className="reveal-details">
            <div className="reveal-row">
              <span className="label">Total Declarado</span>
              <span className="value text-cyan">${result.declarado_usd.toFixed(2)}</span>
            </div>
            <div className="reveal-row">
              <span className="label">Esperado en Sistema</span>
              <span className="value text-muted">${result.teorico_usd.toFixed(2)}</span>
            </div>
            <div className="divider"></div>
            <div className={`reveal-row result-row ${result.estado.toLowerCase()}`}>
              <span className="label">Diferencia Final</span>
              <span className="value highlight">
                {result.diferencia_usd > 0 ? '+' : ''}{result.diferencia_usd.toFixed(2)} USD
              </span>
            </div>
          </div>

          <div className={`status-banner mt-5 ${result.estado.toLowerCase()}`}>
            <span className="status-dot"></span>
            RESULTADO: {result.estado}
          </div>

          <div className="dual-actions mt-5">
            <button className="btn-secondary" onClick={() => setStep(1)}>
              ⬅ Re-abrir Declaración
            </button>
            <button className="btn-primary" onClick={handleConfirmCierre}>
              ✅ Confirmar Cierre de Turno
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="card glassmorphism p-5 mt-4 text-center animate-in success-card">
          <div className="success-glow">
            <span className="check-mark">✓</span>
          </div>
          <h2 className="mt-4">Turno Cerrado Exitosamente</h2>
          <p className="text-muted mt-2">Los datos han sido firmados y guardados localmente.</p>
          <button className="btn-primary mt-5 px-5" onClick={() => window.location.reload()}>
            🏠 Volver al Inicio
          </button>
        </div>
      )}

      <style jsx>{`
        .cash-closing-view {
          max-width: 900px;
          margin: 0 auto;
          padding: 1rem;
        }
        .cash-closing-card {
          padding: 3rem;
          margin-top: 1rem;
        }
        .internal-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 2.5rem;
          margin-bottom: 3rem;
        }
        .form-group label {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 0.75rem;
          font-weight: 600;
          color: var(--text-muted);
        }
        .form-group input {
          font-size: 1.25rem !important;
          padding: 1rem 1.5rem !important;
          background: rgba(15, 23, 42, 0.4) !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          text-align: center;
        }
        .form-actions-center {
          display: flex;
          justify-content: center;
        }
        .large-btn {
          padding: 1rem 3rem !important;
          font-size: 1.1rem !important;
          border-radius: 50px !important;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .reveal-card {
          max-width: 650px;
          margin: 2rem auto;
          padding: 3.5rem !important;
        }
        .reveal-details {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        .reveal-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 1.15rem;
        }
        .reveal-row .value {
          font-weight: 700;
          font-family: 'JetBrains Mono', 'Courier New', monospace;
        }
        .divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, var(--border-color), transparent);
          margin: 1.5rem 0;
          opacity: 0.5;
        }
        .result-row {
          margin-top: 0.5rem;
        }
        .result-row.ok { color: #10B981; }
        .result-row.alerta { color: #F59E0B; }
        .result-row.faltante { color: #EF4444; }
        .highlight {
          font-size: 2.2rem;
          letter-spacing: -1px;
        }
        .status-banner {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          padding: 1.25rem;
          border-radius: 16px;
          font-weight: 800;
          letter-spacing: 2px;
          text-transform: uppercase;
          font-size: 0.9rem;
        }
        .status-banner.ok { background: rgba(16, 185, 129, 0.1); color: #10B981; border: 1px solid rgba(16, 185, 129, 0.3); }
        .status-banner.alerta { background: rgba(245, 158, 11, 0.1); color: #F59E0B; border: 1px solid rgba(245, 158, 11, 0.3); }
        .status-banner.faltante { background: rgba(239, 68, 68, 0.1); color: #EF4444; border: 1px solid rgba(239, 68, 68, 0.3); }
        .status-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: currentColor;
          box-shadow: 0 0 12px currentColor;
        }
        .dual-actions {
          display: flex;
          gap: 1.25rem;
          align-items: stretch;
        }
        .dual-actions button {
          flex: 1;
          padding: 1.25rem !important;
          font-size: 1rem !important;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          height: 60px; /* Altura fija para balance visual */
        }
        .success-card {
          max-width: 500px;
          margin: 4rem auto;
        }
        .success-glow {
          width: 80px;
          height: 80px;
          background: rgba(16, 185, 129, 0.2);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto;
          box-shadow: 0 0 30px rgba(16, 185, 129, 0.3);
        }
        .check-mark {
          font-size: 2.5rem;
          color: #10B981;
        }
      `}</style>
    </div>
  );
};

export default CashClosing;
