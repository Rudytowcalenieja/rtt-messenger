import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { SessionService } from './users/session.service';

describe('profile route access', () => {
  let router: Router;
  let session: SessionService;

  beforeEach(() => {
    sessionStorage.removeItem('rtt-messenger.session');
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideRouter(routes)],
    });
    router = TestBed.inject(Router);
    session = TestBed.inject(SessionService);
  });

  it('redirects signed-out users to login', async () => {
    await router.navigateByUrl('/profile');

    expect(router.url).toBe('/login');
  });

  it('allows signed-in users to open their profile', async () => {
    session.start({
      firstname: 'Test',
      lastname: 'User',
      email: 'test@example.com',
    });

    await router.navigateByUrl('/profile');

    expect(router.url).toBe('/profile');
  });
});
