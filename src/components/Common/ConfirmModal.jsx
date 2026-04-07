import React from 'react';

const ConfirmModal = ({ 
  isOpen, 
  title, 
  message, 
  onConfirm, 
  onCancel, 
  confirmText = 'Confirmar', 
  cancelText = 'Cancelar',
  type = 'danger' // 'danger', 'info', 'warning'
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay animate-fade">
      <div className="confirm-modal glassmorphism animate-in">
        <div className="modal-header">
          <div className={`modal-icon ${type}`}>
            {type === 'danger' ? '⚠️' : type === 'warning' ? '🔔' : 'ℹ️'}
          </div>
          <h3>{title}</h3>
        </div>
        <div className="modal-body">
          <p>{message}</p>
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onCancel}>
            {cancelText}
          </button>
          <button 
            className={`btn-primary ${type === 'danger' ? 'btn-danger-gradient' : ''}`} 
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>

      <style>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(8px);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 2000;
        }

        .confirm-modal {
          width: 90%;
          max-width: 400px;
          padding: 24px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
          text-align: center;
        }

        .modal-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }

        .modal-icon {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          display: flex;
          justify-content: center;
          align-items: center;
          font-size: 1.5rem;
          background: rgba(255, 255, 255, 0.05);
        }

        .modal-icon.danger {
          border: 1px solid rgba(255, 68, 68, 0.5);
          box-shadow: 0 0 15px rgba(255, 68, 68, 0.2);
        }

        .confirm-modal h3 {
          margin: 0;
          font-size: 1.25rem;
          color: var(--text-primary, #fff);
        }

        .modal-body p {
          color: var(--text-secondary, rgba(255, 255, 255, 0.7));
          line-height: 1.5;
          margin: 0;
        }

        .modal-footer {
          display: flex;
          gap: 12px;
          margin-top: 24px;
        }

        .modal-footer button {
          flex: 1;
          padding: 10px;
          font-weight: 600;
        }

        .btn-danger-gradient {
          background: linear-gradient(135deg, #ff4444 0%, #cc0000 100%) !important;
          border: none !important;
          color: white !important;
        }

        .btn-danger-gradient:hover {
          box-shadow: 0 0 20px rgba(255, 68, 68, 0.4);
          transform: translateY(-2px);
        }
      `}</style>
    </div>
  );
};

export default ConfirmModal;
