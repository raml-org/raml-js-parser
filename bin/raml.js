#! /usr/bin/env node

var program = require('commander');
var colorize = require('colorize');
var raml = require('../lib/raml');
var pack = require('../package.json');

var cconsole = colorize.console;

program
  .version(pack.version)

program
  .command('validate [file.raml]')
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
  .command('to-json [file.raml]')
  .description('generate a JSON representation for the specified RAML file')
  .action(function(file){
    raml.loadFile(file).then(function(data) {
    	console.log(JSON.stringify(data, null, 2));
    }, function(error) {
    	cconsole.log("#red[" + error + "]");
    });
  });

program
  .command('resources [file.raml]')
  .description('generate a list of resources in the file')
  .action(function(file){
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
        line += " at #grey[" + resource.line + "," + resource.column + "]:";
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
        cconsole.log(line);
    	});
    }, function(error) {
    	cconsole.log("#red[" + error + "]");
    });
  });
    
program.parse(process.argv);