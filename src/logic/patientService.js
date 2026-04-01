import * as dbManager from '../db/manager.js';

/**
 * Patient Service - Logic layer for Patient management.
 * Handles validation and interacts with the database manager.
 */

// Simple check to see if we are in a browser environment to avoid crashing on better-sqlite3 imports
// We allow the direct DB access in test mode to facilitate unit testing
const isBrowser = typeof window !== 'undefined' && 
                  typeof window.document !== 'undefined' && 
                  process.env.NODE_ENV !== 'test';

/**
 * Adds a new patient after validation.
 * @param {Object} patientData - { cedula_rif, nombre, sexo, fecha_nacimiento, telefono, correo, direccion }
 * @returns {Object} { success: boolean, message: string, data?: any }
 */
export const registerPatient = (patientData) => {
  try {
    // 1. Basic Validation
    const requiredFields = ['cedula_rif', 'nombre', 'sexo', 'fecha_nacimiento'];
    for (const field of requiredFields) {
      if (!patientData[field]) {
        return { success: false, message: `El campo ${field} es obligatorio.` };
      }
    }

    if (isBrowser) {
      console.warn("Registering patient in browser mode (Mock).");
      return { success: true, message: "Paciente registrado (Simulación browser)." };
    }

    // 2. Check for duplicates
    const existing = dbManager.getPacienteByCedula(patientData.cedula_rif);
    if (existing) {
      return { success: false, message: "La cédula o RIF ya se encuentra registrada." };
    }

    // 3. Insert
    const result = dbManager.insertPaciente(patientData);
    return { success: true, message: "Paciente guardado exitosamente.", id: result.lastInsertRowid };
  } catch (error) {
    console.error("Error in registerPatient:", error);
    return { success: false, message: "Error interno al guardar el paciente." };
  }
};

/**
 * Searches for patients by name or ID.
 * @param {string} query 
 * @returns {Array} List of patients
 */
export const searchPatients = (query) => {
  if (isBrowser) {
    return []; // Return empty or mock data in browser
  }
  return dbManager.searchPatients(query);
};

/**
 * Gets all patients (limited).
 * @returns {Array} List of patients
 */
export const getPatients = () => {
  if (isBrowser) {
    return [];
  }
  return dbManager.getAllPatients();
};
