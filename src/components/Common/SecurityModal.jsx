import React, { useState } from 'react';

/**
 * Modal de seguridad que solicita una contraseña antes de realizar una acción sensible.
 */
const SecurityModal = ({ 
  isOpen, 
  title = 'Verificación de Seguridad', 
  message = 'Por favor, ingrese la clave de administrador para confirmar esta acción.', 
  onConfirm, 
  onCancel,
  error = ''
}) => {
  const [password, setPassword] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm(password);
    setPassword('');
  };

  return (
    <div className="modal-overlay animate-fade">
      <div className="security-modal glassmorphism animate-in">
        <div className="modal-header">
          <div className="modal-icon danger">🔒</div>
          <h3>{title}</h3>
        </div>
        
        <form onSubmit={handleSubmit} className="modal-body">
          <p>{message}</p>
          
          <div className="form-group" style={{ marginTop: '20px', textAlign: 'left' }}>
            <label>Clave de Acceso</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoFocus
              required
              className={error ? 'input-error' : ''}
            />
            {error && <span className="error-text">{error}</span>}
          </div>
          
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={() => { setPassword(''); onCancel(); }}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary btn-danger-gradient">
              Confirmar Acción
            </button>
          </div>
        </form>
      </div>

      <style>{`
        .modal-overlay {
          position: fixed;
          top: 0; left: 0;
          width: 100vw; height: 100vh;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(10px);
          display: flex; justify-content: center; align-items: center;
          z-index: 3000;
        }

        .security-modal {
          width: 90%;
          max-width: 400px;
          padding: 32px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 24px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          text-align: center;
          background: rgba(15, 15, 25, 0.8);
        }

        .modal-header {
          display: flex; flex-direction: column; align-items: center; gap: 12px;
          margin-bottom: 24px;
        }

        .modal-icon {
          width: 60px; height: 60px;
          border-radius: 50%;
          display: flex; justify-content: center; align-items: center;
          font-size: 1.8rem;
          background: rgba(255, 68, 68, 0.1);
          border: 1px solid rgba(255, 68, 68, 0.3);
          box-shadow: 0 0 20px rgba(255, 68, 68, 0.15);
        }

        .modal-body p {
          color: var(--text-secondary);
          line-height: 1.6;
          margin: 0;
          font-size: 0.95rem;
        }

        .modal-footer {
          display: flex; gap: 12px; margin-top: 32px;
        }

        .modal-footer button {
          flex: 1; padding: 12px; font-weight: 700;
          border-radius: 12px;
          transition: all 0.3s ease;
        }

        .btn-danger-gradient {
          background: linear-gradient(135deg, #ff4444 0%, #db2777 100%) !important;
          border: none !important; color: white !important;
        }

        .btn-danger-gradient:hover {
          box-shadow: 0 10px 15px -3px rgba(255, 68, 68, 0.4);
          transform: translateY(-2px);
        }

        .input-error {
          border-color: #ff4444 !important;
          background: rgba(255, 68, 68, 0.05) !important;
        }

        .error-text {
          color: #ff4444; font-size: 0.8rem; margin-top: 4px; display: block;
        }
      `}</style>
    </div>
  );
};

export default SecurityModal;
