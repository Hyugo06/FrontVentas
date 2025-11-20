import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.margarita.app',
  appName: 'Tienda Margarita',

  // --- ¡CAMBIA ESTA LÍNEA! ---
  // No uses 'www'. Usa la ruta real de tu carpeta dist.
  // Si tu index.html está en dist/FrontVentas/browser, pon eso.
  // Si está en dist/tienda-frontend/browser, pon eso.
  webDir: 'dist/tienda-frontend/browser',
  // ---------------------------

  server: {
    androidScheme: 'https'
  }
};

export default config;
