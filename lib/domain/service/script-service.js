"use strict";

var _ = require("underscore");

function ScriptService(scriptRepository, path) {
    this._scriptRepository = scriptRepository;
    this._path = path;
}

ScriptService.prototype.constructor = ScriptService;

ScriptService.prototype.get = function (path) {

    return this._scriptRepository.get(path);
};

ScriptService.prototype.getList = function (currentPath) {

    var sqlFiles = [];

    var files = this._scriptRepository.getList(currentPath);

    // Looking for all files in the path directory and all sub directories recursively
    for (var i in files) {
        if (!files.hasOwnProperty(i)) {
            continue;
        }

        var fullPath = currentPath + '/' + files[i];

        var stats = this._scriptRepository.getStat(fullPath);

        if (stats.isDirectory()) {

            sqlFiles = sqlFiles.concat(this.getList(fullPath));

        } else if (stats.isFile()) {

            // Files must have an extension with ".sql" (case insensitive)
            // with and "ID-[UP|DOWN](-description).sql" format where ID must be a number
            // All other files will be ignored
            if (this._path.extname(fullPath).toUpperCase() == '.SQL') {

                var fileName = this._path.basename(fullPath, '.sql');

                if (fileName.indexOf('-') == -1) {
                    continue;
                }

                var parts = fileName.split('-');

                if (parts.length < 2) {
                    continue;
                }

                // "ID-DIRECTION.sql"
                var version = parseInt(parts[0]);
                var direction = parts[1].toUpperCase()

                if (!version || isNaN(version) || (direction != "DOWN" && direction != "UP")) {
                    continue;
                }

                direction = direction == "UP" ? 1 : -1;

                sqlFiles.push({ version: version, direction: direction, path: fullPath, name: fileName });
            }
        }
    }

    return sqlFiles;
};

ScriptService.prototype.getNextVersion = function(fileList, currentVersion, direction) {

    var versions = _.filter(fileList, function(sqlFile) {
        if (direction > 0) {
            return sqlFile.version > currentVersion;
        } else if (direction < 0) {
            return sqlFile.version < currentVersion;
        } else {
            return false;
        }
    });

    return versions.length > 0 ? versions[0].version : 1;
}

ScriptService.prototype.execute = function (query) {

    // Execute migration script
    return this._scriptRepository.execute(query);
};

module.exports = ScriptService;