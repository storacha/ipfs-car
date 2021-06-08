"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const chai_1 = require("chai");
const multiformats_1 = require("multiformats");
const car_1 = require("@ipld/car");
const unpack_1 = require("../../dist/unpack");
const fs_2 = require("../../dist/unpack/fs");
const rawCidString = 'bafkreigk2mcysiwgmacvilb3q6lcdaq53zlwu3jn4pj6qev2lylyfbqfdm';
const rawCid = multiformats_1.CID.parse(rawCidString);
const dirTmp = `${__dirname}/tmp`;
describe('unpack', () => {
    it('file system stream', async () => {
        const inStream = fs_1.default.createReadStream(`${__dirname}/../fixtures/raw.car`);
        const carReader = await car_1.CarReader.fromIterable(inStream);
        const files = [];
        for await (const file of unpack_1.unpack(carReader)) {
            chai_1.expect(file.path).to.eql(rawCidString);
            chai_1.expect(rawCid.equals(file.cid)).to.eql(true);
            files.push(file);
        }
        chai_1.expect(files).to.have.lengthOf(1);
    });
});
describe('unpackStreamToFs', () => {
    beforeEach(() => {
        if (!fs_1.default.existsSync(dirTmp)) {
            fs_1.default.mkdirSync(dirTmp);
        }
    });
    afterEach(() => {
        fs_1.default.rmSync(dirTmp, { recursive: true });
    });
    it('raw file stream', async () => {
        const input = fs_1.default.createReadStream(`${__dirname}/../fixtures/raw.car`);
        const output = `${__dirname}/tmp/raw`;
        await fs_2.unpackStreamToFs({
            input,
            output
        });
        chai_1.expect(fs_1.default.existsSync(output)).to.eql(true);
    });
    it('file system dir', async () => {
        const input = fs_1.default.createReadStream(`${__dirname}/../fixtures/dir.car`);
        const output = `${__dirname}/tmp/dir`;
        await fs_2.unpackStreamToFs({
            input,
            output
        });
        chai_1.expect(fs_1.default.existsSync(output)).to.eql(true);
    });
});
describe('unpackToFs', () => {
    beforeEach(() => {
        if (!fs_1.default.existsSync(dirTmp)) {
            fs_1.default.mkdirSync(dirTmp);
        }
    });
    afterEach(() => {
        fs_1.default.rmSync(dirTmp, { recursive: true });
    });
    it('file system raw', async () => {
        const output = `${__dirname}/tmp/raw`;
        await fs_2.unpackToFs({
            input: `${__dirname}/../fixtures/raw.car`,
            output
        });
        chai_1.expect(fs_1.default.existsSync(output)).to.eql(true);
    });
    it('file system dir', async () => {
        const output = `${__dirname}/tmp/dir`;
        await fs_2.unpackToFs({
            input: `${__dirname}/../fixtures/dir.car`,
            output
        });
        chai_1.expect(fs_1.default.existsSync(output)).to.eql(true);
    });
});
