---
name: Clean_Code
description: Esta habilidad incorpora los principios de "Código Limpio" de Robert C. Martin (Uncle Bob). Úsala para transformar "código que funciona" en "código limpio".
---

# 🧠 Filosofía principal
"El código es limpio si puede ser leído y mejorado por un desarrollador distinto a su autor original." — Grady Booch

## Cuándo usarla
Usa esta habilidad cuando:

- **Escribas código nuevo**: Para garantizar una alta calidad desde el principio.
- **Revises solicitudes de extracción**: Para proporcionar retroalimentación constructiva basada en principios.
- **Refactorices código heredado**: Para identificar y eliminar problemas de código.
- **Mejores los estándares del equipo**: Para alinear las mejores prácticas del sector.

## 1. Nombres significativos
- **Usa nombres que revelen la intención**: `elapsedTimeInDays` en lugar de `d`.
- **Evita la desinformación**: No uses `accountList` si en realidad es un mapa.
- **Establece distinciones significativas**: Evita usar `ProductData` en lugar de `ProductInfo`.
- **Use nombres pronunciables y fáciles de buscar**: Evite los genitivos.
- **Nombres de clases**: Use sustantivos (Cliente, Página Wiki). Evite Administrador, Datos.
- **Nombres de métodos**: Use verbos (postPago, eliminarPágina).

## 2. Funciones
- **¡Pequeñas!**: Las funciones deben ser más cortas de lo que cree.
- **Una sola cosa**: Una función debe hacer solo una cosa y hacerla bien.
- **Un solo nivel de abstracción**: No mezcle lógica de negocio de alto nivel con detalles de bajo nivel (como expresiones regulares).
- **Nombres descriptivos**: `isPasswordValid` es mejor que `check`.
- **Argumentos**: 0 es lo ideal, 1-2 está bien, 3 o más requieren una justificación muy sólida.
- **Sin efectos secundarios**: Las funciones no deben modificar el estado global de forma encubierta.

## 3. Comentarios
- **No comente código deficiente: Reescríbalo**: La mayoría de los comentarios son señal de nuestra incapacidad para expresarnos con claridad en el código.
- **Explicación mediante código**:
    ```python
    # Comprobar si el empleado tiene derecho a todos los beneficios
    if employee.flags & HOURLY and employee.age > 65:
    ```
    vs
    ```python
    if employee.isEligibleForFullBenefits():
    ```
- **Comentarios positivos**: Legal, Informativo (intención de expresiones regulares), Aclaración (bibliotecas externas), Tareas pendientes.
- **Comentarios negativos**: Confuso, Redundante, Engañoso, Obligatorio, Ruido, Marcadores de posición.

## 4. Formato
- **La metáfora del periódico**: Conceptos generales arriba, detalles abajo.
- **Densidad vertical**: Las líneas relacionadas deben estar cerca unas de otras.
- **Distancia**: Las variables deben declararse cerca de su uso.
- **Sangría**: Esencial para la legibilidad estructural.

## 5. Objetos y estructuras de datos
- **Abstracción de datos**: Ocultar la implementación tras interfaces.
- **La ley de Demeter**: Un módulo no debe conocer el funcionamiento interno de los objetos que manipula. Evitar `a.getB().getC().doSomething()`.
- **Objetos de Transferencia de Datos (DTO)**: Clases con variables públicas y sin funciones.

## 6. Manejo de Errores
- **Usar excepciones en lugar de códigos de retorno**: Mantiene la lógica limpia.
- **Escribir primero un bloque Try-Catch-Finally**: Define el alcance de la operación.
- **No devolver nulo**: Obliga a quien llama a comprobar si es nulo en cada ocasión.
- **No pasar nulo**: Provoca una NullPointerException.

## 7. Pruebas Unitarias
- **Las Tres Leyes del Desarrollo Guiado por Pruebas (TDD)**:
    1. No escribir código de producción hasta tener una prueba unitaria que falle.
    2. No escribir más código de una prueba unitaria del necesario para que falle.
    3. No escribir más código de producción del necesario para que la prueba pase.
- **Principios F.I.R.S.T.**: Rápido, Independiente, Repetible, Autovalidante, Oportuno.

## 8. Clases
- **¡Pequeñas!**: Las clases deben tener una única responsabilidad (SRP).
- **La Regla de Paso a Paso**: Queremos que el código se lea como una narrativa de arriba hacia abajo.

## 9. Olores y Heurísticas
- **Rigidez**: Difícil de cambiar.
- **Fragilidad**: Se rompe en muchos puntos.
- **Inmovilidad**: Difícil de reutilizar.
- **Viscosidad**: Difícil de hacer lo correcto.
- **Complejidad/Repetición innecesaria**.

## 🛠️ Lista de verificación de implementación
- ¿Esta función tiene menos de 20 líneas?
- ¿Esta función hace exactamente una cosa?
- ¿Todos los nombres son fáciles de buscar y revelan la intención?
- ¿He evitado los comentarios haciendo que el código sea más claro?
- ¿Estoy pasando demasiados argumentos?
- ¿Hay alguna prueba que falle para este cambio?
