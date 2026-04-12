const isBrowser = typeof window !== 'undefined' && typeof window.document !== 'undefined';

/**
 * Crea un respaldo del archivo de base de datos SQLite.
 * @param {string} dbPath - Ruta al archivo actual de la base de datos.
 * @param {string} backupDir - Directorio donde se guardarán los respaldos.
 * @returns {Promise<string>} Ruta del archivo de respaldo creado.
 */
export async function crearBackup(dbPath = 'data.sqlite', backupDir = 'backups') {
  if (isBrowser) {
    console.log('[BackupService] Simulando backup en el navegador...');
    return 'simulated-backup.sqlite';
  }

  try {
    // Dynamic import to avoid bundling in the browser
    const fs = await import('fs');
    const path = await import('path');

    if (!fs.existsSync(dbPath)) {
      throw new Error(`Base de datos no encontrada en: ${dbPath}`);
    }

    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const ext = path.extname(dbPath);
    const base = path.basename(dbPath, ext);
    const backupName = `${base}_${timestamp}${ext}`;
    const targetPath = path.join(backupDir, backupName);

    fs.copyFileSync(dbPath, targetPath);
    console.log(`[BackupService] Respaldo creado: ${targetPath}`);
    
    return targetPath;
  } catch (error) {
    console.error('[BackupService] Error creando backup:', error);
    throw error;
  }
}

/**
 * Elimina respaldos antiguos que superen la cantidad de días especificada.
 * @param {string} backupDir - Directorio de respaldos.
 * @param {number} diasMax - Días máximos de antigüedad.
 */
export async function limpiarBackupsAntiguos(backupDir = 'backups', diasMax = 30) {
  if (isBrowser) return;

  try {
    const fs = await import('fs');
    const path = await import('path');

    if (!fs.existsSync(backupDir)) return;

    const files = fs.readdirSync(backupDir);
    const ahora = Date.now();
    const msMax = diasMax * 24 * 60 * 60 * 1000;

    files.forEach(file => {
      const filePath = path.join(backupDir, file);
      const stats = fs.statSync(filePath);
      const antiguedad = ahora - stats.mtimeMs;

      if (antiguedad > msMax) {
        fs.unlinkSync(filePath);
        console.log(`[BackupService] Backup eliminado por antigüedad: ${file}`);
      }
    });
  } catch (error) {
    console.error('[BackupService] Error limpiando backups:', error);
  }
}
