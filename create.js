var join = require('path').join;
var fs = require('fs');

function create(options) {

    var currentPath = options.path || '.';
    var currentTimestamp = Math.floor(Date.now() / 1000);
    var title = options.title;

    ['UP','DOWN'].forEach(function(direction) {

        var fileName = title ? [currentTimestamp, direction, title].join('-') : [currentTimestamp, direction].join('-');

        var path = join(currentPath, fileName + '.sql');

        log('create', join(process.cwd(), path));

        fs.writeFileSync(path, "-- " + fileName);
    })
}

function log(key, msg) {
  console.log('  \033[90m%s :\033[0m \033[36m%s\033[0m', key, msg);
}

module.exports = create;
