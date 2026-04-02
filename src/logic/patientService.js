// Import type:module requires dynamic imports to avoid bundling Node modules in browser
let dbManager = null;

// Determine environment
const isBrowser = typeof window !== 'undefined' && 
                  typeof window.document !== 'undefined' && 
                  process.env.NODE_ENV !== 'test';

/**
 * Helper to get the database manager dynamically only in native/test environment.
 */
const getDbManager = async () => {
  if (isBrowser) return null;
  if (!dbManager) {
    // We use a variable path and @vite-ignore to prevent Vite from bundling 
    // Node-specific modules (better-sqlite3) during web dev/build.
    const dbPath = '../db/manager.js';
    dbManager = await import(/* @vite-ignore */ dbPath);
  }
  return dbManager;
};

/**
 * Adds a new patient after validation.
 */
export const registerPatient = async (patientData) => {
  try {
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

    const db = await getDbManager();
    const existing = db.getPacienteByCedula(patientData.cedula_rif);
    if (existing) {
      return { success: false, message: "La cédula o RIF ya se encuentra registrada." };
    }

    const result = db.insertPaciente(patientData);
    return { success: true, message: "Paciente guardado exitosamente.", id: result.lastInsertRowid };
  } catch (error) {
    console.error("Error in registerPatient:", error);
    return { success: false, message: "Error interno al guardar el paciente." };
  }
};

/**
 * Searches for patients by name or ID.
 */
export const searchPatients = async (query) => {
  if (isBrowser) {
    // Return mock data for UI testing in browser
    const mocks = [
      { id: 1, nombre: 'Juan Pérez (Mock)', cedula_rif: 'V-123456', telefono: '0412-1111111', correo: 'juan@test.com', fecha_nacimiento: '1985-10-10', sexo: 'M' },
      { id: 2, nombre: 'María García (Mock)', cedula_rif: 'V-654321', telefono: '0424-2222222', correo: 'maria@test.com', fecha_nacimiento: '1992-05-15', sexo: 'F' }
    ];
    if (!query) return mocks;
    return mocks.filter(p => 
      p.nombre.toLowerCase().includes(query.toLowerCase()) || 
      p.cedula_rif.includes(query)
    );
  }
  const db = await getDbManager();
  return db.searchPatients(query);
};

/**
 * Gets all patients.
 */
export const getPatients = async () => {
  if (isBrowser) {
    return [
      { id: 1, nombre: 'Juan Pérez (Mock)', cedula_rif: 'V-123456', telefono: '0412-1111111', correo: 'juan@test.com', fecha_nacimiento: '1985-10-10', sexo: 'M' },
      { id: 2, nombre: 'María García (Mock)', cedula_rif: 'V-654321', telefono: '0424-2222222', correo: 'maria@test.com', fecha_nacimiento: '1992-05-15', sexo: 'F' }
    ];
  }
  const db = await getDbManager();
  return db.getAllPatients();
};
