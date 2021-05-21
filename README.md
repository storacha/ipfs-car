# ipfs-car 🚘✨⬢

> Convert files to content-addressable archives (.car) and back

## Description

`ipfs-car` is a library and CLI tool to pack & unpack files from [Content Addressable aRchives (CAR)](https://github.com/ipld/specs/blob/master/block-layer/content-addressable-archives.md) file. A thin wrapper over [@ipld/car](https://github.com/ipld/js-car) and [unix-fs](https://github.com/ipfs/js-ipfs-unixfs).

Content-addressable archives store data as blocks (a sequence of bytes) each prefixed with the [Content ID (CID)](https://docs.ipfs.io/concepts/content-addressing/) derived from the hash of the data; typically in a file with a `.car` extension.

Use `ipfs-car` to pack your files into a .car; a portable, verifiable, IPFS compatible archive.

```sh
$ ipfs-car --pack path/to/files --output my-files.car
```

or unpack files from a .car, and verify that every block matches it's CID

```sh
$ ipfs-car --unpack my-files.car --output path/to/write/to
```

## Install

```sh
# install it as a dependency
$ npm i ipfs-car

# or use the cli without installing via `npx`
$ npx ipfs-car --help
```

## Usage

`--pack` files into a .car

```sh
# write a content addressed archive to the current working dir.
$ ipfs-car --pack path/to/file/or/dir

# specify the car file name.
$ ipfs-car --pack path/to/files --output path/to/write/a.car
```

`--unpack` files from a .car

```sh
# unpack files to a specific path.
$ ipfs-car --unpack path/to/my.car --output /path/to/unpack/files/to

# unpack specific roots
$ ipfs-car --unpack path/to/my.car --root <cid1> [--root <cid2>]

# unpack files from a .car on stdin.
$ cat path/to/my.car | ipfs-car --unpack
```

List the contents of a .car

```sh
# list the files.
$ ipfs-car --list path/to/my.ca

# list the cid roots.
$ ipfs-car --list-roots path/to/my.ca

# list the cids for all the blocks.
$ ipfs-car --list-cids path/to/my.ca
```

## API

Use `ipfs-car/to-car` for functions to pack files into content-addressable archives
Use `ipfs-car/from-car` for functions to unpack content-addressable archives to files

### `packFileToCarFs`

Take a path on disk and write it to car file

```js
import { packFileToCarFs } from 'ipfs-car/to-car'

await packFileToCarFs({
  input: `${process.cwd()}/path/to/files`,
  output: `${process.cwd()}/output.car`
})
// output.car file now exists in process.cwd()
```

### `unpackCarToFs`

Take a path to a car file on disk and unpack it to a given path

```js
import { unpackCarToFs } from 'ipfs-car/from-car'

await unpackCarToFs({
  input: `${process.cwd()}/my.car`,
  output: `${process.cwd()}/foo`
})
// foo now exists in process.cwd()
// it is either a file or a directory depending on the contents of the .car
```
