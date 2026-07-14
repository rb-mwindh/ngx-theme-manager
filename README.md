# ngx-theme-manager

`@rb-mwindh/ngx-theme-manager` provides the basics tools for a robust theme-switcher implementation.

This package does not provide ready-made visual components,
but only supports their implementation by providing the necessary services and tools.

---

![sponsors](https://img.shields.io/github/sponsors/rb-mwindh)
![License](https://img.shields.io/github/license/rb-mwindh/ngx-theme-manager?color=blue)
![latest release](https://img.shields.io/github/v/release/rb-mwindh/ngx-theme-manager?color=brightgreen)

![open issues](https://img.shields.io/github/issues/rb-mwindh/ngx-theme-manager?color=red)
![open pr](https://img.shields.io/github/issues-pr/rb-mwindh/ngx-theme-manager?color=orange)

![nodejs](https://img.shields.io/node/v/@rb-mwindh/ngx-theme-manager?color=lightgray&logo=nodedotjs)
![angular](https://img.shields.io/npm/dependency-version/@rb-mwindh/ngx-theme-manager/peer/@angular/core?color=lightgray&logo=angular)

- [API Docs](https://rb-mwindh.github.io/ngx-theme-manager)
- [Demo](https://ngx-theme-manager.vercel.app/)

---

## Table of Contents <!-- omit in toc -->

- [Compatibility](#compatibility)
- [How it works](#how-it-works)
- [Getting Started](#getting-started)
  - [Install the package](#install-the-package)
  - [Implement your theme stylesheets](#implement-your-theme-stylesheets)
  - [Load your theme stylesheets](#load-your-theme-stylesheets)
  - [Implement your theme-picker component](#implement-your-theme-picker-component)
  - [Signals and Observables](#signals-and-observables)
  - [Initial theme selection](#initial-theme-selection)
  - [Configure synchronization](#configure-synchronization)
- [Migrating to the signal-based API](#migrating-to-the-signal-based-api)
- [Building and Testing](#building-and-testing)
- [Contribution Guidelines](#contribution-guidelines)
- [Get help](#get-help)
- [About](#about)
  - [Maintainers](#maintainers)
  - [Contributors](#contributors)
  - [3rd Party Licenses](#3rd-party-licenses)
  - [Used Encryption](#used-encryption)
  - [License](#license)

## Compatibility

As of v18, the package major version follows the supported Angular major version.

| Package version | Angular version | Development runtime                         |
| --------------- | --------------- | ------------------------------------------- |
| `21.x`          | Angular `21.x`  | Node.js `^20.19.0`, `^22.12.0` or `^24.0.0` |
| `20.x`          | Angular `20.x`  | See the corresponding release metadata      |
| `19.x`          | Angular `19.x`  | See the corresponding release metadata      |
| `18.x`          | Angular `18.x`  | See the corresponding release metadata      |

The published package declares `@angular/common` and `@angular/core` version `21` or newer as peer dependencies.
The Node.js versions above apply to this repository's development, build and release tooling.

## How it works

This implementation is based on the regular way Angular loads component styles.
Since theme styles are usually global styles, theme components normally use `ViewEncapsulation.None`.

Angular does not provide a direct way to access the `<style>` element associated with a component.
Therefore, `@rb-mwindh/ngx-theme-manager` identifies theme styles through predefined annotations in CSS comments.

The library scans the application's `<style>` elements, registers annotated themes
and adds a `data-theme="<id>"` attribute to the corresponding elements.
It then uses the [`media` attribute][selfhtml:media] to activate or deactivate each theme:

- inactive theme styles receive `media="none"`
- active theme styles have their `media` attribute removed

Newly added styles are discovered automatically. This also supports themes loaded after application startup.

## Getting Started

### Install the package

```shell
npm install @rb-mwindh/ngx-theme-manager --save
```

### Implement your theme stylesheets

`@rb-mwindh/ngx-theme-manager` identifies CSS, SCSS and other compiled stylesheets as themes
through annotations in CSS comments. Use the `/*! ... */` comment format so the annotations
remain available after production minification.

> ... By default, multi-line comments be stripped from the compiled CSS
> in compressed mode. **If a comment begins with /\*!, though, it will
> always be included in the CSS output.** ...
>
> _See the [Sass documentation on comments][sass-comments]_

Known annotations are:

| Annotation      | Required | Description                                                 |
| --------------- | -------- | ----------------------------------------------------------- |
| `@@id`          | yes      | Unique theme identifier; reads until the end of the line    |
| `@@displayName` | no       | User-facing name; defaults to the theme ID                  |
| `@@description` | no       | Optional user-facing description                            |
| `@@default`     | no       | Marks the theme as the default theme; does not take a value |

```scss
/*!
 * @@id my-theme-id
 * @@displayName My Fantastic Theme
 * @@description This is my fantastic theme with magic colors
 * @@default
 */

// add all your theme styles below this line, e.g.
@import '@angular/material/prebuilt-themes/indigo-pink.css';
@import 'some-other-library/theme.css';
```

### Load your theme stylesheets

Use an Angular component to make the compiler pick up and compile the theme stylesheets.
The component must use `ViewEncapsulation.None` so the styles are global.

```typescript
@Component({
  selector: 'app-themes',
  template: '', // no template needed
  styleUrls: [
    'assets/themes/theme-a.scss',
    'assets/themes/theme-b.scss',
    'assets/themes/theme-c.scss',
  ], // load all theme stylesheets here
  encapsulation: ViewEncapsulation.None, // make the styles global
})
export class AppThemesComponent {
  /* no implementation needed */
}
```

Import and render this component near the root of the application so theme styles are available throughout the application.

```typescript
@Component({
  selector: 'app-root',
  template: `
    <app-themes></app-themes>

    <!-- your app template here -->
  `,
  imports: [AppThemesComponent],
})
export class AppComponent { ... }
```

### Implement your theme-picker component

The package intentionally does not prescribe the appearance of a theme picker.
It exposes the registered themes, the current theme and a method for changing the selection.

Assuming an application provides an `app-theme-picker` component, it can be connected to `ThemeService` as follows:

```typescript
@Component({
  selector: 'app-root',
  imports: [AppThemePickerComponent],
  template: `
    <app-theme-picker
      [themes]="themeService.themes()"
      [currentTheme]="themeService.currentTheme()"
      (selectionChanged)="themeService.selectTheme($event)"
    />
  `,
})
export class AppComponent {
  readonly themeService = inject(ThemeService);
}
```

`selectTheme()` accepts a registered theme ID. Passing `null` clears the current in-memory selection.
Unknown theme IDs are ignored once themes have been registered.

### Signals and Observables

Signals are the preferred API for current Angular applications.

| State             | Signal API                    | Observable compatibility API |
| ----------------- | ----------------------------- | ---------------------------- |
| Registered themes | `themeService.themes()`       | `themeService.themes$`       |
| Current theme ID  | `themeService.currentTheme()` | `themeService.currentTheme$` |

The Observable APIs remain available for applications that use RxJS-based state handling or the `async` pipe.

```typescript
@Component({
  selector: 'app-current-theme',
  imports: [AsyncPipe],
  template: `Current theme: {{ themeService.currentTheme$ | async }}`,
})
export class CurrentThemeComponent {
  readonly themeService = inject(ThemeService);
}
```

### Initial theme selection

After the first themes have been discovered, the initial selection is resolved in this order:

| Priority | Source                                                   |
| -------- | -------------------------------------------------------- |
| 1        | Valid theme ID from the configured URL query parameter   |
| 2        | Valid theme ID from the configured browser storage entry |
| 3        | Theme annotated with `@@default`                         |
| 4        | First registered theme                                   |

Unknown route or storage values are ignored. If no themes are registered, the current theme remains `null`.

### Configure synchronization

By default, the selected theme is synchronized with:

| Integration         | Default value                     |
| ------------------- | --------------------------------- |
| Browser storage key | `ngx-theme-manager/current-theme` |
| URL query parameter | `theme`                           |

Both integrations are optional. Angular Router itself is also optional;
applications without Router can use the package without additional configuration.

Use `provideThemeManager()` to customize the storage key and query parameter:

```typescript
import { ApplicationConfig } from '@angular/core';
import { provideThemeManager } from '@rb-mwindh/ngx-theme-manager';

export const appConfig: ApplicationConfig = {
  providers: [
    provideThemeManager({
      storageKey: 'my-application/current-theme',
      queryParam: 'app-theme',
    }),
  ],
};
```

To disable either integration, provide `null` or an empty string:

```typescript
import { ApplicationConfig } from '@angular/core';
import { provideThemeManager } from '@rb-mwindh/ngx-theme-manager';

export const appConfig: ApplicationConfig = {
  providers: [
    provideThemeManager({
      storageKey: '',
      queryParam: null,
    }),
  ],
};
```

Only specify the options you want to customize. All omitted options retain their default values.

## Migrating to the signal-based API

The signal-based state API can replace template subscriptions
without requiring a breaking migration. The Observable APIs remain supported.

| Previous Observable usage             | Preferred signal usage        |
| ------------------------------------- | ----------------------------- |
| `themeService.themes$ \| async`       | `themeService.themes()`       |
| `themeService.currentTheme$ \| async` | `themeService.currentTheme()` |

The `Theme` interface now exposes immutable metadata.
Construct theme metadata as readonly data and replace objects
instead of mutating individual properties.

```typescript
import { Theme } from '@rb-mwindh/ngx-theme-manager';

const darkTheme: Theme = {
  id: 'dark',
  displayName: 'Dark',
  description: 'Dark application theme',
  defaultTheme: true,
};
```

The demo application uses standalone APIs and signals,
but the library does not require a specific application bootstrap style.

## Building and Testing

This repository requires one of the supported Node.js versions
listed in the [compatibility table](#compatibility).

1. Clone the repository

```shell
git clone https://github.com/rb-mwindh/ngx-theme-manager.git <workspace>
cd <workspace>
```

2. Install the dependencies

```shell
npm ci
```

`npm ci` installs the exact dependency versions recorded in `package-lock.json`.
This is the recommended way to install dependencies for development and testing.

During installation, npm automatically runs the `prepare` script, which configures
the repository's Husky Git hooks. No separate initialization command is required.

3. Run the demo app

```shell
npm run start
```

4. Build the library

```shell
npm run build
```

5. Run the local validation pipeline:

```shell
npm run typecheck
npm run lint
npm run test
```

## Contribution Guidelines

Thank you for your interest in contributing to this library.

Please read the [Contribution Guidelines](CONTRIBUTING.md)

## Get help

Please check my [wiki::faq] and [wiki::troubleshooting] wiki page first.

If this doesn't answer your question, you may [post a question][issue::question] to the issue tracker.

## About

### Maintainers

- [Markus Windhager](https://github.com/rb-mwindh)

### Contributors

<!--
Consider listing contributors in this section to give explicit credit.
You could also ask contributors to add themselves in this file on their own.
-->

- none ;(

### 3rd Party Licenses

<!--
The `<bom></bom>` tags will be processed by `tools/oss-bom.ts` as a pre-commit hook.
-->

<bom>

| Name | License | Type |
| --- | --- | --- |
| [@angular/animations](https://github.com/angular/angular) | [MIT](https://spdx.org/licenses/MIT.html) | Dependency |
| [@angular/cdk](https://github.com/angular/components) | [MIT](https://spdx.org/licenses/MIT.html) | Dependency |
| [@angular/common](https://github.com/angular/angular) | [MIT](https://spdx.org/licenses/MIT.html) | Dependency |
| [@angular/compiler](https://github.com/angular/angular) | [MIT](https://spdx.org/licenses/MIT.html) | Dependency |
| [@angular/core](https://github.com/angular/angular) | [MIT](https://spdx.org/licenses/MIT.html) | Dependency |
| [@angular/forms](https://github.com/angular/angular) | [MIT](https://spdx.org/licenses/MIT.html) | Dependency |
| [@angular/platform-browser](https://github.com/angular/angular) | [MIT](https://spdx.org/licenses/MIT.html) | Dependency |
| [@angular/platform-browser-dynamic](https://github.com/angular/angular) | [MIT](https://spdx.org/licenses/MIT.html) | Dependency |
| [@angular/router](https://github.com/angular/angular) | [MIT](https://spdx.org/licenses/MIT.html) | Dependency |
| [@standard-schema/spec](https://github.com/standard-schema/standard-schema) | [MIT](https://spdx.org/licenses/MIT.html) | Dependency |
| [entities](https://github.com/fb55/entities) | [BSD-2-Clause](https://spdx.org/licenses/BSD-2-Clause.html) | Dependency |
| [material-icons](https://github.com/marella/material-icons) | [Apache-2.0](https://spdx.org/licenses/Apache-2.0.html) | Dependency |
| [ngx-theme-manager](https://github.com/rb-mwindh/ngx-theme-manager) | [MIT](https://spdx.org/licenses/MIT.html) | Dependency |
| [parse5](https://github.com/inikulin/parse5) | [MIT](https://spdx.org/licenses/MIT.html) | Dependency |
| [rxjs](https://github.com/reactivex/rxjs) | [Apache-2.0](https://spdx.org/licenses/Apache-2.0.html) | Dependency |
| [tslib](https://github.com/Microsoft/tslib) | [0BSD](https://spdx.org/licenses/0BSD.html) | Dependency |
| [zone.js](https://github.com/angular/angular) | [MIT](https://spdx.org/licenses/MIT.html) | Dependency |

</bom>

### License

![License](https://badgen.net/github/license/rb-mwindh/ngx-theme-manager)

[wiki::faq]: https://github.com/rb-mwindh/ngx-theme-manager/wiki/FAQ
[wiki::troubleshooting]: https://github.com/rb-mwindh/ngx-theme-manager/wiki/Troubleshooting
[issue::question]: https://github.com/rb-mwindh/ngx-theme-manager/issues/new?template=question.md&title=❓%20
[license]: https://badgen.net/github/license/rb-mwindh/ngx-theme-manager
[selfhtml:media]: https://wiki.selfhtml.org/wiki/HTML/Attribute/media
[known-annotations]: #known-annotations
[sass-comments]: https://sass-lang.com/documentation/syntax/comments
