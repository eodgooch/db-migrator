"use strict";

var colors = require("../../colors");
var Promise = require("bluebird");
var _ = require("lodash");

const DOWN = -1;

function MigratorService(scriptService, versionService, messages) {
    this._scriptService = scriptService;
    this._versionService = versionService;
    this._messages = messages;
}

MigratorService.prototype.constructor = MigratorService;

MigratorService.prototype.rollback = Promise.coroutine(function* (currentPath, targetVersion) {

    var fileList = this._scriptService.getList(currentPath);

    if (fileList.length == 0) {
        throw this._messages.MIGRATION_SCRIPT_NOT_FOUND;
    }

    var currentVersion = yield this._versionService.getLastVersion();

    if (targetVersion == "initial") {

        targetVersion = null;

    } else if (targetVersion == -1) {

        if (currentVersion == null) {
            throw this._messages.NO_MORE_ROLLBACK;
        }

        targetVersion = this._scriptService.getPreviousVersion(fileList, currentVersion);

    } else {

        if (this._scriptService.versionExists(fileList, targetVersion) == false) {
            throw this._messages.INVALID_TARGET_VERSION + targetVersion;
        }

        if (currentVersion < targetVersion) {
            throw "Cannot rollback to newer version. Current: " + currentVersion + ", target: " + targetVersion + ".";
        }
    }

    console.log(colors.verbose(this._messages.CURRENT_VERSION + (currentVersion ? currentVersion : this._messages.INITIAL_STATE)));
    console.log(colors.verbose(this._messages.TARGET_VERSION + (targetVersion ? targetVersion : this._messages.INITIAL_STATE)));

    if (targetVersion == currentVersion) {
        console.log(colors.warn(this._messages.ALREADY_MIGRATED));
        return currentVersion;
    }

    // Recursively call "executeScript" function until reach to target version
    return yield this._executeScript.call(this, fileList, currentVersion, targetVersion);
});

MigratorService.prototype._executeScript = Promise.coroutine(function* (fileList, currentVersion, targetVersion) {

    var previousVersion = this._scriptService.getPreviousVersion(fileList, currentVersion);

    if (!currentVersion) {
        console.log(colors.warn(this._messages.NO_MORE_ROLLBACK));
        return currentVersion;
    }

    var file = _.findWhere(fileList, { version: currentVersion, direction: DOWN });

    if (!file) {
        // Migration file is not found. Probably some steps missing, stop migration
        throw this._messages.FILE_NOT_FOUND + currentVersion + "-DOWN[.*].sql";
    } else {

        var fileContent = this._scriptService.get(file.path);

        yield this._scriptService.execute(fileContent);

        console.log(colors.grey("--------------------------------------------------"));
        console.log(colors.white(fileContent));
        console.log(colors.info(file.name + ".sql executed"));
        console.log(colors.grey("--------------------------------------------------"));

        yield this._versionService.removeVersion(file.version);

        if (previousVersion != targetVersion) {
            return yield this._executeScript.call(this, fileList, previousVersion, targetVersion);
        }

        return targetVersion;
    }
});

module.exports = MigratorService;
