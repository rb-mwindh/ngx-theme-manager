import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Theme } from '@rb-mwindh/ngx-theme-manager';

@Component({
  selector: 'app-theme-picker',
  template: ` <button
    *ngFor="let theme of themes || []"
    (click)="selectionChanged.emit(theme.id)"
    [class.active]="theme.id === currentTheme"
    [title]="theme.description || ''"
  >
    {{ theme.displayName }}
  </button>`,
  styles: [],
})
export class AppThemePickerComponent {
  @Input()
  themes: Theme[] | null = [];

  @Input()
  currentTheme: string | null = '';

  @Output()
  readonly selectionChanged = new EventEmitter<string>();
}
