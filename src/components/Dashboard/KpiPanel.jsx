import { useState, useEffect } from 'react';
import reportService from '../../logic/reportService';

const KpiPanel = () => {
  const [kpis, setKpis] = useState({
    ingresos: { usd: 0, ves: 0 },
    egresos: { usd: 0, ves: 0 },
    ganancia_neta: { usd: 0, ves: 0 }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const data = reportService.getKpiDia();
      setKpis(data);
    } catch (error) {
      console.error("Error fetching KPIs:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  if (loading) {
    return <div className="loading-spinner">Cargando KPIs...</div>;
  }

  const FormatAmount = ({ usd, ves, colorClass }) => (
    <div className={`amount-group ${colorClass}`}>
      <div className="amount-usd">${usd.toFixed(2)}</div>
      <div className="amount-ves">{ves.toLocaleString('es-VE', { minimumFractionDigits: 2 })} VES</div>
    </div>
  );

  return (
    <div className="dashboard-grid fade-in">
      <div className="kpi-card glassmorphism">
        <h3>Ganancia Neta (Hoy)</h3>
        <FormatAmount 
          usd={kpis.ganancia_neta.usd} 
          ves={kpis.ganancia_neta.ves} 
          colorClass={kpis.ganancia_neta.usd >= 0 ? 'text-cyan' : 'text-red'} 
        />
      </div>
      
      <div className="kpi-card glassmorphism">
        <h3>Total Ingresos</h3>
        <FormatAmount 
          usd={kpis.ingresos.usd} 
          ves={kpis.ingresos.ves} 
          colorClass="text-green" 
        />
      </div>

      <div className="kpi-card glassmorphism">
        <h3>Total Egresos</h3>
        <FormatAmount 
          usd={kpis.egresos.usd} 
          ves={kpis.egresos.ves} 
          colorClass="text-red" 
        />
      </div>
    </div>
  );
};

export default KpiPanel;
