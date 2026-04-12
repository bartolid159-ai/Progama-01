import { describe, it, expect, vi } from 'vitest';
import { calcularDiferenciaCaja } from '../src/logic/reportService';
import { crearBackup } from '../src/logic/backupService';

describe('Cash Closing Logic', () => {
  it('debe marcar como OK si no hay diferencia', () => {
    const result = calcularDiferenciaCaja(100, 100);
    expect(result).toEqual({ diferencia: 0, estado: 'OK' });
  });

  it('debe marcar como ALERTA si la diferencia es pequeña (<= 5 USD)', () => {
    const result = calcularDiferenciaCaja(97, 100);
    expect(result).toEqual({ diferencia: -3, estado: 'ALERTA' });
    
    const result2 = calcularDiferenciaCaja(104, 100);
    expect(result2).toEqual({ diferencia: 4, estado: 'ALERTA' });
  });

  it('debe marcar como FALTANTE si la diferencia es grande (> 5 USD)', () => {
    const result = calcularDiferenciaCaja(80, 100);
    expect(result).toEqual({ diferencia: -20, estado: 'FALTANTE' });
  });
});

describe('Backup Service', () => {
  it('debe simular el backup en entorno de pruebas (mock)', async () => {
    // Como estamos en Vitest, el entorno suele detectarse como Node,
    // pero podemos verificar que no explote.
    const path = await crearBackup('non-existent.sqlite', 'tmp-backups');
    expect(path).toBeDefined();
  });
});
