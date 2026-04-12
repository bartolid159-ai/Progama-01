import { useState, useEffect } from 'react';
import reportService from '../../logic/reportService';

const RevenueChart = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const records = reportService.getFlujoDiario(7); // Últimos 7 días para visualización clara
      setData(records);
    } catch (error) {
      console.error("Error fetching daily flow:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  if (loading || data.length === 0) {
    return (
      <div className="kpi-card glassmorphism" style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p className="text-secondary">No hay datos suficientes para la gráfica.</p>
      </div>
    );
  }

  // Dimensiones del SVG
  const width = 600;
  const height = 250;
  const margin = { top: 20, right: 20, bottom: 40, left: 50 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  // Encontrar el valor máximo para escalar
  const maxVal = Math.max(...data.map(d => Math.max(d.ingresos_usd, d.egresos_usd)), 100);

  const barWidth = (innerWidth / data.length) / 2.5;

  return (
    <div className="kpi-card glassmorphism chart-container">
      <h3>Flujo de Caja (Últimos 7 días)</h3>
      <div style={{ marginTop: '20px', overflowX: 'auto' }}>
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
          {/* Ejes */}
          <line x1={margin.left} y1={height - margin.bottom} x2={width - margin.right} y2={height - margin.bottom} stroke="var(--border-color)" />
          <line x1={margin.left} y1={margin.top} x2={margin.left} y2={height - margin.bottom} stroke="var(--border-color)" />

          {data.map((d, i) => {
            const xBase = margin.left + (i * innerWidth / data.length) + 10;
            
            const hIngresos = (d.ingresos_usd / maxVal) * innerHeight;
            const hEgresos = (d.egresos_usd / maxVal) * innerHeight;

            return (
              <g key={d.fecha}>
                {/* Barra de Ingresos (Verde/Cyan) */}
                <rect 
                  x={xBase} 
                  y={height - margin.bottom - hIngresos} 
                  width={barWidth} 
                  height={hIngresos} 
                  fill="var(--cyan)" 
                  rx="2"
                />
                {/* Barra de Egresos (Rojo) */}
                <rect 
                  x={xBase + barWidth + 2} 
                  y={height - margin.bottom - hEgresos} 
                  width={barWidth} 
                  height={hEgresos} 
                  fill="var(--red)" 
                  rx="2"
                />
                
                {/* Texto de fecha (simplificado) */}
                <text 
                  x={xBase + barWidth} 
                  y={height - 15} 
                  textAnchor="middle" 
                  fontSize="10" 
                  fill="var(--text-secondary)"
                >
                  {d.fecha.split('-').slice(1).reverse().join('/')}
                </text>
              </g>
            );
          })}

          {/* Leyenda */}
          <g transform={`translate(${width - 120}, 10)`}>
            <rect width="10" height="10" fill="var(--cyan)" />
            <text x="15" y="10" fontSize="12" fill="var(--text-primary)">Ingresos</text>
            <rect y="15" width="10" height="10" fill="var(--red)" />
            <text x="15" y="25" fontSize="12" fill="var(--text-primary)">Egresos</text>
          </g>
        </svg>
      </div>
    </div>
  );
};

export default RevenueChart;