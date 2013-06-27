module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    coffee: {
      compile: {
          files: {
            'build/composer.js': 'src/composer.coffee',
            'build/construct.js': 'src/construct.coffee',
            'build/errors.js': 'src/errors.coffee',
            'build/events.js': 'src/events.coffee',
            'build/loader.js': 'src/loader.coffee',
            'build/nodes.js': 'src/nodes.coffee',
            'build/parser.js': 'src/parser.coffee',
            'build/reader.js': 'src/reader.coffee',
            'build/resolver.js': 'src/resolver.coffee',
            'build/scanner.js': 'src/scanner.coffee',
            'build/validator.js': 'src/validator.coffee',
            'build/tokens.js': 'src/tokens.coffee',
            'build/util.js': 'src/util.coffee',
            'build/traits.js': 'src/traits.coffee',
            'build/joiner.js': 'src/joiner.coffee',            
            'build/yaml.js': 'src/yaml.coffee'
          }
        }      
    },
    browserify: {
      'dist/heaven-parser.js': ['src/browserify.js', 'build/*.js', 'node_modules/q/q.js']
    },
    watch: {
      coffee: {
        files: ['src/*.coffee'],
        tasks: ['coffee']
      },
      javascript: {
        files: ['build/*.js', 'src/browserify.js'],
        tasks: ['browserify']
      }
    },
    uglify: {
      options: {
        mangle: {
          except: ['Heaven', 'Q']
        }
      },
      javascript: {
        files: {
          'dist/heaven-parser.min.js': ['dist/heaven-parser.js']
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
    }    
  });
  
  grunt.loadNpmTasks('grunt-contrib-coffee');
  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-mocha-phantomjs');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-uglify');

  grunt.registerTask('default', ['coffee', 'browserify', 'uglify']);
  grunt.registerTask('test', ['connect', 'mocha_phantomjs']);
  grunt.registerTask('server', ['default', 'connect', 'watch']);
};
