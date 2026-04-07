import React, { useEffect } from 'react';

const Notification = ({ 
  message, 
  type = 'success', // 'success', 'error', 'info'
  onClose,
  duration = 3000 
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const getIcon = () => {
    switch (type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'info': return 'ℹ️';
      default: return '🔔';
    }
  };

  return (
    <div className={`notification-toast glassmorphism animate-in ${type}`}>
      <div className="notification-icon">{getIcon()}</div>
      <div className="notification-message">{message}</div>
      <button className="notification-close" onClick={onClose}>×</button>

      <style>{`
        .notification-toast {
          position: fixed;
          top: 20px;
          right: 20px;
          min-width: 250px;
          max-width: 350px;
          padding: 12px 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          z-index: 3000;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        }

        .notification-toast.success {
          border-left: 4px solid #4ade80;
        }

        .notification-toast.error {
          border-left: 4px solid #f87171;
        }

        .notification-toast.info {
          border-left: 4px solid #60a5fa;
        }

        .notification-icon {
          font-size: 1.2rem;
        }

        .notification-message {
          flex: 1;
          font-size: 0.9rem;
          color: white;
          font-weight: 500;
        }

        .notification-close {
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.5);
          font-size: 1.5rem;
          cursor: pointer;
          padding: 0;
          line-height: 1;
        }

        .notification-close:hover {
          color: white;
        }
      `}</style>
    </div>
  );
};

export default Notification;
