# ipfs-car 🚗⬢

> The @ipld/car with the UnixFS representation.

## Description

`ipfs-car` is a library and CLI tool that brings together `@ipld/car` and `unixfs`. It enables transforming a [Content Addressable aRchive (CAR)](https://github.com/ipld/specs/blob/master/block-layer/content-addressable-archives.md) file into an IPFS's [UnixFS](https://github.com/ipfs/specs/blob/master/UNIXFS.md) format, and the opposite.

Content Addressable archives (CAR) store IPLD block data as a sequence of bytes; typically in a file with a .car extension. The CAR format is a serialized  representation of any IPLD DAG (graph) as the concatenation of its blocks, plus a header that describes the graphs in the file (via root CIDs).

## Install

```sh
$ npm i ipfs-car
```

## Usage

### CLI

#### Packing files into a .car

```sh
# write a content addressed archive to the current working dir.
$ ipfs-car --pack path/to/file/or/dir

# specify the car file name.
$ ipfs-car --pack path/to/files --output path/to/write/a.car
```

#### Unpacking files from a .car

```sh
# write 1 or more files to the current working dir.
$ ipfs-car --unpack path/to/my.car

# unpack files to a specific path.
$ ipfs-car --unpack path/to/my.car --output /path/to/unpack/files/to

# unpack specific roots
$ ipfs-car --unpack path/to/my.car --root <cid1> [--root <cid2>]

# unpack files from a .car on stdin.
$ cat path/to/my.car | ipfs-car --unpack
```

### Library

TODO: Link docs