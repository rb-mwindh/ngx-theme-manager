import fs from "fs";
import path from "path";
import { ansi } from "../colors";

export function copy<K extends string | number | symbol>(...keys: K[]) {
  keys = keys || [];
  keys = Array.isArray(keys) ? keys : [keys];

  return {
    from: (src: any) => ({
      to: (target: any) => {
        if (src && target) {
          keys
            .filter((key) => !!src[key])
            .forEach((key) => {
              target[key] = src[key];
            });
        }
        return {
          andWriteTo: (filename: string) => {
            const resolved = path.resolve(__dirname, filename);
            try {
              fs.writeFileSync(resolved, JSON.stringify(target, null, 2));
              console.log(
                ansi.success`Successfully updated %s\nwith keys: %s\n`,
                ansi.path`${resolved}`,
                ansi.path`${keys.join(', ')}`,
              );
            } catch (err) {
              console.log(
                ansi.error`Failed to update %s\n%o`,
                ansi.path`${resolved}`,
                err,
              );
              process.exit(-1);
            }
          },
        };
      },
    }),
  };
}
