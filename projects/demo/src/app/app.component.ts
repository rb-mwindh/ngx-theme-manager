import { LiveAnnouncer } from '@angular/cdk/a11y';
import { CommonModule } from '@angular/common';
import { Component, effect, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from '@rb-mwindh/ngx-theme-manager';
import { AppThemePickerComponent } from './theming/app-theme-picker.component';
import { AppThemingComponent } from './theming/app-theming.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  imports: [
    CommonModule,
    RouterOutlet,
    AppThemePickerComponent,
    AppThemingComponent,
  ],
})
export class AppComponent {
  private readonly themeService = inject(ThemeService);
  private readonly announcer = inject(LiveAnnouncer);

  readonly repoUrl = 'https://github.com/rb-mwindh/ngx-theme-manager';
  readonly apiDocUrl = 'https://rb-mwindh.github.io/ngx-theme-manager';

  readonly selection = signal('');
  readonly heading = signal('');

  readonly themes = this.themeService.themes;
  readonly currentTheme = this.themeService.currentTheme;

  constructor() {
    this.updateTerminal('install', 'shell');
    effect(() => {
      this.#announce(this.currentTheme());
    });
  }

  selectTheme(theme: string) {
    this.themeService.selectTheme(theme);
  }

  updateTerminal(selection: string, heading = '') {
    this.selection.set(selection);
    this.heading.set(heading);
  }

  #announce(theme: string | undefined | null) {
    this.announcer.announce(`${theme || 'no'} theme selected.`, 3000);
  }

  readonly install = `npm install @rb-mwindh/ngx-theme-manager --save`;

  readonly newTheme = `
/*!
 * @@id theme-a
 * @@displayName Theme A
 * @@description This is theme A
 * @@default
 */

body {
  background-color: black;
  color: white;
}
`;

  readonly createThemesCmp = `
@Component({
  selector: 'app-themes',
  template: '',
  styleUrls: ['assets/themes/theme-a', 'assets/themes/theme-b'],
  encapsulation: ViewEncapsulation.None,
})
export class AppThemesComponent {}
`;

  readonly injectThemeService = `
import { ThemeService } from 'ngx-theme-manager';

@Component({
  selector: 'app-theme-picker',
  template: \`
    <button
      *ngFor="let theme of themeService.themes$ | async"
      (click)="themeService.selectTheme(theme.id)"
      [title]="theme.description"
      [class.defaultTheme]="theme.defaultTheme"
    >
      {{ theme.displayName }}
    </button>
  \`,
  styleUrls: ['./app-theme-picker.component.scss'],
})
export class AppThemePickerComponent {
  constructor(public themeService: ThemeService) {}
}
`;

  readonly useThemesCmp = `
<app-themes></app-themes>
<!-- your app here -->
`;
}
