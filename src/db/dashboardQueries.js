import { getDb } from './manager';

export const dashboardQueries = {
  getMonthlyRevenue: (days = 30) => {
    const db = getDb();
    const result = db.exec(`
      SELECT COALESCE(SUM(total_usd), 0) as total
      FROM facturas
      WHERE fecha >= datetime('now', '-${days} days')
        AND estatus = 'PAGADA'
    `);
    return result.length > 0 ? result[0].values[0][0] : 0;
  },

  getActivePatients: () => {
    const db = getDb();
    const result = db.exec(`
      SELECT COUNT(DISTINCT id) 
      FROM pacientes
      WHERE created_at >= datetime('now', '-365 days')
    `);
    return result.length > 0 ? result[0].values[0][0] : 0;
  },

  getTotalPatients: () => {
    const db = getDb();
    const result = db.exec('SELECT COUNT(*) FROM pacientes');
    return result.length > 0 ? result[0].values[0][0] : 0;
  },

  getMonthlyGrowth: () => {
    const db = getDb();
    const currentMonth = db.exec(`
      SELECT COALESCE(SUM(total_usd), 0) 
      FROM facturas 
      WHERE fecha >= datetime('now', '-30 days') 
        AND estatus = 'PAGADA'
    `);
    
    const previousMonth = db.exec(`
      SELECT COALESCE(SUM(total_usd), 0) 
      FROM facturas 
      WHERE fecha >= datetime('now', '-60 days') 
        AND fecha < datetime('now', '-30 days')
        AND estatus = 'PAGADA'
    `);

    const current = currentMonth.length > 0 ? currentMonth[0].values[0][0] : 0;
    const previous = previousMonth.length > 0 ? previousMonth[0].values[0][0] : 0;

    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  },

  getOccupancyRate: () => {
    const db = getDb();
    const totalSlots = db.exec(`
      SELECT COUNT(*) * 8 
      FROM medicos 
      WHERE activo = 1
    `);
    
    const appointments = db.exec(`
      SELECT COUNT(*) 
      FROM facturas 
      WHERE fecha >= datetime('now', '-7 days')
    `);

    const slots = totalSlots.length > 0 ? totalSlots[0].values[0][0] : 0;
    const booked = appointments.length > 0 ? appointments[0].values[0][0] : 0;

    if (slots === 0) return 0;
    return Math.min(100, (booked / slots) * 100);
  },

  getRevenueByDay: (days = 30) => {
    const db = getDb();
    const result = db.exec(`
      SELECT DATE(fecha) as date, COALESCE(SUM(total_usd), 0) as total
      FROM facturas
      WHERE fecha >= datetime('now', '-${days} days')
        AND estatus = 'PAGADA'
      GROUP BY DATE(fecha)
      ORDER BY date
    `);
    
    if (result.length === 0) return [];
    
    return result[0].values.map(row => ({
      date: row[0],
      total: row[1]
    }));
  },

  getTopServices: (limit = 5) => {
    const db = getDb();
    const result = db.exec(`
      SELECT 
        s.nombre,
        COUNT(fd.id_servicio) as count,
        SUM(fd.precio_unitario_usd * fd.cantidad) as revenue
      FROM factura_detalles fd
      JOIN servicios s ON fd.id_servicio = s.id
      JOIN facturas f ON fd.id_factura = f.id
      WHERE f.fecha >= datetime('now', '-30 days')
      GROUP BY s.id
      ORDER BY count DESC
      LIMIT ${limit}
    `);
    
    if (result.length === 0) return [];
    
    return result[0].values.map(row => ({
      name: row[0],
      count: row[1],
      revenue: row[2]
    }));
  },

  getDoctorPerformance: () => {
    const db = getDb();
    const result = db.exec(`
      SELECT 
        m.nombre,
        COUNT(f.id) as appointments,
        COALESCE(SUM(f.total_usd), 0) as revenue
      FROM medicos m
      LEFT JOIN facturas f ON m.id = f.id_medico
        AND f.fecha >= datetime('now', '-30 days')
      WHERE m.activo = 1
      GROUP BY m.id
      ORDER BY revenue DESC
    `);
    
    if (result.length === 0) return [];
    
    return result[0].values.map(row => ({
      name: row[0],
      appointments: row[1],
      revenue: row[2]
    }));
  },

  getLowStockItems: () => {
    const db = getDb();
    const result = db.exec(`
      SELECT nombre, stock_actual, stock_minimo
      FROM insumos
      WHERE stock_actual <= stock_minimo
      ORDER BY (stock_actual * 1.0 / NULLIF(stock_minimo, 0)) ASC
      LIMIT 5
    `);
    
    if (result.length === 0) return [];
    
    return result[0].values.map(row => ({
      name: row[0],
      current: row[1],
      minimum: row[2]
    }));
  },

  getRecentInvoices: (limit = 10) => {
    const db = getDb();
    const result = db.exec(`
      SELECT 
        f.id,
        p.nombre as patient,
        m.nombre as doctor,
        f.total_usd,
        f.fecha,
        f.estatus
      FROM facturas f
      LEFT JOIN pacientes p ON f.id_paciente = p.id
      LEFT JOIN medicos m ON f.id_medico = m.id
      ORDER BY f.fecha DESC
      LIMIT ${limit}
    `);
    
    if (result.length === 0) return [];
    
    return result[0].values.map(row => ({
      id: row[0],
      patient: row[1] || 'N/A',
      doctor: row[2] || 'N/A',
      total: row[3],
      date: row[4],
      status: row[5]
    }));
  },

  getMonthlyComparison: () => {
    const db = getDb();
    const result = db.exec(`
      SELECT 
        strftime('%Y-%m', fecha) as month,
        COALESCE(SUM(total_usd), 0) as total
      FROM facturas
      WHERE fecha >= datetime('now', '-12 months')
        AND estatus = 'PAGADA'
      GROUP BY strftime('%Y-%m', fecha)
      ORDER BY month
    `);
    
    if (result.length === 0) return [];
    
    return result[0].values.map(row => ({
      month: row[0],
      total: row[1]
    }));
  }
};

export const getDashboardMetrics = () => {
  return {
    monthlyRevenue: dashboardQueries.getMonthlyRevenue(30),
    activePatients: dashboardQueries.getTotalPatients(),
    monthlyGrowth: parseFloat(dashboardQueries.getMonthlyGrowth().toFixed(1)),
    occupancyRate: parseFloat(dashboardQueries.getOccupancyRate().toFixed(1)),
    revenueByDay: dashboardQueries.getRevenueByDay(30),
    topServices: dashboardQueries.getTopServices(5),
    doctorPerformance: dashboardQueries.getDoctorPerformance(),
    lowStockItems: dashboardQueries.getLowStockItems(),
    recentInvoices: dashboardQueries.getRecentInvoices(10)
  };
};

export default dashboardQueries;