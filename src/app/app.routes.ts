import { Routes } from '@angular/router';
import { ProductoDetalleComponent } from './pages/producto-detalle/producto-detalle';
import { ProductoListaComponent } from './pages/producto-lista/producto-lista';
import { LoginComponent } from './pages/login/login';
import { adminGuard } from './guards/admin-guard';
import { authGuard } from './guards/auth.guard'; // <--- 1. ¡IMPORTANTE! Traemos al Guardia
import { AdminDashboardComponent } from './pages/admin-dashboard/admin-dashboard';
import { ProductoFormComponent } from './pages/admin/producto-form/producto-form';
import { CheckoutComponent } from './pages/checkout/checkout';
import { UsuarioFormComponent } from './pages/admin/usuario-form/usuario-form';
import { AdminVentasComponent } from './pages/admin/admin-ventas/admin-ventas';
import { UserManagementComponent } from './pages/admin/user-management/user-management';
import { AdminLayoutComponent } from './layouts/admin-layout/admin-layout';
import { AdminMarcasComponent } from './pages/admin/admin-marcas/admin-marcas';
import { AdminCategoriasComponent } from './pages/admin/admin-categorias/admin-categorias';
import { CategoriaFormComponent } from './pages/admin/categoria-form/categoria-form';
import { MarcaFormComponent } from './pages/admin/marca-form/marca-form';
import { AdminProductoDetalleComponent } from './pages/admin/admin-producto-detalle/admin-producto-detalle';
import { AdminVentaDetalleComponent } from './pages/admin/admin-venta-detalle/admin-venta-detalle';
import { CartPageComponent } from './pages/cart-page/cart-page';
import { AdminMetricsComponent } from './pages/admin/admin-metrics/admin-metrics';
import { AdminClientesComponent } from './pages/admin/admin-clientes/admin-clientes';
// import {AdminCajaComponent} from './pages/admin/admin-caja/admin-caja.component';

export const routes: Routes = [

  // --- 1. Rutas Públicas (SOLO LOGIN) ---
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent }, // Esta es la única puerta abierta sin llave

  // --- 2. Rutas de la Tienda (AHORA PROTEGIDAS) ---
  {
    path: 'productos',
    component: ProductoListaComponent,
    canActivate: [authGuard] // <--- ¡CANDADO PUESTO! 🔒
  },
  {
    path: 'productos/:id',
    component: ProductoDetalleComponent,
    canActivate: [authGuard] // <--- ¡CANDADO PUESTO! 🔒
  },
  {
    path: 'checkout',
    component: CheckoutComponent,
    canActivate: [authGuard] // <--- ¡CANDADO PUESTO! 🔒
  },
  {
    path: 'gracias',
    component: CheckoutComponent,
    canActivate: [authGuard] // <--- ¡CANDADO PUESTO! 🔒
  },
  {
    path: 'carrito',
    component: CartPageComponent,
    canActivate: [authGuard] // <--- ¡CANDADO PUESTO! 🔒
  },

  // --- 3. RUTAS DE ADMINISTRACIÓN (Doble Seguridad) ---
  {
    path: 'admin',
    component: AdminLayoutComponent,
    // Aquí usamos el 'adminGuard' que seguramente ya verifica que estés logueado Y seas admin
    canActivate: [adminGuard],
    children: [
      { path: '', redirectTo: 'productos', pathMatch: 'full' },
      { path: 'dashboard', component: AdminMetricsComponent },
      { path: 'productos', component: AdminDashboardComponent },
      { path: 'productos/nuevo', component: ProductoFormComponent },
      { path: 'productos/editar/:id', component: ProductoFormComponent },
      { path: 'clientes', component: AdminClientesComponent },

      // { path: 'caja', component: AdminCajaComponent },

      { path: 'ventas', component: AdminVentasComponent },

      { path: 'usuarios', component: UserManagementComponent },
      { path: 'usuarios/nuevo', component: UsuarioFormComponent },
      { path: 'usuarios/editar/:id', component: UsuarioFormComponent },

      { path: 'marcas', component: AdminMarcasComponent },
      { path: 'marcas/nuevo', component: MarcaFormComponent },
      { path: 'marcas/editar/:id', component: MarcaFormComponent },

      { path: 'categorias', component: AdminCategoriasComponent },
      { path: 'categorias/nuevo', component: CategoriaFormComponent },
      { path: 'categorias/editar/:id', component: CategoriaFormComponent },

      { path: 'productos/ver/:id', component: AdminProductoDetalleComponent },

      { path: 'ventas/detalle/:id', component: AdminVentaDetalleComponent },
    ]
  },

  // --- 4. RUTA DE ERROR (Catch-All) ---
  { path: '**', redirectTo: '/login' }
];
