import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { ProfileComponent } from './profile.component';
import { SessionService } from '../users/session.service';
import { UserService } from '../users/user.service';

describe('ProfileComponent', () => {
  let component: ProfileComponent;
  let fixture: ComponentFixture<ProfileComponent>;
  let userService: jasmine.SpyObj<UserService>;

  beforeEach(async () => {
    localStorage.removeItem('rtt-messenger.profile');
    sessionStorage.removeItem('rtt-messenger.session');
    userService = jasmine.createSpyObj<UserService>('UserService', [
      'updateProfileIcon',
    ]);
    userService.updateProfileIcon.and.returnValue(
      of({ icon_address: '/icons/test-avatar.png' }),
    );

    await TestBed.configureTestingModule({
      imports: [ProfileComponent],
      providers: [{ provide: UserService, useValue: userService }],
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('validates required profile fields', () => {
    component.saveProfile();

    expect(component.form.invalid).toBeTrue();
    expect(component.saveError).toBeTrue();
  });

  it('saves valid profile details in browser storage', () => {
    component.form.setValue({
      username: 'rtt_user',
      email: 'user@example.com',
      phone_number: '123456789',
      country: 'Canada',
    });

    component.saveProfile();

    expect(component.saveError).toBeFalse();
    expect(component.saveMessage).toBe('Profile saved in this browser.');
    expect(JSON.parse(localStorage.getItem('rtt-messenger.profile')!).username)
      .toBe('rtt_user');
  });

  it('fills profile information from the logged-in user', () => {
    const session = TestBed.inject(SessionService);
    session.start({
      id: 12,
      firstname: 'Riley',
      lastname: 'Taylor',
      username: 'riley_t',
      email: 'riley@example.com',
      phone_number: '5551234567',
      country: 'Canada',
    });

    fixture.destroy();
    fixture = TestBed.createComponent(ProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.form.getRawValue()).toEqual({
      username: 'riley_t',
      email: 'riley@example.com',
      phone_number: '5551234567',
      country: 'Canada',
    });
  });

  it('updates the logged-in user when profile information is saved', () => {
    const session = TestBed.inject(SessionService);
    session.start({
      firstname: 'Riley',
      lastname: 'Taylor',
      username: 'riley_t',
      email: 'riley@example.com',
      phone_number: '5551234567',
      country: 'Canada',
    });
    component.form.setValue({
      username: 'riley_new',
      email: 'new@example.com',
      phone_number: '5559876543',
      country: 'United States',
    });

    component.saveProfile();

    expect(session.currentUser()?.username).toBe('riley_new');
    expect(session.currentUser()?.email).toBe('new@example.com');
    expect(session.currentUser()?.phone_number).toBe('5559876543');
    expect(session.currentUser()?.country).toBe('United States');
  });

  it('saves changed profile photos to the authenticated account', () => {
    const session = TestBed.inject(SessionService);
    session.start({
      id: 12,
      firstname: 'Riley',
      lastname: 'Taylor',
      email: 'riley@example.com',
      access_token: 'test-token',
    });
    component.form.setValue({
      username: 'riley_t',
      email: 'riley@example.com',
      phone_number: '5551234567',
      country: 'Canada',
    });
    component.avatarUrl = 'data:image/png;base64,iVBORw0KGgo=';
    component.avatarChanged = true;

    component.saveProfile();

    expect(userService.updateProfileIcon).toHaveBeenCalledWith(
      12,
      'data:image/png;base64,iVBORw0KGgo=',
      'test-token',
    );
    expect(session.currentUser()?.icon_address).toBe('/icons/test-avatar.png');
    expect(session.profileAvatarUrl()).toBe(
      '/icons/test-avatar.png',
    );
    expect(component.saveMessage).toBe('Profile photo saved to your account.');
  });
});
