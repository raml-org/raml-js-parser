"use strict";

function itShouldBehaveLikeAnOptionalStructureNamedParameter(initialRaml) {
  function generateRaml(snippetRaml) {
    var indentation = '  ' + initialRaml.split("\n").slice(-1)[0].match(/^(\s*)/)[1]
    snippetRaml = snippetRaml.map(function(line) {
      return indentation + line;
    });

    return initialRaml + "\n" + snippetRaml.join("\n")
  };

  it('should succeed when given a "displayName?" property', function(done) {
    var definition = generateRaml(['displayName?: Display Name']);
    raml.load(definition).should.be.fulfilled.and.notify(done);
  });

  it('should succeed when given a "description?" property', function(done) {
    var definition = generateRaml(['description?: A description of the header']);
    raml.load(definition).should.be.fulfilled.and.notify(done);
  });

  it('should succeed when given a "type?" property', function(done) {
    var definition = generateRaml(['type?: integer']);
    raml.load(definition).should.be.fulfilled.and.notify(done);
  });

  it('should succeed when given a "enum?" property', function(done) {
    var definition = generateRaml(['enum?: ["one-value", "another-value"]']);
    raml.load(definition).should.be.fulfilled.and.notify(done);
  });

  it('should succeed when given a "pattern?" property', function(done) {
    var definition = generateRaml(['pattern?: ']);
    raml.load(definition).should.be.fulfilled.and.notify(done);
  });

  it('should succeed when given a "minLength?" property', function(done) {
    var definition = generateRaml(['minLength?: 3']);
    raml.load(definition).should.be.fulfilled.and.notify(done);
  });

  it('should succeed when given a "maxLength?" property', function(done) {
    var definition = generateRaml(['maxLength?: 16']);
    raml.load(definition).should.be.fulfilled.and.notify(done);
  });

  it('should succeed when given a "minimum?" property', function(done) {
    var definition = generateRaml(['minimum?: 20']);
    raml.load(definition).should.be.fulfilled.and.notify(done);
  });

  it('should succeed when given a "maximum?" property', function(done) {
    var definition = generateRaml(['maximum?: 100']);
    raml.load(definition).should.be.fulfilled.and.notify(done);
  });

  it('should succeed when given a "example?" property', function(done) {
    var definition = generateRaml(['example?: 5']);
    raml.load(definition).should.be.fulfilled.and.notify(done);
  });

  it('should succeed when given a "repeat?" property', function(done) {
    var definition = generateRaml(['repeat?: true']);
    raml.load(definition).should.be.fulfilled.and.notify(done);
  });

  it('should succeed when given a "required?" property', function(done) {
    var definition = generateRaml(['required?: true']);
    raml.load(definition).should.be.fulfilled.and.notify(done);
  });

  it('should succeed when given a "default?" property', function(done) {
    var definition = generateRaml(['default?: Untitled']);
    raml.load(definition).should.be.fulfilled.and.notify(done);
  });
};

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

    it('should succeed when given a "uriParameters" property (does not complain about being unused)', function(done) {
      var definition = resourceTypeSnippet([
        'uriParameters:',
        '  someUriParameter:',
        '    displayName: User ID',
        '    type: integer',
      ]);
      raml.load(definition).should.be.fulfilled.and.notify(done);
    });

    it('should succeed when given a "baseUriParameters" property', function(done) {
      var definition = topLevelSnippetAndResourceTypeSnippet([
        'baseUri: https://{apiSubdomain}.example.com/',
      ], [
        'baseUriParameters:',
        '  apiSubdomain:',
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

      describe('method properties', function() {
        it('should succeed when given a "description" property', function(done) {
          var definition = resourceTypeSnippet([
            'get:',
            '  description: A description of the get, if it exists',
          ]);
          raml.load(definition).should.be.fulfilled.and.notify(done);
        });

        it('should succeed when given a "headers" property', function(done) {
          var definition = resourceTypeSnippet([
            'get:',
            '  headers: !!null',
          ]);
          raml.load(definition).should.be.fulfilled.and.notify(done);
        });

        it.skip('should succeed when given a "protocols" property', function(done) {
          var definition = resourceTypeSnippet([
            'get:',
            '  protocols: [HTTPS]',
          ]);
          raml.load(definition).should.be.fulfilled.and.notify(done);
        });

        it('should succeed when given a "queryParameters" property', function(done) {
          var definition = resourceTypeSnippet([
            'get:',
            '  queryParameters: !!null',
          ]);
          raml.load(definition).should.be.fulfilled.and.notify(done);
        });

        it('should succeed when given a "body" property', function(done) {
          var definition = resourceTypeSnippet([
            'get:',
            '  body: !!null',
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
        '      description: Some description',
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

  describe('Optional Properties', function() {
    it('should succeed when given a "displayName?" property', function(done) {
      var definition = resourceTypeSnippet([ 'displayName?: Display Name']);
      raml.load(definition).should.be.fulfilled.and.notify(done);
    });

    it('should succeed when given a "description?" property', function(done) {
      var definition = resourceTypeSnippet([ 'description?: Description text']);
      raml.load(definition).should.be.fulfilled.and.notify(done);
    });

    describe('uriParameters', function() {
      it('should succeed when given a "uriParameters?" property', function(done) {
        var definition = resourceTypeSnippet([
          'uriParameters?:',
          '  someUriParameter:',
          '    displayName: User ID',
          '    type: integer',
        ]);
        raml.load(definition).should.be.fulfilled.and.notify(done);
      });

      describe('uriParameters properties and sub-properties', function() {
        it('should succeed when given a uri parameter ending with ?', function(done) {
          var definition = resourceTypeSnippet([
            'uriParameters:',
            '  someUriParameter?:',
            '    displayName: User ID',
            '    type: integer',
          ]);
          raml.load(definition).should.be.fulfilled.and.notify(done);
        });

        itShouldBehaveLikeAnOptionalStructureNamedParameter(
          resourceTypeSnippet([
            'uriParameters:',
            '  someUriParameter:',
          ])
        );
      });
    });

    describe('baseUriParameters', function() {
      it.skip('should fail when given a base uri parameter that is not defined', function(done) {
        var definition = topLevelSnippetAndResourceTypeSnippet([
          'baseUri: https://api.example.com/',
        ], [
          'baseUriParameters?:',
          '  apiSubdomain:',
          '    enum: [ "api-content" ]',
        ]);
        raml.load(definition).should.be.rejected.with(/uri parameter unused/).and.notify(done);
      });

      it('should succeed when given a "baseUriParameters?" property', function(done) {
        var definition = topLevelSnippetAndResourceTypeSnippet([
          'baseUri: https://{apiSubdomain}.example.com/',
        ], [
          'baseUriParameters?:',
          '  apiSubdomain:',
          '    enum: [ "api-content" ]',
        ]);
        raml.load(definition).should.be.fulfilled.and.notify(done);
      });

      it('should succeed when given a base uri parameter ending with ?', function(done) {
          var definition = topLevelSnippetAndResourceTypeSnippet([
            'baseUri: https://{apiSubdomain}.example.com/',
          ], [
            'baseUriParameters:',
            '  apiSubdomain?:',
            '    enum: [ "api-content" ]',
          ]);
          raml.load(definition).should.be.fulfilled.and.notify(done);
        });

        itShouldBehaveLikeAnOptionalStructureNamedParameter(
          topLevelSnippetAndResourceTypeSnippet([
            'baseUri: https://{apiSubdomain}.example.com/',
          ], [
            'baseUriParameters:',
            '  apiSubdomain:',
          ])
        );
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

      describe('method properties', function() {
        it('should succeed when given a "description?" property', function(done) {
          var definition = resourceTypeSnippet([
            'get:',
            '  description?: A description of the get, if it exists',
          ]);
          raml.load(definition).should.be.fulfilled.and.notify(done);
        });

        it('should succeed when given a "headers?" property', function(done) {
          var definition = resourceTypeSnippet([
            'get:',
            '  headers?: !!null',
          ]);
          raml.load(definition).should.be.fulfilled.and.notify(done);
        });

        describe('header properties and sub-properties', function() {
          it('should succeed when given a header containing {*} and ?');

          itShouldBehaveLikeAnOptionalStructureNamedParameter(
            resourceTypeSnippet([
              'get:',
              '  headers:',
              '    some-header:',
            ])
          );
        });

        it.skip('should succeed when given a "protocols?" property', function(done) {
          var definition = resourceTypeSnippet([
            'get:',
            '  protocols?: [HTTPS]',
          ]);
          raml.load(definition).should.be.fulfilled.and.notify(done);
        });

        it('should succeed when given a "queryParameters?" property', function(done) {
          var definition = resourceTypeSnippet([
            'get:',
            '  queryParameters?: !!null',
          ]);
          raml.load(definition).should.be.fulfilled.and.notify(done);
        });

        describe('query parameter sub-properties', function() {
          itShouldBehaveLikeAnOptionalStructureNamedParameter(
            resourceTypeSnippet([
              'get:',
              '  queryParameters:',
              '    page:',
            ])
          );
        });

        it('should succeed when given a "body?" property', function(done) {
          var definition = resourceTypeSnippet([
            'get:',
            '  body?: !!null',
          ]);
          raml.load(definition).should.be.fulfilled.and.notify(done);
        });

        describe('body form parameters', function(done) {
          it('should succeed when given a "formParameters?" property', function(done) {
            var definition = resourceTypeSnippet([
              'get:',
              '  body:',
              '    application/x-www-form-urlencoded:',
              '      formParameters?:',
              '        someFormParameter:',
              '          displayName: Some form parameter',
            ]);
            raml.load(definition).should.be.fulfilled.and.notify(done);
          });

          it('should succeed when given a form parameter with a ?', function(done) {
            var definition = resourceTypeSnippet([
              'get:',
              '  body:',
              '    application/x-www-form-urlencoded:',
              '      formParameters:',
              '        someFormParameter?:',
              '          displayName: Some form parameter',
            ]);
            raml.load(definition).should.be.fulfilled.and.notify(done);
          });

          itShouldBehaveLikeAnOptionalStructureNamedParameter(
            resourceTypeSnippet([
              'get:',
              '  body:',
              '    application/x-www-form-urlencoded:',
              '      formParameters:',
              '        someFormParameter?:',
            ])
          );
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
    it.skip('should fail unless a parameter name includes at least one non-white-space character', function(done) {
      var definition = resourceTypeSnippet([
        '<< >>: !!null',
      ]);
      // TODO Add error message
      raml.load(definition).should.be.rejected.and.notify(done);
    });

    it('should allow a parameter as a top-level key', function(done) {
      var definition = resourceTypeSnippet([
        '<<some-parameter>>: !!null',
      ]);
      raml.load(definition).should.be.fulfilled.and.notify(done);
    });

    describe('uriParameters', function() {
      it('should allow a parameter as a key', function(done) {
        var definition = resourceTypeSnippet([
          'uriParameters:',
          '  <<some-parameter>>: !!null',
        ]);
        raml.load(definition).should.be.fulfilled.and.notify(done);
      });

      it('should allow a parameter as a key beneath a uri parameter', function(done) {
        var definition = resourceTypeSnippet([
          'uriParameters:',
          '  someUriParameter:',
          '    <<some-parameter>>: !!null',
        ]);
        raml.load(definition).should.be.fulfilled.and.notify(done);
      });
    });

    describe('baseUriParameters', function() {
      it('should allow a parameter as a key', function(done) {
        var definition = topLevelSnippetAndResourceTypeSnippet([
          'baseUri: https://{apiSubdomain}.example.com/',
        ], [
          'baseUriParameters:',
          '  <<some-parameter>>: !!null',
        ]);
        raml.load(definition).should.be.fulfilled.and.notify(done);
      });

      it('should allow a parameter as a key beneath a base uri parameter', function(done) {
        var definition = topLevelSnippetAndResourceTypeSnippet([
          'baseUri: https://{apiSubdomain}.example.com/',
        ], [
          'baseUriParameters:',
          '  someUriParameter:',
          '    <<some-parameter>>: !!null',
        ]);
        raml.load(definition).should.be.fulfilled.and.notify(done);
      });
    });

    describe('methods', function() {
      ['get', 'post', 'put', 'delete', 'head', 'patch', 'options'].forEach(function(method) {
        it('should allow a parameter as a key beneath ' + method, function(done) {
          var definition = resourceTypeSnippet([
            method + ':',
            '  <<some-parameter>>: !!null',
          ]);
          raml.load(definition).should.be.fulfilled.and.notify(done);
        });
      });

      it('should allow a parameter as a key beneath "get > headers"', function(done) {
        var definition = resourceTypeSnippet([
          'get:',
          '  headers:',
          '    <<some-parameter>>: !!null',
        ]);
        raml.load(definition).should.be.fulfilled.and.notify(done);
      });

      it('should allow a parameter as a key beneath "get > headers > some-header"', function(done) {
        var definition = resourceTypeSnippet([
          'get:',
          '  headers:',
          '    some-header:',
          '      <<some-parameter>>: !!null',
        ]);
        raml.load(definition).should.be.fulfilled.and.notify(done);
      });

      it('should allow a parameter as a key beneath "get > queryParameters"', function(done) {
        var definition = resourceTypeSnippet([
          'get:',
          '  queryParameters:',
          '    <<some-parameter>>: !!null',
        ]);
        raml.load(definition).should.be.fulfilled.and.notify(done);
      });

      it('should allow a parameter as a key beneath "get > queryParameters > some-query-parameter"', function(done) {
        var definition = resourceTypeSnippet([
          'get:',
          '  queryParameters:',
          '    some-query-parameter:',
          '      <<some-parameter>>: !!null',
        ]);
        raml.load(definition).should.be.fulfilled.and.notify(done);
      });

      it('should allow a parameter as a key beneath "get > body"', function(done) {
        var definition = resourceTypeSnippet([
          'get:',
          '  body:',
          '    <<some-parameter>>: !!null',
        ]);
        raml.load(definition).should.be.fulfilled.and.notify(done);
      });
    });
  });
});








describe('Trait Validations', function() {
  var topLevelSnippetAndTraitSnippet = function(topLevelRaml, traitRaml) {
    var traitIdentation = '      '
    traitRaml = traitRaml.map(function(line) {
      return traitIdentation + line;
    });

    return [
      '%YAML 1.2',
      '%TAG ! tag:raml.org,0.2:',
      '---',
      'title: Test',
    ]
    .concat(topLevelRaml)
    .concat([
      'traits:',
      '  - secured:',
    ])
    .concat(traitRaml)
    .join('\n');
  }

  var traitSnippet = function(traitRaml) {
    return topLevelSnippetAndTraitSnippet([], traitRaml);
  }

  it('should fail when given an unknown property', function(done) {
    var definition = traitSnippet([ 'unknown: Some value']);
    raml.load(definition).should.be.rejected.with(/property: 'unknown' is invalid in a trait/).and.notify(done);
  });

  it('should fail when given an "is" property', function(done) {
    var definition = traitSnippet([ 'is: [someTrait]']);
    console.log(definition)
    raml.load(definition).should.be.rejected.with(/property: 'is' is invalid in a trait/).and.notify(done);
  });

  it('should fail when given a "type" property', function(done) {
    var definition = traitSnippet([ 'type: [someType]']);
    console.log(definition)
    raml.load(definition).should.be.rejected.with(/property: 'type' is invalid in a trait/).and.notify(done);
  });

  describe('Optional Properties', function() {
    it('should fail when given a "usage?" property', function(done) {
      var definition = traitSnippet([
        'usage?: This trait should be used for ...',
      ]);
      raml.load(definition).should.be.rejected.with(/property: 'usage\?' is invalid in a trait/).and.notify(done);
    });

    it('should fail when given a "type?" property', function(done) {
      var definition = traitSnippet([ 'type?: collection']);
      raml.load(definition).should.be.rejected.with(/property: 'type\?' is invalid in a trait/).and.notify(done);
    });

    it('should fail when given an "is?" property', function(done) {
      var definition = traitSnippet([ 'is?: [secured]']);
      raml.load(definition).should.be.rejected.with(/property: 'is\?' is invalid in a trait/).and.notify(done);
    });

    describe('method properties', function() {
      it('should succeed when given a "description?" property', function(done) {
        var definition = traitSnippet([
          'description?: A description of the get, if it exists',
        ]);
        raml.load(definition).should.be.fulfilled.and.notify(done);
      });

      it('should succeed when given a "headers?" property', function(done) {
        var definition = traitSnippet([
          'headers?: !!null',
        ]);
        raml.load(definition).should.be.fulfilled.and.notify(done);
      });

      describe('header properties and sub-properties', function() {
        it('should succeed when given a header containing {*} and ?');

        itShouldBehaveLikeAnOptionalStructureNamedParameter(
          traitSnippet([
            'headers:',
            '  some-header:',
          ])
        );
      });

      it.skip('should succeed when given a "protocols?" property', function(done) {
        var definition = traitSnippet([
          'protocols?: [HTTPS]',
        ]);
        raml.load(definition).should.be.fulfilled.and.notify(done);
      });

      it('should succeed when given a "queryParameters?" property', function(done) {
        var definition = traitSnippet([
          'queryParameters?: !!null',
        ]);
        raml.load(definition).should.be.fulfilled.and.notify(done);
      });

      describe('query parameter sub-properties', function() {
        itShouldBehaveLikeAnOptionalStructureNamedParameter(
          traitSnippet([
            'queryParameters:',
            '  page:',
          ])
        );
      });

      it('should succeed when given a "body?" property', function(done) {
        var definition = traitSnippet([
          'body?: !!null',
        ]);
        raml.load(definition).should.be.fulfilled.and.notify(done);
      });

      describe('body form parameters', function(done) {
          it('should succeed when given a "formParameters?" property', function(done) {
            var definition = traitSnippet([
              'body:',
              '  application/x-www-form-urlencoded:',
              '    formParameters?:',
              '      someFormParameter:',
              '        displayName: Some form parameter',
            ]);
            raml.load(definition).should.be.fulfilled.and.notify(done);
          });

          it('should succeed when given a form parameter with a ?', function(done) {
            var definition = traitSnippet([
              'body:',
              '  application/x-www-form-urlencoded:',
              '    formParameters:',
              '      someFormParameter?:',
              '        displayName: Some form parameter',
            ]);
            raml.load(definition).should.be.fulfilled.and.notify(done);
          });

          itShouldBehaveLikeAnOptionalStructureNamedParameter(
            traitSnippet([
              'body:',
              '  application/x-www-form-urlencoded:',
              '    formParameters:',
              '      someFormParameter?:',
            ])
          );
        });
    });
  });

  describe('Parameters', function() {
    it('should allow a parameter as a top-level key', function(done) {
      var definition = traitSnippet([
        '<<some-parameter>>: !!null',
      ]);
      raml.load(definition).should.be.fulfilled.and.notify(done);
    });

    it('should allow a parameter as a key beneath "headers"', function(done) {
      var definition = traitSnippet([
        'headers:',
        '  <<some-parameter>>: !!null',
      ]);
      raml.load(definition).should.be.fulfilled.and.notify(done);
    });

    it('should allow a parameter as a key beneath "headers > some-header"', function(done) {
      var definition = traitSnippet([
        'headers:',
        '  some-header:',
        '    <<some-parameter>>: !!null',
      ]);
      raml.load(definition).should.be.fulfilled.and.notify(done);
    });

    it('should allow a parameter as a key beneath "queryParameters"', function(done) {
      var definition = traitSnippet([
        'queryParameters:',
        '  <<some-parameter>>: !!null',
      ]);
      raml.load(definition).should.be.fulfilled.and.notify(done);
    });

    it('should allow a parameter as a key beneath "queryParameters > some-query-parameter"', function(done) {
      var definition = traitSnippet([
        'queryParameters:',
        '  some-query-parameter:',
        '    <<some-parameter>>: !!null',
      ]);
      raml.load(definition).should.be.fulfilled.and.notify(done);
    });

    it('should allow a parameter as a key beneath "body"', function(done) {
      var definition = traitSnippet([
        'body:',
        '  <<some-parameter>>: !!null',
      ]);
      raml.load(definition).should.be.fulfilled.and.notify(done);
    });
  });
});
