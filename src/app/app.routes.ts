import { Routes } from '@angular/router';
import { authGuard } from './shared/guards/auth.guard';
import { PageNotFoundComponent } from './components/page-not-found/page-not-found.component';
import { noLoguedGuard } from './shared/guards/no-logued.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full'
  },
/*   { path: 'home', component: HomeComponent, canActivate: [authGuard]
  }, */
  { path: 'auth',
    loadChildren: ()=> import('./modules/auth/auth.module').then(m => m.AuthModule), canActivate: [noLoguedGuard],
  },
  { path: 'home',
    loadChildren: ()=> import('./modules/home/home.module').then(m => m.HomeModule), canActivate: [authGuard],
  },
  { path: 'about',
    loadComponent: ()=> import('./pages/about/about.component').then(m => m.AboutComponent)
  },
  { path: 'encuesta',
    loadComponent: ()=> import('./pages/encuesta/encuesta.component').then(m => m.EncuestaComponent)
  },
  { path: '**', component: PageNotFoundComponent
  },
];
