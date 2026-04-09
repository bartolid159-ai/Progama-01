/** @vitest-environment node */
import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest';
import { getDb, closeDb, processInvoice, getFacturaById, getFacturaDetalles } from '../../src/db/manager.js';
import { insertPaciente, insertMedico, insertServicio, insertInsumo, setServicioInsumos } from '../../src/db/manager.js';

describe('processInvoice - Persistencia ACID', () => {
  beforeEach(() => {
    closeDb();
    const db = getDb(':memory:'); // Force memory for clean tests
    
    // Check if some core tables exist
    const tables = db.prepare(`SELECT name FROM sqlite_master WHERE type='table'`).all();
    const tableNames = tables.map(t => t.name);
    if (!tableNames.includes('pacientes')) {
       throw new Error("Critical: 'pacientes' table not found in memory DB. Schema loading failed.");
    }
  });

  const setupTestData = async () => {
    const db = getDb();
    
    insertPaciente({
      cedula_rif: 'V12345678',
      nombre: 'Juan Pérez',
      sexo: 'M',
      fecha_nacimiento: '1990-01-01',
      telefono: '04121234567',
      correo: 'juan@test.com',
      direccion: 'Caracas'
    });

    insertMedico({
      nombre: 'Dr. House',
      cedula_rif: 'V98765432',
      telefono: '04149876543',
      correo: 'house@test.com',
      especialidad: 'Medicina General',
      porcentaje_comision: 10
    });

    insertServicio({
      nombre: 'Consulta General',
      precio_usd: 30,
      es_exento: 1,
      id_medico_defecto: 1
    });

    insertInsumo({
      nombre: 'Guantes de Látex',
      stock_actual: 100,
      stock_minimo: 10,
      unidad_medida: 'Par',
      costo_unitario_usd: 0.50
    });

    setServicioInsumos(1, [{ id_insumo: 1, cantidad: 2 }]);
  };

  it('debe crear una factura con transacción ACID', async () => {
    await setupTestData();

    const invoiceData = {
      id_paciente: 1,
      id_medico: 1,
      tasa_cambio: 36,
      items: [
        { id_servicio: 1, cantidad: 1, precio_usd: 30, es_exento: true }
      ],
      totals: {
        subtotal_usd: 30,
        iva_usd: 0,
        total_usd: 30,
        total_ves: 1080
      },
      commission: 3,
      requiredInsumos: [{ id_insumo: 1, cantidad_total: 2 }]
    };

    const result = processInvoice(invoiceData);

    expect(result.success).toBe(true);
    expect(result.facturaId).toBe(1);
  });

  it('debe reducir el stock de insumos al procesar factura', async () => {
    await setupTestData();

    const invoiceData = {
      id_paciente: 1,
      id_medico: 1,
      tasa_cambio: 36,
      items: [
        { id_servicio: 1, cantidad: 1, precio_usd: 30, es_exento: true }
      ],
      totals: { subtotal_usd: 30, iva_usd: 0, total_usd: 30, total_ves: 1080 },
      commission: 3,
      requiredInsumos: [{ id_insumo: 1, cantidad_total: 2 }]
    };

    processInvoice(invoiceData);

    const db = getDb();
    const insumo = db.prepare('SELECT stock_actual FROM insumos WHERE id = 1').get();
    expect(insumo.stock_actual).toBe(98);
  });

  it('debe crear asientos contables de ingreso y comisión', async () => {
    await setupTestData();

    const invoiceData = {
      id_paciente: 1,
      id_medico: 1,
      tasa_cambio: 36,
      items: [
        { id_servicio: 1, cantidad: 1, precio_usd: 30, es_exento: true }
      ],
      totals: { subtotal_usd: 30, iva_usd: 0, total_usd: 30, total_ves: 1080 },
      commission: 3,
      requiredInsumos: []
    };

    processInvoice(invoiceData);

    const db = getDb();
    const asientos = db.prepare('SELECT * FROM asientos_contables ORDER BY id').all();
    
    expect(asientos.length).toBe(2);
    expect(asientos[0].tipo).toBe('INGRESO');
    expect(asientos[0].monto_usd).toBe(30);
    expect(asientos[1].tipo).toBe('EGRESO');
    expect(asientos[1].categoria).toBe('COMISION');
    expect(asientos[1].monto_usd).toBe(3);
  });

  it('debe calcular IVA para servicios no exentos', async () => {
    closeDb();
    getDb(':memory:');
    
    insertPaciente({
      cedula_rif: 'V12345678',
      nombre: 'Juan Pérez',
      sexo: 'M',
      fecha_nacimiento: '1990-01-01',
      telefono: '04121234567',
      correo: 'juan@test.com',
      direccion: 'Caracas'
    });

    insertMedico({
      nombre: 'Dr. House',
      cedula_rif: 'V98765432',
      telefono: '04149876543',
      correo: 'house@test.com',
      especialidad: 'Medicina General',
      porcentaje_comision: 10
    });

    insertServicio({
      nombre: 'Electrocardiograma',
      precio_usd: 50,
      es_exento: 0,
      id_medico_defecto: 1
    });

    const invoiceData = {
      id_paciente: 1,
      id_medico: 1,
      tasa_cambio: 36,
      items: [
        { id_servicio: 1, cantidad: 1, precio_usd: 50, es_exento: false }
      ],
      totals: { subtotal_usd: 50, iva_usd: 8, total_usd: 58, total_ves: 2088 },
      commission: 5.8,
      requiredInsumos: []
    };

    const result = processInvoice(invoiceData);
    expect(result.success).toBe(true);

    const detalles = getFacturaDetalles(result.facturaId);
    expect(detalles[0].iva_porcentaje).toBe(16);
    expect(detalles[0].precio_unitario_usd).toBe(50);
  });
});
