import { useState, useEffect } from 'react';
import reportService from '../../logic/reportService';

const TopServicesWidget = () => {
  const [topServices, setTopServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const data = reportService.getTopServicios(5);
      setTopServices(data);
    } catch (error) {
      console.error("Error fetching top services:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  if (loading) return null;

  return (
    <div className="kpi-card glassmorphism">
      <h3>Top 5 Servicios (Pareto Real)</h3>
      <div style={{ marginTop: '15px' }}>
        <table className="dashboard-table">
          <thead>
            <tr>
              <th>Servicio</th>
              <th>Ingresos USD</th>
              <th>Ganancia Real</th>
            </tr>
          </thead>
          <tbody>
            {topServices.map((s, idx) => (
              <tr key={idx}>
                <td className="font-bold">{s.nombre}</td>
                <td className="text-secondary">${s.ingresos_usd.toFixed(2)}</td>
                <td className="text-cyan">${s.ganancia_neta_usd.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TopServicesWidget;
