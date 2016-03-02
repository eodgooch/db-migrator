"use strict";

var fs = require("fs");
var path = require("path");
var colors = require("./colors");
var Promise = require("bluebird");
var printStatus = require("./status");
var messages = require("./infrastructure/messages");

var rollback = Promise.coroutine(function* (options) {

    var connectionString = options.connectionString;
    var targetVersion = options.targetVersion || -1;
    var currentPath = options.path || ".";
    var tableName = options.tableName || "migrations";
    var dbDriver = options.dbDriver || "postgres";

    try {
        var persisterProvider = require("./domain/persister/" + dbDriver);
        var persister = yield persisterProvider.create(connectionString, tableName);

        yield persister.beginTransaction();

        var rollbackService = getRollbackService(persister);

        var currentVersion = yield rollbackService.rollback(currentPath, targetVersion);

        yield persister.commitTransaction();

        persister.done();

        console.log(colors.info("--------------------------------------------------"));
        console.log(colors.info(messages.ROLLBACK_COMPLETED + (currentVersion ? currentVersion : messages.INITIAL_STATE)));

    } catch(error) {

        if (error) {
            console.error(colors.error(messages.MIGRATION_ERROR + error));
        }

        if (persister) {
            persister.done();
        }

        throw error;
    };

    if (options.printStatus) {
        yield printStatus(options);
    }
});

var getRollbackService = function (persister) {

    var RollbackService = require("./application/service/rollback-service");
    var ScriptService = require("./domain/service/script-service");
    var VersionService = require("./domain/service/version-service");
    var ScriptRepository = require("./domain/repository/script-repository");
    var VersionRepository = require("./domain/repository/version-repository");

    return new RollbackService(
        new ScriptService(new ScriptRepository(fs, persister), path),
        new VersionService(new VersionRepository(persister), messages),
        messages);
};

module.exports = rollback;
