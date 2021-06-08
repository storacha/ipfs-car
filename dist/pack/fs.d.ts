import { Blockstore } from '../blockstore';
export declare function packToFs({ input, output, blockstore: userBlockstore }: {
    input: string | Iterable<string> | AsyncIterable<string>;
    output?: string;
    blockstore?: Blockstore;
}): Promise<{
    root: import("multiformats").CID;
    filename: string;
}>;
