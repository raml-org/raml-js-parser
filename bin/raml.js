#! /usr/bin/env node

var program = require('commander');
var colorize = require('colorize');
var raml = require('../lib/raml');
var pack = require('../package.json');

var cconsole = colorize.console;

program
  .version(pack.version)

program
  .command('validate [api.raml]')
  .description('validate RAML file against 0.1 version of the specification')
  .action(function(file){
		cconsole.log("Validating #blue[%s]...", file);
    raml.loadFile(file).then(function(data) {
    	cconsole.log("#green[OK]");
    }, function(error) {
    	cconsole.log("#red[" + error + "]");
    });
  });

program
  .command('to-json [api.raml]')
  .option('-p, --pretty', 'pretty print JSON')
  .description('generate a JSON representation for the specified RAML file')
  .action(function(file, args){
    raml.loadFile(file).then(function(data) {
      if( args.pretty ) {
        console.log(JSON.stringify(data, null, 2));
      } else {
        console.log(data);
      }
    }, function(error) {
    	cconsole.log("#red[" + error + "]");
    });
  });

program
  .command('resources [api.raml]')
  .option('-m, --methods', 'list methods for each resource')
  .option('-l, --location', 'show the name of the source file under which the resource was declared')
  .description('generate a list of resources in the file')
  .action(function(file, args) {
    raml.resourcesFile(file).then(function(resources) {
      maxUriLength = 0;
    	resources.forEach( function(resource) {
        if( resource.uri.length > maxUriLength ) {
          maxUriLength = resource.uri.length
        }
      });
    	resources.forEach( function(resource) {
    	  line = "#white[" + resource.uri + "]";
        if( resource.uri.length < maxUriLength ) {
          // pad
          line += Array(maxUriLength - resource.uri.length + 1).join(' ');
        }
        if( args.location ) {
          line += " at";
          if( resource.src != null )
             line += " " + resource.src;
          line += "(#grey[" + resource.line + "," + resource.column + "])";
          if( args.methods ) {
            line += ":";
          }
        }
        if( args.methods ) {
          if (resource.methods.indexOf("get") != -1) {
              line += " #blue[GET]";
          }
          if (resource.methods.indexOf("post") != -1) {
              line += " #yellow[POST]";
          }
          if (resource.methods.indexOf("put") != -1) {
              line += " #green[PUT]";
          }
          if (resource.methods.indexOf("patch") != -1) {
              line += " #cyan[PATCH]";
          }
          if (resource.methods.indexOf("delete") != -1) {
              line += " #red[DELETE]";
          }
          if (resource.methods.indexOf("options") != -1) {
              line += " #white[OPTIONS]";
          }
          if (resource.methods.indexOf("head") != -1) {
              line += " #magenta[HEAD]";
          }
        }
        cconsole.log(line);
    	});
    }, function(error) {
    	cconsole.log("#red[" + error + "]");
    });
  });
    
program.parse(process.argv);