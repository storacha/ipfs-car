/// <reference types="node" />
import { Writable } from 'stream';
import { Blockstore } from '../blockstore';
export declare function packToStream({ input, writable, blockstore: userBlockstore }: {
    input: string | Iterable<string> | AsyncIterable<string>;
    writable: Writable;
    blockstore?: Blockstore;
}): Promise<{
    root: import("multiformats").CID;
}>;
