# ipfs-car Blockstores

While packing files into [Content Addressable aRchives (CAR)](https://github.com/ipld/specs/blob/master/block-layer/content-addressable-archives.md), `ipfs-car` imports the given files into [unix-fs](https://github.com/ipfs/specs/blob/master/UNIXFS.md#importing). All the `unix-fs` graph needs to be computed, in order to get the root CID to create the resulting CAR file. A blockstore is used to store the generated `unix-fs` temporarily, so that we can iterate them afterwards and create large CAR files.

## Blockstore implementations

The Blockstore implementations follows the [Blockstore Interface](./index.d.ts). The available implementations are:

- [FsBlockStore](./fs.ts) with a local file system backend (Node.js environments)
- [MemoryBlockStore](./memory.ts) with an in-memory backend
- [IdbBlockStore](./idb.ts) for browsers with IndexedDb via `idb-keyval`
- [LevelBlockStore](https://github.com/vasco-santos/level-blockstore) with a [level](https://www.npmjs.com/package/level) backend (Node.js, Electron and browser environments)

## Usage

- FsBlockStore

```js
import { FsBlockStore } from 'ipfs-car/blockstore/fs'
```

- IdbBlockStore

```js
import { IdbBlockStore } from 'ipfs-car/blockstore/idb'
```

- MemoryBlockStore

```js
import { MemoryBlockStore } from 'ipfs-car/blockstore/memory'
```

- LevelBlockStore

```js
import { LevelBlockStore } from 'level-blockstore'
```
