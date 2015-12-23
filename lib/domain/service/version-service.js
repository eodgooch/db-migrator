"use strict";

var Promise = require("bluebird");
var colors = require("colors/safe");

function VersionService(versionRepository, messages) {
    this._versionRepository = versionRepository;
    this._messages = messages;
}

VersionService.prototype.constructor = VersionService;

VersionService.prototype.get = Promise.coroutine(function* () {

    var versionRepository = this._versionRepository;
    var messages = this._messages;
    var currentVersion = 1;

    // check if "version" table exists in db
    var exists = yield versionRepository.checkTable()

    if (!exists) {
        console.log(colors.warn(messages.FIRST_INITIALIZE));

        yield versionRepository.createTable();
    } else {
        currentVersion = yield versionRepository.get()
    }

    return currentVersion;
});

VersionService.prototype.update = function (version) {

    // Update current version
    return this._versionRepository.update(version);
};

module.exports = VersionService;
