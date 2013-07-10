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

program.parse(process.argv);