import { DestroyRef, effect, inject, Injectable, InjectionToken } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { ActivatedRoute, Router } from "@angular/router";
import { filter, map } from "rxjs";
import { StorageService, ThemeRegistryService, ThemeStyleManagerService, ThemeTrackingService } from "./internal";
import { Theme } from "./theme";

const PREFIX = 'ngx-theme-manager';

/**
 * Storage key used to persist the currently selected theme.
 *
 * Provide null or an empty string to disable storage synchronization.
 *
 * @group InjectionToken
 */
export const STORAGE_KEY = new InjectionToken<string | null>(
  `${PREFIX}/STORAGE_KEY`,
  {
    factory: () => `${PREFIX}/current-theme`,
  },
);

/**
 * Query parameter used to synchronize the selected theme with the URL.
 *
 * Provide null or an empty string to disable query-parameter
 * synchronization.
 *
 * @group InjectionToken
 */
export const QUERY_PARAM = new InjectionToken<string | null>(
  `${PREFIX}/QUERY_PARAM`,
  {
    factory: () => 'theme',
  },
);

/**
 * Service for managing and selecting application themes.
 *
 * The service exposes signal-based APIs for modern Angular applications and
 * observable APIs for observable-based and legacy applications.
 *
 * @group Services
 * @group Public API
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {

  /**
   * Internal registry containing all discovered themes.
   *
   * @private
   */
  readonly #registry = inject(ThemeRegistryService);

  /**
   * Tracks the currently selected theme.
   *
   * @private
   */
  readonly #tracker = inject(ThemeTrackingService);

  /**
   * Activates and deactivates the corresponding style elements.
   *
   * @private
   */
  readonly #manager = inject(ThemeStyleManagerService);

  /**
   * Synchronizes the selected theme with browser storage.
   *
   * @private
   */
  readonly #storage = inject(StorageService);

  /**
   * Current activated route.
   *
   * The router integration is optional so the theme manager can also be used
   * in applications without Angular Router.
   *
   * @private
   */
  readonly #activatedRoute = inject(ActivatedRoute, {
    optional: true,
  });

  /**
   * Angular Router.
   *
   * The router integration is optional so the theme manager can also
   * be used in applications without Angular Router.
   *
   * @private
   */
  readonly #router = inject(Router, {
    optional: true,
  });

  /**
   * Configured storage key.
   *
   * @private
   */
  readonly #storageKey = inject(STORAGE_KEY);

  /**
   * Configured query parameter.
   *
   * @private
   */
  readonly #queryParam = inject(QUERY_PARAM);

  /**
   * Provides the lifetime used by observable subscriptions.
   *
   * @private
   */
  readonly #destroyRef = inject(DestroyRef);

  /**
   * Whether the initial theme selection has already been resolved.
   *
   * @private
   */
  #initialized = false;

  /**
   * Signal containing all currently registered themes.
   */
  readonly themes = this.#registry.themes;

  /**
   * Observable containing all currently registered themes.
   *
   * This API is retained for observable-based and legacy applications.
   */
  readonly themes$ = this.#registry.themes$;

  /**
   * Signal containing the currently selected theme ID.
   */
  readonly currentTheme = this.#tracker.currentTheme;

  /**
   * Observable containing the currently selected theme ID.
   *
   * This API is retained for observable-based and legacy applications.
   */
  readonly currentTheme$ = this.#tracker.currentTheme$;

  /**
   * Creates the service and initializes theme synchronization.
   */
  constructor() {
    this.#initializeEffects();
    this.#observeStorageChanges();
    this.#observeRouteChanges();
  }

  /**
   * Selects the theme to be used.
   *
   * Unknown theme IDs are ignored after the registry has been populated.
   *
   * @param theme The theme ID to select, or null to clear the selection.
   */
  selectTheme(theme: string | null): void {
    if (
      theme !== null &&
      this.themes().length > 0 &&
      !this.#registry.has(theme)
    ) {
      return;
    }

    this.#tracker.setCurrentTheme(theme);
  }

  #initializeEffects(): void {
    effect(() => {
      const themes = this.themes();

      if (this.#initialized || themes.length === 0) {
        return;
      }

      this.#initialized = true;

      /*
       * A selection may already have been supplied
       * before the registry was populated.
       * In that case, it takes precedence over
       * automatic initial theme resolution.
       */
      if (this.currentTheme() !== null) {
        return;
      }

      const initialTheme  = this.#resolveInitialTheme(themes);
      if (initialTheme !== null) {
        this.#tracker.setCurrentTheme(initialTheme);
      }
    });

    effect(() => {
      const theme = this.currentTheme();

      if (theme === null) {
        return;
      }

      this.#updateRouteParam(theme);
      this.#updateStoredTheme(theme);
      this.#manager.use(theme);
    });
  }

  /**
   * Updates the selected theme when browser storage changes.
   *
   * Storage changes remain observable-based because they represent
   * external events rather than application state.
   *
   * @private
   */
  #observeStorageChanges(): void {
    const storageKey = this.#storageKey;

    if (!storageKey) {
      return;
    }

    this.#storage.changes$
      .pipe(
        filter(({ key }) => key === storageKey),
        map(({ newValue }) => newValue),
        filter(
          (theme) =>
            theme === null ||
            this.#registry.has(theme),
        ),
        takeUntilDestroyed(this.#destroyRef),
      )
      .subscribe((theme) => {
        this.#tracker.setCurrentTheme(theme);
      });
  }

  /**
   * Updates the selected theme when the configured route query parameter
   * changes.
   *
   * Router query parameters remain observable-based because they represent
   * an external event stream.
   *
   * @private
   */
  #observeRouteChanges(): void {
    const queryParam = this.#queryParam;
    const activatedRoute = this.#activatedRoute;

    if (!queryParam || !activatedRoute) {
      return;
    }

    activatedRoute.queryParamMap.pipe(
      map((params) => params.get(queryParam)),
      filter(isNotNull),
      filter((theme) => this.#registry.has(theme)),
      takeUntilDestroyed(this.#destroyRef),
      )
      .subscribe((theme) => {
        this.#tracker.setCurrentTheme(theme);
      });
  }

  /**
   * Resolves the initial theme from route, storage and registered metadata.
   *
   * Priority:
   *
   * 1. URL query parameter
   * 2. Browser storage
   * 3. Theme marked as default
   * 4. First registered theme
   *
   * Unknown route and storage values are ignored.
   *
   * @param themes The registered themes.
   * @returns The selected initial theme ID or null.
   * @private
   */
  #resolveInitialTheme(themes: Theme[]): string | null {
    const candidates = [
      this.#themeFromRoute,
      this.#themeFromStorage,
      themes.find(({ defaultTheme }) => defaultTheme)?.id,
      themes[0]?.id,
    ];

    return (
      candidates.find(
        (candidate): candidate is string =>
          !!candidate &&
          this.#registry.has(candidate),
      ) ??
      null
    );
  }

  /**
   * Returns the theme stored in browser storage.
   *
   * @returns The stored theme ID or null.
   * @private
   */
  get #themeFromStorage(): string | null {
    const storageKey = this.#storageKey;
    if (!storageKey) {
      return null;
    }

    return this.#storage.getItem(storageKey);
  }

  /**
   * Returns the theme from the current route's query parameters.
   *
   * @returns The route theme ID or null.
   * @private
   */
  get #themeFromRoute(): string | null {
    const queryParam = this.#queryParam;
    const activatedRoute = this.#activatedRoute;

    if (!queryParam || !activatedRoute) {
      return null;
    }

    return activatedRoute.snapshot.queryParamMap.get(queryParam);
  }

  /**
   * Updates the configured URL query parameter.
   *
   * No navigation is performed when the parameter already contains the
   * selected theme.
   *
   * @param theme The selected theme ID.
   * @private
   */
  #updateRouteParam(theme: string): void {
    const queryParam = this.#queryParam;
    const activatedRoute = this.#activatedRoute;
    const router = this.#router;

    if (!queryParam || !activatedRoute || !router) {
      return;
    }

    const currentTheme = activatedRoute
      .snapshot
      .queryParamMap
      .get(queryParam);

    if (currentTheme === theme) {
      return;
    }

    void router.navigate([], {
      relativeTo: activatedRoute,
      queryParams: {
        [queryParam]: theme,
      },
      queryParamsHandling: 'merge',
      preserveFragment: true,
      replaceUrl: true,
    });
  }

  /**
   * Persists the selected theme in browser storage.
   *
   * @param theme The selected theme ID.
   * @private
   */
  #updateStoredTheme(theme: string): void {
    const storageKey = this.#storageKey;

    if (!storageKey) {
      return;
    }

    this.#storage.setItem(storageKey, theme);
  }
}

/**
 * Type guard excluding null values.
 *
 * @param value The value to check.
 * @returns Whether the provided value is not null.
 * @internal
 */
function isNotNull<T>(value: T | null): value is T {
  return value !== null;
}
