/** @vitest-environment node */
import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { getDb, closeDb } from '../src/db/manager.js';
import { 
  insertInsumo, 
  updateInsumo, 
  getAllInsumos, 
  searchInsumos, 
  deleteInsumo,
  getInsumoById,
  insertCategoria,
  getAllCategorias,
  deleteCategoria,
  getInsumosConStockBajo
} from '../src/db/manager.js';

describe('CRUD Insumos y Categorías', () => {
  beforeEach(() => {
    closeDb();
    getDb(':memory:');
  });

  describe('Categorías', () => {
    it('debe insertar una categoría', () => {
      const result = insertCategoria('Material Médico');
      expect(result.lastInsertRowid).toBe(1);
      
      const categorias = getAllCategorias();
      expect(categorias.length).toBe(1);
      expect(categorias[0].nombre).toBe('Material Médico');
    });

    it('debe rechazar categoría duplicada por nombre único', () => {
      insertCategoria('Limpieza');
      
      expect(() => insertCategoria('Limpieza')).toThrow();
    });

    it('debe eliminar una categoría', () => {
      insertCategoria('Oficina');
      const cats = getAllCategorias();
      expect(cats.length).toBe(1);
      
      deleteCategoria(1);
      const afterDelete = getAllCategorias();
      expect(afterDelete.length).toBe(0);
    });
  });

  describe('Insumos - Creación', () => {
    beforeEach(() => {
      insertCategoria('Material Médico');
      insertCategoria('Medicamentos');
    });

    it('debe insertar un insumo con todos los campos', () => {
      const result = insertInsumo({
      descripcion: '',
        codigo: 'G-001',
        nombre: 'Guantes de Látex',
        descripcion: 'Guantes estériles talla M',
        id_categoria: 1,
        stock_actual: 100,
        stock_minimo: 10,
        unidad_medida: 'Par',
        costo_unitario_usd: 0.50
      });
      
      expect(result.lastInsertRowid).toBe(1);
      
      const insumo = getInsumoById(1);
      expect(insumo.codigo).toBe('G-001');
      expect(insumo.nombre).toBe('Guantes de Látex');
    });

    it('debe rechazar insumo con código duplicado', () => {
      insertInsumo({
      descripcion: '',
        codigo: 'G-001', nombre: 'Guantes 1', id_categoria: 1,
        stock_actual: 50, stock_minimo: 5, unidad_medida: 'Par', costo_unitario_usd: 0.50
      });
      
      expect(() => insertInsumo({
      descripcion: '',
        codigo: 'G-001', nombre: 'Guantes 2', id_categoria: 1,
        stock_actual: 50, stock_minimo: 5, unidad_medida: 'Par', costo_unitario_usd: 0.60
      })).toThrow();
    });

    it('debe rechazar insumo con FK id_categoria inexistente', () => {
      expect(() => insertInsumo({
      descripcion: '',
        codigo: 'X-001', nombre: 'Insumo Inválido', id_categoria: 999,
        stock_actual: 10, stock_minimo: 5, unidad_medida: 'Unidad', costo_unitario_usd: 1.00
      })).toThrow();
    });
  });

  describe('Insumos - Cálculos', () => {
    beforeEach(() => {
      insertCategoria('Material Médico');
    });

    it('debe calcular costo_total correctamente', () => {
      insertInsumo({
      descripcion: '',
        codigo: 'A-001', nombre: 'Algodón', id_categoria: 1,
        stock_actual: 200, stock_minimo: 50, unidad_medida: 'Paquete', costo_unitario_usd: 2.50
      });
      
      const insumo = getInsumoById(1);
      const costoTotal = insumo.stock_actual * insumo.costo_unitario_usd;
      
      expect(costoTotal).toBe(500);
    });

    it('debe rechazar stock negativo', () => {
      expect(() => insertInsumo({
      descripcion: '',
        codigo: 'N-001', nombre: 'Negativo', id_categoria: 1,
        stock_actual: -10, stock_minimo: 5, unidad_medida: 'Unidad', costo_unitario_usd: 1.00
      })).toThrow();
    });

    it('debe rechazar custo_unitario_usd negativo', () => {
      expect(() => insertInsumo({
      descripcion: '',
        codigo: 'C-001', nombre: 'Costo Neg', id_categoria: 1,
        stock_actual: 10, stock_minimo: 5, unidad_medida: 'Unidad', costo_unitario_usd: -1.00
      })).toThrow();
    });
  });

  describe('Insumos - Actualización', () => {
    beforeEach(() => {
      insertCategoria('Material Médico');
      insertInsumo({
      descripcion: '',
        codigo: 'U-001', nombre: 'Original', id_categoria: 1,
        stock_actual: 100, stock_minimo: 10, unidad_medida: 'Caja', costo_unitario_usd: 5.00
      });
    });

    it('debe actualizar un insumo', () => {
      updateInsumo({
        id: 1,
        codigo: 'U-001',
        nombre: 'Actualizado',
        descripcion: 'Nueva descripción',
        id_categoria: 1,
        stock_actual: 150,
        stock_minimo: 20,
        unidad_medida: 'Caja',
        costo_unitario_usd: 6.00
      });
      
      const insumo = getInsumoById(1);
      expect(insumo.nombre).toBe('Actualizado');
      expect(insumo.stock_actual).toBe(150);
    });

    it('debe eliminar un insumo', () => {
      deleteInsumo(1);
      
      const insumo = getInsumoById(1);
      expect(insumo).toBeUndefined();
    });
  });

  describe('Insumos - Búsqueda y Filtrado', () => {
    beforeEach(() => {
      insertCategoria('Material Médico');
      insertCategoria('Medicamentos');
      insertCategoria('Limpieza');
      
      insertInsumo({
      descripcion: '', codigo: 'G-001', nombre: 'Guantes', id_categoria: 1, stock_actual: 100, stock_minimo: 10, unidad_medida: 'Par', costo_unitario_usd: 0.50 });
      insertInsumo({
      descripcion: '', codigo: 'G-002', nombre: 'Gasa', id_categoria: 1, stock_actual: 50, stock_minimo: 20, unidad_medida: 'Paquete', costo_unitario_usd: 2.00 });
      insertInsumo({
      descripcion: '', codigo: 'A-001', nombre: 'Alcohol', id_categoria: 2, stock_actual: 30, stock_minimo: 5, unidad_medida: 'Litro', costo_unitario_usd: 3.00 });
    });

    it('debe buscar por nombre', () => {
      const resultados = searchInsumos('Guantes');
      expect(resultados.length).toBe(1);
      expect(resultados[0].nombre).toBe('Guantes');
    });

    it('debe buscar por código', () => {
      const resultados = searchInsumos('G-002');
      expect(resultados.length).toBe(1);
      expect(resultados[0].codigo).toBe('G-002');
    });

    it('debe filtrar por categoría', () => {
      const resultados = searchInsumos(null, 1);
      expect(resultados.length).toBe(2);
      expect(resultados.every(i => i.id_categoria === 1)).toBe(true);
    });

    it('debe combinar búsqueda y filtro por categoría', () => {
      const resultados = searchInsumos('G', 1);
      expect(resultados.length).toBe(2);
    });

    it('debe retornar todos si no hay query ni filtro', () => {
      const resultados = searchInsumos();
      expect(resultados.length).toBe(3);
    });
  });

  describe('Stock Bajo', () => {
    beforeEach(() => {
      insertCategoria('Material Médico');
      insertInsumo({
      descripcion: '', codigo: 'S-001', nombre: 'Stock Normal', id_categoria: 1, stock_actual: 50, stock_minimo: 10, unidad_medida: 'Unidad', costo_unitario_usd: 1.00 });
      insertInsumo({
      descripcion: '', codigo: 'S-002', nombre: 'Stock Bajo', id_categoria: 1, stock_actual: 5, stock_minimo: 10, unidad_medida: 'Unidad', costo_unitario_usd: 1.00 });
      insertInsumo({
      descripcion: '', codigo: 'S-003', nombre: 'Stock Crítico', id_categoria: 1, stock_actual: 0, stock_minimo: 10, unidad_medida: 'Unidad', costo_unitario_usd: 1.00 });
    });

    it('debe listar insumos con stock bajo o crítico', () => {
      const resultados = getInsumosConStockBajo();
      expect(resultados.length).toBe(2);
      expect(resultados.map(i => i.nombre)).toContain('Stock Bajo');
      expect(resultados.map(i => i.nombre)).toContain('Stock Crítico');
    });
  });
});