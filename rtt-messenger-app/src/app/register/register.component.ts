import { Component, HostListener, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { countryNames } from './countries';
import {
  FormBuilder,
  FormControl,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { UserService } from '../users/user.service';
import { SessionService } from '../users/session.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent {
  readonly countries = countryNames;
  readonly birthMonths = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];
  readonly birthYears = Array.from(
    { length: new Date().getFullYear() - 1899 },
    (_, index) => new Date().getFullYear() - index,
  );
  countryQuery = '';
  selectedCountry = '';
  activeCountryIndex = 0;
  birthMonth: number | null = null;
  birthDay: number | null = null;
  birthYear: number | null = null;
  activeDropdown: 'country' | null = null;
  birthDateError = false;
  currentStep = 1;
  acceptRules = new FormControl(false, {
    nonNullable: true,
    validators: Validators.requiredTrue,
  });

  get acceptRulesError(): boolean {
    return this.acceptRules.touched && this.acceptRules.invalid;
  }

  get availableBirthDays(): number[] {
    const daysInMonth = this.birthMonth
      ? new Date(this.birthYear ?? 2000, this.birthMonth, 0).getDate()
      : 31;
    return Array.from({ length: daysInMonth }, (_, index) => index + 1);
  }

  get dateOfBirth(): string {
    if (
      this.birthMonth === null ||
      this.birthDay === null ||
      this.birthYear === null
    ) {
      return '';
    }

    const month = String(this.birthMonth).padStart(2, '0');
    const day = String(this.birthDay).padStart(2, '0');
    return `${this.birthYear}-${month}-${day}`;
  }

  get filteredCountries(): string[] {
    const query = this.countryQuery.trim().toLocaleLowerCase();
    return this.countries.filter((country) =>
      country.toLocaleLowerCase().includes(query),
    );
  }

  openCountryList(): void {
    this.countryQuery = '';
    this.activeCountryIndex = 0;
    this.activeDropdown = 'country';
  }

  searchCountries(event: Event): void {
    this.countryQuery = (event.target as HTMLInputElement).value;
    this.activeCountryIndex = 0;
    this.activeDropdown = 'country';
  }

  handleCountryKeydown(event: KeyboardEvent): void {
    const resultCount = this.filteredCountries.length;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (this.activeDropdown !== 'country') {
        this.openCountryList();
      } else if (resultCount > 0) {
        this.activeCountryIndex = Math.min(
          this.activeCountryIndex + 1,
          resultCount - 1,
        );
      }
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (this.activeDropdown !== 'country') {
        this.openCountryList();
        this.activeCountryIndex = Math.max(resultCount - 1, 0);
      } else if (resultCount > 0) {
        this.activeCountryIndex = Math.max(this.activeCountryIndex - 1, 0);
      }
    } else if (
      event.key === 'Enter' &&
      this.activeDropdown === 'country' &&
      resultCount > 0
    ) {
      event.preventDefault();
      this.selectCountry(this.filteredCountries[this.activeCountryIndex]);
    } else if (event.key === 'Escape') {
      this.countryQuery = '';
      this.activeDropdown = null;
    }
  }

  selectCountry(country: string): void {
    this.selectedCountry = country;
    this.countryQuery = '';
    this.activeDropdown = null;
    this.form.controls.country.setValue(country);
  }

  setBirthMonth(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.birthMonth = value ? Number(value) : null;
    this.normalizeBirthDay();
    this.updateBirthDate();
  }

  setBirthDay(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.birthDay = value ? Number(value) : null;
    this.updateBirthDate();
  }

  setBirthYear(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.birthYear = value ? Number(value) : null;
    this.normalizeBirthDay();
    this.updateBirthDate();
  }

  private updateBirthDate(): void {
    this.form.controls.date_of_birth.setValue(this.dateOfBirth);
    this.birthDateError = !this.dateOfBirth;
  }

  @HostListener('document:click', ['$event'])
  @HostListener('document:focusin', ['$event'])
  closeDropdownsOutsidePicker(event: Event): void {
    const target = event.target;
    if (
      target instanceof Element &&
      !target.closest('.country-picker')
    ) {
      if (this.activeDropdown === 'country') {
        this.countryQuery = '';
      }
      this.activeDropdown = null;
    }
  }

  private normalizeBirthDay(): void {
    if (
      this.birthDay !== null &&
      !this.availableBirthDays.includes(this.birthDay)
    ) {
      this.birthDay = null;
    }
  }

  goToNextStep(): void {
    const controlsToValidate =
      this.currentStep === 1
        ? [
            this.form.controls.firstname,
            this.form.controls.lastname,
            this.form.controls.username,
            this.form.controls.password,
          ]
        : [
            this.form.controls.email,
            this.form.controls.phone_number,
            this.form.controls.country,
            this.form.controls.date_of_birth,
          ];

    if (this.currentStep === 2) {
      this.form.controls.date_of_birth.setValue(this.dateOfBirth);
      this.birthDateError = !this.dateOfBirth;
    }

    controlsToValidate.forEach((control) => control.markAsTouched());
    if (controlsToValidate.some((control) => control.invalid)) return;

    this.currentStep = Math.min(this.currentStep + 1, 3);
  }

  goToPreviousStep(): void {
    this.currentStep = Math.max(this.currentStep - 1, 1);
  }

  private fb = inject(FormBuilder);
  private userService = inject(UserService);
  private sessionService = inject(SessionService);
  private router = inject(Router);
  message = '';

  form = this.fb.nonNullable.group({
    firstname: ['', Validators.required],
    lastname: ['', Validators.required],
    username: [
      '',
      [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(20),
        Validators.pattern('[A-Za-z_-]+'),
      ],
    ],
    password: [
      '',
      [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern('(?=.*[A-Za-z])(?=.*[0-9]).{8,}'),
      ],
    ],
    date_of_birth: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone_number: ['', Validators.maxLength(15)],
    country: ['', Validators.required],
  });

  submitForm(): void {
    this.form.controls.date_of_birth.setValue(this.dateOfBirth);
    this.birthDateError = !this.dateOfBirth;
    this.acceptRules.markAsTouched();
    if (this.birthDateError) {
      if (this.activeDropdown === 'country') {
        this.countryQuery = '';
      }
    }
    this.form.markAllAsTouched();
    if (this.form.invalid || this.acceptRules.invalid) return;

    this.userService.addUser(this.form.getRawValue()).subscribe({
      next: (user) => {
        try {
          this.sessionService.start(user);
        } catch {
          this.message = 'Registration succeeded, but your session could not be saved. Please log in.';
          return;
        }
        this.message = 'Registration successful!';
        void this.router.navigateByUrl('/users');
      },
      error: (error) => {
        console.error('Error registering user:', error);
        this.message = 'Registration failed. Please try again.';
      },
    });
  }
}
