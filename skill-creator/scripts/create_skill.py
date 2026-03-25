import os
import sys
import argparse

def create_skill(name, description, base_path):
    skill_dir = os.path.join(base_path, ".agent", "skills", name)
    scripts_dir = os.path.join(skill_dir, "scripts")
    examples_dir = os.path.join(skill_dir, "examples")
    resources_dir = os.path.join(skill_dir, "resources")

    os.makedirs(scripts_dir, exist_ok=True)
    os.makedirs(examples_dir, exist_ok=True)
    os.makedirs(resources_dir, exist_ok=True)

    skill_md_path = os.path.join(skill_dir, "SKILL.md")
    
    content = f"""---
name: {name}
description: {description}
---

# {name.replace('-', ' ').title()}

## Descripción
{description}

## Cuándo usar esta habilidad
- [Describir escenarios de uso aquí]

## Cómo usarla
1. [Paso 1]
2. [Paso 2]

## Notas Adicionales
- Creado automáticamente por Skill Creator.
"""

    with open(skill_md_path, "w", encoding="utf-8") as f:
        f.write(content)

    print(f"Habilidad '{name}' creada exitosamente en {skill_dir}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generador de habilidades para Antigravity")
    parser.add_argument("name", help="Nombre de la habilidad (ej. mi-habilidad)")
    parser.add_argument("description", help="Descripción corta de la habilidad")
    parser.add_argument("--path", default=".", help="Ruta base del workspace")

    args = parser.parse_args()
    
    # En Windows, las rutas pueden ser un problema, normalizamos
    base_path = os.path.abspath(args.path)
    
    create_skill(args.name, args.description, base_path)
