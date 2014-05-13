'use strict';

module.exports = generator;

var fs = require('fs');
var fse = require('fs-extra');
var node_path = require('path');
var async = require('async');
var glob = require('glob');
var ejs = require('ejs');
ejs.open = '{%';
ejs.close = '%}';


// @param {Object} options
// - template {string='default'} template name
// - override
function generator(pkg, options, callback) {
  var template = options.template || 'default';

  if (!~generator.AVAILABLE_TEMPLATES.indexOf(template)) {
    return callback(new Error('Invalid template'));
  }

  var template_root = node_path.join(__dirname, 'templates', template);
  generator._globDir(template_root, function (err, files) {
    if (err) {
      return callback(err);
    }

    generator._copyFiles(files, {
      from: template_root,
      to: options.cwd,
      data: pkg,
      override: options.override
    }, callback);
  });
};


// @param {Array} files relative files
// @param {Object} options
// - from {path}
// - to {path}
// - data {Object}
// - override 
generator._copyFiles = function(files, options, callback) {
  var from = options.from;
  var to = options.to;
  var override = options.override;
  var data = options.data;

  async.each(files, function (file, done) {
    var file_to = node_path.join(to, file);
    var file_from = node_path.join(from, file);

    if (override) {
      return generator._copyFile(file_from, file_to, data, done);
    }

    fs.exists(file_to, function (exists) {
      if (exists) {
        return done(null);
      }

      generator._copyFile(file_from, file_to, data, done);
    });

  }, callback);
};


generator._copyFile = function (from, to, data, callback) {
  generator._readAndTemplate(from, data, function (err, content) {
    if (err) {
      return callback(err);
    }

    fse.outputFile(to, content, callback);
  });
};


// Reads file and substitute with the data
generator._readAndTemplate = function (path, data, callback) {
  fs.readFile(path, function (err, content) {
    if (err) {
      return callback(err);
    }

    content = ejs.render(content.toString(), data);
    callback(null, content);
  });
};


var REGEX_FILE = /[^\/]$/;
generator._globDir = function (root, callback) {
  glob('**/*', {
    cwd: root,
    // Then, the dirs in `files` will end with a slash `/`
    mark: true
  }, function (err, files) {
    if (err) {
      return callback(err);
    }

    files = files.filter(REGEX_FILE.test, REGEX_FILE)
    callback(null, files);
  });
};


generator.AVAILABLE_TEMPLATES = [
  'default'
];

generator.AVAILABLE_LICENCES = [
  'Apache-2.0',
  'GPL-2.0',
  'MIT',
  'MPL-2.0'
];

generator.availableLicences = function() {
  return [].concat(generator.AVAILABLE_LICENCES);
};

generator.availableTemplates = function () {
  return [].concat(generator.AVAILABLE_TEMPLATES);
};
