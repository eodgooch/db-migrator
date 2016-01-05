"use strict";

var Promise = require("bluebird");
var colors = require("colors/safe");

function VersionService(versionRepository, messages) {
    this._versionRepository = versionRepository;
    this._messages = messages;
}

VersionService.prototype.constructor = VersionService;

VersionService.prototype.getLastVersion = Promise.coroutine(function* () {

    var versionRepository = this._versionRepository;
    var messages = this._messages;
    var currentVersion = null;

    // check if "version" table exists in db
    var exists = yield versionRepository.checkTable()

    if (!exists) {
        console.log(colors.warn(messages.FIRST_INITIALIZE));

        yield versionRepository.createTable();
    } else {
        currentVersion = yield versionRepository.getLastVersion()
    }

    return currentVersion;
});

VersionService.prototype.getAll = Promise.coroutine(function* () {

    var versionRepository = this._versionRepository;
    var messages = this._messages;

    // check if "version" table exists in db
    var exists = yield versionRepository.checkTable()

    if (!exists) {
        throw messages.FIRST_INITIALIZE;
    }

    var versions = yield versionRepository.getAll();

    var res = {}

    versions.forEach(function(v) {
        res[v.id] = { version: v.id, migrated_at: v.migrated_at.toLocaleString(), description: v.description };
    });

    return res;
});

VersionService.prototype.addVersion = function (version, description) {

    return this._versionRepository.addVersion(version, description);
};

VersionService.prototype.removeVersion = function (version) {

    return this._versionRepository.removeVersion(version);
};

module.exports = VersionService;
