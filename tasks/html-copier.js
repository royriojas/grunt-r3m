module.exports = function(grunt) {
  'use strict';
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
  var lib = require('../lib/lib');
  var url = require('url');
  var format = lib.format;
  var trim = lib.trim;

  var commandTokenRegex = /\[\s*(\w*)\s*([\w="'-.\/\s]*)\s*\]/gi;

  function parseAttributes(c) {
    var obj = {};
    var parts = trim(c).split(' ');
    for (var i = 0, len = parts.length; i < len; i++) {
      var subParts = trim(parts[i]).split('=');
      var twoParts = subParts.length > 1;
      var value = twoParts ? trim(subParts[1]).replace(/^"|"$|^'|'$/gi, '') : '';

      if (subParts.length > 1 && value.length > 0) {
        obj[subParts[0]] = value;
      }
    }
    return obj;
  }

  function processCommand(replacements, dirOfFile, enabled, a, b, c) {
    verbose.writeln(format('Parameters found {0}, {1}, {2}', a, b, c));
    if (b === 'INCLUDE') {
      verbose.writeln('Executing INCLUDE command');
      var options = parseAttributes(c);
      var id = options.id;

      // if the INCLUDE is one of the enabled ids and the src is a valid source
      if (enabled.indexOf(id) > -1 && trim(options.src).length > 0) {
        var pathOfFile = path.normalize(path.join(dirOfFile, options.src));
        verbose.writeln('path of file to read ' + pathOfFile);
        var content = '';

        try {
          content = file.read(pathOfFile);
        }
        catch (ex) {
          verbose.warning('Error trying to read file ' + pathOfFile + ', message : ' + ex.message);
        }

        return trim(content);
      }
      else {
        return "";
      }
    }

    return trim(replacements[b]);
  }

  function parseReplacements(data, replacements, dirOfFile, enabled) {
    /*for (var i = 0, len = replacements.length; i < len; i++) {
      var rp = replacements[i];
      data = data.replace(rp.token, rp.value);
    }*/
    data = data.replace(commandTokenRegex, function (a, b, c) {
      return processCommand(replacements, dirOfFile, enabled, a, b, c);
      //return trim(replacements[b]);
    });
    return data;
  }

  function cleanHTML(data) {
    return data.replace(/<!--([\s\S]*?)-->/gi, "");  //strip comments
  }

  grunt.registerHelper('HTMLCopier', function(srcFiles, options, callback) {
    var replacements = options.replacements || [];
    var includes = options.includes || {};
    var enabled = includes.enabled || [];

    var processCssResource = function (src, callback) {
      // read source file
      var dirOfFile = path.dirname(src);
      verbose.writeln('dirname ' + src);

      var data = file.read(src);
      if (options.removeHTMLComments) {
        data = cleanHTML(data);
      }
      data = parseReplacements(data, replacements, dirOfFile, enabled);
      callback(null, data);
    };

    utils.async.map(srcFiles, processCssResource, function(err, results) {
      if (err) {
        callback(err);
        return;
      }

      callback(null, results.join(utils.linefeed));
    });
  });


  grunt.registerMultiTask('HTMLCopy', 'process files and replace tokens inside', function () {
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

    verbose.writeln('\n\n====================');
    verbose.writeln('HTMLCopy src files = ' + srcFiles.join(', '));
    verbose.writeln('====================\n\n');

    var done = this.async();

    grunt.helper('HTMLCopier', srcFiles, options, function(err, css) {
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