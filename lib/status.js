"use strict";

var fs = require("fs");
var path = require("path");
var colors = require("colors/safe");
var messages = require("./infrastructure/messages");
var persisterProvider = require("./domain/persister/postgres");
var Promise = require("bluebird");
var ScriptService = require("./domain/service/script-service");
var VersionService = require("./domain/service/version-service");
var ScriptRepository = require("./domain/repository/script-repository");
var VersionRepository = require("./domain/repository/version-repository");
var _ = require("lodash");

colors.setTheme({
    verbose: "cyan",
    info: "green",
    warn: "yellow",
    error: "red"
});

var status = Promise.coroutine(function* (options) {

    var connectionString = options.connectionString;
    var targetVersion = options.targetVersion || 0;
    var currentPath = options.path || ".";
    var tableName = options.tableName || "version";

    try {
        var persister = yield persisterProvider.create(connectionString, tableName);

        var scriptService = new ScriptService(new ScriptRepository(fs, persister), path);
        var versionService = new VersionService(new VersionRepository(persister), messages);

        var scriptVersions = scriptService.getVersions(currentPath);

        var dbVersions = yield versionService.getAll();

        console.log("Version : Migrated At ----------------------------\n");

        scriptVersions.forEach(function(version) {

            if (dbVersions[version]) {
                console.log(colors.info(version + ": " + dbVersions[version].toLocaleString()));
                delete dbVersions[version];
            } else {
                console.log(colors.warn(version + ": not migrated"));
            }
        });

        if (_.size(dbVersions) > 0) {
            console.log("\nMissing files ------------------------------------\n");

            _.forOwn(dbVersions, function(value, key) {
                console.log(colors.error(key + ": " + dbVersions[key].toLocaleString()));
            });
        }

        persister.done();


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

module.exports = status;
