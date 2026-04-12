import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { getDb, closeDb, processInvoice, getFacturaById, getFacturaDetalles, getAllFacturas } from '../../src/db/manager.js';
import Database from 'better-sqlite3';

// Helpers para insertar datos necesarios para FK
const insertPaciente = (p) => {
  const db = getDb();
  return db.prepare(`
    INSERT INTO pacientes (cedula_rif, nombre, sexo, fecha_nacimiento, telefono, email, direccion)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(p.cedula_rif, p.nombre, p.sexo, p.fecha_nacimiento, p.telefono, p.email, p.direccion).lastInsertRowid;
};

const insertMedico = (m) => {
  const db = getDb();
  return db.prepare(`
    INSERT INTO medicos (cedula_rif, nombre, especialidad, porcentaje_comision)
    VALUES (?, ?, ?, ?)
  `).run(m.cedula_rif, m.nombre, m.especialidad, m.porcentaje_comision).lastInsertRowid;
};

const insertServicio = (s) => {
  const db = getDb();
  return db.prepare(`
    INSERT INTO servicios (nombre, precio_usd, es_exento, id_medico_defecto)
    VALUES (?, ?, ?, ?)
  `).run(s.nombre, s.precio_usd, s.es_exento, s.id_medico_defecto).lastInsertRowid;
};

describe('Database Manager - Billing with Payment Methods', () => {
  beforeAll(() => {
    // La base de datos se inicializa automáticamente al importar manager.js en entorno Node
  });

  afterAll(() => {
    closeDb();
  });

  test('debe guardar y recuperar el método de pago y detalle de la factura', async () => {
    // Insertar datos necesarios para FK
    const idPaciente = insertPaciente({
      cedula_rif: 'V-PAY-TEST', nombre: 'Test Pago', sexo: 'M',
      fecha_nacimiento: '1990-01-01', telefono: '123', email: 't@t.com', direccion: 'Dir'
    });

    const idMedico = insertMedico({
      cedula_rif: 'V-DOC-TEST', nombre: 'Dr. Test', especialidad: 'Test', porcentaje_comision: 10
    });

    const idServicio = insertServicio({
      nombre: 'Svc Test', precio_usd: 100, es_exento: 1, id_medico_defecto: idMedico
    });

    const invoiceData = {
      id_paciente: idPaciente,
      id_medico: idMedico,
      tasa_cambio: 36,
      items: [{ id_servicio: idServicio, cantidad: 1, precio_usd: 100, es_exento: true }],
      totals: { subtotal_usd: 100, iva_usd: 0, total_usd: 100, total_ves: 3600 },
      commission: 10,
      requiredInsumos: [],
      metodo_pago: 'TRANSFERENCIA',
      detalle_pago: '1234'
    };

    const result = await processInvoice(invoiceData);
    expect(result.facturaId).toBeDefined();

    const saved = getFacturaById(result.facturaId);
    expect(saved.metodo_pago).toBe('TRANSFERENCIA');
    expect(saved.detalle_pago).toBe('1234');
  });

  test('debe listar todas las facturas en orden descendente', async () => {
    const facturas = getAllFacturas();
    expect(Array.isArray(facturas)).toBe(true);
    expect(facturas.length).toBeGreaterThan(0);
    expect(facturas[0]).toHaveProperty('metodo_pago');
    expect(facturas[0]).toHaveProperty('detalle_pago');
  });
});
