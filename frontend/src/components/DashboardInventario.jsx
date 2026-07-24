import React, { useState, useEffect } from 'react';
import ModalMovimiento from './ModalMovimiento';
import { 
  RefreshCw, AlertTriangle, Package, Store, Search, History, 
  PlusCircle, Download, ChevronDown, ChevronUp, Boxes, 
  TrendingDown, Clock, User 
} from 'lucide-react';
import { API_BASE_URL } from '../config';

const DashboardInventario = ({ usuario }) => {
  const [stockData, setStockData] = useState([]);
  const [movimientos, setMovimientos] = useState([]);
  const [activeTab, setActiveTab] = useState('stock'); // 'stock' | 'movimientos' | 'producto'
  const [loading, setLoading] = useState(true);
  const [loadingMovs, setLoadingMovs] = useState(false);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  
  // Filtros y búsquedas
  const [searchTerm, setSearchTerm] = useState('');
  const [stockFilter, setStockFilter] = useState('all'); // 'all' | 'low' | 'critical'
  const [expandedProduct, setExpandedProduct] = useState(null);

  // Formulario nuevo producto
  const [newProduct, setNewProduct] = useState({
    sku: '',
    nombre: '',
    descripcion: '',
    precio: '',
    stock_minimo: 5
  });
  const [productCreating, setProductCreating] = useState(false);
  const [productSuccessMsg, setProductSuccessMsg] = useState('');

  const tiendas = ['Centro Lima', 'Miraflores', 'San Miguel', 'Independencia', 'E-commerce'];

  const fetchStock = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/stock`);
      if (!response.ok) throw new Error('Error al obtener datos');
      const result = await response.json();
      if (result.success) {
        const productsMap = {};
        result.data.forEach(item => {
          const { producto_id, sku, producto, tienda, cantidad, stock_minimo, precio, descripcion } = item;
          if (!productsMap[producto_id]) {
            productsMap[producto_id] = {
              id: producto_id,
              sku,
              nombre: producto,
              stock_minimo: stock_minimo ?? 5,
              precio: precio ?? 0.00,
              descripcion: descripcion || '',
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

  const fetchMovimientos = async () => {
    setLoadingMovs(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/movimientos`);
      if (!response.ok) throw new Error('Error al obtener movimientos');
      const result = await response.json();
      if (result.success) {
        setMovimientos(result.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMovs(false);
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
    if (activeTab === 'movimientos') {
      fetchMovimientos();
    }
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    setProductCreating(true);
    setProductSuccessMsg('');
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/productos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sku: newProduct.sku.trim(),
          nombre: newProduct.nombre.trim(),
          descripcion: newProduct.descripcion.trim(),
          precio: parseFloat(newProduct.precio) || 0.00,
          stock_minimo: parseInt(newProduct.stock_minimo, 10) || 5
        })
      });

      const result = await response.json();
      if (result.success) {
        setProductSuccessMsg(`¡Producto "${newProduct.nombre}" creado exitosamente!`);
        setNewProduct({
          sku: '',
          nombre: '',
          descripcion: '',
          precio: '',
          stock_minimo: 5
        });
        fetchStock();
        setTimeout(() => {
          setProductSuccessMsg('');
          setActiveTab('stock');
        }, 2000);
      } else {
        setError(result.error || 'Error al crear producto');
      }
    } catch (err) {
      setError('Error al conectar con el servidor');
    } finally {
      setProductCreating(false);
    }
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

  const toggleExpand = (prodId) => {
    setExpandedProduct(expandedProduct === prodId ? null : prodId);
  };

  // Cálculo de estadísticas
  const getStats = () => {
    let totalItems = 0;
    let criticalCount = 0;
    let lowCount = 0;

    stockData.forEach(prod => {
      let isCritical = false;
      let isLow = false;
      tiendas.forEach(t => {
        const qty = prod.tiendas[t] ?? 0;
        totalItems += qty;
        if (qty === 0) isCritical = true;
        else if (qty <= prod.stock_minimo) isLow = true;
      });
      if (isCritical) criticalCount++;
      if (isLow) lowCount++;
    });

    return {
      totalSKUs: stockData.length,
      totalItems,
      criticalCount,
      lowCount
    };
  };

  const stats = getStats();

  // Filtrado de productos
  const filteredProducts = stockData.filter(prod => {
    const matchesSearch = prod.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          prod.nombre.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;

    if (stockFilter === 'low') {
      return tiendas.some(t => {
        const qty = prod.tiendas[t] ?? 0;
        return qty > 0 && qty <= prod.stock_minimo;
      });
    }

    if (stockFilter === 'critical') {
      return tiendas.some(t => {
        const qty = prod.tiendas[t] ?? 0;
        return qty === 0;
      });
    }

    return true;
  });

  // Exportar a CSV
  const exportToCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "SKU,Producto,Precio (S/.),Stock Minimo," + tiendas.join(",") + ",Stock Total\n";

    filteredProducts.forEach(prod => {
      const rowData = [
        prod.sku,
        `"${prod.nombre.replace(/"/g, '""')}"`,
        prod.precio,
        prod.stock_minimo
      ];
      let total = 0;
      tiendas.forEach(t => {
        const qty = prod.tiendas[t] ?? 0;
        rowData.push(qty);
        total += qty;
      });
      rowData.push(total);
      csvContent += rowData.join(",") + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `hiraoka_inventario_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* 4 Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4 flex items-center space-x-3.5 bg-white dark:bg-slate-900 shadow-sm border border-slate-200/50 dark:border-slate-800">
          <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-2xl">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-black text-slate-800 dark:text-white leading-tight">{stats.totalSKUs}</p>
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Productos en Catálogo</p>
          </div>
        </div>

        <div className="card p-4 flex items-center space-x-3.5 bg-white dark:bg-slate-900 shadow-sm border border-slate-200/50 dark:border-slate-800">
          <div className="p-3 bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 rounded-2xl">
            <Boxes className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-black text-slate-800 dark:text-white leading-tight">{stats.totalItems}</p>
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Unidades Totales</p>
          </div>
        </div>

        <div className="card p-4 flex items-center space-x-3.5 bg-white dark:bg-slate-900 shadow-sm border border-slate-200/50 dark:border-slate-800">
          <div className={`p-3 rounded-2xl ${stats.criticalCount > 0 ? 'bg-rose-100 dark:bg-rose-950/30 text-rose-600 dark:text-rose-450 animate-pulse' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-black text-slate-800 dark:text-white leading-tight">{stats.criticalCount}</p>
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Tiendas Agotadas</p>
          </div>
        </div>

        <div className="card p-4 flex items-center space-x-3.5 bg-white dark:bg-slate-900 shadow-sm border border-slate-200/50 dark:border-slate-800">
          <div className={`p-3 rounded-2xl ${stats.lowCount > 0 ? 'bg-amber-100 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
            <TrendingDown className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-black text-slate-800 dark:text-white leading-tight">{stats.lowCount}</p>
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Stock Mínimo</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800/80 space-x-6">
        <button
          onClick={() => setActiveTab('stock')}
          className={`pb-3.5 font-bold text-xs uppercase tracking-wider transition-all duration-200 relative ${
            activeTab === 'stock'
              ? 'text-red-650 dark:text-red-450 border-b-2 border-red-655 dark:border-red-450'
              : 'text-slate-450 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <div className="flex items-center space-x-2">
            <Package className="w-4 h-4" />
            <span>Inventario Omnicanal</span>
          </div>
        </button>
        <button
          onClick={() => {
            setActiveTab('movimientos');
            fetchMovimientos();
          }}
          className={`pb-3.5 font-bold text-xs uppercase tracking-wider transition-all duration-200 relative ${
            activeTab === 'movimientos'
              ? 'text-red-650 dark:text-red-450 border-b-2 border-red-655 dark:border-red-450'
              : 'text-slate-450 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <div className="flex items-center space-x-2">
            <History className="w-4 h-4" />
            <span>Historial de Movimientos</span>
          </div>
        </button>
        <button
          onClick={() => setActiveTab('producto')}
          className={`pb-3.5 font-bold text-xs uppercase tracking-wider transition-all duration-200 relative ${
            activeTab === 'producto'
              ? 'text-red-650 dark:text-red-450 border-b-2 border-red-655 dark:border-red-450'
              : 'text-slate-450 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <div className="flex items-center space-x-2">
            <PlusCircle className="w-4 h-4" />
            <span>Nuevo Producto</span>
          </div>
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'stock' && (
        <div className="space-y-4 animate-fadeIn">
          {/* Filters Panel */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-grow sm:flex-grow-0 sm:w-64">
                <Search className="w-4.5 h-4.5 absolute left-3 top-3 text-slate-400 dark:text-slate-600" />
                <input
                  type="text"
                  placeholder="Buscar SKU o producto..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-field pl-10"
                />
              </div>
              
              <select
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value)}
                className="input-field sm:w-44 py-2 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold"
              >
                <option value="all">🔍 Todos los Stocks</option>
                <option value="low">⚠️ Stocks Mínimos</option>
                <option value="critical">🚨 Tiendas Agotadas</option>
              </select>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                onClick={exportToCSV}
                className="btn-secondary text-xs py-2 px-4 flex items-center"
                title="Exportar a Excel/CSV"
              >
                <Download className="w-3.5 h-3.5 mr-1.5" />
                Exportar
              </button>
              
              <button
                onClick={fetchStock}
                disabled={loading}
                className="btn-primary text-xs py-2 px-4"
              >
                <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Sincronizando...' : 'Sincronizar'}
              </button>
            </div>
          </div>

          {/* Table Container */}
          <div className="card overflow-hidden bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 shadow-md">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-150 dark:divide-slate-800/80">
                <thead className="bg-slate-50 dark:bg-slate-950/60 text-slate-500 dark:text-slate-450">
                  <tr>
                    <th className="w-10"></th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">SKU</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Producto</th>
                    {tiendas.map((t) => (
                      <th key={t} className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider">
                        <div className="flex items-center justify-center space-x-1">
                          <Store className="w-3 h-3 text-slate-450" />
                          <span>{t}</span>
                        </div>
                      </th>
                    ))}
                    <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider">Acción</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-150 dark:divide-slate-800/80 text-sm">
                  {loading && stockData.length === 0 ? (
                    <tr>
                      <td colSpan={tiendas.length + 4} className="px-4 py-12 text-center text-slate-500">
                        <div className="flex justify-center items-center space-x-2">
                          <RefreshCw className="w-5 h-5 animate-spin text-red-650" />
                          <span className="font-semibold">Cargando inventario omnicanal...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={tiendas.length + 4} className="px-4 py-12 text-center text-slate-400 dark:text-slate-650 font-medium">
                        No se encontraron productos con los filtros aplicados.
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((prod) => {
                      const isExpanded = expandedProduct === prod.id;
                      return (
                        <React.Fragment key={prod.id}>
                          <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-950/30 transition-colors cursor-pointer" onClick={() => toggleExpand(prod.id)}>
                            <td className="px-2 text-center">
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4 text-slate-400" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-slate-400" />
                              )}
                            </td>
                            <td className="px-4 py-3.5 font-mono text-xs font-bold text-slate-550 dark:text-slate-400">{prod.sku}</td>
                            <td className="px-4 py-3.5 font-semibold text-slate-800 dark:text-slate-200">
                              {prod.nombre}
                            </td>
                            {tiendas.map((t) => {
                              const cantidad = prod.tiendas[t] ?? 0;
                              const level = getStockLevel(cantidad, prod.stock_minimo);
                              return (
                                <td key={t} className="px-4 py-3.5 text-center">
                                  <span className={`badge-stock ${getBadgeClass(level)}`}>
                                    {cantidad}
                                  </span>
                                </td>
                              );
                            })}
                            <td className="px-4 py-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => handleRegistrarMovimiento(prod)}
                                className="inline-flex items-center px-3 py-1.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-bold rounded-lg transition active:scale-95 shadow-sm hover:shadow shadow-red-500/10"
                              >
                                <RefreshCw className="w-3 h-3 mr-1" />
                                Movimiento
                              </button>
                            </td>
                          </tr>

                          {/* Expanded detail row */}
                          {isExpanded && (
                            <tr className="bg-slate-50/40 dark:bg-slate-950/20">
                              <td colSpan={tiendas.length + 4} className="px-6 py-4">
                                <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
                                  {/* Info card */}
                                  <div className="md:col-span-5 space-y-2">
                                    <div className="flex items-center space-x-2">
                                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">Detalles del Producto</h4>
                                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                        Precio Lista: S/. {parseFloat(prod.precio).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                      </span>
                                    </div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                      {prod.descripcion || 'Sin descripción disponible para este producto.'}
                                    </p>
                                    <div className="pt-1 text-[11px] text-slate-400 font-semibold flex items-center space-x-4">
                                      <span>Mínimo Configurado: <strong className="text-amber-600 dark:text-amber-400">{prod.stock_minimo} unidades</strong></span>
                                      <span>SKU ID: {prod.id}</span>
                                    </div>
                                  </div>

                                  {/* Visual stock chart */}
                                  <div className="md:col-span-7 space-y-2.5">
                                    <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 dark:text-slate-500">Distribución de Stock</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                                      {tiendas.map((t) => {
                                        const qty = prod.tiendas[t] ?? 0;
                                        const min = prod.stock_minimo;
                                        // Barra de progreso relativa al triple del stock minimo
                                        const maxScale = Math.max(min * 3, 15);
                                        const pct = Math.min((qty / maxScale) * 100, 100);
                                        
                                        return (
                                          <div key={t} className="space-y-0.5">
                                            <div className="flex justify-between text-[11px] font-medium">
                                              <span className="text-slate-650 dark:text-slate-400 flex items-center"><Store className="w-3 h-3 mr-1 text-slate-400" /> {t}</span>
                                              <span className={`font-mono font-bold ${qty === 0 ? 'text-rose-600' : qty <= min ? 'text-amber-605 dark:text-amber-400' : 'text-slate-700 dark:text-slate-300'}`}>
                                                {qty} u.
                                              </span>
                                            </div>
                                            <div className="w-full bg-slate-200/60 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                              <div 
                                                className={`h-full rounded-full transition-all duration-500 ${qty === 0 ? 'bg-rose-500' : qty <= min ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`}
                                                style={{ width: `${pct}%` }}
                                              ></div>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            <div className="bg-slate-50 dark:bg-slate-950/60 px-4 py-2 border-t border-slate-150 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
              <span>Última actualización: {lastUpdate.toLocaleTimeString()}</span>
              <span>Mostrando {filteredProducts.length} de {stockData.length} productos</span>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'movimientos' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center">
              <Clock className="w-5 h-5 mr-2 text-red-600 dark:text-red-400" />
              Logs de Actividad
            </h3>
            <button
              onClick={fetchMovimientos}
              disabled={loadingMovs}
              className="btn-secondary text-xs py-1.5 px-3 flex items-center"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1 ${loadingMovs ? 'animate-spin' : ''}`} />
              Actualizar Logs
            </button>
          </div>

          <div className="card bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 shadow-md">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-150 dark:divide-slate-800/80 text-sm">
                <thead className="bg-slate-50 dark:bg-slate-950/60 text-slate-500 dark:text-slate-450">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Fecha / Hora</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Producto (SKU)</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Tienda</th>
                    <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider">Tipo</th>
                    <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider">Cantidad</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Responsable</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-150 dark:divide-slate-800/80">
                  {loadingMovs ? (
                    <tr>
                      <td colSpan="6" className="px-4 py-12 text-center text-slate-500">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto text-red-600 mb-2" />
                        <span>Cargando historial de transacciones...</span>
                      </td>
                    </tr>
                  ) : movimientos.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-4 py-12 text-center text-slate-400 dark:text-slate-650 font-medium">
                        No hay movimientos registrados.
                      </td>
                    </tr>
                  ) : (
                    movimientos.map((mov) => {
                      const isTransfer = mov.usuario && (mov.usuario.includes('Transf. Salida') || mov.usuario.includes('Transf. Entrada'));
                      const userClean = mov.usuario ? mov.usuario.split(' (')[0] : 'sistema';
                      
                      let typeLabel = mov.tipo;
                      let typeColor = 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30';
                      
                      if (isTransfer) {
                        typeLabel = mov.usuario.includes('Salida') ? 'Transferencia (Salida)' : 'Transferencia (Entrada)';
                        typeColor = 'bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400 border-blue-100 dark:border-blue-900/30';
                      } else if (mov.tipo === 'SALIDA') {
                        typeColor = 'bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-455 border-rose-100 dark:border-rose-900/30';
                      }

                      return (
                        <tr key={mov.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/30 transition-colors">
                          <td className="px-4 py-3 text-xs text-slate-550 dark:text-slate-450 font-medium">
                            {new Date(mov.fecha).toLocaleString('es-PE')}
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-semibold text-slate-800 dark:text-slate-200">{mov.producto}</div>
                            <div className="text-[10px] font-mono text-slate-400">{mov.sku}</div>
                          </td>
                          <td className="px-4 py-3 text-slate-650 dark:text-slate-400 font-medium flex items-center py-5">
                            <Store className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                            {mov.tienda}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${typeColor}`}>
                              {typeLabel}
                            </span>
                          </td>
                          <td className={`px-4 py-3 text-center font-mono font-bold ${mov.tipo === 'ENTRADA' ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {mov.tipo === 'ENTRADA' ? '+' : '-'}{mov.cantidad}
                          </td>
                          <td className="px-4 py-3 text-slate-600 dark:text-slate-400 text-xs font-semibold">
                            <div className="flex items-center">
                              <User className="w-3.5 h-3.5 mr-1 text-slate-400" />
                              {userClean}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'producto' && (
        <div className="max-w-2xl mx-auto animate-fadeIn">
          <div className="card bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 shadow-lg p-6 sm:p-8">
            <div className="flex items-center space-x-2.5 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800/60">
              <PlusCircle className="w-6 h-6 text-red-655" />
              <h3 className="text-lg font-black text-slate-900 dark:text-white">Registrar Nuevo Producto</h3>
            </div>

            {productSuccessMsg && (
              <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-250 dark:border-emerald-900/30 rounded-2xl text-emerald-700 dark:text-emerald-400 text-sm flex items-center font-semibold">
                <span className="mr-2">✓</span>
                {productSuccessMsg}
              </div>
            )}

            {error && (
              <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-250 dark:border-rose-900/30 rounded-2xl text-rose-700 dark:text-rose-400 text-sm flex items-center font-semibold">
                <span className="mr-2">⚠️</span>
                {error}
              </div>
            )}

            <form onSubmit={handleCreateProduct} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">SKU *</label>
                  <input
                    type="text"
                    required
                    value={newProduct.sku}
                    onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })}
                    placeholder="Ej: SKU004"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Nombre del Producto *</label>
                  <input
                    type="text"
                    required
                    value={newProduct.nombre}
                    onChange={(e) => setNewProduct({ ...newProduct, nombre: e.target.value })}
                    placeholder="Ej: Licuadora Oster 3 velocidades"
                    className="input-field"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Precio (S/.)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newProduct.precio}
                    onChange={(e) => setNewProduct({ ...newProduct, precio: e.target.value })}
                    placeholder="Ej: 149.90"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Stock Mínimo</label>
                  <input
                    type="number"
                    min="1"
                    value={newProduct.stock_minimo}
                    onChange={(e) => setNewProduct({ ...newProduct, stock_minimo: e.target.value })}
                    placeholder="Ej: 5"
                    className="input-field"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Descripción</label>
                <textarea
                  rows="3"
                  value={newProduct.descripcion}
                  onChange={(e) => setNewProduct({ ...newProduct, descripcion: e.target.value })}
                  placeholder="Ingrese especificaciones técnicas o detalles del producto..."
                  className="input-field py-2"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800/60 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setActiveTab('stock')}
                  className="btn-secondary text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={productCreating}
                  className="btn-primary text-xs"
                >
                  {productCreating ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1.5" />
                      Guardando...
                    </>
                  ) : (
                    'Guardar Producto'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para movimientos */}
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