import type { ImportCandidateStream, ImportCandidate } from 'ipfs-core-types/src/utils';
import type { MultihashHasher } from 'multiformats/hashes/interface';
export type { ImportCandidateStream };
import { Blockstore } from '../blockstore/index';
import { CIDVersion } from "multiformats/types/src/cid";
export interface PackProperties {
    input: ImportCandidateStream | ImportCandidate;
    blockstore?: Blockstore;
    maxChunkSize?: number;
    maxChildrenPerNode?: number;
    wrapWithDirectory?: boolean;
    hasher?: MultihashHasher;
    /**
     * Use raw codec for leaf nodes. Default: true.
     */
    rawLeaves?: boolean;
    cidVersion?: CIDVersion | undefined;
}
export declare function pack({ input, blockstore: userBlockstore, hasher, maxChunkSize, maxChildrenPerNode, wrapWithDirectory, rawLeaves, cidVersion }: PackProperties): Promise<{
    root: import("multiformats/types/src/cid").CID;
    out: AsyncIterable<Uint8Array>;
}>;
