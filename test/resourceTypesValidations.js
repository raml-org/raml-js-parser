"use strict";

describe('Resource Types Validations', function() {
  var topLevelSnippetAndResourceTypeSnippet = function(topLevelRaml, resourceTypeRaml) {
    var resourceTypeIdentation = '      '
    resourceTypeRaml = resourceTypeRaml.map(function(line) {
      return resourceTypeIdentation + line;
    });

    return [
      '%YAML 1.2',
      '%TAG ! tag:raml.org,0.2:',
      '---',
      'title: Test',
    ]
    .concat(topLevelRaml)
    .concat([
      'resourceTypes:',
      '  - collection:',
    ])
    .concat(resourceTypeRaml)
    .join('\n');
  }

  var resourceTypeSnippet = function(resourceTypeRaml) {
    return topLevelSnippetAndResourceTypeSnippet([], resourceTypeRaml);
  }

  it('should succeed when empty');

  describe('Allowed Resource Properties', function() {
    it('should succeed when given a "displayName" property', function(done) {
      var definition = resourceTypeSnippet([ 'displayName: Display Name']);
      raml.load(definition).should.be.fulfilled.and.notify(done);
    });

    it('should succeed when given a "description" property', function(done) {
      var definition = resourceTypeSnippet([ 'description: Description text']);
      raml.load(definition).should.be.fulfilled.and.notify(done);
    });

    it.skip('should succeed when given a "uriParameters" property', function(done) {
      var definition = resourceTypeSnippet([
        'uriParameters:',
        '  userId:',
        '    displayName: User ID',
        '    type: integer',
      ]);
      raml.load(definition).should.be.fulfilled.and.notify(done);
    });

    it.skip('should succeed when given a "baseUriParameters" property', function(done) {
      var definition = resourceTypeSnippet([
        'baseUriParameters:',
        '  apiDomain:',
        '    enum: [ "api-content" ]',
      ]);
      raml.load(definition).should.be.fulfilled.and.notify(done);
    });

    describe('methods', function() {
      ['get', 'post', 'put', 'delete', 'head', 'patch', 'options'].forEach(function(method) {
        it('should succeed when given a "' + method + '" method property', function(done) {
          var definition = resourceTypeSnippet([
            method + ':',
            '  summary: Summary of what a call to method does',
          ]);
          raml.load(definition).should.be.fulfilled.and.notify(done);
        });
      });
    });

    it('should succeed when given a "type" property', function(done) {
      var definition = resourceTypeSnippet([ 'type: collection']);
      raml.load(definition).should.be.fulfilled.and.notify(done);
    });

    it('should succeed when given an "is" property', function(done) {
      var definition = topLevelSnippetAndResourceTypeSnippet([
        'traits:',
        '  - secured:',
        '    protocols: ["HTTPS"]',
      ], [
        'is: [secured]',
      ]);
      raml.load(definition).should.be.fulfilled.and.notify(done);
    });
  });

  it('should fail when given a nested resource', function(done) {
    var definition = resourceTypeSnippet([
      '/resource:',
      '  get:',
      '    summary: Get',
    ]);
    raml.load(definition).should.be.rejected.with(/resource type cannot define child resources/).and.notify(done);
  });

  it('should succeed when given a usage property', function(done) {
    var definition = resourceTypeSnippet([
      'usage: This resourceType should be used for any collection of items',
    ]);
    raml.load(definition).should.be.fulfilled.and.notify(done);
  });

  it('should succeed when given a parameters property');

  describe('Optional Properties', function() {
    it('should succeed when given a "displayName?" property', function(done) {
      var definition = resourceTypeSnippet([ 'displayName?: Display Name']);
      raml.load(definition).should.be.fulfilled.and.notify(done);
    });

    it('should succeed when given a "description?" property', function(done) {
      var definition = resourceTypeSnippet([ 'description?: Description text']);
      raml.load(definition).should.be.fulfilled.and.notify(done);
    });

    it.skip('should succeed when given a "uriParameters?" property', function(done) {
      var definition = resourceTypeSnippet([
        'uriParameters?:',
        '  userId:',
        '    displayName: User ID',
        '    type: integer',
      ]);
      raml.load(definition).should.be.fulfilled.and.notify(done);
    });

    it.skip('should succeed when given a "baseUriParameters" property', function(done) {
      var definition = resourceTypeSnippet([
        'baseUriParameters:',
        '  apiDomain:',
        '    enum: [ "api-content" ]',
      ]);
      raml.load(definition).should.be.fulfilled.and.notify(done);
    });

    describe('methods', function() {
      ['get?', 'post?', 'put?', 'delete?', 'head?', 'patch?', 'options?'].forEach(function(method) {
        it('should succeed when given a "' + method + '" method property', function(done) {
          var definition = resourceTypeSnippet([
            method + ':',
            '  summary: Summary of what a call to method does',
          ]);
          raml.load(definition).should.be.fulfilled.and.notify(done);
        });
      });
    });

    it('should fail when given a "type?" property', function(done) {
      var definition = resourceTypeSnippet([ 'type?: collection']);
      raml.load(definition).should.be.rejected.with(/property: 'type\?' is invalid in a resource type/).and.notify(done);
    });

    it('should fail when given an "is?" property', function(done) {
      var definition = resourceTypeSnippet([ 'is?: [secured]']);
      raml.load(definition).should.be.rejected.with(/property: 'is\?' is invalid in a resource type/).and.notify(done);
    });

    it('should fail when given a "usage?" property', function(done) {
      var definition = resourceTypeSnippet([
        'usage?: This resourceType should be used for any collection of items',
      ]);
      raml.load(definition).should.be.rejected.with(/property: 'usage\?' is invalid in a resource type/).and.notify(done);
    });

    it('should fail when given a nested resource that ends with ?', function(done) {
      var definition = resourceTypeSnippet([
        '/resource?:',
        '  get:',
        '    summary: Get',
      ]);
      raml.load(definition).should.be.rejected.with(/resource type cannot define child resources/).and.notify(done);
    });
  });

  describe('Parameters', function() {
    it('allows parameters');
  });
});
