import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.margarita.app', // (Tu ID puede variar, déjalo como está)
  appName: 'Tienda Margarita',
  webDir: 'dist/tienda-frontend/browser', // (Verifica que sea tu ruta correcta)

  // --- AGREGA O MODIFICA ESTO ---
  server: {
    androidScheme: 'http',         // <--- ESTO ES LA SOLUCIÓN MÁGICA
    allowNavigation: [
      '192.168.1.34'              // <--- Permite navegar a tu IP
    ],
    cleartext: true
  }
  // -----------------------------
};

export default config;
