var doT = require('dot');
var lib = require('./lib.js');
var path = require('path');
var format = lib.format;

module.exports = function (grunt) {
  var log = grunt.log;
  var verbose = grunt.verbose;
  var gruntFile = grunt.file;


  return {
    createMinFromRegular: function (dest) {
      var rgex = /(.+)\.(\w+)$/gi;
      return dest.replace(rgex, '$1.min.$2');
    },
    inferType: function (dest) {
      var rgex = /(.+)\.(\w+)$/gi;
      return dest.replace(rgex, '$2');
    },
    createJSAndCSSTasks: function (cfg, filesToProcess) {
      filesToProcess = filesToProcess || [];
      var count = 0;
      var me = this;

      filesToProcess.forEach(function (group) {
        var destination = group.dest;
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
          var cssmin = cfg.cssmin = (cfg.cssmin || {});

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