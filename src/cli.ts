#!/usr/bin/env node

import fs from 'fs'
import meow from 'meow'
import { fromCarIterable } from './'

const options = {
  flags: {
    output: {
      type: 'string',
      alias: 'o'
    }
  }
} as const;

const cli = meow(`
  Usage
  $ ipfs-car <cid>
`, options)

async function main () {
  const inStream = fs.createReadStream(`${__dirname}/../test/fixtures/raw.car`)

  await fromCarIterable(inStream)
}

main()
