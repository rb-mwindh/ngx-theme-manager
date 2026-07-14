import { EnvironmentProviders, makeEnvironmentProviders } from "@angular/core";
import { QUERY_PARAM, STORAGE_KEY } from "@rb-mwindh/ngx-theme-manager";

export interface ThemeManagerConfig {
  storageKey?: string | null;
  queryParam?: string | null;
}

/**
 * Provides the necessary configuration for the `NgxThemeManager`.
 *
 * @param config - Configuration options for the theme manager.
 * @param config.storageKey - The key used to persist the current theme in storage.
 *   When omitted, the default storage key is used.
 *   Provide `null` or an empty string to disable storage persistence.
 * @param config.queryParam - The query parameter name used to set the theme via URL.
 *   When omitted, the default query parameter is used.
 *   Provide `null` or an empty string to disable URL query-parameter synchronization.
 * @returns An `EnvironmentProviders` instance to be used in the Angular provider configuration.
 *
 * @example
 * // In your app configuration:
 * provideThemeManager({ storageKey: 'my-theme', queryParam: 'theme' })
 */
export function provideThemeManager(config?: ThemeManagerConfig): EnvironmentProviders {
  return makeEnvironmentProviders([
    ...(config?.storageKey !== undefined
      ? [{ provide: STORAGE_KEY, useValue: config.storageKey === '' ? null : config.storageKey }]
      : []),
    ...(config?.queryParam !== undefined
      ? [{ provide: QUERY_PARAM, useValue: config.queryParam === '' ? null : config.queryParam }]
      : []),
  ]);
}
