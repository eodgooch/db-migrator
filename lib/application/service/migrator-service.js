"use strict";

var Promise = require("bluebird");
var _ = require("underscore");
var colors = require("colors/safe");

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

    // Getting valid migration script files ("x-y.sql")
    var fileList = scriptService.getList(currentPath);

    if (fileList.length == 0) {
        // There is no migration script file in current folder and subfolders
        throw messages.MIGRATION_SCRIPT_NOT_FOUND;

    }

    // Getting current db version
    var currentVersion = yield versionService.get()

    if (targetVersion == 0) {

        // User didn't specify target version
        // Looking for the file that has the biggest target version number
        targetVersion = _.max(fileList, function (item) { return item.targetVersion; }).targetVersion;
    }
    else if (targetVersion == "+1") {

        // One step forward request
        targetVersion = currentVersion + 1;
    }
    else if (targetVersion == -1) {

        // One step roll back request
        if (currentVersion == 1) {
            // DB in the initial state, can't go back no more
            throw messages.NO_MORE_ROLLBACK;
        }

        targetVersion = currentVersion - 1;
    }

    console.log(colors.verbose(messages.CURRENT_VERSION + currentVersion));
    console.log(colors.verbose(messages.TARGET_VERSION + targetVersion));

    if (currentVersion == targetVersion) {
        // DB is already migrated to the target version
        console.log(colors.warn(messages.ALREADY_MIGRATED));

        return currentVersion;
    }

    var direction = currentVersion < targetVersion ? 1 : -1;

    // Recursively call "executeScript" function until reach to target version
    yield executeScript.call(that, direction, fileList, currentVersion, targetVersion);

    yield versionService.update(targetVersion);

    return targetVersion;
});

MigratorService.prototype._executeScript = Promise.coroutine(function* (direction, fileList, currentVersion, targetVersion) {

    var scriptService = this._scriptService;
    var messages = this._messages;
    var executeScript = this._executeScript;
    var that = this;

    // Calculate the version after migration step according to direction
    var nextVersion = currentVersion + direction;

    // Get migration step file
    var file = _.findWhere(fileList, {baseVersion: currentVersion, targetVersion: nextVersion});

    if (!file) {
        // Migration file is not found. Probably some steps missing, stop migration
        throw messages.FILE_NOT_FOUND + currentVersion + "-" + nextVersion + ".sql";
    }
    else {

        // Get migration step script file content
        var fileContent = scriptService.get(file.path);

        // Execute migration step script file
        yield scriptService.execute(fileContent);

        console.log(colors.grey("--------------------------------------------------"));

        console.log(colors.white(fileContent));

        console.log(colors.info(currentVersion + "-" + nextVersion + ".sql executed"));

        console.log(colors.grey("--------------------------------------------------"));

        // Update current version
        currentVersion += direction;

        if (currentVersion == targetVersion) {

            // Reached to target version, migration completed
            return currentVersion;
        }
        else {
            // Recursive call until reach to target version
            yield executeScript.call(that, direction, fileList, currentVersion, targetVersion);

            return targetVersion;
        }
    }
});

module.exports = MigratorService;
