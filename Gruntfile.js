module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    coffee: {
      compile: {
          files: {
            'lib/composer.js': 'src/composer.coffee',
            'lib/construct.js': 'src/construct.coffee',
            'lib/errors.js': 'src/errors.coffee',
            'lib/events.js': 'src/events.coffee',
            'lib/loader.js': 'src/loader.coffee',
            'lib/nodes.js': 'src/nodes.coffee',
            'lib/parser.js': 'src/parser.coffee',
            'lib/reader.js': 'src/reader.coffee',
            'lib/resolver.js': 'src/resolver.coffee',
            'lib/scanner.js': 'src/scanner.coffee',
            'lib/validator.js': 'src/validator.coffee',
            'lib/tokens.js': 'src/tokens.coffee',
            'lib/util.js': 'src/util.coffee',
            'lib/traits.js': 'src/traits.coffee',
            'lib/joiner.js': 'src/joiner.coffee',            
            'lib/raml.js': 'src/raml.coffee'
          }
        }      
    },
    browserify: {
      'dist/raml-parser.js': ['src/browserify.js', 'lib/*.js', 'node_modules/q/q.js']
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
          base: '.',
        }
      }
    },
    mocha_phantomjs: {
      all: {
        options: {
          urls: [
            'http://localhost:9001/test/parser.html'
          ]
        }
      }
    },
    mochacli: {
        options: {
            require: ['chai', 'chai-as-promised'],
            reporter: 'nyan',
            bail: true
        },
        all: ['test/parser.js', 'test/local.js']
    }        
  });
  
  grunt.loadNpmTasks('grunt-contrib-coffee');
  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-mocha-phantomjs');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-mocha-cli');

  grunt.registerTask('compile', ['coffee']);
  grunt.registerTask('default', ['coffee', 'browserify', 'uglify']);
  grunt.registerTask('test', ['coffee', 'browserify', 'uglify', 'connect', 'mochacli', 'mocha_phantomjs']);
  grunt.registerTask('server', ['default', 'connect', 'watch']);
};
