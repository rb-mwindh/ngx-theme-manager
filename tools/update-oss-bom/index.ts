/**
 * Updates the third-party license BOM in README.md.
 *
 * Why `license-checker` instead of `npm sbom`?
 * `npm sbom --omit=dev` did not reliably include all production/runtime
 * dependencies for this Angular library setup. In particular, some direct
 * Angular dependencies were missing from the generated SPDX document.
 *
 * Therefore, this script intentionally uses `license-checker --production` and
 * only converts its JSON output into the README Markdown table.
 */

import { spawn } from "child_process";
import fs from "node:fs";
import path from "node:path";
import { catchError, from, map, tap, throwError } from "rxjs";
import { ansi } from "../colors";
import { Column, LicenseCheckerResult, mdTable, normalizeDependencies } from "./utilities";

const readmeFile = path.resolve('README.md');

const columns: Column[] = [
  { field: 'name', label: 'Name' },
  { field: 'licenses', label: 'License' },
  { field: () => 'Dependency', label: 'Type' },
];

const RX_BOM = /^<bom>[\s\S]*?<\/bom>|^<bom\/>/m;

/**
 * Generates a BOM (Bill of Materials) for the production dependencies
 * of this Angular library using `license-checker`.
 *
 * @returns A promise that resolves with the license-checker result.
 */
function createBom(): Promise<LicenseCheckerResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(
      'npm',
      ['exec', 'license-checker', '--', '--production', '--json'],
      {
        cwd: process.cwd(),
        shell: true,
        stdio: ['ignore', 'pipe', 'pipe'],
      },
    );

    let stdout = '';
    let stderr = '';

    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');

    child.stdout.on('data', (chunk) => {
      stdout += chunk;
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk;
    });

    child.on('error', (err) => {
      reject(err);
    });

    child.on('close', (code) => {
      if (code !== 0) {
        reject(
          new Error(
            `license-checker failed with exit code ${code}.${
              stderr ? `\n\n${stderr}` : ''
            }`,
          ),
        );
        return;
      }

      try {
        resolve(JSON.parse(stdout));
      } catch {
        reject(
          new Error(
            `Failed to parse license-checker output as JSON.${
              stdout ? `\n\nOutput:\n${stdout}` : ''
            }`,
          ),
        );
      }
    });
  });
}

/**
 * Replaces the existing `<bom>...</bom>` block in the README
 * content with the newly generated BOM Markdown content.
 *
 * @param readme
 * @param bom
 */
function replaceBom(readme: string, bom: string): string {
  if (!RX_BOM.test(readme)) {
    throw new Error('Could not find <bom>...</bom> block in README.md.');
  }

  return readme.replace(RX_BOM, `<bom>\n\n${bom}\n\n</bom>`);
}

from(createBom())
  .pipe(
    map((bom) => normalizeDependencies(bom)),
    map((dependencies) => mdTable(dependencies, columns)),
    map((bom) => ({
      bom,
      readme: fs.readFileSync(readmeFile, 'utf8'),
    })),
    map(({ bom, readme }) => replaceBom(readme, bom)),
    tap((readme) => fs.writeFileSync(readmeFile, readme, 'utf8')),
    catchError((err) => throwError(() => err)),
  )
  .subscribe({
    error: (err) => {
      console.log(
        ansi.error`Failed to update BOM in %s\n`,
        ansi.path`${readmeFile}`,
        err,
      );
      process.exit(-1);
    },
    next: () => {
      console.log(
        ansi.success`Successfully updated BOM in %s`,
        ansi.path`${readmeFile}`,
      );
      console.log(
        ansi.reminder`\nDon't forget to commit your changes!\n`
      );
    },
  });
