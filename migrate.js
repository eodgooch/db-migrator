"use strict";

var fs = require("fs");
var path = require("path");
var colors = require("colors/safe");
var messages = require("./lib/infrastructure/messages");
var persisterProvider = require("./lib/domain/persister/postgres");

colors.setTheme({
    verbose: 'cyan',
    info: 'green',
    warn: 'yellow',
    error: 'red'
});

function migrate (options) {
    var connectionString = options.connectionString;
    var targetVersion = options.targetVersion || 0;
    var currentPath = options.path || '.';

    var currentPersister;
    var currentVersion;

    return persisterProvider.create(connectionString, 'version')
        .then(function (persister) {
            currentPersister = persister;

            return currentPersister.beginTransaction();
        })
        .then(function () {
            var migrationService = getMigrationService(currentPersister);

            return migrationService.migrate(currentPath, targetVersion);
        })
        .then(function (curVer) {

            currentVersion = curVer;

            return currentPersister.commitTransaction();
        })
        .then(function () {

            persisterProvider.done();

            console.log(colors.info("--------------------------------------------------"));
            console.log(colors.info(messages.MIGRATION_COMPLETED + currentVersion));
        })
        .catch(function (error) {
            // Migration failed

            if (error) {
                console.error(colors.error(messages.MIGRATION_ERROR + error));
            }

            persisterProvider.done();

            // Rethrow error
            throw error;
        });
}

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
