import { copy } from "./internal";

const files = {
  projectPkg: '../../projects/ngx-theme-manager/package.json',
  distPkg: '../../dist/ngx-theme-manager/package.json',
};

const projectPkg = require(files.projectPkg);
const distPkg = require(files.distPkg);

copy('version').from(distPkg).to(projectPkg).andWriteTo(files.projectPkg);
