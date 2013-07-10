# RAML Parser

This project contains a RAML parser capable (at this moment) to parser v0.1 version
of the RAML specification. The parser is written in CoffeeScript and its capable
of running inside NodeJS as well as in-browser.

## Installation

To install the package you need to do the following:

```
npm install -g git+ssh://github.com/restful-api-modelling-lang/javascript-parser
```

This is only required for use within NodeJS or if you want to install the command line utility.

## Command Line Utility

The RAML parser comes with a custom command line tool that can be used
in scripts for doing a bunch of repetitive tasks related to RAML.

### Validating RAML Syntax

The command line utility can be used for validating the syntax of a RAML
file as follows:

```
raml validate myAPI.raml
```

if it succeds you see something like the following:

```
Validating myAPI.raml
OK
```

otherwise it will fail with a message containing an explanation on the error

### Generate a JSON representation of the RAML file

The command line utility also provides a way to generate a JSON representation
of the RAML file. This JSON representation has already all traits factored in
and all the !includes already processed.

You can invoke this sub-command as follows:

```
raml to-json myAPI.raml
```

## Usage for NodeJS
  
### Load

Loading a RAML file is as easy as follows:

```javascript
  var raml = require('raml-parser');
  
  raml.loadFile('myAPI.raml').then( function(data) {
    console.log(data);
  }, function(error) {
    console.log('Error parsing: ' + error);
  });
```

you can also alternatively load from a string containing the api definition:

```javascript
  var raml = require('raml-parser');
  
  var definition = [
    '---',
    'title: MyApi',
    'baseUri: http://myapi.com',
    '/:',
    '  name: Root'
  ].join('\n');
  
  raml.load(definition).then( function(data) {
    console.log(data);
  }, function(error) {
    console.log('Error parsing: ' + error);
  });
```

### Abstract Syntax Tree

Generating an AST from a RAML file is as easy as follows:

```javascript
  var raml = require('raml-parser');
  
  var myAPI;
  raml.composeFile('myAPI.raml').then( function(rootNode) {
    console.log('Root Node: ' + rootNode)
  }, function(error) {
    console.log('Error parsing: ' + error);
  });
```

you can also alternatively generate an AST from a string containing the api definition:

```javascript
  var raml = require('raml-parser');
  
  var definition = [
    '---',
    'title: MyApi',
    'baseUri: http://myapi.com',
    '/:',
    '  name: Root'
  ].join('\n');
  
  raml.compose(definition).then( function(rootNode) {
    console.log('Root Node: ' + rootNode)
  }, function(error) {
    console.log('Error parsing: ' + error);
  });
```

## Usage for In-Browser

Using the RAML parser from inside the browser requires the user to actually
include the RAML javascript file in a script tag as follows:

```html
<script src="raml-parser.min.js"></script>
```

from there on the usage is pretty much the same as NodeJS, the script
defines a *RAML.Parser* object globally which can be used as follows:

```html
RAML.Parser.loadFile('http://localhost:9001/myAPI.raml').then( function(data) {
  console.log(data)
}, function(error) {
  console.log('Error parsing: ' + error);
});
```

Notice that the in-browser version can fetch remote API definitions via XHR.