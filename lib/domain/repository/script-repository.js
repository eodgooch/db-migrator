"use strict";

function ScriptRepository(fs, persister) {
    this._fs = fs;
    this._persister = persister;
}

ScriptRepository.prototype.constructor = ScriptRepository;

ScriptRepository.prototype.get = function (path) {

    return this._fs.readFileSync(path, "utf8");
};

ScriptRepository.prototype.execute = function (query) {

    return this._persister.executeQuery(query);
};

ScriptRepository.prototype.getList = function (path) {

    return this._fs.readdirSync(path);
};

ScriptRepository.prototype.getStat = function (path) {

    return this._fs.statSync(path)
};

module.exports = ScriptRepository;