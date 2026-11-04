import { Injectable, signal } from '@angular/core';
import { User } from './user.service';

@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly storageKey = 'rtt-messenger.session';
  private readonly profileStorageKey = 'rtt-messenger.profile';
  readonly currentUser = signal<User | null>(this.readSession());
  readonly profileAvatarUrl = signal<string | null>(this.readProfileAvatar());

  isAdmin(): boolean {
    return this.currentUser()?.is_admin === true;
  }

  start(user: User): void {
    sessionStorage.setItem(this.storageKey, JSON.stringify(user));
    this.currentUser.set(user);
    this.profileAvatarUrl.set(
      user.icon_address ? this.resolveIconAddress(user.icon_address) : null,
    );
  }

  end(): void {
    sessionStorage.removeItem(this.storageKey);
    this.currentUser.set(null);
    this.profileAvatarUrl.set(null);
  }

  private readSession(): User | null {
    const storedSession = sessionStorage.getItem(this.storageKey);
    if (!storedSession) return null;

    try {
      const user: unknown = JSON.parse(storedSession);
      if (this.isUser(user)) return user;
      sessionStorage.removeItem(this.storageKey);
    } catch {
      sessionStorage.removeItem(this.storageKey);
    }

    return null;
  }

  private readProfileAvatar(): string | null {
    const iconAddress = this.currentUser()?.icon_address;
    if (iconAddress) return this.resolveIconAddress(iconAddress);

    const storedProfile = localStorage.getItem(this.profileStorageKey);
    if (!storedProfile) return null;

    try {
      const profile: unknown = JSON.parse(storedProfile);
      if (typeof profile !== 'object' || profile === null) return null;
      const avatarUrl = (profile as Record<string, unknown>)['avatarUrl'];
      return typeof avatarUrl === 'string' ? avatarUrl : null;
    } catch {
      return null;
    }
  }

  private resolveIconAddress(iconAddress: string): string {
    return iconAddress.startsWith('http')
      ? iconAddress
      : `${iconAddress.startsWith('/') ? '' : '/'}${iconAddress}`;
  }

  private isUser(value: unknown): value is User {
    if (typeof value !== 'object' || value === null) return false;
    const user = value as Record<string, unknown>;
    return (
      typeof user['firstname'] === 'string' &&
      typeof user['lastname'] === 'string' &&
      typeof user['email'] === 'string'
    );
  }
}
