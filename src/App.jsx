import { useState, useEffect } from 'react';
import PatientList from './components/Patients/PatientList';
import PatientForm from './components/Patients/PatientForm';
import DoctorList from './components/Doctors/DoctorList';
import DoctorForm from './components/Doctors/DoctorForm';
import ServiceList from './components/Services/ServiceList';
import ServiceForm from './components/Services/ServiceForm';
import Banner from './components/Common/Banner';

function App() {
  const [theme, setTheme] = useState('dark');
  const [activeView, setActiveView] = useState('dashboard');
  
  // Patient states
  const [showPatientForm, setShowPatientForm] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);
  
  // Doctor states
  const [showDoctorForm, setShowDoctorForm] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState(null);
  
  // Service states
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [editingService, setEditingService] = useState(null);
  
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

  // Patient handlers
  const handleSavePatient = (message) => {
    setShowPatientForm(false);
    setEditingPatient(null);
    setBanner({ message, type: 'success' });
    setActiveView('patients'); 
  };

  const handleEditPatient = (patient) => {
    setEditingPatient(patient);
    setShowPatientForm(true);
  };

  // Doctor handlers
  const handleSaveDoctor = (message) => {
    setShowDoctorForm(false);
    setEditingDoctor(null);
    setBanner({ message, type: 'success' });
    setActiveView('doctors');
  };

  const handleEditDoctor = (doctor) => {
    setEditingDoctor(doctor);
    setShowDoctorForm(true);
  };

  // Service handlers
  const handleSaveService = (message) => {
    setShowServiceForm(false);
    setEditingService(null);
    setBanner({ message, type: 'success' });
    setActiveView('services');
  };

  const handleEditService = (service) => {
    setEditingService(service);
    setShowServiceForm(true);
  };

  const handleCancelForm = () => {
    setShowPatientForm(false);
    setEditingPatient(null);
    setShowDoctorForm(false);
    setEditingDoctor(null);
    setShowServiceForm(false);
    setEditingService(null);
  };

  const closeBanner = () => setBanner({ ...banner, message: '' });

  const getPageTitle = () => {
    switch (activeView) {
      case 'dashboard': return 'Dashboard';
      case 'patients': return 'Gestión de Pacientes';
      case 'doctors': return 'Gestión de Médicos';
      case 'services': return 'Gestión de Servicios';
      default: return 'Sistema de Gestión';
    }
  };

  return (
    <div className="layout-container">
      <nav className="sidebar">
        <div className="logo">
          Médica<span>ERP</span>
        </div>
        <ul className="nav-links">
          <li className={activeView === 'dashboard' ? 'active' : ''} onClick={() => setActiveView('dashboard')}>Dashboard</li>
          <li className={activeView === 'patients' ? 'active' : ''} onClick={() => setActiveView('patients')}>Pacientes</li>
          <li className={activeView === 'doctors' ? 'active' : ''} onClick={() => setActiveView('doctors')}>Médicos</li>
          <li className={activeView === 'services' ? 'active' : ''} onClick={() => setActiveView('services')}>Servicios</li>
          <li>Facturación</li>
          <li>Inventario</li>
          <li>Liquidación</li>
        </ul>
      </nav>
      
      <main className="main-content">
        <header className="topbar">
          <h2>{getPageTitle()}</h2>
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
          <PatientList 
            onAddClick={() => setShowPatientForm(true)} 
            onEditClick={handleEditPatient} 
          />
        )}

        {activeView === 'doctors' && (
          <DoctorList 
            key={showDoctorForm ? 'editing' : 'list'}
            onAddClick={() => setShowDoctorForm(true)} 
            onEditClick={handleEditDoctor} 
          />
        )}

        {activeView === 'services' && (
          <ServiceList 
            key={showServiceForm ? 'editing' : 'list'}
            onAddClick={() => setShowServiceForm(true)} 
            onEditClick={handleEditService} 
          />
        )}

        {showPatientForm && (
          <PatientForm 
            patient={editingPatient}
            onSave={handleSavePatient} 
            onCancel={handleCancelForm} 
          />
        )}

        {showDoctorForm && (
          <DoctorForm 
            doctor={editingDoctor}
            onSave={handleSaveDoctor} 
            onCancel={handleCancelForm} 
          />
        )}

        {showServiceForm && (
          <ServiceForm 
            service={editingService}
            onSave={handleSaveService} 
            onCancel={handleCancelForm} 
          />
        )}
      </main>
    </div>
  )
}

export default App
