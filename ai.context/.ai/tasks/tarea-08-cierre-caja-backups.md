# Tarea 08: Cierre de Caja Ciego y Backups

## Objetivo
Terminar el flujo operativo con el cierre de caja seguro y el sistema de respaldo automático.

## Archivos Afectados
- `src/components/Settings/CashClosing.jsx`
- `src/logic/backupService.js`

## Criterio de Éxito
- El cajero declara montos y el sistema reporta diferencia sin mostrar el teórico antes.
- Al cerrar la app, se sugiere o realiza un respaldo del archivo SQLite.
