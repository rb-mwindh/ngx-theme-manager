# ngx-theme-manager

`@rb-mwindh/ngx-theme-manager` provides the basics tools for a robust theme-switcher implementation.

This package does not provide ready-made visual components,
but only supports their implementation by providing the necessary services and tools.

---
![License](https://badgen.net/github/license/rb-mwindh/ngx-theme-manager)
![latest release](https://badgen.net/github/release/rb-mwindh/ngx-theme-manager)
![open issues](https://badgen.net/github/open-issues/rb-mwindh/ngx-theme-manager)
---

## Table of Contents <!-- omit in toc -->

- [How it works](#how-it-works)
- [Getting Started](#getting-started)
- [Building and Testing](#building-and-testing)
- [Contribution Guidelines](#contribution-guidelines)
- [Get help](#get-help)
- [About](#about)
  - [Maintainers](#maintainers)
  - [Contributors](#contributors)
  - [3rd Party Licenses](#3rd-party-licenses)
  - [Used Encryption](#used-encryption)
  - [License](#license)

## How it works

This implementation is based on the regular way Angular loads styles for components.
Since theme styles are usually global styles, theme components will normally use `ViewEncapsulation.None`.

Since Angular does not provide a direct way to access the `<style>` element associated with a component,
the `@rb-mwindh/ngx-theme-manager` applies a little trick:
Style elements provided as themes should carry annotations in the form of [predefined CSS comments](#known-annotations).
These annotations are searched throughout all `<style>` elements of the application using regular expressions
and are registered in the theme registry. Also, an additional attribute (`data-theme="<id>"`) is added to the
corresponding style elements, which is used as a query selector.

Hereafter, the ThemeService leverages the [`media` attribute][selfhtml:media] to enable or disable the styles of a theme.
For inactive themes, the `media="none"` attribute is added to the associated `<style>` element. For active themes,
the `media` attribute of the associated `<style>` element is simply removed again.

## Getting Started

### Install the package

```shell
npm install ngx-theme-manager --save
```

### Implement your theme stylesheets

`@rb-mwindh/ngx-theme-manager` identifies your stylesheets (css/scss/...) as themes through annotations
in css comments. To prevent your annotations from being disposed at build time
by minification, you should use the css comment format `/*! ... */`.

> ... By default, multi-line comments be stripped from the compiled CSS
> in compressed mode. **If a comment begins with /*!, though, it will
> always be included in the CSS output.** ...
> 
> _from https://sass-lang.com/documentation/syntax/comments_

Known annotations are:
- `@@id` - required, any character until end-of-line
- `@@displayName` - optional, defaults to `<@@id>`, any character until end-of-line
- `@@description` - optional, any character until end-of-line
- `@@default` - optional, no value, value is `true` when given, or `false` when omitted

```scss
/*!
 * @@id my-theme-id
 * @@displayName My Fantastic Theme
 * @@description This is my fantastic theme with magic colors
 * @@default
 */

// add all your theme styles below this line, e.g.
@import "@angular/material/prebuilt-themes/indigo-pink.css";
@import "some-other-library/theme.css";
```

### Loading your theme stylesheets

By using an Angular component to load your stylesheets, you make the
Angular compiler pick up and compile your stylesheets automatically.

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
export class AppThemesComponent { /* no implementation needed */ }
```

This way, loading the theme stylesheets is easily done by using
your AppThemesComponent, preferably at the top of your AppComponent.

```typescript
@Component({
  selector: 'app-root',
  template: `
    <app-themes></app-themes>
    
    <!-- you app template here -->
  `,
})
export class AppComponent() { ... }
```

### Implement your theme-picker component

The desired look-and-feel of your visual theme-picker component usually is very
specific for the respective project. Thus, I've decided not to implement any
visual stuff, but instead provide you with the required data.

Assuming, you've implemented a theme picker component named `app-theme-picker`,
you would provide it with the available themes, the current theme and a
theme selection callback like this:

```typescript
@Component({
  selector: 'app-root',
  template: `
    <app-theme-picker
      [themes]="themeService.themes$ | async"
      [currentTheme]="themeService.currentTheme$ | async"
      (select)="themeService.selectTheme($event)"
    ></app-theme-picker>
    
    <!-- you app template here -->
  `,
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  constructor(public readonly themeService: ThemeService) {
  }
}
```

## Building and Testing

1. Clone the repository

```shell
git clone https://github.com/rb-mwindh/ngx-theme-manager.git <workspace>
cd <workspace>
```

2. Initialize the workspace

The `init` script installs all dependencies and sets up the pre-commit hooks.

**This is mandatory to guarantee the code style and quality!**

```shell
npm run init
```

3. Run the demo app

```shell
npm run start
```

4. Build the library

```shell
npm run build
```

5. Run the unit tests

```shell
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
| [@angular/animations](https://github.com/angular/angular) | [MIT](http://opensource.org/licenses/MIT) | Dependency |
| [@angular/cdk](https://github.com/angular/components) | [MIT](http://opensource.org/licenses/MIT) | Dependency |
| [@angular/common](https://github.com/angular/angular) | [MIT](http://opensource.org/licenses/MIT) | Dependency |
| [@angular/compiler](https://github.com/angular/angular) | [MIT](http://opensource.org/licenses/MIT) | Dependency |
| [@angular/core](https://github.com/angular/angular) | [MIT](http://opensource.org/licenses/MIT) | Dependency |
| [@angular/forms](https://github.com/angular/angular) | [MIT](http://opensource.org/licenses/MIT) | Dependency |
| [@angular/platform-browser-dynamic](https://github.com/angular/angular) | [MIT](http://opensource.org/licenses/MIT) | Dependency |
| [@angular/platform-browser](https://github.com/angular/angular) | [MIT](http://opensource.org/licenses/MIT) | Dependency |
| [@angular/router](https://github.com/angular/angular) | [MIT](http://opensource.org/licenses/MIT) | Dependency |
| [material-icons](https://github.com/marella/material-icons) | [Apache-2.0](http://opensource.org/licenses/Apache-2.0) | Dependency |
| [ngx-theme-manager](https://github.com/rb-mwindh/ngx-theme-manager) | [MIT](http://opensource.org/licenses/MIT) | Dependency |
| [parse5](https://github.com/inikulin/parse5) | [MIT](http://opensource.org/licenses/MIT) | Dependency |
| [rxjs](https://github.com/reactivex/rxjs) | [Apache-2.0](http://opensource.org/licenses/Apache-2.0) | Dependency |
| [tslib](https://github.com/Microsoft/tslib) | 0BSD | Dependency |
| [zone.js](https://github.com/angular/angular) | [MIT](http://opensource.org/licenses/MIT) | Dependency |

</bom>

### License

![License](https://badgen.net/github/license/rb-mwindh/ngx-theme-manager)


[wiki::faq]: https://github.com/rb-mwindh/ngx-theme-manager/wiki/FAQ

[wiki::troubleshooting]: https://github.com/rb-mwindh/ngx-theme-manager/wiki/Troubleshooting

[issue::question]: https://github.com/rb-mwindh/ngx-theme-manager/issues/new?template=question.md&title=❓%20

[license]: https://badgen.net/github/license/rb-mwindh/ngx-theme-manager



[selfhtml:media]: https://wiki.selfhtml.org/wiki/HTML/Attribute/media

[known-annotations]: #known-annotations
