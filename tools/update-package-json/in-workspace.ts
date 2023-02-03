/*
 * Copyright 2022. (c) All rights by Robert Bosch GmbH.
 * We reserve all rights of disposal such as copying and passing on to third parties.
 */

import { copy } from './internal';

const files = {
  workspacePkg: '../../package.json',
  libraryPkg: '../../dist/ngx-theme-manager/package.json',
};

const workspacePkg = require(files.workspacePkg);
const libraryPkg = require(files.libraryPkg);

copy('version')
  .from(libraryPkg)
  .to(workspacePkg)
  .andWriteTo(files.workspacePkg);
