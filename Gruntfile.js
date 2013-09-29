module.exports = function(grunt) {

  var path = require('path');

  var srcFolder = 'vendor/assets/javascripts/angularjs/rails/resource/',
      srcFiles = ["index.js", "utils/**/*.js", "serialization.js", "resource.js"].map(function(glob) {
        return srcFolder + glob;
      });

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    meta: {
      banner: '/**\n' +
      ' * <%= pkg.description %>\n' +
      ' * @version v<%= pkg.version %> - <%= grunt.template.today("yyyy-mm-dd") %>\n' +
      ' * @link <%= pkg.homepage %>\n' +
      ' * @author <%= pkg.author %>\n' +
      ' */\n'
    },
    dirs: {
      dest: './'
    },
    concat: {
      options: {
        banner: "<%= meta.banner %>"
      },
      dist: {
        src: srcFiles,
        dest: '<%= dirs.dest %>/<%= pkg.name %>.js',
        options: {
          process: function(src, filepath) {
            return src.replace(/^\/\/= require.*\n/gm, '');
          },
        },
      }
    },
    zip: {
      '<%= dirs.dest %>/angularjs-rails-resource.zip': ['<%= dirs.dest %>/<%= pkg.name %>.js', '<%= dirs.dest %>/<%= pkg.name %>.min.js']
    },
    uglify: {
      options: {
        banner: "<%= meta.banner %>"
      },
      dist: {
        files: {
          '<%= dirs.dest %>/<%= pkg.name %>.min.js': ['<%= concat.dist.dest %>']
        }
      }
    },
    jshint: {
      files: ['gruntfile.js'],
      options: {
        // options here to override JSHint defaults
        globals: {
          angular: true
        }
      }
    },
    watch: {
      files: ['<%= jshint.files %>'],
      tasks: ['jshint', 'qunit']
    }
  });

  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-zip');

  grunt.registerTask('default', ['jshint', 'concat', 'uglify', 'zip']);

  // Provides the "bump" task.
  grunt.registerTask('bump', 'Increment version number', function() {
    var versionType = grunt.option('type');
    function bumpVersion(version, versionType) {
      var type = {patch: 2, minor: 1, major: 0},
          parts = version.split('.'),
          idx = type[versionType || 'patch'];
      parts[idx] = parseInt(parts[idx], 10) + 1;
      while(++idx < parts.length) { parts[idx] = 0; }
      return parts.join('.');
    }
    var version;
    function updateFile(file) {
      var json = grunt.file.readJSON(file);
      version = json.version = bumpVersion(json.version, versionType || 'patch');
      grunt.file.write(file, JSON.stringify(json, null, '  '));
    }
    updateFile('package.json');
    updateFile('bower.json');
    grunt.log.ok('Version bumped to ' + version);
  });

};
