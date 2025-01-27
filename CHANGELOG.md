# Changelog

## [2.0.0](https://github.com/storacha/ipfs-car/compare/v1.2.0...v2.0.0) (2025-01-27)


### ⚠ BREAKING CHANGES

* log cid to stdout when there's an output file ([#169](https://github.com/storacha/ipfs-car/issues/169))

### Features

* log cid to stdout when there's an output file ([#169](https://github.com/storacha/ipfs-car/issues/169)) ([f5e21a2](https://github.com/storacha/ipfs-car/commit/f5e21a2db4aade5cf86c5456a3d690f7faa5f0fe))

## [1.2.0](https://github.com/web3-storage/ipfs-car/compare/v1.1.0...v1.2.0) (2024-01-22)


### Features

* streaming sha256 CAR hash ([#162](https://github.com/web3-storage/ipfs-car/issues/162)) ([f1601a0](https://github.com/web3-storage/ipfs-car/commit/f1601a049db3f6512ddc5b1d710d856f5760bf2e))

## [1.1.0](https://github.com/web3-storage/ipfs-car/compare/v1.0.0...v1.1.0) (2023-12-08)


### Features

* **cli:** check block hash consistency when listing blocks ([#157](https://github.com/web3-storage/ipfs-car/issues/157)) ([273079f](https://github.com/web3-storage/ipfs-car/commit/273079fa3876f7fd17593cc0791bd0fcfef43c77))


### Bug Fixes

* docs typos ([#153](https://github.com/web3-storage/ipfs-car/issues/153)) ([0144a86](https://github.com/web3-storage/ipfs-car/commit/0144a86f013087b0b54ebc195542b640c723a99b))

## [1.0.0](https://github.com/web3-storage/ipfs-car/compare/v0.9.2...v1.0.0) (2023-03-20)


### ⚠ BREAKING CHANGES

* The programmatic API has changed significantly, see the README for new streaming API. The CLI "commands" like `--pack` have changed to `pack` (i.e. without dashes) but are largely very similar. In the CLI, CAR files written to stdout or piped to another program (i.e. not written to disk using `--output`) will not have a root CID in the CAR header. Minimum Node.js version for the CLI has changed to 18.

### Features

* streaming CAR packing ([#148](https://github.com/web3-storage/ipfs-car/issues/148)) ([5f5c466](https://github.com/web3-storage/ipfs-car/commit/5f5c466e5184c885cfde20061c4e0721a7d35411))

## [0.9.2](https://github.com/web3-storage/ipfs-car/compare/v0.9.1...v0.9.2) (2023-02-15)


### Bug Fixes

* just trigger release ([#146](https://github.com/web3-storage/ipfs-car/issues/146)) ([e3f2e51](https://github.com/web3-storage/ipfs-car/commit/e3f2e5106c0aacf6504b623dd193265825c7e418))

## [0.9.1](https://github.com/web3-storage/ipfs-car/compare/v0.9.0...v0.9.1) (2022-10-03)


### Bug Fixes

* add car hash command to docs ([baf23a6](https://github.com/web3-storage/ipfs-car/commit/baf23a6d5555172c5b6c7bbca1e8769058880e05))

## [0.9.0](https://github.com/web3-storage/ipfs-car/compare/v0.8.1...v0.9.0) (2022-10-03)


### Features

* add car hash command ([#138](https://github.com/web3-storage/ipfs-car/issues/138)) ([14f5304](https://github.com/web3-storage/ipfs-car/commit/14f53044b87c82c3e73cd7a035f587c155c22bd2))

## [0.8.1](https://github.com/web3-storage/ipfs-car/compare/v0.8.0...v0.8.1) (2022-08-05)


### Bug Fixes

* readme contributing and license ([e4cf245](https://github.com/web3-storage/ipfs-car/commit/e4cf245923407fdd44b1ddf8426248a4393e4cc6))

## [0.8.0](https://github.com/web3-storage/ipfs-car/compare/v0.7.0...v0.8.0) (2022-08-02)


### Features

* display cids with associated filename ([#124](https://github.com/web3-storage/ipfs-car/issues/124)) ([9ebb328](https://github.com/web3-storage/ipfs-car/commit/9ebb328b3d15cf4691a53d74516c197d908d5aa0))
* release workflow ([#128](https://github.com/web3-storage/ipfs-car/issues/128)) ([6fffa74](https://github.com/web3-storage/ipfs-car/commit/6fffa74df82cdc08ba9588b381db4d75db462ca3))
