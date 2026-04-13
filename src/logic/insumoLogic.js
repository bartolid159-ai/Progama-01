import * as dbManager from '../db/manager.js';

let isBrowser = typeof window !== 'undefined' && typeof window.document !== 'undefined';

export const setBrowserMode = (mode) => { isBrowser = mode; };

const getDbManager = () => {
  if (isBrowser) return null;
  return dbManager;
};

const INSUMOS_KEY = 'clinica_insumos';
const CATEGORIAS_KEY = 'clinica_categorias_insumos';

const getBrowserInsumos = () => JSON.parse(localStorage.getItem(INSUMOS_KEY) || '[]');
const saveBrowserInsumos = (insumos) => localStorage.setItem(INSUMOS_KEY, JSON.stringify(insumos));
const getBrowserCategorias = () => JSON.parse(localStorage.getItem(CATEGORIAS_KEY) || '[]');
const saveBrowserCategorias = (categorias) => localStorage.setItem(CATEGORIAS_KEY, JSON.stringify(categorias));

export const registerCategoria = async (nombre) => {
  if (isBrowser) {
    const categorias = getBrowserCategorias();
    const newCat = { id: Date.now(), nombre };
    categorias.push(newCat);
    saveBrowserCategorias(categorias);
    return { success: true, message: "Categoría registrada (Navegador)." };
  }
  const db = getDbManager();
  const result = db.insertCategoria(nombre);
  return { success: true, message: "Categoría registrada.", id: result.lastInsertRowid };
};

export const getCategorias = async () => {
  if (isBrowser) return getBrowserCategorias();
  const db = getDbManager();
  return db.getAllCategorias();
};

export const registerInsumo = async (insumoData) => {
  try {
    if (!insumoData.codigo || !insumoData.nombre) {
      return { success: false, message: "Código y nombre son obligatorios." };
    }
    if (insumoData.id_categoria) {
      const categorias = isBrowser ? getBrowserCategorias() : getDbManager().getAllCategorias();
      const catExists = categorias.find(c => Number(c.id) === Number(insumoData.id_categoria));
      if (!catExists) {
        return { success: false, message: "La categoría seleccionada no existe." };
      }
    }

    if (isBrowser) {
      const insumos = getBrowserInsumos();
      const newInsumo = { ...insumoData, id: Date.now() };
      insumos.push(newInsumo);
      saveBrowserInsumos(insumos);
      return { success: true, message: "Insumo registrado (Navegador)." };
    }

    const db = getDbManager();
    const result = db.insertInsumo(insumoData);
    return { success: true, message: "Insumo registrado.", id: result.lastInsertRowid };
  } catch (error) {
    console.error("Error in registerInsumo:", error);
    return { success: false, message: error.message || "Error al registrar el insumo." };
  }
};

export const updateInsumo = async (insumoData) => {
  try {
    if (!insumoData.id) return { success: false, message: "ID obligatorio." };
    if (!insumoData.codigo || !insumoData.nombre) {
      return { success: false, message: "Código y nombre son obligatorios." };
    }

    if (isBrowser) {
      const insumos = getBrowserInsumos();
      const index = insumos.findIndex(i => Number(i.id) === Number(insumoData.id));
      if (index !== -1) {
        insumos[index] = { ...insumos[index], ...insumoData };
        saveBrowserInsumos(insumos);
        return { success: true, message: "Insumo actualizado (Navegador)." };
      }
      return { success: false, message: "Insumo no encontrado." };
    }

    const db = getDbManager();
    db.updateInsumo(insumoData);
    return { success: true, message: "Insumo actualizado." };
  } catch (error) {
    console.error("Error in updateInsumo:", error);
    return { success: false, message: error.message || "Error al actualizar el insumo." };
  }
};

export const deleteInsumo = async (id) => {
  try {
    const numericId = Number(id);
    if (isNaN(numericId)) return { success: false, message: "ID inválido." };

    if (isBrowser) {
      const insumos = getBrowserInsumos().filter(i => Number(i.id) !== numericId);
      saveBrowserInsumos(insumos);
      return { success: true, message: "Insumo eliminado (Navegador)." };
    }

    const db = getDbManager();
    db.deleteInsumo(numericId);
    return { success: true, message: "Insumo eliminado." };
  } catch (error) {
    console.error("Error in deleteInsumo:", error);
    return { success: false, message: "Error al eliminar el insumo." };
  }
};

export const getInsumos = async () => {
  if (isBrowser) return getBrowserInsumos();
  const db = getDbManager();
  return db.getAllInsumos();
};

export const searchInsumos = async (query, idCategoria = null) => {
  if (isBrowser) {
    let insumos = getBrowserInsumos();
    if (query) {
      const q = query.toLowerCase();
      insumos = insumos.filter(i => 
        i.nombre?.toLowerCase().includes(q) || i.codigo?.toLowerCase().includes(q)
      );
    }
    if (idCategoria) {
      insumos = insumos.filter(i => Number(i.id_categoria) === Number(idCategoria));
    }
    return insumos;
  }
  const db = getDbManager();
  return db.searchInsumos(query, idCategoria);
};

export const getInsumosConStockBajo = async () => {
  if (isBrowser) {
    return getBrowserInsumos().filter(i => Number(i.stock_actual) <= Number(i.stock_minimo));
  }
  const db = getDbManager();
  return db.getInsumosConStockBajo();
};

export const validarStockInsumos = async (requiredInsumos) => {
  if (!requiredInsumos || requiredInsumos.length === 0) {
    return { valido: true, faltantes: [] };
  }

  if (isBrowser) {
    const insumos = getBrowserInsumos();
    const faltantes = [];
    for (const req of requiredInsumos) {
      const insumo = insumos.find(i => Number(i.id) === Number(req.id_insumo));
      if (!insumo) {
        faltantes.push({ id_insumo: req.id_insumo, nombre: `ID ${req.id_insumo}`, requerido: req.cantidad_total, disponible: 0 });
      } else if (Number(insumo.stock_actual) < req.cantidad_total) {
        faltantes.push({ id_insumo: req.id_insumo, nombre: insumo.nombre, requerido: req.cantidad_total, disponible: Number(insumo.stock_actual) });
      }
    }
    return { valido: faltantes.length === 0, faltantes };
  }

  const db = getDbManager();
  return db.validarStockInsumos(requiredInsumos);
};

export const registrarCompra = async (compraData) => {
  const { proveedor, observaciones, items } = compraData;
  
  if (isBrowser) {
    const compras = JSON.parse(localStorage.getItem('clinica_compras') || '[]');
    const detallesLocal = JSON.parse(localStorage.getItem('clinica_compra_detalles') || '[]');
    const nuevosInsumos = getBrowserInsumos();
    
    const totalUsd = items.reduce((sum, item) => sum + (item.cantidad * item.costo_unitario_usd), 0);
    const compraId = Date.now();
    
    const nuevaCompra = {
      id: compraId,
      fecha: new Date().toISOString(),
      proveedor: proveedor || '',
      total_usd: totalUsd,
      observaciones: observaciones || '',
      num_items: items.length
    };
    compras.push(nuevaCompra);
    localStorage.setItem('clinica_compras', JSON.stringify(compras));
    
    for (const item of items) {
      detallesLocal.push({
        id_compra: compraId,
        id_insumo: item.id_insumo,
        insumo_nombre: item.insumo_nombre,
        insumo_codigo: item.insumo_codigo,
        cantidad: item.cantidad,
        costo_unitario_usd: item.costo_unitario_usd
      });

      const idx = nuevosInsumos.findIndex(i => Number(i.id) === Number(item.id_insumo));
      if (idx !== -1) {
        nuevosInsumos[idx].stock_actual = (Number(nuevosInsumos[idx].stock_actual) || 0) + Number(item.cantidad);
        nuevosInsumos[idx].costo_unitario_usd = Number(item.costo_unitario_usd);
      }
    }
    localStorage.setItem('clinica_compra_detalles', JSON.stringify(detallesLocal));
    saveBrowserInsumos(nuevosInsumos);
    
    return { success: true, compraId, message: 'Compra registrada correctamente (Navegador)' };
  }

  const db = getDbManager();
  return db.registrarCompra(compraData);
};

export const getAllCompras = async () => {
  if (isBrowser) {
    const compras = JSON.parse(localStorage.getItem('clinica_compras') || '[]');
    const detalles = JSON.parse(localStorage.getItem('clinica_compra_detalles') || '[]');
    return compras.map(c => ({
      ...c,
      detalles: detalles.filter(d => d.id_compra === c.id)
    }));
  }
  const db = getDbManager();
  const compras = db.getAllCompras();
  // Adjuntamos detalles para la UI
  return compras.map(c => {
    const data = db.getCompraById(c.id);
    return data ? data : c;
  });
};