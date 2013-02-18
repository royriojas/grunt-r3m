/*
 * based upon grunt-concat
 * https://github.com/eastkiki/grunt-concat
 *
 * Copyright (c) 2012 Dong-il Kim
 * Licensed under the MIT license.
 *
 * Modified by Roy Riojas
 */

module.exports = function(grunt) {
  'use strict';
  var
    verbose = grunt.verbose,
    request = require("request"),
    file = grunt.file,
    path = require('path'),
    preprocess = require('../lib/preprocess')(grunt);


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

  grunt.registerMultiTask('preprocess', 'Concatenate files with remote supports and token parsing.', function() {
    var self = this,
      done = self.async(),
      fnList = [],
      data = self.data || {},
      src = data.src || [],
      dest = self.data.dest;


    src.forEach(function (filename) {
      if (isRemoteFile(filename)) {
        fnList.push(function(cb){
          readRemoteFile(filename, cb);
        });
      } else {

        var fName = path.normalize(filename);

        verbose.writeln('======== Exploding =========');
        verbose.writeln('fName : '+ fName);

        var files = file.expand(fName);

        if (files.length > 0) {
          fnList.push(function(cb) {
            var data = preprocess(files, self.data);
            if (data === '') {
              cb({e:"invalid file path : " + filename, filepath:filename});
            } else {

              cb(null, data);
            }
          });
        }

      }
    });




    grunt.util.async.parallel(fnList, function (err, results) {
      if (err) {
        grunt.verbose.error();
        throw grunt.task.taskError('Unable to read "' + err.filepath +
          '" file (Error code: ' + err.e.code + ').', err.e);
      }

      var src = results.join(self.data.separator || "");

      //src = processCommandsInResult(src);

      grunt.file.write(dest, src);

      // Fail task if errors were logged.
      if (self.errorCount) {
        done(false);
        return false;
      }

      // Otherwise, print a success message.
      grunt.verbose.writeln('File "' + dest + '" created.');
      done(true);
      return true;
    });
  });
};