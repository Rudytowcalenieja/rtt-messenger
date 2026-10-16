import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface User {
  id?: number;
  firstname: string;
  lastname: string;
  username?: string;
  email: string;
  phone_number?: string | null;
  country?: string;
  date_of_birth?: string;
}

export interface NewUser {
  firstname: string;
  lastname: string;
  username: string;
  password: string;
  date_of_birth: string;
  email: string;
  phone_number?: string | null;
  country: string;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api/users';

  getUserByLogin(username: string, password: string): Observable<User> {
    const url = `${this.apiUrl}/login`;
    return this.http.post<User>(url, { username, password });
  }

  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.apiUrl);
  }

  addUser(user: NewUser): Observable<User> {
    return this.http.post<User>(this.apiUrl, user);
  }
}
