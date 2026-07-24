import React, { useState, useEffect } from 'react';
import DashboardInventario from './components/DashboardInventario';
import Login from './components/Login';
import { LogOut } from 'lucide-react';

function App() {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('hiraoka_admin_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    // Asegurar que la clase dark esté desactivada
    document.body.classList.remove('dark');
    localStorage.removeItem('hiraoka_dark_mode');
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    localStorage.setItem('hiraoka_admin_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('hiraoka_admin_user');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 text-slate-850 transition-colors duration-300">
      <header className="glass-panel sticky top-0 z-40 shadow-sm transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-rose-600 rounded-xl flex items-center justify-center text-white font-extrabold text-xl shadow-md shadow-red-500/20 active:scale-95 transition-transform duration-200">
              H
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-slate-900 flex items-center gap-1.5 leading-tight">
                Importaciones Hiraoka
              </h1>
              <p className="text-[10px] text-slate-550 font-semibold tracking-wider uppercase">
                Sistema de Gestión de Inventario Omnicanal
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 sm:space-x-4">

            {user && (
              <div className="flex items-center space-x-3 bg-white border border-slate-200/60 py-1 pl-3 pr-1 rounded-xl shadow-sm text-xs">
                <span className="text-slate-600 font-medium hidden md:inline-block">
                  Usuario: <span className="font-bold text-red-600">{user.usuario}</span>
                </span>
                <button
                  onClick={handleLogout}
                  className="p-1.5 hover:bg-red-50 hover:text-red-600 text-slate-500 rounded-lg transition duration-150"
                  title="Cerrar sesión"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="hidden sm:flex items-center space-x-2 text-xs font-semibold text-slate-650">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-450 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>En línea</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {user ? (
          <DashboardInventario usuario={user.usuario} />
        ) : (
          <Login onLoginSuccess={handleLoginSuccess} />
        )}
      </main>
    </div>
  );
}

export default App;