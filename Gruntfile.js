module.exports = function (grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    coffee: {
      files: {
        expand: true,
        flatten: true,
        src: 'src/*.coffee',
        dest: 'lib',
        ext: '.js'
      }
    },

    watch: {
      coffee: {
        files: ['src/*.coffee'],
        tasks: ['coffee']
      },
      javascript: {
        files: ['lib/*.js', 'src/browserify.js'],
        tasks: ['browserify']
      }
    },

    browserify: {
      'dist/raml-parser.js': ['src/browserify.js', 'lib/*.js', 'node_modules/q/q.js']
    },

    uglify: {
      options: {
        mangle: {
          except: ['RAML', 'Q']
        }
      },

      javascript: {
        files: {
          'dist/raml-parser.min.js': ['dist/raml-parser.js']
        }
      }
    },

    connect: {
      server: {
        options: {
          port: 9001,
          base: '.'
        }
      }
    },

    mocha_phantomjs: {
      all: {
        options: {
          urls: [
            'http://localhost:9001/test/specs/parser.html'
          ],
          reporter: 'dot'
        }
      }
    },

    mochacli: {
      options: {
        require: ['chai', 'chai-as-promised'],
        reporter: 'dot',
        bail: true
      },
      all: ['test/specs/*.js']
    },

    coffeelint: {
      app: ['src/*.coffee'],
      options: {
        max_line_length: {
          level: 'ignore'
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-coffeelint');
  grunt.loadNpmTasks('grunt-contrib-coffee');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-mocha-cli');
  grunt.loadNpmTasks('grunt-mocha-phantomjs');

  grunt.registerTask('compile', ['coffeelint', 'coffee']);
  grunt.registerTask('test', ['default', 'connect', 'mochacli', 'mocha_phantomjs']);
  grunt.registerTask('test-ui-only', ['coffee', 'browserify', 'uglify', 'connect', 'mocha_phantomjs']);
  grunt.registerTask('server', ['default', 'connect', 'watch']);

  grunt.registerTask('default', ['coffeelint', 'coffee', 'browserify', 'uglify']);
};
