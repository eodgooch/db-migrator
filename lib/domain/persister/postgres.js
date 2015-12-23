
var Pgb = require("pg-bluebird");
var Promise = require("bluebird");
var currentConnection;

var persister = function(client, tableName) {

	var queryValue = function(sql, params) {
		return new Promise(function(resolve, reject) {

			client.query(sql, params)
			.then(function(result) {
				console.log("queryValue result:", result.rows);
				resolve(result.rows[0].value);
			})
			.catch(reject);
		});
	}

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

	helper.executeQuery = function(sql) {
		return new Promise(function(resolve, reject) {

			client.query(sql)
			.then(function(result) {
				console.log("query result:", result.rows);
				resolve(result.rows);
			})
			.catch(reject);
		});
	}

	return helper;
}

module.exports = {
	create: function(connectionString, tableName) {
		return new Promise(function(resolve, reject) {

			var pgb = new Pgb();

			pgb.connect(connectionString)
			.then(function(connection) {
				currentConnection = connection;
				resolve(persister(connection.client, tableName));
			})
			.catch(reject);
		});
	},

	done: function() {
		if (currentConnection) {
			currentConnection.done();
		}
	}
}