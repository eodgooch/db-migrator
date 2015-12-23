
var Pgb = require("pg-bluebird");
var Promise = require("bluebird");

var persister = function(connection, tableName) {

    var client = connection.client;

    var queryValue = Promise.coroutine(function* (sql, params) {

        var result = yield client.query(sql, params);

        console.log("queryValue result:", result.rows);

        return result.rows[0].value;
    });

    var helper = {}

    helper.beginTransaction = function() {
        return client.query("BEGIN TRANSACTION");
    }

    helper.commitTransaction = function() {
        return client.query("COMMIT");
    }

    helper.checkTableExists = function() {

        var sql = "SELECT EXISTS(SELECT * FROM information_schema.tables WHERE table_name = $1) as value;";
        var params = [tableName];

        return queryValue(sql, params);
    }

    helper.createTable = function() {
        var sql = "CREATE TABLE " + tableName + " (value INT); INSERT INTO " + tableName + " (value) VALUES (1);";

        return client.query(sql);
    }

    helper.getVersion = function() {
        return queryValue("SELECT value FROM " + tableName + ";");
    }

    helper.setVersion = function(version) {
        return client.query("UPDATE " + tableName + " SET value = $1;", [version]);
    }

    helper.executeQuery = Promise.coroutine(function* (sql) {

        var result = yield client.query(sql)

        console.log("query result:", result.rows);

        return result.rows;
    });

    helper.done = function() {
        if (connection) {
            connection.done();
        }
    }

    return helper;
}

module.exports = {
    create: Promise.coroutine(function* (connectionString, tableName) {
        var pgb = new Pgb();

        var connection = yield pgb.connect(connectionString);

        return persister(connection, tableName);
    })
}