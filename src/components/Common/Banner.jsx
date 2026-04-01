import { useEffect } from 'react';

const Banner = ({ message, type = 'success', onClose, duration = 3000 }) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  if (!message) return null;

  return (
    <div className={`banner banner-${type} glassmorphism`}>
      <div className="banner-content">
        {type === 'success' ? '✅' : '❌'} {message}
      </div>
      <button className="banner-close" onClick={onClose}>&times;</button>
    </div>
  );
};

export default Banner;
