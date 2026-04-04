// Import type:module requires dynamic imports to avoid bundling Node modules in browser
let dbManager = null;

// Determine environment
let isBrowser = typeof window !== 'undefined' && 
                  typeof window.document !== 'undefined' && 
                  process.env.NODE_ENV !== 'test';

export const setBrowserMode = (mode) => { isBrowser = mode; };

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

// Browser persistence helper
const STORAGE_KEY = 'clinica_patients_db';
const getBrowserPatients = () => {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
        const initial = [
            { id: 1, nombre: 'Juan Pérez', cedula_rif: 'V-123456', telefono: '0412-1111111', correo: 'juan@test.com', fecha_nacimiento: '1985-10-10', sexo: 'M', activo: 1 },
            { id: 2, nombre: 'María García', cedula_rif: 'V-654321', telefono: '0424-2222222', correo: 'maria@test.com', fecha_nacimiento: '1992-05-15', sexo: 'F', activo: 1 }
        ];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
        return initial;
    }
    const parsed = JSON.parse(data);
    return parsed.map(p => ({ ...p, id: Number(p.id) }));
};
const saveBrowserPatients = (patients) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(patients));
    console.log("Pacientes actualizados (localStorage):");
    console.table(patients.filter(p => p.activo !== 0));
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
      const patients = getBrowserPatients();
      const newPatient = { ...patientData, id: Date.now(), activo: 1 };
      patients.push(newPatient);
      saveBrowserPatients(patients);
      return { success: true, message: "Paciente registrado exitosamente (Modo Navegador)." };
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
 * Updates an existing patient.
 */
export const updatePatient = async (patientData) => {
  try {
    if (!patientData.id) return { success: false, message: "ID obligatorio." };
    
    if (isBrowser) {
        const patients = getBrowserPatients();
        const numericId = Number(patientData.id);
        const index = patients.findIndex(p => p.id === numericId);
        if (index !== -1) {
            patients[index] = { ...patients[index], ...patientData, id: numericId };
            saveBrowserPatients(patients);
            return { success: true, message: "Paciente actualizado (Modo Navegador)." };
        }
        return { success: false, message: "Paciente no encontrado." };
    }
    // TODO: Implement actual SQL update when needed (Tarea 03 focused on registration mostly)
    return { success: true, message: "Actualización exitosa (SQL placeholder)." };
  } catch (error) {
    console.error("Error in updatePatient:", error);
    return { success: false, message: "Error al actualizar." };
  }
};

/**
 * Deactivates an existing patient.
 */
export const deletePatient = async (id) => {
  try {
    const numericId = Number(id);
    if (isBrowser) {
        const patients = getBrowserPatients();
        const index = patients.findIndex(p => p.id === numericId);
        if (index !== -1) {
            patients[index].activo = 0;
            saveBrowserPatients(patients);
            return { success: true, message: "Paciente eliminado (Modo Navegador)." };
        }
        return { success: false, message: "Paciente no encontrado." };
    }
    return { success: true, message: "Borrado exitoso (SQL placeholder)." };
  } catch (error) {
    console.error("Error in deletePatient:", error);
    return { success: false, message: "Error al borrar." };
  }
};

/**
 * Searches for patients by name or ID.
 */
export const searchPatients = async (query) => {
  if (isBrowser) {
    const patients = getBrowserPatients().filter(p => p.activo !== 0);
    if (!query) return patients;
    const lowerQuery = query.toLowerCase();
    return patients.filter(p => 
      p.nombre.toLowerCase().includes(lowerQuery) || 
      (p.cedula_rif && p.cedula_rif.includes(query))
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
    return getBrowserPatients().filter(p => p.activo !== 0);
  }
  const db = await getDbManager();
  return db.getAllPatients();
};

