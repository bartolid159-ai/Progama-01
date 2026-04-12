import { useState, useEffect } from 'react';
import PatientList from './components/Patients/PatientList';
import PatientForm from './components/Patients/PatientForm';
import DoctorList from './components/Doctors/DoctorList';
import DoctorForm from './components/Doctors/DoctorForm';
import ServiceList from './components/Services/ServiceList';
import ServiceForm from './components/Services/ServiceForm';
import InvoiceForm from './components/Billing/InvoiceForm';
import InvoiceHistory from './components/Billing/InvoiceHistory';
import KpiPanel from './components/Dashboard/KpiPanel';
import StockAlertWidget from './components/Dashboard/StockAlertWidget';
import RevenueChart from './components/Dashboard/RevenueChart';
import Banner from './components/Common/Banner';
import Dashboard from './components/Dashboard/Dashboard';

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
  
  // Billing states
  const [billingSubView, setBillingSubView] = useState('form');
  const [lastInvoiceKey, setLastInvoiceKey] = useState(0);

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

  const handleShowBanner = (message, type = 'success') => {
    setBanner({ message, type });
  };

  const getPageTitle = () => {
    switch (activeView) {
      case 'dashboard': return 'Dashboard';
      case 'patients': return 'Gestión de Pacientes';
      case 'doctors': return 'Gestión de Médicos';
      case 'services': return 'Gestión de Servicios';
      case 'billing': return 'Facturación';
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
          <li className={activeView === 'billing' ? 'active' : ''} onClick={() => { setActiveView('billing'); setBillingSubView('form'); }}>Facturación</li>
          <li className={activeView === 'reports' ? 'active' : ''} onClick={() => setActiveView('reports')}>Reportes</li>
          <li>Inventario</li>
          <li>Liquidación</li>
        </ul>
      </nav>
      
      <main className="main-content">
        <header className="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <h2>{getPageTitle()}</h2>
            {activeView === 'billing' && (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className={billingSubView === 'form' ? 'btn-primary' : 'btn-secondary'}
                  style={{ fontSize: '0.85rem', padding: '6px 14px' }}
                  onClick={() => setBillingSubView('form')}
                  id="billing-new-invoice-btn"
                >
                  ➕ Nueva Factura
                </button>
                <button
                  className={billingSubView === 'history' ? 'btn-primary' : 'btn-secondary'}
                  style={{ fontSize: '0.85rem', padding: '6px 14px' }}
                  onClick={() => setBillingSubView('history')}
                  id="billing-history-btn"
                >
                  📋 Historial
                </button>
              </div>
            )}
          </div>
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
          <Dashboard onShowBanner={handleShowBanner} />
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



        {activeView === 'billing' && billingSubView === 'form' && (
          <InvoiceForm
            key={lastInvoiceKey}
            onProcessComplete={() => {
              setLastInvoiceKey(k => k + 1);
              setBanner({ message: 'Factura procesada y guardada exitosamente.', type: 'success' });
            }}
          />
        )}

        {activeView === 'billing' && billingSubView === 'history' && (
          <InvoiceHistory />
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
