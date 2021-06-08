"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pack = void 0;
const it_last_1 = __importDefault(require("it-last"));
const it_pipe_1 = __importDefault(require("it-pipe"));
const car_1 = require("@ipld/car");
const ipfs_unixfs_importer_1 = require("ipfs-unixfs-importer");
const index_1 = __importDefault(require("ipfs-core-utils/src/files/normalise-input/index"));
const sha2_1 = require("multiformats/hashes/sha2");
const memory_1 = require("../blockstore/memory");
async function pack({ input, blockstore: userBlockstore }) {
    const blockstore = userBlockstore ? userBlockstore : new memory_1.MemoryBlockStore();
    // Consume the source
    const rootEntry = await it_last_1.default(it_pipe_1.default(index_1.default(input), (source) => ipfs_unixfs_importer_1.importer(source, blockstore, {
        cidVersion: 1,
        chunker: 'fixed',
        maxChunkSize: 262144,
        hasher: sha2_1.sha256,
        rawLeaves: true,
        wrapWithDirectory: false // TODO: Set to true when not directory to keep names?
    })));
    if (!rootEntry || !rootEntry.cid) {
        throw new Error('given input could not be parsed correctly');
    }
    const root = rootEntry.cid;
    const { writer, out } = await car_1.CarWriter.create([root]);
    for await (const block of blockstore.blocks()) {
        writer.put(block);
    }
    writer.close();
    if (!userBlockstore) {
        await blockstore.destroy();
    }
    return { root, out };
}
exports.pack = pack;
