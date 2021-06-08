"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeFiles = exports.unpackStreamToFs = exports.unpackToFs = void 0;
const fs_1 = __importDefault(require("fs"));
const it_pipe_1 = __importDefault(require("it-pipe"));
const streaming_iterables_1 = require("streaming-iterables");
const car_1 = require("@ipld/car");
// tslint:disable-next-line: no-var-requires needs types
const toIterable = require('stream-to-it');
const _1 = require(".");
// Node only, read a car from fs, write files to fs
async function unpackToFs({ input, roots, output }) {
    const carReader = await car_1.CarIndexedReader.fromFile(input);
    await writeFiles(_1.unpack(carReader, roots), output);
}
exports.unpackToFs = unpackToFs;
// Node only, read a stream, write files to fs
async function unpackStreamToFs({ input, roots, output }) {
    // This stores blocks in memory, which is bad for large car files.
    // Could write the stream to a BlockStore impl first and make it abuse the disk instead.
    const carReader = await car_1.CarReader.fromIterable(input);
    await writeFiles(_1.unpack(carReader, roots), output);
}
exports.unpackStreamToFs = unpackStreamToFs;
async function writeFiles(source, output) {
    for await (const file of source) {
        let filePath = file.path;
        // output overrides the first part of the path.
        if (output) {
            const parts = file.path.split('/');
            parts[0] = output;
            filePath = parts.join('/');
        }
        if (file.type === 'file' || file.type === 'raw') {
            await it_pipe_1.default(file.content, streaming_iterables_1.map((chunk) => chunk.slice()), // BufferList to Buffer
            toIterable.sink(fs_1.default.createWriteStream(filePath)));
        }
        else if (file.type === 'directory') {
            await fs_1.default.promises.mkdir(filePath, { recursive: true });
        }
        else {
            throw new Error(`Unsupported UnixFS type ${file.type} for ${file.path}`);
        }
    }
}
exports.writeFiles = writeFiles;
