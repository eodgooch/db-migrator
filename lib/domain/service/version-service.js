"use strict";

var Promise = require("bluebird");
var colors = require("colors/safe");

function VersionService(versionRepository, messages) {
    this._versionRepository = versionRepository;
    this._messages = messages;
}

VersionService.prototype.constructor = VersionService;

VersionService.prototype.getLastVersion = Promise.coroutine(function* () {

    var currentVersion = null;

    var exists = yield this._versionRepository.checkTable();

    if (!exists) {
        console.log(colors.warn(this._messages.FIRST_INITIALIZE));
        yield this._versionRepository.createTable();
    } else {
        currentVersion = yield this._versionRepository.getLastVersion();
    }

    return currentVersion;
});

VersionService.prototype.getAll = Promise.coroutine(function* () {

    var exists = yield this._versionRepository.checkTable();
    var indexedVersions = {};

    if (!exists) {

        console.log(colors.warn(this._messages.FIRST_INITIALIZE));
        yield this._versionRepository.createTable();

    } else {

      var versions = yield this._versionRepository.getAll();

      versions.forEach(function(v) {
          indexedVersions[v.id] = { version: v.id, migrated_at: v.migrated_at.toLocaleString(), description: v.description };
      });
    }

    return indexedVersions;
});

VersionService.prototype.addVersion = function (version, description) {

    return this._versionRepository.addVersion(version, description);
};

VersionService.prototype.removeVersion = function (version) {

    return this._versionRepository.removeVersion(version);
};

module.exports = VersionService;
