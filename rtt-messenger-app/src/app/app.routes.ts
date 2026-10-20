import { inject } from '@angular/core';
import { CanActivateFn, Router, Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { UsersComponent } from './users/users.component';
import { ProfileComponent } from './profile/profile.component';
import { SessionService } from './users/session.service';
import { ChatListComponent } from './chat-list/chat-list.component';

const requireSession: CanActivateFn = () =>
  inject(SessionService).currentUser()
    ? true
    : inject(Router).parseUrl('/login');

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'home', component: ChatListComponent, canActivate: [requireSession] },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  {
    path: 'profile',
    component: ProfileComponent,
    canActivate: [requireSession],
  },
  {
    path: 'contacts',
    component: ChatListComponent,
    canActivate: [requireSession],
  },
  {
    path: 'users',
    component: UsersComponent,
    canActivate: [requireSession],
  },
];
