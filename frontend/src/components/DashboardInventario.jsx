import React, { useState, useEffect } from 'react';
import ModalMovimiento from './ModalMovimiento';
import { RefreshCw, AlertTriangle, Package, Store } from 'lucide-react';

const DashboardInventario = ({ usuario }) => {
  const [stockData, setStockData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const tiendas = ['Centro Lima', 'Miraflores', 'San Miguel', 'Independencia', 'E-commerce'];

  const fetchStock = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:5000/api/stock');
      if (!response.ok) throw new Error('Error al obtener datos');
      const result = await response.json();
      if (result.success) {
        const productsMap = {};
        result.data.forEach(item => {
          const { producto_id, sku, producto, tienda, cantidad } = item;
          if (!productsMap[producto_id]) {
            productsMap[producto_id] = {
              id: producto_id,
              sku,
              nombre: producto,
              tiendas: {}
            };
          }
          productsMap[producto_id].tiendas[tienda] = cantidad;
        });
        setStockData(Object.values(productsMap));
        setLastUpdate(new Date());
      } else {
        setError(result.error || 'Error al cargar datos');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStock();
  }, []);

  const handleRegistrarMovimiento = (producto) => {
    setSelectedProduct(producto);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedProduct(null);
    fetchStock();
  };

  const getStockLevel = (cantidad, min = 5) => {
    if (cantidad === 0) return 'critico';
    if (cantidad <= min) return 'bajo';
    return 'alto';
  };

  const getBadgeClass = (level) => {
    const classes = {
      alto: 'badge-stock-alto',
      bajo: 'badge-stock-bajo',
      critico: 'badge-stock-critico'
    };
    return classes[level] || 'badge-stock-alto';
  };

  return (
    <div>
      {/* Encabezado del dashboard */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center">
            <Package className="w-6 h-6 mr-2 text-blue-600" />
            Inventario en Tiempo Real
          </h2>
          <p className="text-sm text-gray-500">
            Última actualización: {lastUpdate.toLocaleTimeString()}
          </p>
        </div>
        <button
          onClick={fetchStock}
          disabled={loading}
          className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Actualizando...' : 'Actualizar'}
        </button>
      </div>

      {/* Mensaje de error */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center">
          <AlertTriangle className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}

      {/* Tabla */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                {tiendas.map((t) => (
                  <th key={t} className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center justify-center space-x-1">
                      <Store className="w-3 h-3" />
                      <span>{t}</span>
                    </div>
                  </th>
                ))}
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Acción</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={tiendas.length + 3} className="px-4 py-8 text-center text-gray-500">
                    <div className="flex justify-center items-center space-x-2">
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      <span>Cargando inventario...</span>
                    </div>
                  </td>
                </tr>
              ) : stockData.length === 0 ? (
                <tr>
                  <td colSpan={tiendas.length + 3} className="px-4 py-8 text-center text-gray-500">
                    No hay productos disponibles.
                  </td>
                </tr>
              ) : (
                stockData.map((prod) => (
                  <tr key={prod.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-sm text-gray-600">{prod.sku}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{prod.nombre}</td>
                    {tiendas.map((t) => {
                      const cantidad = prod.tiendas[t] ?? 0;
                      const level = getStockLevel(cantidad);
                      return (
                        <td key={t} className="px-4 py-3 text-center">
                          <span className={`badge-stock ${getBadgeClass(level)}`}>
                            {cantidad}
                          </span>
                        </td>
                      );
                    })}
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleRegistrarMovimiento(prod)}
                        className="inline-flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md transition"
                      >
                        <Package className="w-3.5 h-3.5 mr-1" />
                        Movimiento
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <ModalMovimiento
          producto={selectedProduct}
          onClose={handleCloseModal}
          onSuccess={fetchStock}
          usuario={usuario}
        />
      )}
    </div>
  );
};

export default DashboardInventario;