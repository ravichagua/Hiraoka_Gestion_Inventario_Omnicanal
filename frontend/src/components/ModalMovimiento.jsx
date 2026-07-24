import React, { useState } from 'react';
import { X, Package, AlertCircle } from 'lucide-react';
import { API_BASE_URL } from '../config';

const ModalMovimiento = ({ producto, onClose, onSuccess, usuario }) => {
  const [tipo, setTipo] = useState('ENTRADA');
  const [cantidad, setCantidad] = useState(1);
  const [numeroSerie, setNumeroSerie] = useState('');
  const [tiendaId, setTiendaId] = useState(1);
  const [tiendaDestinoId, setTiendaDestinoId] = useState(2);
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
      setError('El número de serie es obligatorio para registrar salidas.');
      return;
    }

    if (tipo === 'TRANSFERENCIA' && tiendaId === tiendaDestinoId) {
      setError('La tienda origen y destino deben ser diferentes.');
      return;
    }

    if (parseInt(cantidad, 10) <= 0) {
      setError('La cantidad debe ser de al menos 1 unidad.');
      return;
    }

    setLoading(true);
    
    let url = `${API_BASE_URL}/api/movimiento`;
    let payload = {
      tienda_id: tiendaId,
      producto_id: producto.id,
      tipo,
      cantidad: parseInt(cantidad, 10),
      usuario: usuario || 'vendedor'
    };

    if (tipo === 'SALIDA') {
      payload.numero_serie = numeroSerie.trim();
    }

    if (tipo === 'TRANSFERENCIA') {
      url = `${API_BASE_URL}/api/transferencia`;
      payload = {
        tienda_origen_id: tiendaId,
        tienda_destino_id: tiendaDestinoId,
        producto_id: producto.id,
        cantidad: parseInt(cantidad, 10),
        usuario: usuario || 'vendedor'
      };
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (result.success) {
        if (result.alerta) {
          alert(`⚠️ Alerta de Inventario:\n\n${result.alerta}`);
        }
        onSuccess();
        onClose();
      } else {
        setError(result.error || 'Error al procesar movimiento');
      }
    } catch (err) {
      setError('Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md max-h-[92vh] overflow-y-auto border border-slate-100 dark:border-slate-800/80 animate-scaleUp">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800/50">
          <div className="flex items-center space-x-2.5">
            <Package className="w-5.5 h-5.5 text-red-600 dark:text-red-400" />
            <h2 className="text-lg font-black text-slate-900 dark:text-white">Registrar Movimiento</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-500 hover:text-slate-700 dark:hover:text-slate-350 transition duration-150"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-slate-50 dark:bg-slate-950/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/30">
            <p className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Producto</p>
            <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm mt-0.5">{producto.nombre}</h3>
            <p className="text-[10px] font-mono font-semibold text-slate-500 mt-0.5">SKU: {producto.sku}</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Tipo de Transacción</label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className="input-field py-2.5 bg-white dark:bg-slate-950 font-medium"
            >
              <option value="ENTRADA">📥 Entrada de Stock (Abastecimiento)</option>
              <option value="SALIDA">📤 Salida / Venta (Salida de Tienda)</option>
              <option value="TRANSFERENCIA">🔄 Transferencia entre Tiendas</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Cantidad</label>
            <input
              type="number"
              min="1"
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              className="input-field"
              required
            />
          </div>

          {/* Tienda selectors (Conditional) */}
          {tipo === 'TRANSFERENCIA' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Tienda Origen</label>
                <select
                  value={tiendaId}
                  onChange={(e) => setTiendaId(parseInt(e.target.value, 10))}
                  className="input-field py-2.5 bg-white dark:bg-slate-950 text-xs font-semibold"
                >
                  {tiendas.map((t) => (
                    <option key={t.id} value={t.id}>{t.nombre}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Tienda Destino</label>
                <select
                  value={tiendaDestinoId}
                  onChange={(e) => setTiendaDestinoId(parseInt(e.target.value, 10))}
                  className="input-field py-2.5 bg-white dark:bg-slate-950 text-xs font-semibold"
                >
                  {tiendas.map((t) => (
                    <option key={t.id} value={t.id} disabled={t.id === tiendaId}>{t.nombre}</option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Tienda</label>
              <select
                value={tiendaId}
                onChange={(e) => setTiendaId(parseInt(e.target.value, 10))}
                className="input-field py-2.5 bg-white dark:bg-slate-950 font-semibold text-xs"
              >
                {tiendas.map((t) => (
                  <option key={t.id} value={t.id}>{t.nombre}</option>
                ))}
              </select>
            </div>
          )}

          {tipo === 'SALIDA' && (
            <div className="animate-slideDown">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Número de Serie <span className="text-red-500 font-bold">*</span>
              </label>
              <input
                type="text"
                value={numeroSerie}
                onChange={(e) => setNumeroSerie(e.target.value)}
                placeholder="Ej: SN-LP999"
                className="input-field font-mono"
                required
              />
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 font-semibold">
                Este serial se vinculará para la validación de la garantía.
              </p>
            </div>
          )}

          {error && (
            <div className="flex items-center p-3.5 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 rounded-2xl text-rose-700 dark:text-rose-400 text-xs font-semibold">
              <AlertCircle className="w-4.5 h-4.5 mr-2 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100 dark:border-slate-800/50">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary text-xs"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary text-xs"
            >
              {loading ? (
                <>
                  <span className="animate-spin mr-1.5">⟳</span>
                  Procesando...
                </>
              ) : (
                'Registrar Movimiento'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModalMovimiento;