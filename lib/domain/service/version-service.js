"use strict";

var Promise = require("bluebird");
var colors = require("colors/safe");

function VersionService(versionRepository, messages) {
    this._versionRepository = versionRepository;
    this._messages = messages;
}

VersionService.prototype.constructor = VersionService;

VersionService.prototype.get = function () {

    var versionRepository = this._versionRepository;
    var messages = this._messages;

    return new Promise(function(resolve, reject) {

        // check if "version" table exists in db
        versionRepository.checkTable()
            .then(function (exists) {

                if (!exists) {

                    // "version" table does not exist, will be created for the first time with version "1"
                    console.log(colors.warn(messages.FIRST_INITIALIZE));

                    versionRepository.createTable()
                        .then(function () {
                            resolve(1);
                        })
                        .catch(function (error) {
                            reject(error);
                        });
                }
                else {
                    // Get the current version from db
                    versionRepository.get()
                        .then(function (currentVersion) {
                            resolve(currentVersion);
                        })
                        .catch(function (error) {
                            reject(error);
                        });
                }
            })
            .catch(function (error) {
                reject(error);
            });
    });
};

VersionService.prototype.update = function (version) {

    // Update current version
    return this._versionRepository.update(version);
};

module.exports = VersionService;
