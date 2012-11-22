module.exports = function(grunt) {
  'use strict';
  var file = grunt.file;
  var utils = grunt.utils;

  // external dependencies
  var fs = require('fs');
  var path = require('path');
  var cleanCSS = require('clean-css');

  var url = require('url');

  grunt.registerHelper('cleanCss', function(srcFiles, options, callback) {
    var processCssResource = function (src, callback) {
      // read source file
      fs.readFile(src, 'utf8', function(err, data) {
        if (err) {
          callback(err);
        }
        data = cleanCSS.process(data);
        callback(null, data);
      });
    };

    utils.async.map(srcFiles, processCssResource, function(err, results) {
      if (err) {
        callback(err);
        return;
      }

      callback(null, results.join(utils.linefeed));
    });
  });


  grunt.registerMultiTask('cleanCss', 'Minify CSS using clean-css', function () {
    //grunt.file.read(this.data.src);

    //var outStr = cleanCSS.process(outStr);
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
    var done = this.async();

    grunt.helper('cleanCss', srcFiles, options, function(err, css) {
      if (err) {
        grunt.warn(err);
        done(false);

        return;
      }

      file.write(dest, css);
      done();
    });

  });

};