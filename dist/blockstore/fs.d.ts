/// <reference types="node" />
import { CID } from 'multiformats';
import { Block } from '@ipld/car/api';
import { Blockstore } from './';
export declare class FsBlockStore implements Blockstore {
    path: string;
    _opened: boolean;
    _opening?: Promise<void>;
    constructor();
    _open(): Promise<void>;
    put({ cid, bytes }: {
        cid: CID;
        bytes: Uint8Array;
    }): Promise<{
        cid: CID;
        bytes: Uint8Array;
    }>;
    get(cid: CID): Promise<Block>;
    blocks(): AsyncGenerator<{
        cid: CID;
        bytes: Buffer;
    }, void, unknown>;
    destroy(): Promise<void>;
}
