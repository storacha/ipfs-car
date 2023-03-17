# ipfs-car 🚘✨⬢

> Convert files to content-addressable archives (.car) and back

[![Build](https://github.com/web3-storage/ipfs-car/actions/workflows/main.yml/badge.svg)](https://github.com/web3-storage/ipfs-car/actions/workflows/main.yml)
[![dependencies Status](https://status.david-dm.org/gh/web3-storage/ipfs-car.svg)](https://david-dm.org/web3-storage/ipfs-car)
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)
[![Downloads](https://img.shields.io/npm/dm/ipfs-car.svg)](https://www.npmjs.com/package/ipfs-car)
[![Minzipped size](https://badgen.net/bundlephobia/minzip/ipfs-car)](https://bundlephobia.com/result?p=ipfs-car)

## Description

`ipfs-car` is a library and CLI tool to pack & unpack files from [Content Addressable aRchives (CAR)](https://ipld.io/specs/transport/car/) file. A thin wrapper over [@ipld/car](https://github.com/ipld/js-car) and [unix-fs](https://github.com/ipfs/js-ipfs-unixfs).

Content-addressable archives store data as blocks (a sequence of bytes) each prefixed with the [Content ID (CID)](https://docs.ipfs.tech/concepts/content-addressing/) derived from the hash of the data; typically in a file with a `.car` extension.

Use `ipfs-car` to pack your files into a .car; a portable, verifiable, IPFS compatible archive.

```sh
$ ipfs-car pack path/to/files --output my-files.car
```

or unpack files from a .car, and verify that every block matches it's CID

```sh
$ ipfs-car unpack my-files.car --output path/to/write/to
```

Fetch and locally verify files from a IPFS gateway over http

```sh
curl "https://ipfs.io/ipfs/bafybeidd2gyhagleh47qeg77xqndy2qy3yzn4vkxmk775bg2t5lpuy7pcu?format=car" | ipfs-car unpack
```

## Install

```sh
# install it as a dependency
$ npm i ipfs-car

# OR use the cli without installing via `npx`
$ npx ipfs-car --help
```

## Usage

Pack files into a .car

```sh
# write a content addressed archive to stdout.
$ ipfs-car pack path/to/file/or/dir
# note: CAR data streamed to stdout will not have roots set in CAR header!

# specify the car file name.
$ ipfs-car pack path/to/files --output path/to/write/a.car

# by default, ipfs-car will wrap files in an IPFS directory.
# use --no-wrap to avoid this.
$ ipfs-car pack path/to/file --no-wrap --output path/to/write/a.car
```

Unpack files from a .car

```sh
# unpack files to a specific path.
$ ipfs-car unpack path/to/my.car --output /path/to/unpack/files/to

# unpack a specific root.
$ ipfs-car unpack path/to/my.car --root <cid1>

# unpack files from a .car on stdin.
$ cat path/to/my.car | ipfs-car unpack
```

Show the files and directories in a .car

```sh
# show the files and directories.
$ ipfs-car ls path/to/my.car

# show the files and directories, their CIDs and byte sizes.
$ ipfs-car ls path/to/my.car --verbose
```

Show the root CIDs in a .car

```sh
# show the CID roots found in the CAR header.
$ ipfs-car roots path/to/my.car

# show the CID roots found implicitly from the blocks in the file.
$ ipfs-car roots --implicit path/to/my.car
```

Show the block CIDs in a .car

```sh
# show the CIDs for all the blocks.
$ ipfs-car blocks path/to/my.car
```

Get other information about a CAR

```sh
# generate CID for a CAR.
$ ipfs-car hash path/to/my.car
```

## API

To pack files into content-addressable archives, you can use the following:

- `createFileEncoderStream` a factory function for creating a `ReadbaleStream` that encodes a single file into DAG `Block`s.
- `createDirectoryEncoderStream` a factory function for creating a `ReadbleStream` for encoding a directory of files into DAG `Block`s.
- `CAREncoderStream` a `TransformStream` sub-class that you can write `Block`s to and read `Uint8Array` CAR file data from.

To unpack content-addressable archives to files, you should use `@ipld/car` and `ipfs-unixfs-exporter` modules.

### Examples

#### Basic single file pack

```js
import { createFileEncoderStream, CAREncoderStream } from 'ipfs-car'

const file = new Blob(['Hello ipfs-car!'])
const carStream = createFileEncoderStream(file).pipeThrough(new CAREncoderStream())

// carStream.pipeTo(somewhereWritable)
```

#### Directory pack to file system in Node.js

```js
import { Writable } from 'stream'
import { createDirectoryEncoderStream, CAREncoderStream } from 'ipfs-car'
import { filesFromPaths } from 'files-from-path'

const files = await filesFromPaths(process.argv.slice(2))

await createDirectoryEncoderStream(files)
  .pipeThrough(new CAREncoderStream())
  .pipeTo(Writable.toWeb(process.stdout))
```

Usage: `node script.js file0 file1 dir0 > my.car`.

## Contributing

Feel free to join in. All welcome. [Open an issue](https://github.com/web3-storage/ipfs-car/issues)!

## License

Dual-licensed under [MIT + Apache 2.0](https://github.com/web3-storage/ipfs-car/blob/main/LICENSE.md)
