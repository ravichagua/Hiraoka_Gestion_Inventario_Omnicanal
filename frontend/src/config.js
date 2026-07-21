// Configuración dinámica de la URL del Backend
// Si se accede desde localhost, usará localhost:5000
// Si se accede desde la red local (ej. 192.168.1.X:3000), usará 192.168.1.X:5000
export const API_BASE_URL = `http://${window.location.hostname}:5000`;
