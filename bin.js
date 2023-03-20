#!/usr/bin/env node
import fs from 'fs'
import sade from 'sade'

const pkg = JSON.parse(fs.readFileSync(new URL('./package.json', import.meta.url)).toString())
const cli = sade(pkg.name)

cli
  .version(pkg.version)
  .example('pack path/to/file/or/dir')

cli
  .command('pack [file]')
  .alias('p')
  .describe('Pack files into a CAR.')
  .example('pack path/to/file/or/dir')
  .example('pack images --output images.car')
  .example('pack --no-wrap snow.mov > snow.mov.car')
  .option('-H, --hidden', 'Include paths that start with ".".', false)
  .option('--wrap', 'Wrap input files with a directory.', true)
  .option('-o, --output', 'Output file.')
  .action(createAction('./cmd/pack.js'))

cli
  .command('unpack [car]')
  .alias('un')
  .describe('Unpack files and directories from a CAR.')
  .option('--verify', 'Verify block hash consistency.', true)
  .option('-o, --output', 'Output file.')
  .option('-r, --root', 'Root CID to unpack.')
  .action(createAction('./cmd/unpack.js'))

cli
  .command('roots [car]')
  .describe('List root CIDs from a CAR.')
  .option('-i, --implicit', 'List roots found implicitly from the blocks contained within the CAR.', false)
  .action(createAction('./cmd/roots.js'))

cli
  .command('ls [car]')
  .alias('list', 'files')
  .describe('List files and directories from a CAR.')
  .option('-r, --root', 'Root CID to list files from.')
  .option('--verbose', 'Print file CIDs and byte sizes.')
  .action(createAction('./cmd/ls.js'))

cli
  .command('blocks [car]')
  .describe('List block CIDs from a CAR.')
  .action(createAction('./cmd/blocks.js'))

cli
  .command('hash [car]')
  .describe('Generate CID for a CAR.')
  .action(createAction('./cmd/hash.js'))

cli.parse(process.argv)

/** @param {string} modulePath */
function createAction (modulePath) {
  return async (...args) => {
    const module = await import(modulePath)
    return module.default(...args)
  }
}
