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