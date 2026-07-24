const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Importar el controlador de inventario y autenticación
const inventoryController = require('./controllers/inventory.controller');
const authController = require('./controllers/auth.controller');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Ruta de prueba (la que ya tenías)
app.get('/api/prueba', (req, res) => {
    res.json({ mensaje: "¡El backend de Hiraoka está vivo y funcionando! 🚀" });
});

// ===== ENDPOINT DE AUTENTICACIÓN =====
app.post('/api/login', authController.login);

// ===== ENDPOINTS DEL SISTEMA DE INVENTARIO =====
// Obtener stock total (todas las tiendas) - usado por DashboardInventario
app.get('/api/stock', inventoryController.getStockAll);

// Obtener stock por tienda específica
app.get('/api/stock/:tiendaId', inventoryController.getStockByStore);

// Disponibilidad cruzada (todas las tiendas para un producto)
app.get('/api/disponibilidad/:productoId', inventoryController.getCrossAvailability);

// Registrar movimiento (entrada/salida) - usado por ModalMovimiento
app.post('/api/movimiento', inventoryController.registrarMovimiento);

// Obtener historial de movimientos
app.get('/api/movimientos', inventoryController.getMovimientos);

// Registrar transferencia de stock entre tiendas
app.post('/api/transferencia', inventoryController.registrarTransferencia);

// Registrar un nuevo producto en catálogo
app.post('/api/productos', inventoryController.registrarProducto);

// Encender servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`==================================================`);
    console.log(`🚀 Servidor corriendo con éxito en el puerto ${PORT}`);
    console.log(`==================================================`);
});