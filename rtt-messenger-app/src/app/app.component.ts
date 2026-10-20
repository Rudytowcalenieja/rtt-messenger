import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './header/header.component';

declare global {
  interface Window {
    electronAPI: {
      sendMessage: (message: string) => void;
    };
  }
}

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HeaderComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'rtt-messenger-app';
  sendMessage() {
    window.electronAPI.sendMessage('Hello from Angular!');
  }
}
