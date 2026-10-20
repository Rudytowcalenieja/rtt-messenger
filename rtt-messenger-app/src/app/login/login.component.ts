import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { UserService } from '../users/user.service';
import { SessionService } from '../users/session.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly userService = inject(UserService);
  private readonly sessionService = inject(SessionService);
  private readonly router = inject(Router);

  readonly form = this.formBuilder.nonNullable.group({
    usernameOrEmail: ['', [Validators.required, Validators.pattern(/\S/)]],
    password: ['', Validators.required],
  });

  isSubmitting = false;
  errorMessage = '';

  submitForm(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.isSubmitting) return;

    this.isSubmitting = true;
    this.errorMessage = '';
    const { usernameOrEmail, password } = this.form.getRawValue();

    this.userService
      .getUserByLogin(usernameOrEmail.trim(), password)
      .subscribe({
        next: (user) => {
          try {
            this.sessionService.start(user);
          } catch {
            this.isSubmitting = false;
            this.errorMessage = 'Login succeeded, but your session could not be saved.';
            return;
          }
          void this.router.navigateByUrl('/users');
        },
        error: () => {
          this.isSubmitting = false;
          this.errorMessage =
            'Login failed. Check your username or email and password.';
        },
      });
  }
}
