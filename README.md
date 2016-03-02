db-migrator
===========

The complete and easy to use database migration tool for Node.js projects. Supports PostgreSQL and MySQL.

## Features

  * Auto migration from scratch to up to date
  * Step by step forward migration
  * Step by step backward migration
  * Migrate to a specific version forward or backward
  * Subfolder deep search for migration scripts
  * All or nothing (transactional migration)

## Installation

```
npm install db-migrator --save
# and one of
npm install pg-bluebird --save
npm install promise-mysql --save
```

## Quick Start

The simplest way to use db-migrator:

Add following to your `package.json`:

```
"scripts": {
  "db-migrate": "db-migrate",
  "db-rollback": "db-rollback",
  "db-create": "db-create",
  "db-status": "db-status"
}
```

Create `.npmrc` and with database connection string:

```
# PostgreSQL
db_migrator_db_url=postgresql://pavel@localhost?ssl=false
# or MySQL
db_migrator_db_url=mysql://user:pass@host/db
```

Create folder for migrations, by default `migrations`.

### db-create

Run `npm run db-create description of the migration` to generate files for UP and DOWN migration and put your SQL to these files. Migration scripts name has to match pattern `timestamp-[UP|DOWN](-optional-description).sql`.

![Example migration scripts](https://raw.githubusercontent.com/Pajk/db-migrator/master/doc/db-create.png)

### db-migrate

Run `npm run db-migrate` to migrate your database to the latest version.

### db-rollback

Run `npm run db-rollback` to rollback one last migration.

### db-status

Run `npm run db-status` to see the state of your database.

![Example output of db-status](https://raw.githubusercontent.com/Pajk/db-migrator/master/doc/db-status.png)


## Configuration

Use [npm config variables](https://docs.npmjs.com/misc/config) to configure `db-migrator`.

Available options are:

* db_url: database connection string
* directory: name of the migration scripts folder (defaults to `./migrations`)
* table_name: name of the database table where to store database state (defaults to `migrations`)
* target: target migration id (timestamp)

All these variables can be set either in `package.json` under `config/db-migrator`:
```
"config": {
  "db-migrator": {
    "directory": "./db-migrations"
   }
}
```

In `.npmrc` file with `db_migrator_` or `db-migrator-` prefix:
```
db_migrator_db_url=postgresql://pavel@localhost
```

Or from the command line:
```
npm run db-status --db_migrator_table_name=version
npm run db-rollback --db-migrator-target=1452156800
```

## Custom Execution Scripts

You can write your own execution scripts for all commands mentioned in Quickstart section. It could be handy if you have more databases to maintain or you want to use database connection string which you already have somewhere (env variable, your custom config).

Look at [doc/db-migrate.js](https://github.com/Pajk/db-migrator/blob/master/doc/db-migrate.js) script to see a script where the configuration is loaded from `.env` file and migrations are run on more database instances based on selected environment (dev, staging, production).

## Common Pitfalls

* All migration scripts are executed in the same transaction scope and totally roll back in case of fail so you shouldn't put any transaction statements in your scripts.
* You should use a db user with sufficient permissions according to your script content.

## Credits

This is a fork of [pg-migrator](https://github.com/aphel-bilisim-hizmetleri/pg-migrator) library with following differences features:

  * Timestamp-based version id
  * All version ids together with time of execution are stored in the database
  * It's possible to get a list of versions migrated in the database
  * Promise coroutines together with ES6 generators are used in the codebase so at least Node.js v4 is required
  * Migration file name can contain a short description of the migration
  * Favors npm scripts (and .npmrc config file) but supports also custom execution scripts
  * MySQL support
