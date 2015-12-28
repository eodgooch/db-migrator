"use strict";

var promise = require("bluebird");

function VersionRepository(persister) {
    this._persister = persister;
}

VersionRepository.prototype.constructor = VersionRepository;

VersionRepository.prototype.checkTable = function () {

    return this._persister.checkTableExists();
};

VersionRepository.prototype.createTable = function () {

    return this._persister.createTable();
};

VersionRepository.prototype.getLastVersion = function () {

    return this._persister.getLastVersion();
};

VersionRepository.prototype.getAll = function () {

    return this._persister.getAll();
};

VersionRepository.prototype.addVersion = function (version) {

    return this._persister.addVersion(version);
};

VersionRepository.prototype.removeVersion = function (version) {

    return this._persister.removeVersion(version);
};

module.exports = VersionRepository;
