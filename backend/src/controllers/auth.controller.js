const pool = require('../config/db');

const login = async (req, res) => {
    const { usuario, password } = req.body;
    if (!usuario || !password) {
        return res.status(400).json({ success: false, error: 'Usuario y contraseña requeridos' });
    }
    try {
        const [rows] = await pool.query('SELECT * FROM Usuarios WHERE usuario = ? AND password = ?', [usuario, password]);
        if (rows.length > 0) {
            res.json({ 
                success: true, 
                user: { 
                    id: rows[0].id,
                    usuario: rows[0].usuario 
                } 
            });
        } else {
            res.status(401).json({ success: false, error: 'Usuario o contraseña incorrectos' });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = {
    login
};
