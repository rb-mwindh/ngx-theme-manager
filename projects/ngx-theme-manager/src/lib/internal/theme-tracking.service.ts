import { Injectable, Signal } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { BehaviorSubject, distinctUntilChanged } from "rxjs";

/**
 * A service to track the currently active theme.
 *
 * @internal
 * @group Services
 */
@Injectable({ providedIn: 'root' })
export class ThemeTrackingService {
  /**
   * The subject that emits the next value set through {@link currentTheme}.
   *
   * @private
   */
  readonly #currentTheme$ = new BehaviorSubject<string | null>(null);

  /**
   * The observable that emits the current theme, shared among subscribers.
   * This observable prevents emitting the same value twice in a row.
   * It also updates the private #currentTheme property.
   */
  readonly currentTheme$ = this.#currentTheme$.pipe(
    distinctUntilChanged(),
  );

  readonly currentTheme: Signal<string | null> = toSignal(this.currentTheme$, {
    requireSync: true,
  })

  /**
   * Set the current theme.
   *
   * @param theme
   */
  setCurrentTheme(theme: string | null): void {
    if (theme !== this.#currentTheme$.value) {
      this.#currentTheme$.next(theme);
    }
  }
}
