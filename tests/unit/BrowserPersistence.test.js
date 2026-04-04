import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as doctorService from '../../src/logic/doctorService.js';

// No need to redeclare window/localStorage as Vitest with jsdom environment provides them.

describe('Browser Persistence (localStorage)', () => {
  beforeEach(() => {
    localStorage.clear();
    // Ensure we are in browser mode for these tests
    vi.stubGlobal('window', { document: {} });
    doctorService.setBrowserMode(true);
  });

  it('should initialize and persist doctors in localStorage', async () => {
    const doctors = await doctorService.getDoctors();
    expect(doctors.length).toBeGreaterThan(0);
    expect(localStorage.getItem('clinica_doctors_db')).toBeDefined();
  });

  it('should update a doctor in localStorage', async () => {
    const initialDoctors = await doctorService.getDoctors();
    const target = initialDoctors[0];
    
    const updatedData = { ...target, nombre: 'Updated via Test' };
    const result = await doctorService.updateDoctor(updatedData);
    
    expect(result.success).toBe(true);
    
    const refreshed = await doctorService.getDoctors();
    const found = refreshed.find(d => d.id === target.id);
    expect(found.nombre).toBe('Updated via Test');
  });

  it('should delete (deactivate) a doctor in localStorage', async () => {
    const initialDoctors = await doctorService.getDoctors();
    const target = initialDoctors[0];
    
    const result = await doctorService.deleteDoctor(target.id);
    expect(result.success).toBe(true);
    
    const refreshed = await doctorService.getDoctors();
    const found = refreshed.find(d => d.id === target.id);
    expect(found).toBeUndefined(); // getDoctors filters by activo=1
    
    // Low level check
    const raw = JSON.parse(localStorage.getItem('clinica_doctors_db'));
    const deleted = raw.find(d => d.id === target.id);
    expect(deleted.activo).toBe(0);
  });
});
