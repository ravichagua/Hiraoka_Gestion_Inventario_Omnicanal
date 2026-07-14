import React, { useState } from 'react';
import DashboardInventario from './components/DashboardInventario';
import Login from './components/Login';

function App() {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('hiraoka_admin_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    localStorage.setItem('hiraoka_admin_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('hiraoka_admin_user');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200/80 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
              H
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
                Importaciones Hiraoka
              </h1>
              <p className="text-xs text-gray-500 font-medium tracking-wider uppercase">
                Sistema de Gestión de Inventarios Omnicanal
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {user && (
              <>
                <span className="text-sm text-gray-600 hidden md:inline-block">
                  Sesión: <span className="font-semibold text-blue-600">{user.usuario}</span>
                </span>
                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-semibold rounded-lg transition active:scale-95"
                >
                  Cerrar Sesión
                </button>
              </>
            )}
            <span className="text-sm text-gray-600 hidden sm:inline-block">
              <span className="font-semibold">4</span> tiendas físicas + e‑commerce
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              ● En línea
            </span>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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