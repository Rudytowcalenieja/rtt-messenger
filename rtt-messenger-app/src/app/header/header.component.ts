import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { inject } from '@angular/core';
import { SessionService } from '../users/session.service';
import { UserService } from '../users/user.service';

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  readonly session = inject(SessionService);
  private readonly router = inject(Router);
  private readonly userService = inject(UserService);

  logout(): void {
    const accessToken = this.session.currentUser()?.access_token;
    this.session.end();
    void this.router.navigateByUrl('/login');
    if (accessToken) {
      this.userService.endSession(accessToken).subscribe({
        error: (error: unknown) => console.error('Could not revoke API session', error),
      });
    }
  }
}
