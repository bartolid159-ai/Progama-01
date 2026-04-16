/** @vitest-environment node */
import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { 
  getDb, 
  closeDb, 
  processInvoice, 
  deleteFactura, 
  getAllFacturas, 
  getFacturaDetalles,
  insertPaciente,
  insertMedico,
  insertServicio
} from '../../src/db/manager.js';

describe('deleteFactura - Borrado Atómico y Seguridad Contable', () => {
  beforeEach(() => {
    closeDb();
    getDb(':memory:');
    
    // Setup basic data
    insertPaciente({
      cedula_rif: 'VTEST', nombre: 'Test Paciente', sexo: 'M',
      fecha_nacimiento: '1990-01-01', telefono: '123', correo: 'a@a.com', direccion: 'x'
    });
    insertMedico({
      nombre: 'Dr. Test', cedula_rif: 'VDOCTEST', telefono: '456',
      correo: 'd@d.com', especialidad: 'X', porcentaje_comision: 10
    });
    insertServicio({
      nombre: 'Svc Test', precio_usd: 100, es_exento: 1, id_medico_defecto: 1
    });
  });

  afterAll(() => {
    closeDb();
  });

  const createTestInvoice = () => {
    const invoiceData = {
      id_paciente: 1,
      id_medico: 1,
      tasa_cambio: 36,
      items: [{ id_servicio: 1, cantidad: 1, precio_usd: 100, es_exento: true }],
      totals: { subtotal_usd: 100, iva_usd: 0, total_usd: 100, total_ves: 3600 },
      commission: 10,
      requiredInsumos: []
    };
    return processInvoice(invoiceData);
  };

  it('debe eliminar la factura y sus registros relacionados de forma atómica', async () => {
    const { facturaId } = createTestInvoice();
    
    // Verificamos que existen
    const db = getDb();
    const facturasPrev = db.prepare('SELECT COUNT(*) as count FROM facturas WHERE id = ?').get(facturaId);
    const detallesPrev = db.prepare('SELECT COUNT(*) as count FROM factura_detalles WHERE id_factura = ?').get(facturaId);
    const asientosPrev = db.prepare('SELECT COUNT(*) as count FROM contabilidad_asientos WHERE referencia_id = ?').get(facturaId);
    
    expect(facturasPrev.count).toBe(1);
    expect(detallesPrev.count).toBe(1);
    expect(asientosPrev.count).toBe(2); // Ingreso y Comisión

    // Ejecutamos el borrado
    const result = deleteFactura(facturaId);
    expect(result.success).toBe(true);

    // Verificamos que ya no existen
    const facturasPost = db.prepare('SELECT COUNT(*) as count FROM facturas WHERE id = ?').get(facturaId);
    const detallesPost = db.prepare('SELECT COUNT(*) as count FROM factura_detalles WHERE id_factura = ?').get(facturaId);
    const asientosPost = db.prepare('SELECT COUNT(*) as count FROM contabilidad_asientos WHERE referencia_id = ?').get(facturaId);
    
    expect(facturasPost.count).toBe(0);
    expect(detallesPost.count).toBe(0);
    expect(asientosPost.count).toBe(0);
  });

  it('debe lanzar error si se intenta borrar una factura inexistente', () => {
    expect(() => deleteFactura(999)).toThrow('No se encontró la factura con ID 999');
  });

  it('no debe afectar a otras facturas al borrar una específica', () => {
    const inv1 = createTestInvoice();
    const inv2 = createTestInvoice();
    
    deleteFactura(inv1.facturaId);
    
    const facturas = getAllFacturas();
    expect(facturas.length).toBe(1);
    expect(facturas[0].id).toBe(inv2.facturaId);
  });
});
