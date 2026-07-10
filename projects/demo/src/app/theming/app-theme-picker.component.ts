import { Component, EventEmitter, Input, Output } from "@angular/core";
import { Theme } from "@rb-mwindh/ngx-theme-manager";

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
  styles: [`
    :host {
      display: flex;
      gap: 0.5rem;
    }

    button {
      padding: 0.4rem 0.9rem;
      border: 1px solid #d0d0d0;
      border-radius: 9999px;
      background: white;
      color: #444;
      cursor: pointer;
      font: inherit;
      transition: background-color .15s,
      color .15s,
      border-color .15s,
      box-shadow .15s;
    }

    button:hover {
      background: #f5f5f5;
      border-color: #999;
    }

    button.active {
      background: #1976d2;
      border: 2px solid white;
      color: white;
      font-weight: 600;
      box-shadow:
        0 0 0 2px rgb(0 0 0 / 20%),
        0 2px 6px rgb(0 0 0 / 25%);
    }

    button:focus-visible {
      outline: 2px solid #1976d2;
      outline-offset: 2px;
    }
  `],
})
export class AppThemePickerComponent {
  @Input()
  themes: Theme[] | null = [];

  @Input()
  currentTheme: string | null = '';

  @Output()
  readonly selectionChanged = new EventEmitter<string>();
}
