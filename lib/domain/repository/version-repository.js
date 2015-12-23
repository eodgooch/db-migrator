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

VersionRepository.prototype.get = function () {

    return this._persister.getVersion();
};

VersionRepository.prototype.update = function (version) {

    return this._persister.setVersion(version);
};

module.exports = VersionRepository;
