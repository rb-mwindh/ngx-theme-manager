import { Injectable, signal } from "@angular/core";
import { toObservable } from "@angular/core/rxjs-interop";

/**
 * A service to track the currently active theme.
 *
 * @internal
 * @group Services
 */
@Injectable({ providedIn: 'root' })
export class ThemeTrackingService {
  /**
   * Signal containing the currently selected theme.
   *
   * @private
   */
  readonly #currentTheme = signal<string | null>(null);

  /**
   * Observable compatibility API
   */
  readonly currentTheme$ = toObservable(this.#currentTheme);

  /**
   * Signal containing the currently selected theme.
   */
  readonly currentTheme = this.#currentTheme.asReadonly();

  /**
   * Set the current theme.
   *
   * @param theme
   */
  setCurrentTheme(theme: string | null): void {
    this.#currentTheme.set(theme);
  }
}
