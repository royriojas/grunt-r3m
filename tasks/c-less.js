/*
 * grunt-r3m c-less
 *
 * Based on the now deprecated grunt-less
 * original repo https://github.com/jachardi/grunt-less
 *
 * modified by royriojas@gmail.com to support copy of resources and concatenating of
 *
 * Copyright (c) 2012 Jake Harding
 * Licensed under the MIT license.
 */

module.exports = function(grunt) {
  'use strict';

  // Grunt utilities.
  var task = grunt.task;
  var file = grunt.file;
  var utils = grunt.utils;
  var log = grunt.log;
  var verbose = grunt.verbose;
  var fail = grunt.fail;
  var option = grunt.option;
  var config = grunt.config;
  var template = grunt.template;

  // external dependencies
  var fs = require('fs');
  var path = require('path');
  var less = require('less');
  var lib = require('../lib/lib');
  var url = require('url');
  var format = lib.format;
  var trim = lib.trim;
  var md5 = lib.md5;
  var addNoCache = lib.addNoCache;

  // ==========================================================================
  // TASKS
  // ==========================================================================

  grunt.registerMultiTask('less', 'Compile LESS files.', function() {
    var src = this.file.src;
    var dest = this.file.dest;
    var options = this.data.options || {};


    if (!src) {
      grunt.warn('Missing src property.');
      return false;
    }

    if (!dest) {
      grunt.warn('Missing dest property');
      return false;
    }

    var srcFiles = file.expandFiles(src);

    verbose.writeln('\n\n====================');
    verbose.writeln('Less src files = ' + srcFiles.join(', '));
    verbose.writeln('====================\n\n');

    var destDir = path.dirname(dest);

    var done = this.async();

    grunt.helper('less', srcFiles, destDir, options, function(err, css) {
      if (err) {
        grunt.warn(err);
        done(false);

        return;
      }

      file.write(dest, css);
      done();
    });
  });

  // ==========================================================================
  // HELPERS
  // ==========================================================================


  var URL_MATCHER = /url\(\s*[\'"]?\/?(.+?)[\'"]?\s*\)/gi,  //regex used to match the urls inside the less or css files
    DATA_URI_MATCHER = /^data:/gi,                          //regex to test for an url with a data uri
    PROTOCOL_MATCHER = /^http|^https:\/\//gi,               //regex to test for an url with an absolute path
    RELATIVE_TO_HOST_MATCHER = /^\//g,                      //regex to test for an url relative to the host
    IS_LESS_MATCHER = /\.less$/;

  /**
   * test if a given path is a less file
   * @param path
   * @return {Boolean}
   */
  function isLessFile (path) {
    return IS_LESS_MATCHER.test(path);
  }



  function copyFileToNewLocation (src, destDir, relativePathToFile) {
    var dirOfFile = path.dirname(src);

    var urlObj = url.parse(relativePathToFile);
    var relativePath = lib.trim(urlObj.pathname);
    var lastPart = lib.trim(urlObj.search) + lib.trim(urlObj.hash);

    if (relativePath === '') {
      throw new Error('Not a valid url');
    }

    var absolutePathToResource = path.normalize(path.join(dirOfFile,relativePath));
    var md5OfResource = md5(absolutePathToResource);
    var fName = format('{0}', path.basename(relativePath));
    var relativeOutputFn = format('assets/{1}_{0}', fName, md5OfResource);
    var newPath = path.normalize(path.join(destDir, relativeOutputFn));

    grunt.file.copy(absolutePathToResource, newPath);
    verbose.writeln(format('===> copied file from {0} to {1}', absolutePathToResource, newPath));
    var outName = relativeOutputFn + lastPart;
    verbose.writeln(format('===> url replaced from {0} to {1}', relativePathToFile, outName));
    return outName;
  }

  function checkIfNeedRewrite (b) {
    //if start with / it means it is relative to the main domain
    //if start with data:
    //TODO: this is the second time a call for a regularExpression.test fails when called too fast
    //return !DATA_URI_MATCHER.test(b) && !RELATIVE_TO_HOST_MATCHER.test(b) && !PROTOCOL_MATCHER.test(b);

    //if already an absolute path, do nothing
    return b.match(DATA_URI_MATCHER) ? false : b.match(RELATIVE_TO_HOST_MATCHER) ? false : !b.match(PROTOCOL_MATCHER);
  }

  //to avoid duplicated file names
  var folderIdx = 0,
    idx = 0;
  function rewriteURLS (ctn, src, destDir) {

    if (!lib.isNull(ctn)) {
      var first = true;
      ctn = ctn.replace(URL_MATCHER, function (a, b) {
        if (first) {
          first = false;
          folderIdx++;
          idx = 0;
        }
        b = trim(b);
        var needRewrite = checkIfNeedRewrite(b);

        if (needRewrite) {
          var pathToFile = copyFileToNewLocation(src, destDir, b, folderIdx, idx++);

          var o = format('url({0})', addNoCache(pathToFile));
          verbose.writeln(format('===> This url will be transformed : {0} ==> {1}', b, o));
          return o;
        }

        return a;
      });
    }
    return ctn;
  }


  grunt.registerHelper('less', function(srcFiles, destDir, options, callback) {
    var compileLESSFile = function (src, callback) {
      var parser = new less.Parser({
        paths: [path.dirname(src)]
      });

      var data = file.read(src);

      if (isLessFile(src)) {
        verbose.writeln('Parsing ' + src);
        // send data from source file to LESS parser to get CSS
        parser.parse(data, function (err, tree) {
          if (err) {
            callback(err);
          }

          var css = null;
          try {
            css = tree.toCSS({
              compress: options.compress,
              yuicompress: options.yuicompress
            });


            verbose.writeln('=========================================');
            verbose.writeln('Checking if require to rewrite the paths');
            css = rewriteURLS(css, src, destDir);

          } catch(e) {
            callback(e);
            return;
          }

          callback(null, css);
        });
      }
      else {
        data = rewriteURLS(data, src, destDir);
        callback(null, data);
      }

    };

    utils.async.map(srcFiles, compileLESSFile, function(err, results) {
      if (err) {
        callback(err);
        return;
      }

      callback(null, results.join(utils.linefeed));
    });
  });
};
