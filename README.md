
grunt-r3m
==========

This is a very tiny set of tasks for grunt. It contains:

- grunt-less. Same as the original grunt-less, but it handles the copy and override of the resources to the folder of the output file
- clean-css. A wrapper of clean-css to be used in grunt
- html-copy. A task to process and replace special tokens in the html files and to remove html comments. It kinda minimize html files

Getting Started
---------------

Install this grunt plugin next to your project's [grunt.js gruntfile][getting_started] with: `npm install grunt-r3m`

Then add this line to your project's `grunt.js` gruntfile:

```javascript
grunt.loadNpmTasks('grunt-r3m');
```

[npm_registry_page]: http://search.npmjs.org/#/grunt-r3m
[grunt]: https://github.com/cowboy/grunt
[getting_started]: https://github.com/cowboy/grunt/blob/master/docs/getting_started.md

Documentation
-------------

These tasks are [multi task][types_of_tasks], meaning that grunt will automatically iterate over all `less`, `cleanCSS` and `HTMLCopy` targets if a target is not specified.

less task

### Target Properties
*   __src__*(required)*: The LESS file(s) to be compiled. Can be either a string or an array of strings. If more than one LESS file is provided, each LESS file will be compiled individually and then concatenated together.
*   __dest__*(required)*: The path where the output from the LESS compilation should be placed. Must be a string as there can be only one destination.
*   __options__*(optional)*: An object of LESS options. As of right now, the only options supported are `compress` and `yuicompress`.

### Example

```javascript
// project configuration
grunt.initConfig({
  less: {
    signup: {
      src: 'signup.less',
      dest: 'signup.css'
    },
    homepage: {
      src: ['banner.less', 'app.less'],
      dest: 'homepage.css',
      options: {
        yuicompress: true
      }
    },
    all: {
      src: '*.less',
      dest: 'all.css',
      options: {
        compress: true
      }
    }
  }
});
```

cleanCss task

### Target Properties
*   __src__*(required)*: The css file(s) to be minimized. Can be either a string or an array of strings. If more than one css file is provided they are going to be concatenated together.
*   __dest__*(required)*: The path where the output from the css minification should be placed. Must be a string as there can be only one destination.

### Example

```javascript
// project configuration
grunt.initConfig({
  cleanCss : {
    app : {
      src : ['<config:less.app.dest>'],
      dest : CSS_DEPLOY_PATH+'<%= pkg.name %>.app.min.css'
    },
    cabin : {
      src : ['<config:less.cabin.dest>'],
      dest : CSS_DEPLOY_PATH + '/cabin.css'
    }
  }
});
```

HTMLCopy task

### Target Properties
*   __src__*(required)*: The file to be processed.
*   __dest__*(required)*: The path where the output should be placed. 
*   __options__*(required)*: some configuration options to use like removeHTMLComments, enable include statements, and replacements to be processed. Take a look at the example below 

### Example

```javascript
// project configuration
grunt.initConfig({
  HTMLCopy : {
    prod : {
      src : [BASE_SOURCE_DIR  + 'index.html'],
      dest : BASE_DEPLOY_PATH + 'index.html',
      options : {
        removeHTMLComments : true, // remove the html comments
        includes : {
          enabled : ['CHROME_FRAME', 'GOOGLE_ANALITICS'] // the ids of the include statements that are going to be processed. Only the ids of the statements included here will be processed. This will likely change to add in the statement itself the name of the tasks where the directive should be processed
        },
        replacements : { //tokens to be replaced in the template file
          'REQUIRE_OOBE' : 'require-oobe',
          "LIB_CSS" : LIB_CSS_MIN,
          "MODERNIZR" : MODERNIZR_MIN,
          "LIB_JQUERY" : LIB_JQUERY_MIN,
          "LIB_JQUERY_UI" : LIB_JQUERY_UI_MIN,
          "LIB_JQUERY_EXT" : LIB_JQUERY_EXT_MIN,
          "LIB_JQUERY_UI_EXT" : LIB_JQUERY_UI_EXT_MIN,
          "LAB" : LAB_MIN,
          "LIB_JS" : LIB_JS_MIN,
          "LIB_APP_JS" : LIB_APP_JS_MIN,
          "APP_JS" : APP_JS_MIN,
          "APP_CSS" : APP_CSS_MIN,
          "LOADER_FILE" : LOADER_FILE_MIN,
          "I18N_PATTERN" : I18N_PATTERN
        }
      }
    },
    dev : {
      src : [BASE_SOURCE_DIR  + 'index.html'],
      dest : BASE_DEPLOY_PATH + 'index.html',
      options : {
        includes : {
          enabled : ['CHROME_FRAME']
        },
        replacements : {
          'REQUIRE_OOBE' : 'require-oobe',
          "LIB_CSS" : LIB_CSS,
          "MODERNIZR" : MODERNIZR,
          "LIB_JQUERY" : LIB_JQUERY,
          "LIB_JQUERY_UI" : LIB_JQUERY_UI,
          "LIB_JQUERY_EXT" : LIB_JQUERY_EXT,
          "LIB_JQUERY_UI_EXT" : LIB_JQUERY_UI_EXT,
          "LAB" : LAB,
          "LIB_JS" : LIB_JS,
          "LIB_APP_JS" : LIB_APP_JS,
          "APP_JS" : APP_JS,
          "APP_CSS" : APP_CSS,
          "LOADER_FILE" : LOADER_FILE,
          "I18N_PATTERN" : I18N_PATTERN
        }
      }
    }
  }
});
```



[types_of_tasks]: https://github.com/cowboy/grunt/blob/master/docs/types_of_tasks.md

Contributing
------------

In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [grunt][grunt].

Release History
---------------
*   __04/04/2012 - 0.1.1__: Added some documentation.
*   __04/04/2012 - 0.1.0__: Initial release.

License
-------

Copyright (c) 2012 Roy Riojas  
This is based on the original grunt-less task
Licensed under the MIT license.
