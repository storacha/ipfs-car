"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const sinon_1 = __importDefault(require("sinon"));
const fs_1 = __importDefault(require("fs"));
const process_1 = __importDefault(require("process"));
const it_all_1 = __importDefault(require("it-all"));
const equals_1 = __importDefault(require("uint8arrays/equals"));
const car_1 = require("@ipld/car");
const unpack_1 = require("../../dist/unpack");
const fs_2 = require("../../dist/pack/fs");
const stream_1 = require("../../dist/pack/stream");
const memory_1 = require("../../dist/blockstore/memory");
const fs_3 = require("../../dist/blockstore/fs");
const dirTmp = `${__dirname}/tmp`;
describe('pack', () => {
    ;
    [memory_1.MemoryBlockStore, fs_3.FsBlockStore].map((Blockstore) => {
        describe(`with ${Blockstore.name}`, () => {
            beforeEach(() => {
                if (!fs_1.default.existsSync(dirTmp)) {
                    fs_1.default.mkdirSync(dirTmp);
                }
            });
            afterEach(() => {
                fs_1.default.rmSync(dirTmp, { recursive: true });
            });
            it('pack dir to car with filesystem output with iterable input', async () => {
                const blockstore = new Blockstore();
                const writable = fs_1.default.createWriteStream(`${__dirname}/tmp/dir.car`);
                // Create car from file
                await stream_1.packToStream({
                    input: `${__dirname}/../fixtures/dir`,
                    writable,
                    blockstore
                });
                await blockstore.destroy();
                const inStream = fs_1.default.createReadStream(`${__dirname}/tmp/dir.car`);
                const carReader = await car_1.CarReader.fromIterable(inStream);
                const files = await it_all_1.default(unpack_1.unpack(carReader));
                chai_1.expect(files).to.have.lengthOf(2);
            });
            it('pack dir to car with filesystem output', async () => {
                const blockstore = new Blockstore();
                // Create car from file
                await fs_2.packToFs({
                    input: `${__dirname}/../fixtures/dir`,
                    output: `${__dirname}/tmp/dir.car`,
                    blockstore
                });
                await blockstore.destroy();
                const inStream = fs_1.default.createReadStream(`${__dirname}/tmp/dir.car`);
                const carReader = await car_1.CarReader.fromIterable(inStream);
                const files = await it_all_1.default(unpack_1.unpack(carReader));
                chai_1.expect(files).to.have.lengthOf(2);
            });
            it('pack raw file to car with filesystem output', async () => {
                const blockstore = new Blockstore();
                // Create car from file
                await fs_2.packToFs({
                    input: `${__dirname}/../fixtures/file.raw`,
                    output: `${__dirname}/tmp/raw.car`,
                    blockstore
                });
                await blockstore.destroy();
                const inStream = fs_1.default.createReadStream(`${__dirname}/tmp/raw.car`);
                const carReader = await car_1.CarReader.fromIterable(inStream);
                const files = await it_all_1.default(unpack_1.unpack(carReader));
                chai_1.expect(files).to.have.lengthOf(1);
                const rawOriginalContent = new Uint8Array(fs_1.default.readFileSync(`${__dirname}/../fixtures/file.raw`));
                const rawContent = (await it_all_1.default(files[0].content()))[0];
                chai_1.expect(equals_1.default(rawOriginalContent, rawContent)).to.eql(true);
            });
            it('pack raw file to car without output', async () => {
                const blockstore = new Blockstore();
                // Create car from file
                await fs_2.packToFs({
                    input: `${__dirname}/../fixtures/file.raw`,
                    blockstore
                });
                await blockstore.destroy();
                const newCarPath = `${process_1.default.cwd()}/file.car`;
                const inStream = fs_1.default.createReadStream(newCarPath);
                const carReader = await car_1.CarReader.fromIterable(inStream);
                const files = await it_all_1.default(unpack_1.unpack(carReader));
                chai_1.expect(files).to.have.lengthOf(1);
                const rawOriginalContent = new Uint8Array(fs_1.default.readFileSync(`${__dirname}/../fixtures/file.raw`));
                const rawContent = (await it_all_1.default(files[0].content()))[0];
                chai_1.expect(equals_1.default(rawOriginalContent, rawContent)).to.eql(true);
                // Remove created file
                fs_1.default.rmSync(newCarPath);
            });
            it('pack raw file to car with writable stream', async () => {
                const blockstore = new Blockstore();
                const writable = fs_1.default.createWriteStream(`${__dirname}/tmp/raw.car`);
                // Create car from file
                await stream_1.packToStream({
                    input: `${__dirname}/../fixtures/file.raw`,
                    writable,
                    blockstore
                });
                await blockstore.destroy();
                const inStream = fs_1.default.createReadStream(`${__dirname}/tmp/raw.car`);
                const carReader = await car_1.CarReader.fromIterable(inStream);
                const files = await it_all_1.default(unpack_1.unpack(carReader));
                chai_1.expect(files).to.have.lengthOf(1);
                const rawOriginalContent = new Uint8Array(fs_1.default.readFileSync(`${__dirname}/../fixtures/file.raw`));
                const rawContent = (await it_all_1.default(files[0].content()))[0];
                chai_1.expect(equals_1.default(rawOriginalContent, rawContent)).to.eql(true);
            });
            it('packToStream does not destroy provided blockstore', async () => {
                const writable = fs_1.default.createWriteStream(`${__dirname}/tmp/raw.car`);
                const blockstore = new Blockstore();
                const spy = sinon_1.default.spy(blockstore, 'destroy');
                // Create car from file
                await stream_1.packToStream({
                    input: `${__dirname}/../fixtures/dir`,
                    writable,
                    blockstore
                });
                chai_1.expect(spy.callCount).to.eql(0);
                await blockstore.destroy();
            });
            it('packToFs does not destroy provided blockstore', async () => {
                const blockstore = new Blockstore();
                const spy = sinon_1.default.spy(blockstore, 'destroy');
                // Create car from file
                await fs_2.packToFs({
                    input: `${__dirname}/../fixtures/file.raw`,
                    output: `${__dirname}/tmp/dir.car`,
                    blockstore
                });
                chai_1.expect(spy.callCount).to.eql(0);
                await blockstore.destroy();
            });
        });
    });
});
