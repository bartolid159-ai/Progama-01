import { useState, useEffect } from 'react';
import PatientList from './components/Patients/PatientList';
import PatientForm from './components/Patients/PatientForm';
import Banner from './components/Common/Banner';

function App() {
  const [theme, setTheme] = useState('dark');
  const [activeView, setActiveView] = useState('dashboard');
  const [showPatientForm, setShowPatientForm] = useState(false);
  const [banner, setBanner] = useState({ message: '', type: 'success' });

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

  const handleSavePatient = (message) => {
    setShowPatientForm(false);
    setBanner({ message, type: 'success' });
    // Recargar vista si fuese necesario (en este caso el PatientList se refresca al montarse de nuevo)
    setActiveView('patients'); 
  };

  const closeBanner = () => setBanner({ ...banner, message: '' });

  return (
    <div className="layout-container">
      <nav className="sidebar">
        <div className="logo">
          Médica<span>ERP</span>
        </div>
        <ul className="nav-links">
          <li className={activeView === 'dashboard' ? 'active' : ''} onClick={() => setActiveView('dashboard')}>Dashboard</li>
          <li className={activeView === 'patients' ? 'active' : ''} onClick={() => setActiveView('patients')}>Pacientes</li>
          <li>Facturación</li>
          <li>Inventario</li>
          <li>Liquidación</li>
        </ul>
      </nav>
      
      <main className="main-content">
        <header className="topbar">
          <h2>{activeView === 'dashboard' ? 'Dashboard' : 'Gestión de Pacientes'}</h2>
          <div className="user-profile">
            <button className="theme-toggle" onClick={toggleTheme}>
              {theme === 'light' ? '🌙 Modo Oscuro' : '☀️ Modo Claro'}
            </button>
            <div className="avatar">AD</div>
            <span>Administrador</span>
          </div>
        </header>

        {banner.message && <Banner message={banner.message} type={banner.type} onClose={closeBanner} />}
        
        {activeView === 'dashboard' && (
          <div className="dashboard-grid fade-in">
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
        )}

        {activeView === 'patients' && (
          <PatientList onAddClick={() => setShowPatientForm(true)} />
        )}

        {showPatientForm && (
          <PatientForm onSave={handleSavePatient} onCancel={() => setShowPatientForm(false)} />
        )}
      </main>
    </div>
  )
}

export default App
