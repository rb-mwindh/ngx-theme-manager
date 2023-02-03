/*
 * Copyright 2022. (c) All rights by Robert Bosch GmbH.
 * We reserve all rights of disposal such as copying and passing on to third parties.
 */

import { init, InitOpts, ModuleInfo, ModuleInfos } from 'license-checker';
import licenseUrl from 'oss-license-name-to-url';
import { Observable } from 'rxjs';

export interface License {
  name: string;
  url: string | null;
}

export type Dependency = Omit<ModuleInfo, 'licenses'> & {
  name: string;
  licenses: License | License[] | undefined;
};

export interface Column {
  label?: string;
  field: keyof Dependency | ((dep?: Dependency) => string);
}

export class LicenseChecker extends Observable<ModuleInfos> {
  constructor(opts: InitOpts) {
    super((subscriber) => {
      init(opts, (err, ret) => {
        if (err) {
          subscriber.error(err);
        } else {
          subscriber.next(ret);
        }
        subscriber.complete();
      });
    });
  }
}

export function normalizeDependencies(deps: ModuleInfos): Dependency[] {
  return Object.keys(deps).map((dep) => {
    const atPos = dep.lastIndexOf('@');
    const name = dep.substring(0, atPos);
    const version = dep.substring(atPos + 1);
    return {
      ...deps[dep],
      name,
      version,
      licenses: resolveLicenses(deps[dep].licenses),
    };
  });
}

function resolveLicenses(
  licenses: string | string[] | undefined,
): License | License[] | undefined {
  if (!licenses) {
    return undefined;
  }
  if (Array.isArray(licenses)) {
    return licenses.map((name) => ({ name, url: licenseUrl(name) }));
  }
  return { name: licenses, url: licenseUrl(licenses) };
}

export function mdTable(
  dependencies: Dependency[],
  columns: Column[],
): string {
  const rows = new Array<string>();
  rows.push(
    columns
      .map((col) => col.label || col.field)
      .map((label) => (typeof label === 'string' ? () => label : label))
      .reduce((row, label) => `${row} ${label()} |`, '|'),
  );

  rows.push(columns.reduce((row) => `${row} --- |`, '|'));

  dependencies.forEach((dep) => rows.push(mdTableRow(dep, columns)));

  return rows.join('\n');
}

function mdTableRow(dep: Dependency, columns: Column[]): string {
  return columns
    .map((col) => col.field)
    .reduce((row, field) => {
      if (typeof field === 'function') {
        return `${row} ${field(dep)} |`;
      }

      switch (field) {
        case 'licenses':
          return `${row} ${getLicenseLinks(dep[field])} |`;
        case 'name':
          return `${row} ${mdLink(dep.name, dep.repository)} |`;
        default:
          return `${row} ${dep[field]} |`;
      }
    }, '|');
}

function getLicenseLinks(
  licenses: License | License[] | undefined,
): string {
  if (!licenses) {
    return '';
  }
  if (Array.isArray(licenses)) {
    const links = [];
    links.push(
      ...licenses.map((license) => mdLink(license.name, license.url)),
    );
    return links.join(', ');
  }
  return mdLink(licenses.name, licenses.url);
}

function mdLink(label: string, url?: string | null): string {
  return url ? `[${label}](${url})` : label;
}
