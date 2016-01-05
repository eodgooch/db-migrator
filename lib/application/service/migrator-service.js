"use strict";

var Promise = require("bluebird");
var _ = require("lodash");
var colors = require("colors/safe");
const UP = 1;
const DOWN = -1;

function MigratorService(scriptService, versionService, messages) {
    this._scriptService = scriptService;
    this._versionService = versionService;
    this._messages = messages;
}

MigratorService.prototype.constructor = MigratorService;

MigratorService.prototype.migrate = Promise.coroutine(function* (currentPath, targetVersion) {

    var scriptService = this._scriptService;
    var versionService = this._versionService;
    var messages = this._messages;
    var executeScript = this._executeScript;
    var that = this;
    var direction = UP;

    var fileList = scriptService.getList(currentPath);

    if (fileList.length == 0) {
        throw messages.MIGRATION_SCRIPT_NOT_FOUND;
    }

    var currentVersion = yield versionService.getLastVersion();

    if (targetVersion == "initial") {

        targetVersion = null;
        direction = -1;

    } else if (targetVersion == 0) {

        targetVersion = scriptService.getNewestVersion(fileList);

    } else if (targetVersion === "+1") {

        targetVersion = scriptService.getNextVersion(fileList, currentVersion);

    } else if (targetVersion == -1) {

        if (currentVersion == null) {
            throw messages.NO_MORE_ROLLBACK;
        }

        targetVersion = scriptService.getPreviousVersion(fileList, currentVersion);
        direction = DOWN;

    } else {

        if (scriptService.versionExists(fileList, targetVersion) == false) {
            throw messages.INVALID_TARGET_VERSION + targetVersion;
        }

        direction = currentVersion < targetVersion ? 1 : -1;
    }

    console.log(colors.verbose(messages.CURRENT_VERSION + (currentVersion ? currentVersion : messages.INITIAL_STATE)));
    console.log(colors.verbose(messages.TARGET_VERSION + (targetVersion ? targetVersion : messages.INITIAL_STATE)));

    if (targetVersion == currentVersion) {
        console.log(colors.warn(messages.ALREADY_MIGRATED));
        return currentVersion;
    }

    // Recursively call "executeScript" function until reach to target version
    return yield executeScript.call(that, direction, fileList, currentVersion, targetVersion);
});

MigratorService.prototype._executeScript = Promise.coroutine(function* (direction, fileList, currentVersion, targetVersion) {

    var scriptService = this._scriptService;
    var versionService = this._versionService;
    var messages = this._messages;
    var executeScript = this._executeScript;
    var that = this;

    if (direction > 0) {
        var nextVersion = scriptService.getNextVersion(fileList, currentVersion);
        var migrateFileVersion = nextVersion;
    } else {
        nextVersion = scriptService.getPreviousVersion(fileList, currentVersion, direction);
        migrateFileVersion = currentVersion;
    }

    if (!migrateFileVersion) {
        console.log(colors.warn(direction > 0 ? messages.NO_MORE_MIGRATE : messages.NO_MORE_ROLLBACK));
        return currentVersion;
    }

    var file = _.findWhere(fileList, { version: migrateFileVersion, direction: direction });

    if (!file) {
        // Migration file is not found. Probably some steps missing, stop migration
        throw messages.FILE_NOT_FOUND + migrateFileVersion + "-" + (direction > 0 ? "UP" : "DOWN") + "[.*].sql";
    }
    else {

        // Get migration step script file content
        var fileContent = scriptService.get(file.path);

        // Execute migration step script file
        yield scriptService.execute(fileContent);

        console.log(colors.grey("--------------------------------------------------"));

        console.log(colors.white(fileContent));

        console.log(colors.info(file.name + ".sql executed"));

        console.log(colors.grey("--------------------------------------------------"));

        if (direction > 0) {
            yield versionService.addVersion(file.version, file.description);
        } else {
            yield versionService.removeVersion(file.version);
        }

        currentVersion = nextVersion;

        if (currentVersion != targetVersion) {

            // Recursive call until reach to target version
            return yield executeScript.call(that, direction, fileList, currentVersion, targetVersion);
        }

        return targetVersion;
    }
});

module.exports = MigratorService;
