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
    lib = require('../lib/lib.js'),
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
      dest = data.dest,
      options = self.options({
        tokenRegex : /\[\s*(\w*)\s*([\w="'-.\/\s]*)\s*\]/gi
      });

    //console.log(options);

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
            var data = preprocess(files, self.data, options);
            
            if (lib.isNull(data)) {
              cb({ 
                message:"invalid file path : " + filename, 
                filepath:filename
              });
              return;
            }

            if (data === '') {
              grunt.log.warn('[WARNING] possible empty file : ' + filename);
            }
            cb(null, data);
            
          });
        }

      }
    });




    grunt.util.async.parallel(fnList, function (err, results) {
      if (err) {
        console.log(err);
        grunt.log.error('Unable to read "' + err.filepath + '", error details : ' + err.message);
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