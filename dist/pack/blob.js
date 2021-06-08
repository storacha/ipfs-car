"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.packToBlob = void 0;
const it_all_1 = __importDefault(require("it-all"));
const memory_1 = require("../blockstore/memory");
const _1 = require("./");
async function packToBlob({ input, blockstore: userBlockstore }) {
    const blockstore = userBlockstore ? userBlockstore : new memory_1.MemoryBlockStore();
    const { root, out } = await _1.pack({
        input,
        blockstore
    });
    if (!userBlockstore) {
        await blockstore.destroy();
    }
    const carParts = await it_all_1.default(out);
    const car = new Blob(carParts, {
        type: 'application/car',
    });
    return { root, car };
}
exports.packToBlob = packToBlob;
