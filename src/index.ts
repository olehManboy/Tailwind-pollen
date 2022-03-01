#!/usr/bin/env node
import { program } from 'commander';
import { cosmiconfig } from 'cosmiconfig';
import fs from 'fs';
import mapObject, { mapObjectSkip } from 'map-obj';
import path from 'path';
import { ConfigObject, PollenModule } from './types';
import { formatModule } from './lib/formatModule';
import { toCSS } from './lib/toCSS';
import modules from './modules';
import { toJSON } from './lib/toJSON';

const DEFAULTS = {
  ...Object.keys(modules).reduce((acc, cur) => ({ ...acc, [cur]: true }), {})
};

program
  .option('-o, --output <path>', 'output file path')
  .option('-c, --config <path>', 'config file path');
program.parse(process.argv);

function parseOutputConfig(output: ConfigObject['output']) {
  if (!output) {
    return { css: undefined, schema: undefined };
  }
  if (typeof output === 'string') {
    return { css: output, schema: undefined };
  }
  return output;
}

(async () => {
  const cliOpts = program.opts();
  const cosmic = cosmiconfig('pollen');
  const configResults = cliOpts?.config
    ? await cosmic.load(cliOpts.config)
    : await cosmic.search();
  const config: ConfigObject =
    typeof configResults?.config === 'function'
      ? configResults.config(modules)
      : configResults?.config;
  const { css = './pollen.css', schema } = parseOutputConfig(cliOpts?.output || config?.output)
  const cssMap = mapObject({ ...DEFAULTS, ...config?.modules }, (key, val) => {
      if (!val) {
        return mapObjectSkip;
      }
      return typeof val === 'boolean'
        ? [key, modules[key as keyof typeof modules]]
        : ([key, val] as any);
    }) as PollenModule;

  fs.writeFileSync(
    path.resolve(process.cwd(), css),
    `/**
* THIS IS AN AUTO-GENERATED FILE
* Edit Pollen config to update
*/
:root ${toCSS(formatModule(cssMap))}`
  );

  if (schema) {
    fs.writeFileSync(
      path.resolve(process.cwd(), schema),
      toJSON(modules as Record<string, any>)
    );
  }
})();
