db-migrator
===========

The complete and easy to use database migration tool for Node.js projects.

## Features

  * Auto migration from scratch to up to date
  * Step by step forward migration
  * Step by step backward migration
  * Migrate to a specific version forward or backward
  * Subfolder deep search for migration scripts
  * All or nothing (transactional migration)

## Installation

## Quick Start

## Migration Scripts

## Common Pitfalls

* All migration scripts are executed in the same transaction scope and totally roll back in case of fail so you shouldn't put any transaction statements in your scripts.
* You should use a db user with sufficient permissions according to your script content.

## References

This is a fork of [pg-migrator](https://github.com/aphel-bilisim-hizmetleri/pg-migrator) library with following differences features:

  * Timestamp-based version id
  * All version ids together with time of execution are stored in the database
  * It's possible to get a list of versions migrated in the database
  * Promise coroutines together with ES6 generators are used in the codebase so at least Node.js v4 is required
  * Migration files can contain a short description of the migration
  * All Postgres related code is extracted to one module and support for other DBMS is coming soon
  * Favors npm scripts (and .npmrc config file) but supports also custom execution scripts
