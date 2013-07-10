# RAML Parser

This project contains a RAML parser capable (at this moment) to parser v0.1 version
of the RAML specification. The parser is written in CoffeeScript and its capable
of running inside NodeJS as well as in-browser.

## Usage for NodeJS

To install the package you need to do the following:

  npm install -g git+ssh://github.com/restful-api-modelling-lang/javascript-parser
  
### Parsing

Parsing a RAML file is as easy as follows:

```javascript
  var raml = require('raml-parser');
  
  var myAPI;
  raml.loadFile('myAPI.raml').then( function(data) {
    myAPI = data
  }, function(error) {
    console.log('Error parsing: ' + error);
  });
```

you can also alternatively parse from an string containing the api definition:

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
    myAPI = data
  }, function(error) {
    console.log('Error parsing: ' + error);
  });
```