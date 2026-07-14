import { copy } from "./internal";

const files = {
  workspacePkg: '../../package.json',
  libraryPkg: '../../dist/ngx-theme-manager/package.json',
};

const workspacePkg = require(files.workspacePkg);
const libraryPkg = require(files.libraryPkg);

const keys: (keyof typeof workspacePkg)[] = [
  'description',
  'keywords',
  'license',
  'author',
  'maintainers',
  'contributors',
  'homepage',
  'bugs',
  'repository',
  'publishConfig',
  'engines',
];

copy(...keys)
  .from(workspacePkg)
  .to(libraryPkg)
  .andWriteTo(files.libraryPkg);
