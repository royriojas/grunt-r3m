'use strict';

module.exports = function(grunt) {
  'use strict';
  grunt.initConfig({
    jshint: {
      all: [ 'Gruntfile.js', 'tasks/*.js'
      ],
      options: {
        jshintrc: '.jshintrc'
      }
    },
    watch: {
      files: '<config:jshint.files>',
      tasks: 'default'
    }
  });

  // Load local tasks.
  grunt.loadTasks('tasks');

  // Default task.
  grunt.registerTask('default', 'jshint');
};
