import { CID } from 'multiformats';
import { Block } from '@ipld/car/api';
import { Blockstore } from './';
export declare class MemoryBlockStore implements Blockstore {
    store: Map<string, Uint8Array>;
    constructor();
    blocks(): AsyncGenerator<{
        cid: CID;
        bytes: Uint8Array;
    }, void, unknown>;
    put({ cid, bytes }: {
        cid: CID;
        bytes: Uint8Array;
    }): Promise<{
        cid: CID;
        bytes: Uint8Array;
    }>;
    get(cid: CID): Promise<Block>;
    destroy(): Promise<void>;
}
