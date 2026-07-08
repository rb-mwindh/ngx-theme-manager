export interface License {
  name: string;
  url: string | null;
}

export interface Dependency {
  name: string;
  version?: string;
  repository?: string;
  licenses: License | License[] | undefined;
}

export interface Column {
  label?: string;
  field: keyof Dependency | ((dep?: Dependency) => string);
}

export interface LicenseCheckerResult {
  [key: string]: {
    licenses?: string | string[];
    repository?: string;
  };
}

export function normalizeDependencies(
  result: LicenseCheckerResult,
): Dependency[] {
  return Object.entries(result)
    .map(([key, value]) => {
      const at = key.lastIndexOf('@');

      return {
        name: key.substring(0, at),
        version: key.substring(at + 1),
        repository: value.repository,
        licenses: normalizeLicenses(value.licenses),
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

function normalizeLicenses(
  licenses?: string | string[],
): License | License[] | undefined {
  if (!licenses) {
    return undefined;
  }

  if (Array.isArray(licenses)) {
    return licenses.map((license) => ({
      name: license,
      url: getSpdxLicenseUrl(license),
    }));
  }

  return {
    name: licenses,
    url: getSpdxLicenseUrl(licenses),
  };
}

function getSpdxLicenseUrl(license: string): string | null {
  if (!isSimpleLicenseId(license)) {
    return null;
  }

  return `https://spdx.org/licenses/${license}.html`;
}

function isSimpleLicenseId(license: string): boolean {
  return /^[A-Za-z0-9-.+]+$/.test(license);
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
          return `${row} ${dep[field] ?? ''} |`;
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
    return licenses
      .map((license) => mdLink(license.name, license.url))
      .join(', ');
  }

  return mdLink(licenses.name, licenses.url);
}

function mdLink(label: string, url?: string | null): string {
  return url ? `[${label}](${url})` : label;
}
