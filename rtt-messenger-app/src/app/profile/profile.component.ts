import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserService } from '../users/user.service';
import { countryNames } from '../register/countries';
import { SessionService } from '../users/session.service';

interface StoredProfile {
  username: string;
  email: string;
  phone_number: string;
  country: string;
  avatarUrl: string | null;
}

@Component({
  selector: 'app-profile',
  imports: [ReactiveFormsModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
})
export class ProfileComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly session = inject(SessionService);
  private readonly userService = inject(UserService);
  private readonly storageKey = 'rtt-messenger.profile';

  readonly countries = countryNames;
  readonly form = this.formBuilder.nonNullable.group({
    username: [
      '',
      [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(20),
        Validators.pattern(/^[A-Za-z_-]+$/),
      ],
    ],
    email: ['', [Validators.required, Validators.email]],
    phone_number: ['', Validators.maxLength(15)],
    country: ['', Validators.required],
  });

  avatarUrl: string | null = null;
  avatarChanged = false;
  isSavingAvatar = false;
  saveMessage = '';
  saveError = false;

  constructor() {
    this.loadProfile();
  }

  get profileName(): string {
    return this.form.controls.username.value || 'Your profile';
  }

  get initials(): string {
    const username = this.form.controls.username.value.trim();
    return username ? username.slice(0, 2).toUpperCase() : 'ME';
  }

  selectPhoto(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      this.showMessage('Choose a JPG, PNG or WebP image.', true);
      input.value = '';
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      this.showMessage('Choose an image smaller than 2 MB.', true);
      input.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        this.showMessage('The selected photo could not be read.', true);
        return;
      }
      this.avatarUrl = reader.result;
      this.avatarChanged = true;
      this.session.profileAvatarUrl.set(this.avatarUrl);
      this.saveMessage = '';
      this.saveError = false;
    };
    reader.onerror = () => this.showMessage('The selected photo could not be read.', true);
    reader.readAsDataURL(file);
    input.value = '';
  }

  removePhoto(): void {
    this.avatarUrl = null;
    this.avatarChanged = true;
    this.session.profileAvatarUrl.set(null);
    this.saveMessage = '';
    this.saveError = false;
  }

  saveProfile(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.showMessage('Check the highlighted fields and try again.', true);
      return;
    }

    const profile: StoredProfile = {
      ...this.form.getRawValue(),
      username: this.form.controls.username.value.trim(),
      email: this.form.controls.email.value.trim(),
      phone_number: this.form.controls.phone_number.value.trim(),
      avatarUrl: this.avatarUrl,
    };

    try {
      localStorage.setItem(this.storageKey, JSON.stringify(profile));
      const currentUser = this.session.currentUser();
      if (currentUser) {
        this.session.start({
          ...currentUser,
          username: profile.username,
          email: profile.email,
          phone_number: profile.phone_number,
          country: profile.country,
        });
        if (this.avatarChanged) {
          this.session.profileAvatarUrl.set(this.avatarUrl);
        }
      }
      this.form.patchValue({
        username: profile.username,
        email: profile.email,
        phone_number: profile.phone_number,
      });
      if (this.avatarChanged) {
        this.saveAvatarToAccount(profile);
      } else {
        this.showMessage('Profile saved in this browser.', false);
      }
    } catch {
      this.showMessage('Your profile could not be saved in this browser.', true);
    }
  }

  private loadProfile(): void {
    const currentUser = this.session.currentUser();
    if (currentUser) {
      this.form.patchValue({
        username: currentUser.username ?? '',
        email: currentUser.email,
        phone_number: currentUser.phone_number ?? '',
        country: currentUser.country ?? '',
      });
    }

    try {
      const savedProfile = localStorage.getItem(this.storageKey);
      if (!savedProfile) return;

      const parsedProfile: unknown = JSON.parse(savedProfile);
      if (!this.isStoredProfile(parsedProfile)) {
        this.showMessage('Saved profile data could not be read. You can replace it by saving again.', true);
        return;
      }

      if (!currentUser) {
        this.form.patchValue({
          username: parsedProfile.username,
          email: parsedProfile.email,
          phone_number: parsedProfile.phone_number,
          country: parsedProfile.country,
        });
      }
      this.avatarUrl = currentUser?.icon_address
        ? this.session.profileAvatarUrl()
        : parsedProfile.avatarUrl;
      this.session.profileAvatarUrl.set(this.avatarUrl);
      this.avatarChanged = Boolean(this.avatarUrl && !currentUser?.icon_address);
    } catch {
      this.showMessage('Saved profile data could not be loaded.', true);
    }
  }

  private isStoredProfile(value: unknown): value is StoredProfile {
    if (typeof value !== 'object' || value === null) return false;
    const profile = value as Record<string, unknown>;
    return (
      typeof profile['username'] === 'string' &&
      typeof profile['email'] === 'string' &&
      typeof profile['phone_number'] === 'string' &&
      typeof profile['country'] === 'string' &&
      (typeof profile['avatarUrl'] === 'string' || profile['avatarUrl'] === null)
    );
  }

  private showMessage(message: string, isError: boolean): void {
    this.saveMessage = message;
    this.saveError = isError;
  }

  private saveAvatarToAccount(profile: StoredProfile): void {
    const currentUser = this.session.currentUser();
    if (!currentUser?.id || !currentUser.access_token) {
      this.showMessage('Log in again before saving your profile photo.', true);
      return;
    }

    this.isSavingAvatar = true;
    this.userService
      .updateProfileIcon(currentUser.id, this.avatarUrl, currentUser.access_token)
      .subscribe({
        next: ({ icon_address }) => {
          const updatedUser = { ...currentUser, icon_address: icon_address ?? undefined };
          this.session.start(updatedUser);
          this.avatarUrl = this.session.profileAvatarUrl();
          this.avatarChanged = false;
          this.isSavingAvatar = false;
          try {
            localStorage.setItem(
              this.storageKey,
              JSON.stringify({ ...profile, avatarUrl: this.avatarUrl }),
            );
          } catch {
            this.showMessage('Your photo was saved, but local profile details could not be updated.', true);
            return;
          }
          this.showMessage('Profile photo saved to your account.', false);
        },
        error: () => {
          this.isSavingAvatar = false;
          this.showMessage('Profile details are saved in this browser, but your photo could not be saved to your account.', true);
        },
      });
  }
}
