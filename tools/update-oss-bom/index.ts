/*
 * Copyright 2022. (c) All rights by Robert Bosch GmbH.
 * We reserve all rights of disposal such as copying and passing on to third parties.
 */

import { throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { Column, LicenseChecker, mdTable, normalizeDependencies, } from './utilities';

const fs = require('fs');
const path = require('path');
const colors = require('colors/safe');

const readmeFile = path.resolve('README.md');

const columns: Column[] = [
  { field: 'name', label: 'Name' },
  { field: 'licenses', label: 'License' },
  { field: () => 'Dependency', label: 'Type' },
];

const RX_BOM = /^<bom\w*\/>|^<bom>.*<\/bom>/gms;

new LicenseChecker({
  start: '.',
  json: true,
  direct: true,
  production: true,
  excludePrivatePackages: true,
})
  .pipe(
    map((moduleInfos) => normalizeDependencies(moduleInfos)),
    map((dependencies) => mdTable(dependencies, columns)),
    map((bom) => ({ bom, readme: fs.readFileSync(readmeFile, 'utf8') })),
    map(({ bom, readme }) =>
      readme.replace(RX_BOM, `<bom>\n\n${bom}\n\n</bom>`),
    ),
    tap((readme) => fs.writeFileSync(readmeFile, readme, 'utf8')),
    catchError((err) => throwError(err)),
  )
  .subscribe({
    error: (err) => {
      console.log(
        colors.red('Failed to update BOM in %s\n'),
        colors.blue(readmeFile),
        err,
      );
      process.exit(-1);
    },
    next: () => {
      console.log(
        colors.green('Successfully updated BOM in %s'),
        colors.blue(readmeFile),
      );
      console.log(
        colors.bgGray.brightCyan.bold(
          `\nDon't forget to commit your changes!\n`,
        ),
      );
    },
  });
