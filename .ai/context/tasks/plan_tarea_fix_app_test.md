# Plan de Tarea: Corrección de tests de integración (App.test.jsx)

## 1. Análisis de Impacto
- **Archivos:** `src/App.test.jsx`
- **Impacto:** Soluciona el fallo de integración que impedía que el CI del PR #29 pasara a verde.

## 2. Nuevos Archivos
- Ninguno.

## 3. Lógica de Negocio
- No aplicable (cambio en tests).

## 4. Tests de Vitest
- Se corregirán los matchers en `src/App.test.jsx` para manejar nodos de texto divididos.
- Verificación: `npx vitest src/App.test.jsx`.
