import React, { useState } from 'react';
import { X, Package, AlertCircle } from 'lucide-react';

const ModalMovimiento = ({ producto, onClose, onSuccess, usuario }) => {
  const [tipo, setTipo] = useState('ENTRADA');
  const [cantidad, setCantidad] = useState(1);
  const [numeroSerie, setNumeroSerie] = useState('');
  const [tiendaId, setTiendaId] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const tiendas = [
    { id: 1, nombre: 'Centro Lima' },
    { id: 2, nombre: 'Miraflores' },
    { id: 3, nombre: 'San Miguel' },
    { id: 4, nombre: 'Independencia' },
    { id: 5, nombre: 'E-commerce' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (tipo === 'SALIDA' && !numeroSerie.trim()) {
      setError('El número de serie es obligatorio para salidas.');
      return;
    }

    setLoading(true);
    const payload = {
      tienda_id: tiendaId,
      producto_id: producto.id,
      tipo,
      cantidad: parseInt(cantidad, 10),
      usuario: usuario || 'vendedor'
    };

    try {
      const response = await fetch('http://localhost:5000/api/movimiento', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (result.success) {
        if (result.alerta) {
          alert(`⚠️ ${result.alerta}`);
        }
        onSuccess();
        onClose();
      } else {
        setError(result.error || 'Error al registrar movimiento');
      }
    } catch (err) {
      setError('Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Package className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-800">Registrar Movimiento</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <p className="text-sm text-gray-500">
              Producto: <span className="font-semibold text-gray-800">{producto.nombre}</span>
            </p>
            <p className="text-xs text-gray-400">SKU: {producto.sku}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className="input-field"
            >
              <option value="ENTRADA">Entrada</option>
              <option value="SALIDA">Salida</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad</label>
            <input
              type="number"
              min="1"
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tienda</label>
            <select
              value={tiendaId}
              onChange={(e) => setTiendaId(parseInt(e.target.value, 10))}
              className="input-field"
            >
              {tiendas.map((t) => (
                <option key={t.id} value={t.id}>{t.nombre}</option>
              ))}
            </select>
          </div>

          {tipo === 'SALIDA' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Número de Serie <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={numeroSerie}
                onChange={(e) => setNumeroSerie(e.target.value)}
                placeholder="Ej: SN-123456"
                className="input-field"
                required
              />
              <p className="text-xs text-gray-400 mt-1">
                Obligatorio para registrar garantía.
              </p>
            </div>
          )}

          {error && (
            <div className="flex items-center p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex items-center"
            >
              {loading ? (
                <>
                  <span className="animate-spin mr-2">⟳</span>
                  Procesando...
                </>
              ) : (
                'Registrar'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModalMovimiento;