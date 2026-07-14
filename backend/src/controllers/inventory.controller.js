const pool = require('../config/db');

// Función para obtener stock total
const getStockAll = async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT t.id AS tienda_id, t.nombre AS tienda, 
                   p.id AS producto_id, p.sku, p.nombre AS producto, 
                   i.cantidad
            FROM Inventario_Local i
            JOIN Tiendas t ON i.tienda_id = t.id
            JOIN Productos p ON i.producto_id = p.id
            ORDER BY t.id, p.id
        `);
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// Función para obtener stock por tienda
const getStockByStore = async (req, res) => {
    const { tiendaId } = req.params;
    try {
        const [rows] = await pool.query(`
            SELECT p.id, p.sku, p.nombre, i.cantidad, p.stock_minimo
            FROM Inventario_Local i
            JOIN Productos p ON i.producto_id = p.id
            WHERE i.tienda_id = ?
        `, [tiendaId]);
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// Función para disponibilidad cruzada
const getCrossAvailability = async (req, res) => {
    const { productoId } = req.params;
    try {
        const [rows] = await pool.query(`
            SELECT t.id, t.nombre, i.cantidad,
                   CASE WHEN i.cantidad > 0 THEN 'disponible' ELSE 'sin stock' END AS estado
            FROM Tiendas t
            LEFT JOIN Inventario_Local i ON t.id = i.tienda_id AND i.producto_id = ?
            ORDER BY t.id
        `, [productoId]);
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// Función para registrar movimiento
const registrarMovimiento = async (req, res) => {
    const { tienda_id, producto_id, tipo, cantidad, usuario } = req.body;
    if (!tienda_id || !producto_id || !tipo || !cantidad) {
        return res.status(400).json({ success: false, error: 'Faltan campos requeridos' });
    }
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        // Insertar movimiento
        await conn.query(`
            INSERT INTO Movimientos (tienda_id, producto_id, tipo, cantidad, usuario)
            VALUES (?, ?, ?, ?, ?)
        `, [tienda_id, producto_id, tipo, cantidad, usuario || 'sistema']);

        // Actualizar inventario
        const factor = tipo === 'ENTRADA' ? 1 : -1;
        await conn.query(`
            UPDATE Inventario_Local 
            SET cantidad = cantidad + ? 
            WHERE tienda_id = ? AND producto_id = ?
        `, [factor * cantidad, tienda_id, producto_id]);

        // Obtener nuevo stock
        const [stockRows] = await conn.query(`
            SELECT i.cantidad, p.stock_minimo, p.nombre
            FROM Inventario_Local i
            JOIN Productos p ON i.producto_id = p.id
            WHERE i.tienda_id = ? AND i.producto_id = ?
        `, [tienda_id, producto_id]);

        await conn.commit();
        res.json({
            success: true,
            message: 'Movimiento registrado',
            nuevo_stock: stockRows[0]?.cantidad || 0,
            alerta: stockRows[0]?.cantidad <= stockRows[0]?.stock_minimo ? 'Stock mínimo alcanzado' : null
        });
    } catch (error) {
        await conn.rollback();
        res.status(500).json({ success: false, error: error.message });
    } finally {
        conn.release();
    }
};

// Exportar todas las funciones como un objeto
module.exports = {
    getStockAll,
    getStockByStore,
    getCrossAvailability,
    registrarMovimiento
};