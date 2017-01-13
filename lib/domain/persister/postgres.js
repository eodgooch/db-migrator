try {
    var pg = require("pg");
} catch (er) {
    throw new Error("Add `pg` as a dependency to your project to use db-migrator with PostgreSQL.")
}

var Promise = require("bluebird");

var persister = function(client, tableName) {

    var queryValue = Promise.coroutine(function* (sql, params) {

        var result = yield client.query(sql, params);

        if (result.rows.length > 0) {
            return result.rows[0].value;
        }

        return null;
    });

    var helper = {}

    helper.beginTransaction = function() {
        return client.query("BEGIN TRANSACTION");
    }

    helper.commitTransaction = function() {
        return client.query("COMMIT");
    }

    helper.checkTableExists = function() {

        var sql = "SELECT EXISTS(SELECT * FROM information_schema.tables WHERE table_name = $1) as value";
        var params = [tableName];

        return queryValue(sql, params);
    }

    helper.createTable = function() {
        var sql = "CREATE TABLE " + tableName + " (id int, description VARCHAR(500), migrated_at timestamptz DEFAULT NOW())";
        console.log(sql);
        return client.query(sql);
    }

    helper.getLastVersion = function() {
        return queryValue("SELECT id AS value FROM " + tableName + " ORDER BY id DESC LIMIT 1");
    }

    helper.getAll = Promise.coroutine(function* (sql) {
        var result = yield client.query("SELECT id, description, migrated_at FROM " + tableName + " ORDER BY id DESC");

        return result.rows;
    })

    helper.addVersion = function(version, description) {
        return client.query("INSERT INTO " + tableName + " (id, description) VALUES ($1, $2)", [version, description]);
    }

    helper.removeVersion = function(version) {
        return client.query("DELETE FROM " + tableName + " WHERE id = $1", [version]);
    }

    helper.executeRawQuery = Promise.coroutine(function* (sql) {

        var result = yield client.query(sql)

        return result.rows;
    });

    helper.done = function() {
        if (client) {
            client.release()
        }
    }

    return helper;
}

module.exports = {
    create: Promise.coroutine(function* (connectionString, tableName) {
        var pool = new pg.Pool({
            connectionString: connectionString
        });

        var client = yield pool.connect();

        return persister(client, tableName);
    })
}
