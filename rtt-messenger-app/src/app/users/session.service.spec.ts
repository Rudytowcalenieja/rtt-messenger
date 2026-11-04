import { TestBed } from '@angular/core/testing';
import { SessionService } from './session.service';

describe('SessionService', () => {
  beforeEach(() => {
    sessionStorage.removeItem('rtt-messenger.session');
    localStorage.removeItem('rtt-messenger.profile');
    TestBed.configureTestingModule({});
  });

  it('restores a valid session from session storage', () => {
    sessionStorage.setItem(
      'rtt-messenger.session',
      JSON.stringify({
        firstname: 'Test',
        lastname: 'User',
        email: 'test@example.com',
      }),
    );

    const session = TestBed.inject(SessionService);

    expect(session.currentUser()?.email).toBe('test@example.com');
  });

  it('persists and clears the current user', () => {
    const session = TestBed.inject(SessionService);
    const user = {
      firstname: 'Test',
      lastname: 'User',
      email: 'test@example.com',
    };

    session.start(user);
    expect(JSON.parse(sessionStorage.getItem('rtt-messenger.session')!).email)
      .toBe('test@example.com');
    expect(session.currentUser()).toEqual(user);

    session.end();
    expect(sessionStorage.getItem('rtt-messenger.session')).toBeNull();
    expect(session.currentUser()).toBeNull();
  });

  it('restores the profile avatar saved by the profile page', () => {
    const avatarUrl = 'data:image/png;base64,dGVzdA==';
    localStorage.setItem(
      'rtt-messenger.profile',
      JSON.stringify({ avatarUrl }),
    );

    const session = TestBed.inject(SessionService);

    expect(session.profileAvatarUrl()).toBe(avatarUrl);
  });

  it('restores the profile icon path from the authenticated database user', () => {
    sessionStorage.setItem(
      'rtt-messenger.session',
      JSON.stringify({
        id: 12,
        firstname: 'Test',
        lastname: 'User',
        email: 'test@example.com',
        icon_address: '/icons/avatar.png',
        access_token: 'test-token',
      }),
    );

    const session = TestBed.inject(SessionService);

    expect(session.profileAvatarUrl()).toBe(
      '/icons/avatar.png',
    );
  });
});
