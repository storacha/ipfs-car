import { CID } from 'multiformats';
import { UnixFSEntry } from 'ipfs-unixfs-exporter';
export declare function unpackToFs({ input, roots, output }: {
    input: string;
    roots?: CID[];
    output?: string;
}): Promise<void>;
export declare function unpackStreamToFs({ input, roots, output }: {
    input: AsyncIterable<Uint8Array>;
    roots?: CID[];
    output?: string;
}): Promise<void>;
export declare function writeFiles(source: AsyncIterable<UnixFSEntry>, output?: string): Promise<void>;
