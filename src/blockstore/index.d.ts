import { Block } from '@ipld/car/api'

export interface Blockstore {
  put({ cid, bytes }: {
    cid: CID
    bytes: Uint8Array
  }): Promise<Block>
  get(cid: CID): Promise<Block>
  blocks(): AsyncGenerator<Block, void, unknown>
  close(): Promise<void>
}
