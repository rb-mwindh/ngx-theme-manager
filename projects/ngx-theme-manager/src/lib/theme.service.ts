import { inject, Injectable, InjectionToken, OnDestroy } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { filter, map, Subject, take, takeUntil } from "rxjs";
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
export class ThemeService implements OnDestroy {
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
   * Emits when the service is destroyed.
   *
   * @private
   */
  readonly #destroyed = new Subject<void>();

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
    this.#initializeThemeSelection();
    this.#synchronizeSelectedTheme();
    this.#observeStorageChanges();
    this.#observeRouteChanges();
  }

  /**
   * Completes all internal subscriptions.
   *
   * @internal
   */
  ngOnDestroy(): void {
    this.#destroyed.next();
    this.#destroyed.complete();
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

  /**
   * Resolves and selects the initial theme once themes are available.
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
   * @private
   */
  #initializeThemeSelection(): void {
    this.themes$
      .pipe(
        filter((themes) => themes.length > 0),
        take(1),
        takeUntil(this.#destroyed),
      )
      .subscribe((themes) => {
        if (this.currentTheme() !== null) {
          return;
        }

        const initialTheme = this.#resolveInitialTheme(themes);

        if (initialTheme !== null) {
          this.#tracker.setCurrentTheme(initialTheme);
        }
      });
  }

  /**
   * Synchronizes selected themes with the route, storage and style manager.
   *
   * @private
   */
  #synchronizeSelectedTheme(): void {
    this.currentTheme$
      .pipe(
        filter(isNotNull),
        takeUntil(this.#destroyed),
      )
      .subscribe((theme) => {
        this.#updateRouteParam(theme);
        this.#updateStoredTheme(theme);
        this.#manager.use(theme);
      });
  }

  /**
   * Updates the selected theme when browser storage changes.
   *
   * @private
   */
  #observeStorageChanges(): void {
    if (!this.#storageKey) {
      return;
    }

    this.#storage.changes$
      .pipe(
        filter(({ key }) => key === this.#storageKey),
        map(({ newValue }) => newValue),
        filter(
          (theme) =>
            theme === null ||
            this.#registry.has(theme),
        ),
        takeUntil(this.#destroyed),
      )
      .subscribe((theme) => {
        this.#tracker.setCurrentTheme(theme);
      });
  }

  /**
   * Updates the selected theme when the configured route query parameter
   * changes.
   *
   * @private
   */
  #observeRouteChanges(): void {
    if (
      !this.#queryParam ||
      !this.#activatedRoute
    ) {
      return;
    }

    this.#activatedRoute.queryParamMap
      .pipe(
        map((params) => params.get(this.#queryParam!)),
        filter(isNotNull),
        filter((theme) => this.#registry.has(theme)),
        takeUntil(this.#destroyed),
      )
      .subscribe((theme) => {
        this.#tracker.setCurrentTheme(theme);
      });
  }

  /**
   * Resolves the initial theme from route, storage and registered metadata.
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
    if (!this.#storageKey) {
      return null;
    }

    return this.#storage.getItem(this.#storageKey);
  }

  /**
   * Returns the theme from the current route's query parameters.
   *
   * @returns The route theme ID or null.
   * @private
   */
  get #themeFromRoute(): string | null {
    if (
      !this.#queryParam ||
      !this.#activatedRoute
    ) {
      return null;
    }

    return this.#activatedRoute.snapshot.queryParamMap.get(
      this.#queryParam,
    );
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
    if (
      !this.#queryParam ||
      !this.#activatedRoute ||
      !this.#router
    ) {
      return;
    }

    const currentTheme =
      this.#activatedRoute.snapshot.queryParamMap.get(
        this.#queryParam,
      );

    if (currentTheme === theme) {
      return;
    }

    void this.#router.navigate([], {
      relativeTo: this.#activatedRoute,
      queryParams: {
        [this.#queryParam]: theme,
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
    if (!this.#storageKey) {
      return;
    }

    this.#storage.setItem(this.#storageKey, theme);
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
