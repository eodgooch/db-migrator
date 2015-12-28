"use strict";

module.exports = {
    getConfig: function() {

        var config = {}

        var args = Array.prototype.slice.call(process.argv, 2);

        config.connectionString = args[0]
            || process.env.npm_package_config_db_migrator_db_url
            || process.env.npm_config_db_migrator_db_url;

        config.scriptsPath = args[1]
            || process.env.npm_package_config_db_migrator_directory
            || process.env.npm_config_db_migrator_directory
            || "./migrations";

        config.tableName = args[2]
            || process.env.npm_package_config_db_migrator_table_name
            || process.env.npm_config_db_migrator_table_name
            || "migrations";

        config.targetVersion = args[3]
            || process.env.npm_config_db_migrator_target;

        return config
    }
}