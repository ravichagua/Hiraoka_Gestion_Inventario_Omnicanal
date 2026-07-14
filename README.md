# Sistema de Gestión de Inventarios Omnicanal - Importaciones Hiraoka S.A.C.

Este proyecto consiste en un **Sistema de Gestión de Inventarios Omnicanal** diseñado para **Importaciones Hiraoka S.A.C.** Su objetivo principal es controlar y sincronizar en tiempo real el stock de productos a través de 4 tiendas físicas y 1 canal e-commerce, asegurando la disponibilidad de información oportuna para la toma de decisiones.

---

## 🚀 Características Principales (Requerimientos Funcionales)

El sistema ha sido desarrollado para cumplir con las siguientes especificaciones técnicas y operativas detalladas en el documento de requerimientos:

*   **RF01 / RF02 - Dashboard e Inventario Omnicanal:**
    *   Visualización de todos los productos en una tabla unificada con el stock correspondiente a cada una de las 5 tiendas.
    *   Indicadores visuales de stock dinámicos:
        *   🟩 **Fondo verde con texto verde oscuro:** Stock disponible (`cantidad > 0`).
        *   🟥 **Fondo rojo con texto rojo oscuro:** Stock agotado (`cantidad = 0`).
    *   Header interactivo con indicador de estado **"● En línea"** (verificación de conexión activa con la API) y resumen del alcance.
*   **RF03 - Alertas de Stock Mínimo:**
    *   Al registrar cualquier movimiento, el backend verifica si el nuevo stock del producto en la tienda queda por debajo del mínimo configurado.
    *   De ser así, retorna una alerta que el frontend captura para mostrar un mensaje emergente al usuario: `⚠️ Stock mínimo alcanzado`.
*   **RF04 - Consultas de Disponibilidad Cruzada:**
    *   Implementación del endpoint `/api/disponibilidad/:productoId` para consultar la disponibilidad detallada y el estado de stock ("disponible" o "sin stock") de un producto en todos los puntos de venta.
*   **RF05 - Sincronización en Tiempo Real:**
    *   Diseño centralizado con base de datos única en MySQL.
    *   Toda transacción realizada en una tienda se refleja instantáneamente en el dashboard general y en otras terminales sin necesidad de sincronizaciones por lotes o replicación diferida.
*   **RF06 - Registro de Garantías (Números de Serie):**
    *   Al registrar un movimiento de tipo **SALIDA**, el sistema obliga al usuario a ingresar un **Número de Serie** (único en la base de datos).
    *   Este número se registra en la tabla `Garantias_Series` junto al producto, la tienda, la fecha y el estado `activa` para facilitar el rastreo y la gestión de garantías de los equipos vendidos.

---

## 🛠️ Stack Tecnológico

El sistema se compone de una arquitectura clásica de tres capas (Cliente, Servidor, Base de Datos):

*   **Frontend:** React, TailwindCSS, Lucide React (Iconos), Fetch API.
*   **Backend:** Node.js, Express, MySQL2 (Promise wrapper), CORS, Dotenv, Nodemon.
*   **Base de Datos:** MySQL (con soporte para transacciones ACID y restricciones de integridad relacional).

---

## 📂 Estructura del Proyecto

El repositorio está organizado de la siguiente manera:

```text
├── backend/                  # Servidor API REST en Node.js + Express
│   ├── src/
│   │   ├── config/           # Configuración de conexión a la Base de Datos
│   │   │   └── db.js
│   │   ├── controllers/      # Lógica de negocio (Consultas y transacciones SQL)
│   │   │   └── inventory.controller.js
│   │   └── server.js         # Configuración del servidor express y endpoints
│   ├── .env                  # Variables de entorno del backend (credenciales de DB)
│   └── package.json          # Dependencias y scripts del backend
│
├── frontend/                 # Aplicación del lado del cliente en React
│   ├── src/
│   │   ├── components/       # Componentes de la interfaz
│   │   │   ├── DashboardInventario.jsx  # Tabla e indicadores de inventario
│   │   │   └── ModalMovimiento.jsx      # Formulario para registrar entradas/salidas
│   │   ├── App.js            # Contenedor principal de la app
│   │   ├── index.css         # Estilos globales y personalización de TailwindCSS
│   │   └── index.js          # Punto de entrada de React
│   ├── tailwind.config.js    # Configuración de TailwindCSS
│   └── package.json          # Dependencias y scripts del frontend
│
├── database/                 # Recursos de la Base de Datos
│   └── schema.sql            # Script DDL para creación de tablas e inserción de datos de prueba
│
├── descripcion_proyecto.pdf  # Manual descriptivo del sistema
└── query-hiraoka.sql         # Copia del script SQL para la base de datos
```

---

## 🗄️ Modelo de Base de Datos

El diseño de la base de datos consta de 5 tablas principales normalizadas:

1.  **`Tiendas`:** Registra las sucursales físicas y el canal digital (Centro Lima, Miraflores, San Miguel, Independencia, E-commerce).
2.  **`Productos`:** Catálogo de productos que contiene SKU, nombre, descripción, stock mínimo y precio.
3.  **`Inventario_Local`:** Tabla intermedia que gestiona la cantidad en stock de cada producto por tienda específica.
4.  **`Movimientos`:** Historial detallado de todas las transacciones de entrada y salida realizadas.
5.  **`Garantias_Series`:** Tabla que vincula los números de serie únicos a cada venta (SALIDA) de producto para la gestión de garantías.

---

## ⚙️ Instalación y Configuración

Siga los siguientes pasos para poner en marcha el proyecto localmente:

### Paso 1: Configurar la Base de Datos (MySQL)
1. Inicie su servidor MySQL local.
2. Ejecute el script SQL ubicado en `/database/schema.sql` o en directorio principal `query-hiraoka.sql`. 
```
mysql -u root -p hiraoka_inventario < query-hiraoka.sql
```
Esto creará la base de datos `hiraoka_inventario`, las tablas necesarias y cargará los datos de prueba iniciales.

### Paso 2: Configurar las Variables de Entorno del Backend
1. Diríjase a la carpeta `backend`.
2. Revise o modifique el archivo `.env` configurando los parámetros de su servidor MySQL local:
   ```env
   DB_HOST=localhost
   DB_USER=tu_usuario_mysql
   DB_PASSWORD=tu_contraseña_mysql
   DB_NAME=hiraoka_inventario
   
   ```

### Paso 3: Iniciar el Servidor Backend
1. Abra una terminal en la carpeta [backend](file:///home/user/Downloads/PLATAFORMA%20SISTEMAS%20DE%20INFORMACION%20EMPRESARIAL/project/backend).
2. Instale las dependencias necesarias:
   ```bash
   npm install
   ```
3. Ejecute el servidor de desarrollo (nodemon):
   ```bash
   npx nodemon src/server.js
   ```
   *El backend se ejecutará en http://localhost:5000.*

### Paso 4: Iniciar la Aplicación Frontend
1. Abra otra terminal en la carpeta [frontend](file:///home/user/Downloads/PLATAFORMA%20SISTEMAS%20DE%20INFORMACION%20EMPRESARIAL/project/frontend).
2. Instale las dependencias del cliente:
   ```bash
   npm install
   ```
3. Inicie el servidor de desarrollo de React:
   ```bash
   npm start
   ```
   *La aplicación web se abrirá automáticamente en su navegador en http://localhost:3000.*

---

## 🧪 Guía de Demostración Paso a Paso

Para comprobar las capacidades del sistema frente a un público o evaluador, siga esta ruta de prueba:

1.  **Visualizar el Dashboard:**
    *   Compruebe la carga de datos iniciales en la tabla. Cada columna representa una tienda y cada fila un producto.
    *   Verifique el indicador **"● En línea"** en el header y los colores verdes/rojos de stock según la cantidad.
2.  **Registrar una Entrada de Mercadería (ENTRADA):**
    *   Busque un producto con stock 0 (ej. *Smart TV Samsung 55"* en la columna *E-commerce*).
    *   Haga clic en el botón **"Movimiento"** de ese producto.
    *   Seleccione el tipo **"Entrada"**, ingrese cantidad `5`, seleccione la tienda **"E-commerce"** y haga clic en **"Registrar"**.
    *   Observe cómo el modal se cierra y el stock en la columna correspondiente del dashboard pasa a ser `5` inmediatamente con fondo verde.
3.  **Registrar una Salida con Garantía (SALIDA):**
    *   Seleccione la *Laptop HP 15* en la sucursal *Centro Lima* (stock inicial `10`).
    *   Haga clic en **"Movimiento"**, configure tipo **"Salida"**, cantidad `1` y elija la tienda **"Centro Lima"**.
    *   El sistema habilitará un campo obligatorio para el **Número de Serie**. Ingrese un código único (ej: `SN-LP999`) y pulse **"Registrar"**.
    *   El stock se actualizará automáticamente a `9` y el número de serie quedará grabado en la base de datos.
4.  **Simular Alerta de Stock Mínimo:**
    *   Seleccione un producto con stock cercano a su valor mínimo (ej. *Smart TV Samsung 55"* en la tienda *Independencia* con stock `1`, cuyo mínimo es `2`).
    *   Al registrar una salida de `1` unidad en esa sucursal, el stock final será `0` (menor o igual a `2`).
    *   Al guardar, el sistema mostrará inmediatamente una alerta emergente en pantalla informando: `⚠️ Stock mínimo alcanzado`.
5.  **Verificar Sincronización en Tiempo Real:**
    *   Abra el sistema en dos pestañas o navegadores diferentes lado a lado.
    *   Realice un movimiento en una pestaña y verifique cómo el cambio se visualiza de forma instantánea al actualizar el dashboard de la otra pestaña, demostrando la naturaleza integrada de la API y de la base de datos única.

---

## ❓ Preguntas Frecuentes (FAQ)

*   **¿Qué pasa si dos tiendas intentan modificar el mismo producto al mismo tiempo?**
    El backend utiliza transacciones atómicas de MySQL (`conn.beginTransaction()`) y pool de conexiones, lo que asegura que las lecturas y escrituras concurrentes estén aisladas evitando condiciones de carrera y manteniendo la integridad del inventario.
*   **¿Cómo se maneja el stock de la tienda digital (E-commerce)?**
    El canal E-commerce está configurado en la base de datos como una tienda más de tipo `ecommerce`. Funciona bajo el mismo flujo de consultas y movimientos (entradas/salidas) que las tiendas físicas.
*   **¿Se puede ver el historial de transacciones en la interfaz?**
    Actualmente el historial se almacena de forma persistente en la tabla `Movimientos` con el detalle del usuario, fecha, tipo de movimiento y cantidad. En el alcance actual de esta demo, esta tabla se explota directamente mediante consultas SQL en base de datos, pero la API cuenta con la arquitectura flexible para agregar una pantalla de historial de movimientos con facilidad.
*   **¿Los números de serie son estrictamente únicos?**
    Sí, la tabla `Garantias_Series` posee una restricción de clave única (`UNIQUE KEY unique_serie (numero_serie)`) para evitar que se registren garantías duplicadas de diferentes transacciones o productos.
