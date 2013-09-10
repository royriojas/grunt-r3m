var doT = require('dot');
var lib = require('./lib.js');
var path = require('path');
var format = lib.format;

module.exports = function (grunt) {
  'use strict';
  var log = grunt.log;
  var verbose = grunt.verbose;
  var gruntFile = grunt.file;

  function doReplace(outStr, currentPrefixable, pfx) {
    return outStr.replace(currentPrefixable, function (token) {
      return pfx + token;
    });
  }

  function replaceTokens(sectionFound, pfx) {
    var outStr = sectionFound;
    var prefixables = [/keyframes/gi, /transform/gi, /animation-timing-function/gi, /animation-delay/gi];
    for (var j = 0, len2 = prefixables.length; j < len2; j++) {
      var currentPrefixable = prefixables[j];
      outStr = doReplace(outStr, currentPrefixable, pfx);
    }
    return outStr;
  }

  return {

    prefixAnimationsBlock: function (sectionFound) {
      var prefixes = ['-webkit-', '-moz-', '-ms-', '-o-', ''];

      var outStr = '';
      for (var i = 0, len = prefixes.length; i < len; i++) {
        var pfx = prefixes[i];
        outStr += replaceTokens(sectionFound, pfx);
      }
      return outStr;
    },

    createMinFromRegular: function (dest) {
      var rgex = /(.+)\.(\w+)$/gi;
      return dest.replace(rgex, '$1.min.$2');
    },
    inferType: function (dest) {
      var rgex = /(.+)\.(\w+)$/gi;
      return dest.replace(rgex, '$2');
    },
    createJSAndCSSTasks: function (cfg, filesToProcess, useCSSO) {
      filesToProcess = filesToProcess || [];
      var count = 0;
      var me = this;

      filesToProcess.forEach(function (group) {
        var destination = group.dest;
        if (lib.isNull(destination)) {
          var msg = "destination on group " + group.name + " is required";
          log.error(msg);
          throw new Error(msg);
        }
        var type = group.type || me.inferType(destination);
        var groupName = group.name || ('unnamed-task-' + type + '-' + count++);

        var minifiedDestination = group.minDest || me.createMinFromRegular(destination);

        if (type === 'js') {
          var preprocess = cfg.preprocess = (cfg.preprocess || {});
          var uglify = cfg.uglify = (cfg.uglify || {});

          var task = preprocess[groupName] = {
            src: group.src,
            dest: group.dest
          };

          if (group.replacements) {
            task.replacements = group.replacements;
          }

          var ugGroup = uglify[groupName] = {
            files: {}
          };

          ugGroup.files[minifiedDestination] = [destination];

        } else if (type === 'css') {
          var cLess = cfg.cLess = (cfg.cLess || {});
          var cssmin = !useCSSO ? cfg.cssmin = (cfg.cssmin || {}) : cfg.csso = (cfg.csso || {});

          cLess[groupName] = {
            src: group.src,
            dest: group.dest,
            options: {
              yuicompress: false
            }
          };

          var minGroup = cssmin[groupName] = {
            files: {}
          };

          minGroup.files[minifiedDestination] = [destination];
        } else {
          throw new Error("Not known group type : \n" + JSON.stringify(group, null, 2));
        }
      });
    },

    compileTemplates : function (src, dest, options) {
      var opts = {
        ext : '.doT',
        fileTemplate : ';(function (window) { \n  var ns = function (ns, root) {\n    if (!ns) {\n      return null;\n    }\n    var nsParts = ns.split(".");\n    var innerRoot = root || window;\n    for (var i = 0, len = nsParts.length; i < len; i++) {\n      if (typeof innerRoot[nsParts[i]] === "undefined") {\n        innerRoot[nsParts[i]] = {};\n      }\n      innerRoot = innerRoot[nsParts[i]];\n    }\n    return innerRoot;\n  };\n  \n  //[CONTENT]\n  \n}(window));',
        objNamespace : '__dotTemplates',
        normalizeName : function (filename) {
          var t = /-(.)/g;
          return filename.replace(t, function (a, b) {
            return b.toUpperCase();
          });
        }
      };

      lib.extend(opts, options);

      var sourceFiles = gruntFile.expand(src);

      var tplContent = lib.format('var obj = ns("{0}");\n', opts.objNamespace);

      sourceFiles.forEach(function (ele, i) {
        var fileName = path.basename(ele, opts.ext);
        log.writeln('compiling template : ' + fileName);

        var content = gruntFile.read(ele);

        try {
          var templateFn = doT.compile(content);
          var name = opts.normalizeName(fileName);

          tplContent += lib.format('obj["{0}"] = {1};\n', name, templateFn.toString().replace('function anonymous', 'function '));

          verbose.writeln('template ' + fileName + ': OK');
        } catch (ex) {
          //log.error('template ' + ele + ': failed to compile');
          //log.error('error: ' + ex.message);
          var message = lib.format('{0} failed : {1}. {2}', templateFn, ele, ex.message);
          throw new Error(message);
        }
      });

      gruntFile.write(dest, opts.fileTemplate.replace('//[CONTENT]', tplContent));

    },

    validateTemplates : function (templates) {

      var templateFiles = gruntFile.expand(templates);

      var passed = 0;
      var failed = 0;


      templateFiles.forEach(function (ele, i) {
        var fileName = path.basename(ele);
        log.writeln('processing template : ' + fileName);
        var content = gruntFile.read(ele);

        try {
          var template = doT.compile(content);
          verbose.writeln('template ' + ele + ': OK');
          passed++;
        } catch (ex) {
          failed++;
          log.error('template ' + ele + ': failed to compile');
          log.error('error: ' + ex.message);
        }
      });
      if (failed > 0) {
        log.error(format('Templates validating result passed: {0}, failed: {1}, total : {2}', passed, failed, passed + failed));
        return false;
      }
      log.writeln('=========================================');
      log.writeln(format('Templates processed : {0}', passed));
    }
  };
};