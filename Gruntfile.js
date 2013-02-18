
module.exports = function(grunt) {
  'use strict';
  grunt.initConfig({
    jshint: {
      all: [ 'Gruntfile.js', 'lib/*.js', 'tasks/*.js'
      ],
      options: {
        jshintrc: '.jshintrc'
      }
    },
    watch: {
      files: '<%= jshint.files %>',
      tasks: 'default'
    }
  });

  // Actually load this plugin's task(s).
  grunt.loadTasks('tasks');

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-jshint');

  // Default task.
  grunt.registerTask('default', 'jshint');
};
