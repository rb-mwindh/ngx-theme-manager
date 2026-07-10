/**
 * @interface
 * @group Public API
 */
export interface Theme {
  readonly id: string;
  readonly displayName?: string;
  readonly description?: string;
  readonly defaultTheme?: boolean;
}
