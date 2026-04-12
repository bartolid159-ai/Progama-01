import KpiPanel from './KpiPanel';
import StockAlertWidget from './StockAlertWidget';
import RevenueChart from './RevenueChart';
import TopServicesWidget from './TopServicesWidget';
import RateHistoryWidget from './RateHistoryWidget';

function Dashboard() {
  return (
    <div className="dashboard-container fade-in">
      <header className="dashboard-header" style={{ marginBottom: '24px' }}>
        <div className="dashboard-title">
          <h1>Panel de Inteligencia de Negocio</h1>
          <p className="dashboard-subtitle">Control bimoneda y métricas operativas (PRD v2)</p>
        </div>
      </header>

      {/* 1. KPIs Principales (Bimoneda Hoy) */}
      <KpiPanel />

      <div className="dashboard-layout" style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Fila 1: Gráfica y Alertas Stock */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '24px' }}>
          <RevenueChart />
          <StockAlertWidget />
        </div>

        {/* Fila 2: Pareto Real y Auditoría de Tasas */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '24px' }}>
          <TopServicesWidget />
          <RateHistoryWidget />
        </div>

      </div>
    </div>
  );
}

export default Dashboard;