---
name: skill-creator
description: Esta habilidad permite crear nuevas habilidades en el workspace de manera automatizada y determinista, siguiendo los estándares de Antigravity y priorizando el idioma español.
---

# Skill Creator (Creador de Habilidades)

Esta habilidad dota al agente de la capacidad de expandir sus propias capacidades mediante la creación de módulos de habilidades (.agent/skills).

## Cuándo usar esta habilidad
- Cuando el usuario solicita una nueva funcionalidad recurrente que no existe actualmente.
- Cuando se desea automatizar un proceso complejo mediante un "Script Tonto" y una guía de ejecución.
- Cuando se necesite estandarizar procesos en español dentro del workspace.

## Cómo usarla
1. **Identificar la necesidad**: Determinar qué nueva capacidad se requiere.
2. **Definir el nombre**: Usar nombres en minúsculas con guiones (ej. `gestor-facturas`).
3. **Ejecutar el script de creación**: Utilizar `create_skill.py` para generar la estructura base.
   - Ruta del script: `.agent/skills/skill-creator/scripts/create_skill.py`
4. **Redactar SKILL.md**: Escribir las instrucciones en español, incluyendo YAML frontmatter con `name` y `description`.
5. **Añadir recursos**: Si es necesario, incluir scripts en `scripts/` o ejemplos en `examples/`.

## Estructura de una Habilidad
Cualquier habilidad creada debe seguir este esquema:
- `SKILL.md`: Instrucciones maestras (Obligatorio).
- `scripts/`: Herramientas deterministas (Python/JS).
- `examples/`: Ejemplos de uso.
- `resources/`: Activos adicionales.

## Protocolo de Idioma
Todas las nuevas habilidades creadas con esta herramienta DEBEN tener su documentación principal (`SKILL.md`) y comentarios de scripts en **español**, a menos que el usuario indique lo contrario.
