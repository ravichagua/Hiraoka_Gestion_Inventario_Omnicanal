const pool = require('../config/db');

// Función para obtener stock total
const getStockAll = async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT t.id AS tienda_id, t.nombre AS tienda, 
                   p.id AS producto_id, p.sku, p.nombre AS producto, 
                   p.stock_minimo AS stock_minimo, p.precio AS precio,
                   p.descripcion AS descripcion, i.cantidad
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
    const { tienda_id, producto_id, tipo, cantidad, usuario, numero_serie } = req.body;
    if (!tienda_id || !producto_id || !tipo || !cantidad) {
        return res.status(400).json({ success: false, error: 'Faltan campos requeridos' });
    }
    if (tipo === 'SALIDA' && (!numero_serie || !numero_serie.trim())) {
        return res.status(400).json({ success: false, error: 'El número de serie es obligatorio para salidas.' });
    }

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        // Registrar serie de garantía si es salida
        if (tipo === 'SALIDA') {
            const cleanSerie = numero_serie.trim();
            const [existing] = await conn.query(`
                SELECT id FROM Garantias_Series WHERE numero_serie = ?
            `, [cleanSerie]);

            if (existing.length > 0) {
                throw new Error(`El número de serie "${cleanSerie}" ya está registrado.`);
            }

            await conn.query(`
                INSERT INTO Garantias_Series (producto_id, numero_serie, tienda_venta_id, fecha_venta, estado)
                VALUES (?, ?, ?, CURRENT_DATE(), 'activa')
            `, [producto_id, cleanSerie, tienda_id]);
        }

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

// Obtener historial de movimientos
const getMovimientos = async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT m.id, m.tipo, m.cantidad, m.fecha, m.usuario,
                   t.nombre AS tienda, p.nombre AS producto, p.sku
            FROM Movimientos m
            JOIN Tiendas t ON m.tienda_id = t.id
            JOIN Productos p ON m.producto_id = p.id
            ORDER BY m.fecha DESC
            LIMIT 50
        `);
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// Registrar transferencia entre tiendas
const registrarTransferencia = async (req, res) => {
    const { tienda_origen_id, tienda_destino_id, producto_id, cantidad, usuario } = req.body;
    if (!tienda_origen_id || !tienda_destino_id || !producto_id || !cantidad) {
        return res.status(400).json({ success: false, error: 'Faltan campos requeridos' });
    }
    if (tienda_origen_id === tienda_destino_id) {
        return res.status(400).json({ success: false, error: 'Las tiendas origen y destino deben ser diferentes' });
    }
    if (parseInt(cantidad, 10) <= 0) {
        return res.status(400).json({ success: false, error: 'La cantidad debe ser mayor a cero' });
    }

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        // 1. Verificar stock en origen
        const [origenStock] = await conn.query(`
            SELECT cantidad FROM Inventario_Local 
            WHERE tienda_id = ? AND producto_id = ?
        `, [tienda_origen_id, producto_id]);

        const currentStock = origenStock[0] ? origenStock[0].cantidad : 0;
        if (currentStock < cantidad) {
            throw new Error('Stock insuficiente en la tienda de origen');
        }

        // 2. Registrar movimiento de SALIDA en origen
        await conn.query(`
            INSERT INTO Movimientos (tienda_id, producto_id, tipo, cantidad, usuario)
            VALUES (?, ?, 'SALIDA', ?, ?)
        `, [tienda_origen_id, producto_id, cantidad, `${usuario || 'sistema'} (Transf. Salida)`]);

        // 3. Registrar movimiento de ENTRADA en destino
        await conn.query(`
            INSERT INTO Movimientos (tienda_id, producto_id, tipo, cantidad, usuario)
            VALUES (?, ?, 'ENTRADA', ?, ?)
        `, [tienda_destino_id, producto_id, cantidad, `${usuario || 'sistema'} (Transf. Entrada)`]);

        // 4. Actualizar inventario en origen
        await conn.query(`
            UPDATE Inventario_Local 
            SET cantidad = cantidad - ? 
            WHERE tienda_id = ? AND producto_id = ?
        `, [cantidad, tienda_origen_id, producto_id]);

        // 5. Actualizar inventario en destino
        const [destinoStock] = await conn.query(`
            SELECT cantidad FROM Inventario_Local 
            WHERE tienda_id = ? AND producto_id = ?
        `, [tienda_destino_id, producto_id]);

        if (destinoStock.length === 0) {
            await conn.query(`
                INSERT INTO Inventario_Local (tienda_id, producto_id, cantidad)
                VALUES (?, ?, ?)
            `, [tienda_destino_id, producto_id, cantidad]);
        } else {
            await conn.query(`
                UPDATE Inventario_Local 
                SET cantidad = cantidad + ? 
                WHERE tienda_id = ? AND producto_id = ?
            `, [cantidad, tienda_destino_id, producto_id]);
        }

        // Obtener stock mínimo y nuevo stock en origen para alertas
        const [stockMinRows] = await conn.query(`
            SELECT i.cantidad, p.stock_minimo, p.nombre
            FROM Inventario_Local i
            JOIN Productos p ON i.producto_id = p.id
            WHERE i.tienda_id = ? AND i.producto_id = ?
        `, [tienda_origen_id, producto_id]);

        await conn.commit();
        res.json({
            success: true,
            message: 'Transferencia registrada con éxito',
            alerta: stockMinRows[0] && stockMinRows[0].cantidad <= stockMinRows[0].stock_minimo ? `Stock mínimo alcanzado en tienda origen` : null
        });
    } catch (error) {
        await conn.rollback();
        res.status(500).json({ success: false, error: error.message });
    } finally {
        conn.release();
    }
};

// Registrar nuevo producto
const registrarProducto = async (req, res) => {
    const { sku, nombre, descripcion, stock_minimo, precio } = req.body;
    if (!sku || !nombre) {
        return res.status(400).json({ success: false, error: 'SKU y nombre son requeridos' });
    }

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        // 1. Insertar producto
        const [result] = await conn.query(`
            INSERT INTO Productos (sku, nombre, descripcion, stock_minimo, precio)
            VALUES (?, ?, ?, ?, ?)
        `, [sku, nombre, descripcion || '', stock_minimo || 5, precio || 0.00]);

        const newProductId = result.insertId;

        // 2. Inicializar stock en todas las tiendas en 0
        const [tiendas] = await conn.query('SELECT id FROM Tiendas');
        for (const tienda of tiendas) {
            await conn.query(`
                INSERT INTO Inventario_Local (tienda_id, producto_id, cantidad)
                VALUES (?, ?, 0)
            `, [tienda.id, newProductId]);
        }

        await conn.commit();
        res.json({
            success: true,
            message: 'Producto creado con éxito e inventario inicializado',
            data: { id: newProductId, sku, nombre, descripcion, stock_minimo, precio }
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
    registrarMovimiento,
    getMovimientos,
    registrarTransferencia,
    registrarProducto
};