'use strict'

const colors = require('../../colors')
const _ = require('lodash')

const UP = 1

function MigratorService (scriptService, versionService, messages) {
  this._scriptService = scriptService
  this._versionService = versionService
  this._messages = messages
}

MigratorService.prototype.constructor = MigratorService

MigratorService.prototype.migrate = async function(
  currentPath,
  targetVersion
) {
  const scriptVersions = this._scriptService.getList(currentPath, UP)
  const dbVersions = await this._versionService.getAll()

  if (scriptVersions.length == 0) {
    throw this._messages.MIGRATION_SCRIPT_NOT_FOUND
  }

  const currentVersion = await this._versionService.getLastVersion()

  if (targetVersion == 0) {
    targetVersion = this._scriptService.getNewestVersion(scriptVersions)
  } else if (targetVersion === '+1') {
    targetVersion = this._scriptService.getNextVersion(
      scriptVersions,
      currentVersion
    )
  } else {
    if (
      this._scriptService.versionExists(scriptVersions, targetVersion) == false
    ) {
      throw this._messages.INVALID_TARGET_VERSION + targetVersion
    }

    if (currentVersion > targetVersion) {
      throw 'Cannot migrate to older version. Current: ' +
        currentVersion +
        ', target: ' +
        targetVersion +
        '.'
    }
  }

  console.log(
    colors.verbose(
      this._messages.CURRENT_VERSION +
        (currentVersion ? currentVersion : this._messages.INITIAL_STATE)
    )
  )
  console.log(
    colors.verbose(
      this._messages.TARGET_VERSION +
        (targetVersion ? targetVersion : this._messages.INITIAL_STATE)
    )
  )

  const migrateVersions = _.filter(scriptVersions, function (v) {
    return typeof dbVersions[v.version] === 'undefined' &&
      (v.version <= targetVersion || v.version <= currentVersion)
  })

  if (migrateVersions.length == 0) {
    console.log(colors.warn(this._messages.ALREADY_MIGRATED))
    return currentVersion
  }

  for (const v of migrateVersions) {
    await this._migrateVersion(v)
  }

  return targetVersion
}

MigratorService.prototype._migrateVersion = async function(
  versionInfo
) {
  const fileContent = this._scriptService.get(versionInfo.path)

  console.log(
    colors.grey('--------------------------------------------------')
  )
  console.log(colors.white(fileContent))

  await this._scriptService.execute(fileContent)

  console.log(colors.info(versionInfo.name + '.sql executed'))
  console.log(
    colors.grey('--------------------------------------------------')
  )

  await this._versionService.addVersion(
    versionInfo.version,
    versionInfo.description
  )
}

module.exports = MigratorService
