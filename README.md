
grunt-r3m
==========

This is a very tiny set of tasks for grunt. It contains:

preprocess: a tiny utility to concat files, and execute string replacements during concatenation.
cLess: a tiny utility that uses less to parse less files, and concatenate them along with regular css files
appart from concat files this utility also replace the relative urls of the assets referenced by the less files while
moving them to a folder called assets/ which is relative to the output file


Getting Started
---------------

Install this grunt plugin next to your project's [Gruntfile.js gruntfile][getting_started] with: `npm install
grunt-r3m --save-dev`

Then add this line to your project's `grunt.js` gruntfile:

```javascript
grunt.loadNpmTasks('grunt-r3m');
```

[npm_registry_page]: http://search.npmjs.org/#/grunt-r3m
[grunt]: https://github.com/cowboy/grunt
[getting_started]: https://github.com/cowboy/grunt/blob/master/docs/getting_started.md

Documentation
-------------

These tasks are [multi task][types_of_tasks], meaning that grunt will automatically iterate over all `cLess` and
`preprocess` targets if a target is not specified.

cLess task

### Target Properties
*   __src__*(required)*: The LESS file(s) to be compiled. Can be either a string or an array of strings. If more than one LESS file is provided, each LESS file will be compiled individually and then concatenated together.
*   __dest__*(required)*: The path where the output from the LESS compilation should be placed. Must be a string as there can be only one destination.
*   __options__*(optional)*: An object of LESS options. As of right now, the only options supported are `compress` and `yuicompress`.

### Example

```javascript
// project configuration
grunt.initConfig({
  cLess: {
    signup: {
      src: 'signup.less',
      dest: 'signup.css'
    },
    homepage: {
      src: ['banner.less', 'app.less', 'some.css'],
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
preprocess task

### Target Properties
*   __src__*(required)*: The file to be processed.
*   __dest__*(required)*: The path where the output should be placed.
*   __options__*(required)*: some configuration options to use like removeHTMLComments, enable include statements, and replacements to be processed. Take a look at the example below

### Example

```javascript
// project configuration
grunt.initConfig({
  preprocess: {
    options : {
      // this regular expression is used to parse the INCLUDE commands
      // which are used to include the contents of other files inside the 
      // preprocessed files
      // something like this 
      // 
      // var tpl = '[INCLUDE src="../templates/templates.doT"]';
      // 
      // if not specified the tokenRegex is as the one shown below
      tokenRegex : /\[\s*(\w*)\s*([\w="'-.\/\s]*)\s*\]/gi
    },
    app: {
      src: ['path/to/some/file.js', 'path/to/more/files/**/*.js'],
      dest: 'path/to/some/deploy/file.js',
      replacements : [{
        replace : '[APP_VERSION]', // could be a regular expression too
        using : function (fileProps, a, b, c) {
          /*
            fileProps is a JSON object with path and dir properties
            where path is the path of the current processing file and
            the dir the is the dir of the current processed file.

            fileProps = { path : 'path/of/file.js', dir : 'path/of/' }

            a, b, c, d ==> are the default arguments of the replace function
            where a is the current text matched and b the first capture group
          */
          // where the token [APP_VERSION] is found
          // replace it with pkg.version
          return pkg.version;
        }
      }]
    },
    appLoader: {
      src: ['path/to/several/files/**/*.js'],
      dest: 'path/to/out-put.js',
      replacements : [{
        replace : /\/\/<editor-fold desc="test-region">[\s\S.]*\/\/<\/editor-fold>/,
        //remove code that is only for testing purposes and which is inside the editor-fold region
        using : '//CODE FOR TESTING REMOVED' // here we can use a string too, not only a function
      }]
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
*   __02/18/2013 - 0.1.8__: Added some documentation.
*   __04/04/2012 - 0.1.0__: Initial release.

License
-------

Copyright (c) 2012 Roy Riojas
This is based on the original grunt-less task
Licensed under the MIT license.

