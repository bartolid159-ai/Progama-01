import { useState, useEffect } from 'react';
import reportService from '../../logic/reportService';

const RateHistoryWidget = () => {
  const [rates, setRates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const data = reportService.getAuditoriaTasas(5);
      setRates(data);
    } catch (error) {
      console.error("Error fetching rates:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  if (loading || rates.length === 0) return null;

  return (
    <div className="kpi-card glassmorphism">
      <h3>Historial de Tasas (BCV)</h3>
      <div style={{ marginTop: '12px' }}>
        <table className="dashboard-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Valor (VES/USD)</th>
            </tr>
          </thead>
          <tbody>
            {rates.map((r, idx) => (
              <tr key={idx}>
                <td className="text-secondary">{r.fecha}</td>
                <td className="text-white font-bold">{r.valor_bcv.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RateHistoryWidget;
