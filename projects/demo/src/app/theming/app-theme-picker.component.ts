import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Theme } from '@rb-mwindh/ngx-theme-manager';

@Component({
  selector: 'app-theme-picker',
  template: ` @for (theme of themes || []; track theme) {
    <button
      (click)="selectionChanged.emit(theme.id)"
      [class.active]="theme.id === currentTheme"
      [title]="theme.description || ''"
    >
      {{ theme.displayName }}
    </button>
  }`,
  styles: [],
  standalone: false,
})
export class AppThemePickerComponent {
  @Input()
  themes: Theme[] | null = [];

  @Input()
  currentTheme: string | null = '';

  @Output()
  readonly selectionChanged = new EventEmitter<string>();
}
