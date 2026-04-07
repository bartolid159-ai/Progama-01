import { useState, useEffect, useCallback } from 'react';
import * as manager from '../../db/manager';

const InvoiceHistory = () => {
  const [facturas, setFacturas] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

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
                <th>Cédula</th>
                <th>Teléfono</th>
                <th>Médico</th>
                <th>Total USD</th>
                <th>Total VES</th>
                <th>Tasa</th>
                <th>Estatus</th>
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
                  <td style={{ color: 'var(--text-secondary)' }}>{f.paciente_cedula || '—'}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{f.paciente_telefono || '—'}</td>
                  <td>{f.medico_nombre || '—'}</td>
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
                  <td style={{ color: 'var(--text-secondary)', fontSize: '0.87rem' }}>
                    {Number(f.tasa_cambio || 0).toFixed(2)}
                  </td>
                  <td>
                    <span className={`status-badge ${f.estatus === 'PAGADA' ? 'active' : 'inactive'}`}>
                      {f.estatus || 'PAGADA'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default InvoiceHistory;
