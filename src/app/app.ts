import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from './components/header/header';

import 'zone.js';
import { AuthService } from './services/auth.service';
import { map } from 'rxjs';
import { AsyncPipe } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header, AsyncPipe],
  templateUrl: './app.html',
})
export class App {
  private authService = inject(AuthService);
  isAuthenticated$ = this.authService.authState$.pipe(map((user) => !!user));
  protected readonly title = signal('dallas-dashboard');
}
