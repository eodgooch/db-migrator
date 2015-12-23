"use strict";

var fs = require("fs");
var path = require("path");
var colors = require("colors/safe");
var messages = require("./lib/infrastructure/messages");
var persisterProvider = require("./lib/domain/persister/postgres");
var Promise = require("bluebird");

colors.setTheme({
    verbose: 'cyan',
    info: 'green',
    warn: 'yellow',
    error: 'red'
});

var migrate = Promise.coroutine(function* (options) {

    var connectionString = options.connectionString;
    var targetVersion = options.targetVersion || 0;
    var currentPath = options.path || '.';
    var tableName = options.tableName || 'version';

    try {
        var persister = yield persisterProvider.create(connectionString, tableName);

        yield persister.beginTransaction();

        var migrationService = getMigrationService(persister);

        var currentVersion = yield migrationService.migrate(currentPath, targetVersion);

        yield persister.commitTransaction();

        persister.done();

        console.log(colors.info("--------------------------------------------------"));
        console.log(colors.info(messages.MIGRATION_COMPLETED + currentVersion));

    } catch(error) {

        if (error) {
            console.log(error.stack);
            console.error(colors.error(messages.MIGRATION_ERROR + error));
        }

        if (persister) {
            persister.done();
        }

        throw error;
    };
});

var getMigrationService = function (persister) {

    var MigratiorService = require("./lib/application/service/migrator-service");
    var ScriptService = require("./lib/domain/service/script-service");
    var VersionService = require("./lib/domain/service/version-service");
    var ScriptRepository = require("./lib/domain/repository/script-repository");
    var VersionRepository = require("./lib/domain/repository/version-repository");

    // Service definition with dependency injection
    return new MigratiorService(
        new ScriptService(new ScriptRepository(fs, persister), path),
        new VersionService(new VersionRepository(persister), messages),
        messages);
};

module.exports = migrate;
