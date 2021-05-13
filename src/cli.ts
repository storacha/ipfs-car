#!/usr/bin/env node

import meow from 'meow'
import { unpackCarToFs, listFilesInCar, listCidsInCar } from './from-car.js'

const options = {
  flags: {
    output: {
      type: 'string',
      alias: 'o',
    },
    pack: {
      type: 'string',
      alias: 'p'
    },
    unpack: {
      type: 'string',
      alias: 'u',
    },
    list: {
      type: 'string',
      alias: 'l',
    },
    listCids: {
      type: 'string'
    }
  }
} as const;

const cli = meow(`
  Content Addressable archives (CAR) store IPLD block data as a sequence of bytes;
  typically in a file with a .car extension. The CAR format is a serialized 
  representation of any IPLD DAG (graph) as the concatenation of its blocks, plus 
  a header that describes the graphs in the file (via root CIDs).

  See: https://github.com/ipld/specs/blob/master/block-layer/content-addressable-archives.md

  --pack files into a .car
  or
  --unpack files from a .car
  
  Usage:
    # pack files into a .car
    $ ipfs-car --pack path/to/file/or/dir

    # pack files into a car and specify the car file name
    $ ipfs-car --pack path/to/files --output path/to/write/a.car

    # unpack files from a .car 
    $ ipfs-car --unpack path/to/my.car

    # unpack files from a .car to a specific file path
    $ ipfs-car --unpack path/to/my.car --output /path/to/unpack/files/to

    # list cids in a .car
    $ ipfs-car --list-cids path/to/my.ca

    # list files in a .car
    $ ipfs-car --list path/to/my.ca

`, options)

interface Flags {
  output?: string,
  pack?: string,
  unpack?: string,
  list?: string,
  listCids?: string
}

async function handleInput ({flags}: { flags: Flags}) {
  if (flags.pack) {
    console.log('TODO! pack files into a .car')
    // await fsToCar({input: flags.pack, output: flags.output})

  } else if (flags.unpack) {
    await unpackCarToFs({input: flags.unpack, output: flags.output})

  } else if (flags.list) {
    await listFilesInCar({input: flags.list})

  } else if (flags.listCids) {
    await listCidsInCar({input: flags.listCids})

  } else {
    cli.showHelp()
    throw new Error('--pack or --unpack flag required')
  }
}

handleInput(cli)
