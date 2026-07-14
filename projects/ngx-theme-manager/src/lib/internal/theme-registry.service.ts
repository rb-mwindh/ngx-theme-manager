import { Injectable, signal } from "@angular/core";
import { toObservable } from "@angular/core/rxjs-interop";
import { Theme } from "../theme";

/**
 * RbThemeRegistryService is an injectable service that allows for
 * registering and unregistering themes, as well as providing access
 * to the currently registered themes.
 * It also provides an observable of themes that can be used
 * to notify subscribers of changes to the registered themes.
 *
 * @internal
 * @group Services
 */
@Injectable({ providedIn: 'root' })
export class ThemeRegistryService {
  /**
   * The internal dictionary that holds the registered themes.
   *
   * @private
   */
  readonly #dictionary = new Map<string, Theme>();

  /**
   * The subject that emits an updated array of registered themes whenever a change occurs.
   *
   * @private
   */
  readonly #themes = signal<Theme[]>([]);

  /**
   * Signal containing all currently registered themes.
   */
  readonly themes = this.#themes.asReadonly();

  /**
   * Observable compatibility API
   */
  readonly themes$ = toObservable(this.#themes);

  /**
   * Registers a new theme and emits the changed collection of themes.
   *
   * If a theme with the same ID is already registered,
   * the registered theme will be merged with the new one.
   *
   * Themes without ID will be ignored.
   *
   * @param theme - The new theme to register
   */
  register(theme: Theme | undefined | null): void {
    if (!theme?.id) {
      return;
    }

    if (this.#register(theme)) {
      this.#publish();
    }
  }

  registerAll(themes: (Theme | undefined | null)[]): void {
    let changed = false;

    for (const theme of themes) {
      if (theme?.id && this.#register(theme)) {
        changed = true;
      }
    }

    if (changed) {
      this.#publish();
    }
  }

  /**
   * Removes the provided theme from the registry and emits the changed collection of themes.
   *
   * @param theme - The theme to remove.
   */
  unregister(theme: Theme | undefined | null): void {
    if (theme?.id && this.#dictionary.delete(theme?.id)) {
      this.#publish();
    }
  }

  /**
   * Returns the theme with the given ID, or null if no such theme is registered.
   *
   * @param id - The ID of the theme to retrieve
   */
  get(id: string | null): Theme | null {
    if (!id) {
      return null;
    }

    return this.#dictionary.get(id) ?? null;
  }

  /**
   * Returns whether a theme with the given ID is currently registered.
   *
   * @param id - The ID of the theme to check.
   */
  has(id: string | null): boolean {
    return id !== null && this.#dictionary.has(id!);
  }

  /**
   * Registers or updates a theme without publishing the collection.
   *
   * @param theme The theme to register.
   * @returns Whether the registry was changed.
   * @private
   */
  #register(theme: Theme): boolean {
    const previous = this.#dictionary.get(theme.id);

    const registeredTheme: Theme = {
      ...previous,
      ...theme,
    };

    if (
      previous?.id === registeredTheme.id &&
      previous?.displayName === registeredTheme.displayName &&
      previous?.description === registeredTheme.description &&
      previous?.defaultTheme === registeredTheme.defaultTheme
    ) {
      return false;
    }

    this.#dictionary.set(registeredTheme.id, registeredTheme);
    return true;
  }

  /**
   * Publishes a new immutable snapshot of the registered themes.
   *
   * @private
   */
  #publish(): void {
    this.#themes.set([...this.#dictionary.values()]);
  }
}
