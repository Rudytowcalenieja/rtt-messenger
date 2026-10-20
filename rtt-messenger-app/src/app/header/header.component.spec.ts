import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';

import { HeaderComponent } from './header.component';
import { SessionService } from '../users/session.service';
import { UserService } from '../users/user.service';

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;
  let session: SessionService;
  let router: Router;
  let userService: jasmine.SpyObj<UserService>;

  beforeEach(async () => {
    sessionStorage.removeItem('rtt-messenger.session');
    userService = jasmine.createSpyObj<UserService>('UserService', ['endSession']);
    userService.endSession.and.returnValue(of(void 0));
    await TestBed.configureTestingModule({
      imports: [HeaderComponent],
      providers: [
        provideRouter([]),
        { provide: UserService, useValue: userService },
      ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    session = TestBed.inject(SessionService);
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('shows login when signed out and logout when signed in', () => {
    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('Log in');
    expect(element.textContent).not.toContain('Log out');
    expect(element.textContent).not.toContain('Profile');

    session.start({
      firstname: 'Test',
      lastname: 'User',
      email: 'test@example.com',
    });
    fixture.detectChanges();

    expect(element.textContent).toContain('Log out');
    expect(element.textContent).not.toContain('Log in');
    expect(element.textContent).toContain('Profile');
    expect(element.querySelector('.header__avatar')).toBeNull();

    const avatarUrl = 'data:image/png;base64,dGVzdA==';
    session.profileAvatarUrl.set(avatarUrl);
    fixture.detectChanges();

    const avatar = element.querySelector<HTMLImageElement>('.header__avatar');
    expect(avatar?.getAttribute('src')).toBe(avatarUrl);
  });

  it('clears the session and navigates to login on logout', () => {
    session.start({
      firstname: 'Test',
      lastname: 'User',
      email: 'test@example.com',
      access_token: 'test-token',
    });
    const navigateSpy = spyOn(router, 'navigateByUrl').and.resolveTo(true);
    fixture.detectChanges();

    (fixture.nativeElement as HTMLElement)
      .querySelector<HTMLButtonElement>('.header__auth')
      ?.click();

    expect(session.currentUser()).toBeNull();
    expect(navigateSpy).toHaveBeenCalledWith('/login');
    expect(userService.endSession).toHaveBeenCalledWith('test-token');
  });
});
