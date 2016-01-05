"use strict";

var colors = require("../../colors");
var Promise = require("bluebird");
var _ = require("lodash");

const DOWN = -1;

function RollbackService(scriptService, versionService, messages) {
    this._scriptService = scriptService;
    this._versionService = versionService;
    this._messages = messages;
}

RollbackService.prototype.constructor = RollbackService;

RollbackService.prototype.rollback = Promise.coroutine(function* (currentPath, targetVersion) {

    var scriptVersions = this._scriptService.getList(currentPath, DOWN);
    var dbVersions = yield this._versionService.getAll();

    if (scriptVersions.length == 0) {
        throw this._messages.MIGRATION_SCRIPT_NOT_FOUND;
    }

    var currentVersion = yield this._versionService.getLastVersion();

    if (targetVersion == "initial") {

        targetVersion = null;

    } else if (targetVersion == -1) {

        if (currentVersion == null) {
            throw this._messages.NO_MORE_ROLLBACK;
        }

        targetVersion = this._scriptService.getPreviousVersion(scriptVersions, currentVersion);

    } else {

        if (this._scriptService.versionExists(scriptVersions, targetVersion) == false) {
            throw this._messages.INVALID_TARGET_VERSION + targetVersion;
        }

        if (currentVersion < targetVersion) {
            throw "Cannot rollback to newer version. Current: " + currentVersion + ", target: " + targetVersion + ".";
        }
    }

    console.log(colors.verbose(this._messages.CURRENT_VERSION + (currentVersion ? currentVersion : this._messages.INITIAL_STATE)));
    console.log(colors.verbose(this._messages.TARGET_VERSION + (targetVersion ? targetVersion : this._messages.INITIAL_STATE)));

    var rollbackVersions = _.filter(scriptVersions, function(v) {
        return dbVersions[v.version] && v.version > targetVersion;
    });

    if (rollbackVersions.length == 0) {
        console.log(colors.warn(this._messages.ALREADY_MIGRATED));
        return currentVersion;
    }

    for (var v of rollbackVersions) {
        yield this._rollbackVersion(v);
    }

    return targetVersion;
});

RollbackService.prototype._rollbackVersion = Promise.coroutine(function* (versionInfo) {

    var fileContent = this._scriptService.get(versionInfo.path);

    console.log(colors.grey("--------------------------------------------------"));
    console.log(colors.white(fileContent));

    yield this._scriptService.execute(fileContent);

    console.log(colors.info(versionInfo.name + ".sql executed"));
    console.log(colors.grey("--------------------------------------------------"));

    yield this._versionService.removeVersion(versionInfo.version);
});

module.exports = RollbackService;
