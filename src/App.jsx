import { useState, useEffect } from 'react';

function App() {
  const [theme, setTheme] = useState('dark');

  // Aplicamos la clase "light-mode" al body cuando el estado cambie
  useEffect(() => {
    if (theme === 'light') {
      document.body.classList.add('light-mode');
    } else {
      document.body.classList.remove('light-mode');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <div className="layout-container">
      <nav className="sidebar">
        <div className="logo">
          Médica<span>ERP</span>
        </div>
        <ul className="nav-links">
          <li className="active">Dashboard</li>
          <li>Pacientes</li>
          <li>Facturación</li>
          <li>Inventario</li>
          <li>Liquidación</li>
        </ul>
      </nav>
      
      <main className="main-content">
        <header className="topbar">
          <h2>Dashboard</h2>
          <div className="user-profile">
            <button className="theme-toggle" onClick={toggleTheme}>
              {theme === 'light' ? '🌙 Modo Oscuro' : '☀️ Modo Claro'}
            </button>
            <div className="avatar">AD</div>
            <span>Administrador</span>
          </div>
        </header>
        
        <div className="dashboard-grid">
          <div className="kpi-card glassmorphism">
            <h3>Ganancia Neta (Hoy)</h3>
            <p className="amount text-cyan">$850.00</p>
          </div>
          <div className="kpi-card glassmorphism">
            <h3>Consultas Atendidas</h3>
            <p className="amount">24</p>
          </div>
          <div className="kpi-card glassmorphism alert">
            <h3>Alerta de Stock</h3>
            <p className="amount text-red">3 Mínimos</p>
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
