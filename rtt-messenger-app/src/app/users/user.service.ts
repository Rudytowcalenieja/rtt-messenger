import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
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
  icon_address?: string;
  access_token?: string;
  is_admin?: boolean;
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

  updateProfileIcon(
    userId: number,
    image: string | null,
    accessToken: string,
  ): Observable<{ icon_address: string | null }> {
    return this.http.put<{ icon_address: string | null }>(
      `${this.apiUrl}/${userId}/icon`,
      { image },
      { headers: new HttpHeaders({ Authorization: `Bearer ${accessToken}` }) },
    );
  }

  endSession(accessToken: string): Observable<void> {
    return this.http.delete<void>('http://localhost:3000/api/session', {
      headers: new HttpHeaders({ Authorization: `Bearer ${accessToken}` }),
    });
  }
}
