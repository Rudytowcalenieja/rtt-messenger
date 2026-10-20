import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { LoginComponent } from './login.component';
import { UserService } from '../users/user.service';
import { SessionService } from '../users/session.service';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let userService: jasmine.SpyObj<UserService>;
  let sessionService: SessionService;
  let router: Router;

  beforeEach(async () => {
    sessionStorage.removeItem('rtt-messenger.session');
    userService = jasmine.createSpyObj<UserService>('UserService', [
      'getUserByLogin',
    ]);
    userService.getUserByLogin.and.returnValue(of({
      id: 12,
      firstname: 'Test',
      lastname: 'User',
      email: 'test@example.com',
      access_token: 'test-token',
    }));

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [provideRouter([]), { provide: UserService, useValue: userService }],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    sessionService = TestBed.inject(SessionService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('requires a username or email and a password', () => {
    component.submitForm();

    expect(component.form.invalid).toBeTrue();
    expect(userService.getUserByLogin).not.toHaveBeenCalled();
  });

  it('logs in and navigates to users', () => {
    const navigateSpy = spyOn(router, 'navigateByUrl').and.resolveTo(true);
    component.form.setValue({
      usernameOrEmail: ' test@example.com ',
      password: 'secret',
    });

    component.submitForm();

    expect(userService.getUserByLogin).toHaveBeenCalledWith(
      'test@example.com',
      'secret',
    );
    expect(navigateSpy).toHaveBeenCalledWith('/users');
    expect(sessionService.currentUser()?.email).toBe('test@example.com');
    expect(sessionService.currentUser()?.access_token).toBe('test-token');
  });

  it('shows an error when login fails and allows retrying', () => {
    userService.getUserByLogin.and.returnValue(
      throwError(() => new Error('Unauthorized')),
    );
    component.form.setValue({
      usernameOrEmail: 'testuser',
      password: 'wrong-password',
    });

    component.submitForm();

    expect(component.errorMessage).toContain('Login failed');
    expect(component.isSubmitting).toBeFalse();
  });
});
