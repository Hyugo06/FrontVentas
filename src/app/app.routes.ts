import { Routes } from '@angular/router';
import { ProductoDetalleComponent } from './pages/producto-detalle/producto-detalle';
import { ProductoListaComponent } from './pages/producto-lista/producto-lista';
import { LoginComponent } from './pages/login/login';
import { adminGuard } from './guards/admin-guard';
import { AdminDashboardComponent } from './pages/admin-dashboard/admin-dashboard';
import { ProductoFormComponent } from './pages/admin/producto-form/producto-form';
import { CheckoutComponent } from './pages/checkout/checkout';
import { UsuarioFormComponent } from './pages/admin/usuario-form/usuario-form';
import {AdminVentasComponent} from './pages/admin/admin-ventas/admin-ventas';
import {UserManagementComponent} from './pages/admin/user-management/user-management';
import {AdminLayoutComponent} from './layouts/admin-layout/admin-layout';
import {AdminMarcasComponent} from './pages/admin/admin-marcas/admin-marcas';

// --- ¡¡CORRECCIÓN 1: Importar el nombre de clase correcto!! ---

import {AdminCategoriasComponent} from './pages/admin/admin-categorias/admin-categorias';
import {CategoriaFormComponent} from './pages/admin/categoria-form/categoria-form';
import {MarcaFormComponent} from './pages/admin/marca-form/marca-form';
import {AdminProductoDetalleComponent} from './pages/admin/admin-producto-detalle/admin-producto-detalle';


export const routes: Routes = [

  // --- 1. Rutas Públicas/Tienda ---
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'productos', component: ProductoListaComponent },
  { path: 'productos/:id', component: ProductoDetalleComponent },
  { path: 'checkout', component: CheckoutComponent },
  { path: 'gracias', component: CheckoutComponent },


  // --- 2. RUTAS DE ADMINISTRACIÓN (Anidadas) ---
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [adminGuard],
    children: [
      { path: '', redirectTo: 'productos', pathMatch: 'full' },
      { path: 'productos', component: AdminDashboardComponent },
      { path: 'productos/nuevo', component: ProductoFormComponent },
      { path: 'productos/editar/:id', component: ProductoFormComponent },

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

    ]
  },

  // --- 3. RUTA CATCH-ALL ---
  { path: '**', redirectTo: '/login' }
];
