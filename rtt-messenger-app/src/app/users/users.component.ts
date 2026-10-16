import { Component, inject, OnInit } from '@angular/core';
import { UserService, User } from './user.service';

@Component({
  selector: 'app-users',
  standalone: true,
  template: `
    <ul>
      @for (user of users; track user.id) {
        <li>
          {{ user.id }}
          {{ user.firstname }}
          {{ user.lastname }}
          {{ user.username }}
          {{ user.email }}
          {{ user.phone_number }}
          {{ user.country }}
          {{ user.date_of_birth }}
        </li>
      }
    </ul>
  `,
})
export class UsersComponent implements OnInit {
  private userService = inject(UserService);
  users: User[] = [];

  ngOnInit() {
    this.userService.getUsers().subscribe((data) => (this.users = data));
  }
}
