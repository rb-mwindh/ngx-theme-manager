/*
 * Copyright 2022. (c) All rights by Robert Bosch GmbH.
 * We reserve all rights of disposal such as copying and passing on to third parties.
 */

const fs = require('fs');
const path = require('path');
const colors = require('colors/safe');

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
                colors.green(`Successfully updated %s\nwith keys: %s\n`),
                colors.blue(resolved),
                colors.blue(keys.join(', ')),
              );
            } catch (err) {
              console.log(
                colors.red(`Failed to update %s\n%o`),
                colors.blue(resolved),
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
