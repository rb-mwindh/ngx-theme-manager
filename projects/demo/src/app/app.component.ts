import { Component, OnDestroy, OnInit } from '@angular/core';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { Observable, Subject, takeUntil, tap } from 'rxjs';
import { Theme, ThemeService } from '@rb-mwindh/ngx-theme-manager';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, OnDestroy {
  readonly #destroyed = new Subject<void>();

  readonly repoUrl = 'https://github.com/rb-mwindh/ngx-theme-manager';
  apiDocUrl = 'https://rb-mwindh.github.io/ngx-theme-manager';
  selection = '';
  heading = '';

  themes$: Observable<Theme[]> = this.themeService.themes$;
  currentTheme$: Observable<string | null> =
    this.themeService.currentTheme$;

  constructor(
    private readonly themeService: ThemeService,
    private readonly announcer: LiveAnnouncer,
  ) {}

  ngOnDestroy() {
    this.#destroyed.next();
    this.#destroyed.complete();
  }

  ngOnInit() {
    this.updateTerminal('install', 'shell');
    this.themeService.currentTheme$
      .pipe(
        tap((theme) => this.#announce(theme)),
        takeUntil(this.#destroyed),
      )
      .subscribe();
  }

  selectTheme(theme: string) {
    this.themeService.selectTheme(theme);
  }

  updateTerminal(selection: string, heading?: string) {
    this.selection = selection;
    this.heading = heading || '';
  }

  #announce(theme: string | undefined | null) {
    this.announcer.announce(`${theme || 'no'} theme selected.`, 3000);
  }

  readonly install = `npm install ngx-theme-manager --save`;

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
