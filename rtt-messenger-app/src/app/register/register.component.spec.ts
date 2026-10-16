import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { RegisterComponent } from './register.component';
import { UserService } from '../users/user.service';

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterComponent],
      providers: [
        provideRouter([]),
        {
          provide: UserService,
          useValue: jasmine.createSpyObj('UserService', ['addUser']),
        },
      ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
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
});
