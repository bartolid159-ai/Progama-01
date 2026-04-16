import * as manager from '../../db/manager';
import SecurityModal from '../Common/SecurityModal';
import { login } from '../../auth';

const InvoiceHistory = () => {
  const [facturas, setFacturas] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  // Seguridad y Borrado
  const [securityModal, setSecurityModal] = useState({ isOpen: false, invoiceId: null, error: '' });

  const loadFacturas = useCallback(async (query = '') => {
    setIsLoading(true);
    try {
      const results = query.trim()
        ? await manager.searchFacturas(query)
        : await manager.getAllFacturas();
      setFacturas(results || []);
    } catch (err) {
      console.error('Error al cargar facturas:', err);
      setFacturas([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFacturas();
  }, [loadFacturas]);

  const handleSearch = (e) => {
    const q = e.target.value;
    setSearchQuery(q);
    loadFacturas(q);
  };

  const handleDeleteClick = (id) => {
    setSecurityModal({ isOpen: true, invoiceId: id, error: '' });
  };

  const handleConfirmDelete = async (password) => {
    try {
      // Validamos contra el usuario administrador
      const authResult = await login('admin', password);
      
      if (!authResult.success) {
        setSecurityModal(prev => ({ ...prev, error: 'Clave incorrecta. Acceso denegado.' }));
        return;
      }

      const result = await manager.deleteFactura(securityModal.invoiceId);
      if (result.success) {
        setSecurityModal({ isOpen: false, invoiceId: null, error: '' });
        loadFacturas(searchQuery);
      }
    } catch (err) {
      console.error('Error al eliminar factura:', err);
      setSecurityModal(prev => ({ ...prev, error: 'Error del sistema al procesar el borrado.' }));
    }
  };

  const formatDate = (fecha) => {
    if (!fecha) return '—';
    const d = new Date(fecha);
    return d.toLocaleString('es-VE', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="patient-list animate-in">

      {/* Buscador */}
      <div className="form-group" style={{ marginBottom: '20px', maxWidth: '600px' }}>
        <input
          type="text"
          placeholder="🔍 Buscar por paciente, cédula, teléfono o fecha..."
          value={searchQuery}
          onChange={handleSearch}
          id="invoice-history-search"
        />
      </div>

      {/* Contador */}
      <div style={{ marginBottom: '12px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
        {isLoading ? 'Cargando...' : `${facturas.length} factura${facturas.length !== 1 ? 's' : ''} encontrada${facturas.length !== 1 ? 's' : ''}`}
      </div>

      {/* Tabla */}
      {!isLoading && facturas.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          color: 'var(--text-secondary)'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '12px' }}>📋</div>
          <p style={{ fontSize: '1.1rem' }}>
            {searchQuery ? 'No se encontraron facturas para esta búsqueda.' : 'Aún no hay facturas registradas.'}
          </p>
        </div>
      ) : (
        <div className="table-wrapper glassmorphism">
          <table className="modern-table">
            <thead>
              <tr>
                <th>N° Factura</th>
                <th>Fecha</th>
                <th>Paciente</th>
                <th>Total USD</th>
                <th>Total VES</th>
                <th>Pago</th>
                <th>Ref / Detalle</th>
                <th>Estatus</th>
                <th style={{ textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {facturas.map((f) => (
                <tr key={f.id}>
                  <td>
                    <span style={{ fontWeight: 700, color: 'var(--accent-cyan)' }}>
                      #{String(f.id).padStart(4, '0')}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.87rem', whiteSpace: 'nowrap' }}>
                    {formatDate(f.fecha)}
                  </td>
                  <td style={{ fontWeight: 600 }}>{f.paciente_nombre || '—'}</td>
                  <td>
                    <span style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>
                      ${Number(f.total_usd || 0).toFixed(2)}
                    </span>
                  </td>
                  <td>
                    <span style={{ color: 'var(--accent-yellow)', fontWeight: 600 }}>
                      Bs.{Number(f.total_ves || 0).toFixed(2)}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {f.metodo_pago === 'TRANSFERENCIA' && (
                        <span className="status-badge" style={{ background: 'rgba(56, 182, 255, 0.1)', color: '#38b6ff', border: '1px solid #38b6ff' }}>
                          🏦 Transf
                        </span>
                      )}
                      {f.metodo_pago === 'PAGO_MOVIL' && (
                        <span className="status-badge" style={{ background: 'rgba(255, 158, 0, 0.1)', color: '#ff9e00', border: '1px solid #ff9e00' }}>
                          📱 Móvil
                        </span>
                      )}
                      {f.metodo_pago === 'EFECTIVO_USD' && (
                        <span className="status-badge" style={{ background: 'rgba(74, 222, 128, 0.1)', color: '#4ade80', border: '1px solid #4ade80' }}>
                          💵 Efectivo
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {f.detalle_pago || '—'}
                  </td>
                  <td>
                    <span className={`status-badge ${f.estatus === 'PAGADA' ? 'active' : 'inactive'}`}>
                      {f.estatus || 'PAGADA'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button 
                      className="btn-icon" 
                      onClick={() => handleDeleteClick(f.id)}
                      title="Eliminar Factura"
                      style={{ color: '#ff4444', background: 'rgba(255, 68, 68, 0.1)', border: '1px solid rgba(255, 68, 68, 0.2)' }}
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <SecurityModal 
        isOpen={securityModal.isOpen}
        title="Confirmar Borrado de Factura"
        message={`¿Está seguro que desea eliminar la factura #${String(securityModal.invoiceId).padStart(4, '0')}? Esta acción eliminará también los asientos contables asociados.`}
        error={securityModal.error}
        onConfirm={handleConfirmDelete}
        onCancel={() => setSecurityModal({ isOpen: false, invoiceId: null, error: '' })}
      />
    </div>
  );
};

export default InvoiceHistory;
