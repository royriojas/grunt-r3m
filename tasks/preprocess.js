/*
 * based upon grunt-concat
 * https://github.com/eastkiki/grunt-concat
 *
 * Copyright (c) 2012 Dong-il Kim
 * Licensed under the MIT license.
 *
 * Modified by Roy Riojas
 */
var request = require("request"),
  fs = require("fs");
var path = require('path');
var lib = require('../lib/lib');
var trim = lib.trim;
var extend = lib.extend,
  isNull = lib.isNull;


module.exports = function(grunt) {
  'use strict';
  // Please see the grunt documentation for more information regarding task and
  // helper creation: https://github.com/cowboy/grunt/blob/master/docs/toc.md

  // ==========================================================================
  // TASKS
  // ==========================================================================
  var verbose = grunt.verbose;
  var file = grunt.file;

  var commandTokenRegex = /\[\s*(\w*)\s*([\w="'-.\/\s]*)\s*\]/gi;

  function isRemoteFile(filename) {
    return (/(?:file|https?):\/\/([a-z0-9\-]+\.)+[a-z0-9]{2,4}.*$/).test(filename);
  }
  function readRemoteFile(filename, cb) {
    request(filename, function (err, res, body) {
      if (!err && res.statusCode === 200) {
        cb(null, body);
      } else {
        cb({e:err,filepath:filename});
      }
    });
  }

  function doParse(value) {
    try {
      return JSON.parse(value);
    }
    catch(ex) {
      verbose.writeln('The value was not parsed properly. Returning it as text', ex.message, value);
      return value;
    }
  }

  function parseAttributes(c) {
    var obj = {};
    var parts = trim(c).split(' ');
    for (var i = 0, len = parts.length; i < len; i++) {
      var subParts = trim(parts[i]).split('=');
      var twoParts = subParts.length > 1;
      var value = twoParts ? trim(subParts[1]).replace(/^"|"$|^'|'$/gi, '') : '';

      if (subParts.length > 1 && value.length > 0) {
        obj[subParts[0]] = doParse(value);
      }
    }
    return obj;
  }

  function processCommand(a, b, c, dirOfFile) {
    verbose.writeln('Token found ==> ', a, b, c, dirOfFile);
    if (b === 'INCLUDE') {
      verbose.writeln('Executing INCLUDE command');
      var options = {
        removeLineBreaks : true,
        escapeQuotes : true
      };
      extend(options, parseAttributes(c));
      verbose.writeln('INCLUDE ATTRS \n', JSON.stringify(options, null, 2));

      var pathOfFile = path.normalize(path.join(dirOfFile, options.src));
      verbose.writeln('path of file to read ' + pathOfFile);

      var content = '';

      try {
        content = file.read(pathOfFile);
        if (options.removeLineBreaks) {
          content = content.replace(/(\r\n|\n|\r)/gm,"");
        }
        if (options.escapeQuotes) {
          content = content.replace(/'|"/gi,"\\$&");
        }
      }
      catch (ex) {
        //verbose.writeln('Error trying to read file ' + pathOfFile + ', message : ' + ex.message);
        grunt.verbose.error();
        throw grunt.task.taskError('Unable to read "' + pathOfFile);
      }

      return trim(content);
    }
    return a;
  }

  function findTokens(src, dirOfFile) {
    src = src.replace(commandTokenRegex, function (a, b, c) {
      return processCommand(a, b, c, dirOfFile);
    });
    return src;
  }

  function executeReplacements(src, replacements) {

    for (var i = 0, len = replacements.length; i < len; i++) {
      var current = replacements[i],
        regex = current.replace,
        replacement = current.using;

      if (isNull(regex)) {
        continue;
      }
      console.log('replacing:-----',regex,replacement);
      src = src.replace(regex,replacement);
    }
    return src;
  }

  // Concat source files and/or directives.
  grunt.registerHelper('preprocess', function(files, options) {
    options = grunt.utils._.defaults(options || {}, {
      separator: grunt.utils.linefeed
    });



    return files ? files.map(function(filepath) {
      return grunt.task.directive(filepath, function (fname) {
        var data = grunt.file.read(fname),
          dirOfFile = path.dirname(fname);

        data = findTokens(data, dirOfFile);
        data = executeReplacements(data, options.replacements || []);

        return data;
      });
    }).join(grunt.utils.normalizelf(options.separator)) : '';
  });


  grunt.registerMultiTask('preprocess', 'Concatenate files with remote supports and token parsing.', function() {
    var done = this.async();
    var self = this;

    var fnList = [];

    this.file.src.forEach(function (filename, index) {
      if (isRemoteFile(filename)) {
        fnList.push(function(cb){
          readRemoteFile(filename, cb);
        });
      } else {

        var fName = path.normalize(filename);
        grunt.verbose.writeln('======== Exploding =========');
        grunt.verbose.writeln('fName : '+ fName);
        var files = grunt.file.expandFiles(fName);
        //if (files.length === 0) {
        //grunt.verbose.error();
        //throw grunt.task.taskError('Unable to read "' + fName);
        //}
        if (files.length > 0) {
          fnList.push(function(cb) {
            var data = grunt.helper('preprocess', files, self.data);
            if (data === '') {
              cb({e:"invalid file path : " + filename, filepath:filename});
            } else {

              cb(null, data);
            }
          });
        }

      }
    });




    grunt.utils.async.parallel(fnList, function (err, results) {
      if (err) {
        grunt.verbose.error();
        throw grunt.task.taskError('Unable to read "' + err.filepath +
          '" file (Error code: ' + err.e.code + ').', err.e);
      }

      var src = results.join(self.data.separator || "");

      //src = processCommandsInResult(src);

      grunt.file.write(self.file.dest, src);

      // Fail task if errors were logged.
      if (self.errorCount) {
        done(false);
        return false;
      }

      // Otherwise, print a success message.
      grunt.log.writeln('File "' + self.file.dest + '" created.');
      done(true);
    });
  });
};