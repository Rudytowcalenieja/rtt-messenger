import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';

import { RegisterComponent } from './register.component';
import { UserService } from '../users/user.service';
import { SessionService } from '../users/session.service';

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;
  let userService: jasmine.SpyObj<UserService>;
  let sessionService: SessionService;
  let router: Router;

  beforeEach(async () => {
    sessionStorage.removeItem('rtt-messenger.session');
    userService = jasmine.createSpyObj<UserService>('UserService', ['addUser']);
    await TestBed.configureTestingModule({
      imports: [RegisterComponent],
      providers: [
        provideRouter([]),
        { provide: UserService, useValue: userService },
      ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    sessionService = TestBed.inject(SessionService);
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('shows one registration step at a time in the requested order', () => {
    const sections = fixture.nativeElement.querySelectorAll(
      '.form-section',
    ) as NodeListOf<HTMLElement>;

    expect(sections.length).toBe(1);
    expect(sections[0].querySelector('label[for="firstName"]')).toBeTruthy();
    expect(sections[0].querySelector('label[for="lastName"]')).toBeTruthy();
    expect(sections[0].querySelector('label[for="username"]')).toBeTruthy();
    expect(sections[0].querySelector('label[for="password"]')).toBeTruthy();
    expect(
      fixture.nativeElement.querySelectorAll('.step-indicator li').length,
    ).toBe(3);
  });

  it('validates each page and preserves values while navigating', () => {
    component.goToNextStep();
    expect(component.currentStep).toBe(1);
    expect(component.form.controls.firstname.touched).toBeTrue();

    component.form.controls.firstname.setValue('Test');
    component.form.controls.lastname.setValue('User');
    component.form.controls.username.setValue('test_user');
    component.form.controls.password.setValue('password123');
    component.goToNextStep();
    fixture.detectChanges();

    expect(component.currentStep).toBe(2);
    expect(
      fixture.nativeElement.querySelector('label[for="email"]'),
    ).toBeTruthy();
    expect(
      fixture.nativeElement.querySelector('label[for="firstName"]'),
    ).toBeNull();

    component.form.controls.email.setValue('test@example.com');
    component.form.controls.country.setValue('Canada');
    component.birthMonth = 5;
    component.birthDay = 10;
    component.birthYear = 1990;
    component.goToNextStep();
    fixture.detectChanges();

    expect(component.currentStep).toBe(3);
    expect(
      fixture.nativeElement.querySelector('#acceptRules'),
    ).toBeTruthy();
    expect(component.form.controls.firstname.value).toBe('Test');
    expect(component.form.controls.date_of_birth.value).toBe('1990-05-10');

    component.goToPreviousStep();
    fixture.detectChanges();
    expect(component.currentStep).toBe(2);
    expect(component.form.controls.email.value).toBe('test@example.com');
  });

  it('requires acceptance of the rules before registering', () => {
    component.submitForm();

    expect(component.acceptRulesError).toBeTrue();
    expect(userService.addUser).not.toHaveBeenCalled();
  });

  it('should validate the registration fields', () => {
    component.form.controls.password.setValue('short');
    component.form.controls.email.setValue('not-an-email');
    component.form.controls.phone_number.setValue('1234567890123456');

    expect(component.form.controls.password.hasError('minlength')).toBeTrue();
    expect(component.form.controls.email.hasError('email')).toBeTrue();
    expect(
      component.form.controls.phone_number.hasError('maxlength'),
    ).toBeTrue();

    component.form.controls.password.setValue('');
    component.form.controls.email.setValue('');
    expect(component.form.controls.password.hasError('required')).toBeTrue();
    expect(component.form.controls.email.hasError('required')).toBeTrue();
  });

  it('uses native date-of-birth selects and builds a valid date', () => {
    component.currentStep = 2;
    fixture.detectChanges();
    const selects = fixture.nativeElement.querySelectorAll(
      '.birth-date select',
    ) as NodeListOf<HTMLSelectElement>;
    expect(selects.length).toBe(3);

    selects[2].value = '2024';
    selects[2].dispatchEvent(new Event('change'));
    fixture.detectChanges();
    selects[0].value = '2';
    selects[0].dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(selects[1].options.length).toBe(30);
    selects[1].value = '29';
    selects[1].dispatchEvent(new Event('change'));

    expect(component.form.controls.date_of_birth.value).toBe('2024-02-29');
  });

  it('starts a session after successful registration', () => {
    const user = {
      id: 12,
      firstname: 'Test',
      lastname: 'User',
      username: 'test_user',
      email: 'test@example.com',
      phone_number: '123456789',
      country: 'Canada',
      access_token: 'test-registration-token',
    };
    userService.addUser.and.returnValue(of(user));
    component.form.setValue({
      firstname: user.firstname,
      lastname: user.lastname,
      username: user.username,
      password: 'password123',
      date_of_birth: '',
      email: user.email,
      phone_number: user.phone_number,
      country: user.country,
    });
    component.acceptRules.setValue(true);
    component.birthMonth = 5;
    component.birthDay = 10;
    component.birthYear = 1990;
    const navigateSpy = spyOn(router, 'navigateByUrl').and.resolveTo(true);

    component.submitForm();

    expect(sessionService.currentUser()?.email).toBe(user.email);
    expect(sessionService.currentUser()?.access_token).toBe(
      'test-registration-token',
    );
    expect(navigateSpy).toHaveBeenCalledWith('/users');
  });
});
