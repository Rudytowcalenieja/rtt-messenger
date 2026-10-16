import { Component, HostListener, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { countryNames } from './countries';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserService } from '../users/user.service';

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
  activeDropdown: 'country' | 'month' | 'day' | 'year' | null = null;
  activeBirthOptionIndex = 0;
  birthDateError = false;

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

  toggleBirthDropdown(field: 'month' | 'day' | 'year'): void {
    if (this.activeDropdown === field) {
      this.activeDropdown = null;
      return;
    }

    if (this.activeDropdown === 'country') {
      this.countryQuery = '';
    }
    this.activeDropdown = field;
    this.activeBirthOptionIndex = this.selectedBirthOptionIndex(field);
  }

  handleBirthDropdownKeydown(
    event: KeyboardEvent,
    field: 'month' | 'day' | 'year',
  ): void {
    const optionCount = this.birthOptionCount(field);

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const direction = event.key === 'ArrowDown' ? 1 : -1;

      if (this.activeDropdown !== field) {
        if (this.activeDropdown === 'country') {
          this.countryQuery = '';
        }
        this.activeDropdown = field;
        this.activeBirthOptionIndex =
          direction > 0
            ? this.selectedBirthOptionIndex(field)
            : optionCount - 1;
      } else if (optionCount > 0) {
        this.activeBirthOptionIndex = Math.max(
          0,
          Math.min(this.activeBirthOptionIndex + direction, optionCount - 1),
        );
      }
    } else if (
      (event.key === 'Enter' || event.key === ' ') &&
      this.activeDropdown === field
    ) {
      event.preventDefault();
      this.selectBirthOption(field, this.activeBirthOptionIndex);
    } else if (event.key === 'Escape') {
      this.activeDropdown = null;
    }
  }

  selectBirthOption(field: 'month' | 'day' | 'year', index: number): void {
    if (field === 'month') {
      this.birthMonth = index + 1;
      this.normalizeBirthDay();
    } else if (field === 'day') {
      this.birthDay = this.availableBirthDays[index];
    } else {
      this.birthYear = this.birthYears[index];
      this.normalizeBirthDay();
    }

    this.activeDropdown = null;
    this.form.controls.date_of_birth.setValue(this.dateOfBirth);
    this.birthDateError = !this.dateOfBirth;
  }

  @HostListener('document:click', ['$event'])
  @HostListener('document:focusin', ['$event'])
  closeDropdownsOutsidePicker(event: Event): void {
    const target = event.target;
    if (
      target instanceof Element &&
      !target.closest('.country-picker, .date-select')
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

  private birthOptionCount(field: 'month' | 'day' | 'year'): number {
    if (field === 'month') return this.birthMonths.length;
    if (field === 'day') return this.availableBirthDays.length;
    return this.birthYears.length;
  }

  private selectedBirthOptionIndex(field: 'month' | 'day' | 'year'): number {
    if (field === 'month') return Math.max((this.birthMonth ?? 1) - 1, 0);
    if (field === 'day') return Math.max((this.birthDay ?? 1) - 1, 0);
    const yearIndex = this.birthYear
      ? this.birthYears.indexOf(this.birthYear)
      : 0;
    return Math.max(yearIndex, 0);
  }

  private fb = inject(FormBuilder);
  private userService = inject(UserService);
  message = '';

  form = this.fb.nonNullable.group({
    firstname: ['', Validators.required],
    lastname: ['', Validators.required],
    username: ['', Validators.required],
    password: ['', [Validators.required, Validators.minLength(8)]],
    date_of_birth: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone_number: ['', Validators.maxLength(15)],
    country: ['', Validators.required],
  });

  submitForm(): void {
    this.form.controls.date_of_birth.setValue(this.dateOfBirth);
    this.birthDateError = !this.dateOfBirth;
    if (this.birthDateError) {
      if (this.activeDropdown === 'country') {
        this.countryQuery = '';
      }
      this.activeDropdown = !this.birthMonth
        ? 'month'
        : !this.birthDay
          ? 'day'
          : 'year';
      this.activeBirthOptionIndex = 0;
    }
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    this.userService.addUser(this.form.getRawValue()).subscribe({
      next: (user) => {
        console.log('User registered:', user);
        this.message = 'Registration successful!';
        this.form.reset();
        this.selectedCountry = '';
        this.countryQuery = '';
        this.birthMonth = null;
        this.birthDay = null;
        this.birthYear = null;
        this.birthDateError = false;
      },
      error: (error) => {
        console.error('Error registering user:', error);
        this.message = 'Registration failed. Please try again.';
      },
    });
  }
}
