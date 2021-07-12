import { Block } from '@ipld/car/api'
import { Blockstore as IpfsBlockstore } from 'interface-blockstore/src/types'

export interface Blockstore extends IpfsBlockstore {
  blocks(): AsyncGenerator<Block, void, unknown>
}
