-- Crear base de datos
CREATE DATABASE IF NOT EXISTS hiraoka_inventario;
USE hiraoka_inventario;

-- Tabla Tiendas
CREATE TABLE Tiendas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    direccion VARCHAR(255),
    tipo ENUM('fisica', 'ecommerce') DEFAULT 'fisica'
);

-- Tabla Productos
CREATE TABLE Productos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sku VARCHAR(50) UNIQUE NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    stock_minimo INT DEFAULT 5,
    precio DECIMAL(10,2)
);

-- Tabla Inventario_Local (stock por tienda)
CREATE TABLE Inventario_Local (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tienda_id INT NOT NULL,
    producto_id INT NOT NULL,
    cantidad INT DEFAULT 0,
    FOREIGN KEY (tienda_id) REFERENCES Tiendas(id) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES Productos(id) ON DELETE CASCADE,
    UNIQUE KEY unique_inventario (tienda_id, producto_id)
);

-- Tabla Movimientos (historial)
CREATE TABLE Movimientos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tienda_id INT NOT NULL,
    producto_id INT NOT NULL,
    tipo ENUM('ENTRADA', 'SALIDA') NOT NULL,
    cantidad INT NOT NULL,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    usuario VARCHAR(50),
    FOREIGN KEY (tienda_id) REFERENCES Tiendas(id),
    FOREIGN KEY (producto_id) REFERENCES Productos(id)
);

-- Tabla Garantias_Series (para RF06)
CREATE TABLE Garantias_Series (
    id INT AUTO_INCREMENT PRIMARY KEY,
    producto_id INT NOT NULL,
    numero_serie VARCHAR(100) NOT NULL,
    tienda_venta_id INT NOT NULL,
    fecha_venta DATE,
    estado ENUM('activa','usada','vencida') DEFAULT 'activa',
    FOREIGN KEY (producto_id) REFERENCES Productos(id),
    FOREIGN KEY (tienda_venta_id) REFERENCES Tiendas(id),
    UNIQUE KEY unique_serie (numero_serie)
);

-- Tabla Usuarios
CREATE TABLE Usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL
);

-- ===== DATOS DE PRUEBA =====
-- Usuarios
INSERT INTO Usuarios (usuario, password) VALUES
('admin', 'admin123');

-- Tiendas (coinciden con los nombres usados en el frontend)
INSERT INTO Tiendas (nombre, direccion, tipo) VALUES
('Centro Lima', 'Av. Abancay 500', 'fisica'),
('Miraflores', 'Av. Larco 1200', 'fisica'),
('San Miguel', 'Av. La Marina 3000', 'fisica'),
('Independencia', 'Av. Tupac Amaru 4000', 'fisica'),
('E-commerce', 'Web', 'ecommerce');

-- Productos
INSERT INTO Productos (sku, nombre, descripcion, stock_minimo, precio) VALUES
('SKU001', 'Laptop HP 15', 'Intel i5, 8GB, 512GB SSD', 3, 2500.00),
('SKU002', 'Smart TV Samsung 55"', '4K UHD, Smart Hub', 2, 1800.00),
('SKU003', 'Audífonos Sony WH-1000XM4', 'Bluetooth, Noise Cancelling', 5, 350.00);

-- Inventario inicial (stock en cada tienda)
INSERT INTO Inventario_Local (tienda_id, producto_id, cantidad) VALUES
(1,1,10), (2,1,8), (3,1,5), (4,1,3), (5,1,2),
(1,2,4), (2,2,6), (3,2,2), (4,2,1), (5,2,0),
(1,3,15), (2,3,12), (3,3,10), (4,3,8), (5,3,20);

-- Movimientos iniciales (ejemplo)
INSERT INTO Movimientos (tienda_id, producto_id, tipo, cantidad, usuario) VALUES
(1,1,'ENTRADA',5,'admin'), 
(2,1,'SALIDA',2,'vendedor');

-- Garantías/Series (ejemplo)
INSERT INTO Garantias_Series (producto_id, numero_serie, tienda_venta_id, fecha_venta, estado) VALUES
(1,'SN-LP001',1,'2026-01-15','activa'),
(2,'SN-TV002',2,'2026-02-20','activa');