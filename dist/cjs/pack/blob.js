"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.packToBlob = void 0;
const blob_1 = require("@web-std/blob");
const it_all_1 = __importDefault(require("it-all"));
const memory_1 = require("../blockstore/memory");
const index_1 = require("./index");
async function packToBlob({ input, blockstore: userBlockstore, hasher, maxChunkSize, maxChildrenPerNode, wrapWithDirectory, rawLeaves }) {
    const blockstore = userBlockstore ? userBlockstore : new memory_1.MemoryBlockStore();
    const { root, out } = await (0, index_1.pack)({
        input,
        blockstore,
        hasher,
        maxChunkSize,
        maxChildrenPerNode,
        wrapWithDirectory,
        rawLeaves
    });
    const carParts = await (0, it_all_1.default)(out);
    if (!userBlockstore) {
        await blockstore.close();
    }
    const car = new blob_1.Blob(carParts, {
        // https://www.iana.org/assignments/media-types/application/vnd.ipld.car
        type: 'application/vnd.ipld.car',
    });
    return { root, car };
}
exports.packToBlob = packToBlob;
