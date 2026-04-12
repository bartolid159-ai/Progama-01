import { useState, useEffect } from 'react';
import reportService from '../../logic/reportService';

const StockAlertWidget = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const data = reportService.getStockAlertas();
      setAlerts(data);
    } catch (error) {
      console.error("Error fetching stock alerts:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  if (loading) return null;

  return (
    <div className={`kpi-card glassmorphism ${alerts.length > 0 ? 'alert' : 'success'}`}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3>Alertas Críticas de Stock</h3>
        {alerts.length > 0 && (
          <span className="badge-red">{alerts.length} Insumos</span>
        )}
      </div>
      
      {alerts.length > 0 ? (
        <div style={{ marginTop: '15px' }}>
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Cód.</th>
                <th>Nombre</th>
                <th>Categoría</th>
                <th>Actual</th>
              </tr>
            </thead>
            <tbody>
              {alerts.map(item => (
                <tr key={item.id}>
                  <td className="text-secondary">{item.codigo || '-'}</td>
                  <td>{item.nombre}</td>
                  <td><span className="badge-outline">{item.categoria || 'Sin Cat.'}</span></td>
                  <td className="text-red font-bold">{item.stock_actual} / {item.stock_minimo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-cyan" style={{ marginTop: '12px' }}>✅ Todos los suministros están en niveles óptimos.</p>
      )}
    </div>
  );
};

export default StockAlertWidget;
