import { Block } from '@ipld/car/api';
import { CID } from 'multiformats';
export interface Blockstore {
    put(block: Block): Promise<Block>;
    get(cid: CID): Promise<Block>;
    blocks(): AsyncGenerator<Block, void, unknown>;
    destroy(): Promise<void>;
}
