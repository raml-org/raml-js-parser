"use strict";

if (typeof window === 'undefined') {
  var raml = require('../lib/raml.js')
  var chai = require('chai')
    , expect = chai.expect
    , should = chai.should();
  var chaiAsPromised = require("chai-as-promised");
  chai.use(chaiAsPromised);
} else {
  var raml = RAML.Parser;
  chai.should();
}

describe('Parser', function() {
  describe('Basic Information', function(done) {
    it('should fail unsupported yaml version', function(done) {
      var definition = [
        '%YAML 1.1',
        '---',
        'title: MyApi'
      ].join('\n');

      raml.load(definition).should.be.rejected.with(/found incompatible YAML document \(version 1.2 is required\)/).and.notify(done);
    });
    it('should succeed', function(done) {
      var definition = [
        '%YAML 1.2',
        '---',
        'title: MyApi',
        'baseUri: http://myapi.com',
        '/:',
        '  name: Root'
      ].join('\n');

      raml.load(definition).should.become({ title: 'MyApi', baseUri: 'http://myapi.com', resources: [ { relativeUri: '/', name: 'Root' } ] }).and.notify(done);
    });
      it('should fail if no title', function(done) {
      var definition = [
        '---',
        'baseUri: http://myapi.com'
      ].join('\n');

      raml.load(definition).should.be.rejected.with(/missing title/).and.notify(done);
    });
      it('should fail if title is array', function(done) {
          var definition = [
              '---',
              'title: ["title", "title line 2", "title line 3"]',
              'baseUri: http://myapi.com'
          ].join('\n');

          raml.load(definition).should.be.rejected.with(/not a scalar/).and.notify(done);
      });
      it('should fail if title is mapping', function(done) {
          var definition = [
              '---',
              'title: { line 1: line 1, line 2: line 2 }',
              'baseUri: http://myapi.com'
          ].join('\n');

          raml.load(definition).should.be.rejected.with(/not a scalar/).and.notify(done);
      });
      it('should fail if title is longer than 48 chars', function(done) {
          var definition = [
              '---',
              'title: this is a very long title, it should fail the length validation for titles with an exception clearly marking it so',
              'baseUri: http://myapi.com'
          ].join('\n');

          raml.load(definition).should.be.rejected.with(/too long/).and.notify(done);
      });
      it('should allow number title', function(done) {
        var definition = [
            '---',
            'title: 54',
            'baseUri: http://myapi.com'
        ].join('\n');

        raml.load(definition).should.become({ title: 54, baseUri: 'http://myapi.com' }).and.notify(done);
      });
      it('should fail if there is a root property with wrong name', function(done) {
      var definition = [
        '---',
        'title: MyApi',
        'version: v1',
        'wrongPropertyName: http://myapi.com/{version}'
      ].join('\n');

      raml.load(definition).should.be.rejected.with(/unknown property/).and.notify(done);
    });
  });
  describe('Include', function() {
    it('should fail if include not found', function(done) {
      var definition = [
        '%YAML 1.2',
        '%TAG ! tag:raml.org,0.1:',
        '---',
        'title: !include relative.md'
      ].join('\n');

      raml.load(definition).should.be.rejected.with(/error 404|cannot find relative.md/).and.notify(done);
    });
    it('should succeed on including Markdown', function(done) {
      var definition = [
        '%TAG ! tag:raml.org,0.1:',
        '---',
        'title: MyApi',
        'documentation:',
        '  - title: Getting Started',
        '    content: !include http://localhost:9001/test/gettingstarted.md'
      ].join('\n');

      raml.load(definition).should.eventually.deep.equal({ title: 'MyApi', documentation: [ { title: 'Getting Started', content: '# Getting Started\n\nThis is a getting started guide.' } ] }).and.notify(done);
    });
    it('should succeed on including another YAML file with .yml extension', function(done) {
      var definition = [
        '%TAG ! tag:raml.org,0.1:',
        '---',
        '!include http://localhost:9001/test/external.yml'
      ].join('\n');

      raml.load(definition).should.eventually.deep.equal({ title: 'MyApi', documentation: [ { title: 'Getting Started', content: '# Getting Started\n\nThis is a getting started guide.' } ] }).and.notify(done);
    });
    it('should succeed on including another YAML file with .yaml extension', function(done) {
      var definition = [
        '%TAG ! tag:raml.org,0.1:',
        '---',
        '!include http://localhost:9001/test/external.yaml'
      ].join('\n');

      raml.load(definition).should.eventually.deep.equal({ title: 'MyApi', documentation: [ { title: 'Getting Started', content: '# Getting Started\n\nThis is a getting started guide.' } ] }).and.notify(done);
    });
    it('should succeed on including another YAML file mid-document', function(done) {
      var definition = [
          '%TAG ! tag:raml.org,0.1:',
          '---',
          'title: Test',
          'traits:',
          '  customTrait: !include http://localhost:9001/test/customtrait.yml'
      ].join('\n');

        raml.load(definition).should.eventually.deep.equal({
          title: 'Test',
          traits: {
              customTrait: {
                  name: 'Custom Trait',
                  description: 'This is a custom trait',
                  provides: {
                      get: {
                          responses: {
                              429: {
                                  description: 'API Limit Exceeded'
                              }
                          }
                      }
                  }
              }
          }
      }).and.notify(done);
    });
  });
  describe('URI Parameters', function() {
    it('should succeed when dealing with URI parameters', function(done) {
      var definition = [
        '%YAML 1.2',
        '%TAG ! tag:raml.org,0.1:',
        '---',
        'title: Test',
        'baseUri: http://{a}.myapi.org',
        'uriParameters:',
        '  a:',
        '    name: A',
        '    description: This is A',
        ''
      ].join('\n');

      raml.load(definition).should.become({
        title: 'Test',
        baseUri: 'http://{a}.myapi.org',
        uriParameters: {
          'a': {
            name: 'A',
            description: 'This is A'
          }
        }
      }).and.notify(done);
    });

    it('should fail when declaring a URI parameter not on the baseUri', function(done) {
      var definition = [
        '%YAML 1.2',
        '%TAG ! tag:raml.org,0.1:',
        '---',
        'title: Test',
        'baseUri: http://{a}.myapi.org',
        'uriParameters:',
        '  b:',
        '    name: A',
        '    description: This is A',
        ''
      ].join('\n');

      raml.load(definition).should.be.rejected.with(/uri parameter unused/).and.notify(done);
    });

    it('should fail when declaring a URI parameter not on the resource URI', function(done) {
      var definition = [
        '%YAML 1.2',
        '%TAG ! tag:raml.org,0.1:',
        '---',
        'title: Test',
        'baseUri: http://{a}.myapi.org',
        'uriParameters:',
        '  a:',
        '    name: A',
        '    description: This is A',
        '/{hello}:',
        '  uriParameters:',
        '    a:',
        '      name: A',
        '      description: This is A'
      ].join('\n');

      raml.load(definition).should.be.rejected.with(/uri parameter unused/).and.notify(done);
    });

    it('should fail when declaring a property inside a URI parameter that is not valid', function(done) {
      var definition = [
        '%YAML 1.2',
        '%TAG ! tag:raml.org,0.1:',
        '---',
        'title: Test',
        'baseUri: http://{a}.myapi.org',
        'uriParameters:',
        '  a:',
        '    name: A',
        '    description: This is A',
        '    wrongPropertyName: X'
      ].join('\n');

      raml.load(definition).should.be.rejected.with(/unknown property wrongPropertyName/).and.notify(done);
    });

    it('should succeed when declaring a minLength validation as a number', function(done) {
      var definition = [
        '%YAML 1.2',
        '%TAG ! tag:raml.org,0.1:',
        '---',
        'title: Test',
        'baseUri: http://{a}.myapi.org',
        'uriParameters:',
        '  a:',
        '    name: A',
        '    description: This is A',
        '    minLength: 123'
      ].join('\n');

      raml.load(definition).should.be.fulfilled.and.notify(done);
    });

    it('should succeed when declaring a maxLength validation as a number', function(done) {
      var definition = [
        '%YAML 1.2',
        '%TAG ! tag:raml.org,0.1:',
        '---',
        'title: Test',
        'baseUri: http://{a}.myapi.org',
        'uriParameters:',
        '  a:',
        '    name: A',
        '    description: This is A',
        '    maxLength: 123'
      ].join('\n');

      raml.load(definition).should.be.fulfilled.and.notify(done);
    });

    it('should succeed when declaring a minimum validation as a number', function(done) {
      var definition = [
        '%YAML 1.2',
        '%TAG ! tag:raml.org,0.1:',
        '---',
        'title: Test',
        'baseUri: http://{a}.myapi.org',
        'uriParameters:',
        '  a:',
        '    name: A',
        '    description: This is A',
        '    minimum: 123'
      ].join('\n');

      raml.load(definition).should.be.fulfilled.and.notify(done);
    });

    it('should succeed when declaring a maximum validation as a number', function(done) {
      var definition = [
        '%YAML 1.2',
        '%TAG ! tag:raml.org,0.1:',
        '---',
        'title: Test',
        'baseUri: http://{a}.myapi.org',
        'uriParameters:',
        '  a:',
        '    name: A',
        '    description: This is A',
        '    maximum: 123'
      ].join('\n');

      raml.load(definition).should.be.fulfilled.and.notify(done);
    });

    it('should fail when declaring a minLength validation as anything other than a number', function(done) {
      var definition = [
        '%YAML 1.2',
        '%TAG ! tag:raml.org,0.1:',
        '---',
        'title: Test',
        'baseUri: http://{a}.myapi.org',
        'uriParameters:',
        '  a:',
        '    name: A',
        '    description: This is A',
        '    minLength: X'
      ].join('\n');

      raml.load(definition).should.be.rejected.with(/the value of minLength must be a number/).and.notify(done);
    });

    it('should fail when declaring a maxLength validation as anything other than a number', function(done) {
      var definition = [
        '%YAML 1.2',
        '%TAG ! tag:raml.org,0.1:',
        '---',
        'title: Test',
        'baseUri: http://{a}.myapi.org',
        'uriParameters:',
        '  a:',
        '    name: A',
        '    description: This is A',
        '    maxLength: X'
      ].join('\n');

      raml.load(definition).should.be.rejected.with(/the value of maxLength must be a number/).and.notify(done);
    });

    it('should fail when declaring a minimum validation as anything other than a number', function(done) {
      var definition = [
        '%YAML 1.2',
        '%TAG ! tag:raml.org,0.1:',
        '---',
        'title: Test',
        'baseUri: http://{a}.myapi.org',
        'uriParameters:',
        '  a:',
        '    name: A',
        '    description: This is A',
        '    minimum: X'
      ].join('\n');

      raml.load(definition).should.be.rejected.with(/the value of minimum must be a number/).and.notify(done);
    });

    it('should fail when declaring a maximum validation as anything other than a number', function(done) {
      var definition = [
        '%YAML 1.2',
        '%TAG ! tag:raml.org,0.1:',
        '---',
        'title: Test',
        'baseUri: http://{a}.myapi.org',
        'uriParameters:',
        '  a:',
        '    name: A',
        '    description: This is A',
        '    maximum: X'
      ].join('\n');

      raml.load(definition).should.be.rejected.with(/the value of maximum must be a number/).and.notify(done);
    });

    it('should fail when declaring a URI parameter with an invalid type', function(done) {
      var definition = [
        '%YAML 1.2',
        '%TAG ! tag:raml.org,0.1:',
        '---',
        'title: Test',
        'baseUri: http://{a}.myapi.org',
        'uriParameters:',
        '  a:',
        '    name: A',
        '    description: This is A',
        '    type: X'
      ].join('\n');

      raml.load(definition).should.be.rejected.with(/type can either be: string, number, integer or date/).and.notify(done);
    });

    it('should succeed when declaring a URI parameter with a string type', function(done) {
      var definition = [
        '%YAML 1.2',
        '%TAG ! tag:raml.org,0.1:',
        '---',
        'title: Test',
        'baseUri: http://{a}.myapi.org',
        'uriParameters:',
        '  a:',
        '    name: A',
        '    description: This is A',
        '    type: string'
      ].join('\n');

      raml.load(definition).should.be.fulfilled.and.notify(done);
    });

    it('should succeed when declaring a URI parameter with a number type', function(done) {
      var definition = [
        '%YAML 1.2',
        '%TAG ! tag:raml.org,0.1:',
        '---',
        'title: Test',
        'baseUri: http://{a}.myapi.org',
        'uriParameters:',
        '  a:',
        '    name: A',
        '    description: This is A',
        '    type: number'
      ].join('\n');

      raml.load(definition).should.be.fulfilled.and.notify(done);
    });

    it('should succeed when declaring a URI parameter with a integer type', function(done) {
      var definition = [
        '%YAML 1.2',
        '%TAG ! tag:raml.org,0.1:',
        '---',
        'title: Test',
        'baseUri: http://{a}.myapi.org',
        'uriParameters:',
        '  a:',
        '    name: A',
        '    description: This is A',
        '    type: integer'
      ].join('\n');

      raml.load(definition).should.be.fulfilled.and.notify(done);
    });

    it('should succeed when declaring a URI parameter with a date type', function(done) {
      var definition = [
        '%YAML 1.2',
        '%TAG ! tag:raml.org,0.1:',
        '---',
        'title: Test',
        'baseUri: http://{a}.myapi.org',
        'uriParameters:',
        '  a:',
        '    name: A',
        '    description: This is A',
        '    type: date'
      ].join('\n');

      raml.load(definition).should.be.fulfilled.and.notify(done);
    });

    it('should fail if baseUri value its not really a URI', function(done) {
      var definition = [
        '---',
        'title: MyApi',
        'baseUri: http://{myapi.com'
      ].join('\n');

      raml.load(definition).should.be.rejected.with(/unclosed brace/).and.notify(done);
    });
    it('should fail if baseUri uses version but there is no version defined', function(done) {
      var definition = [
        '---',
        'title: MyApi',
        'baseUri: http://myapi.com/{version}'
      ].join('\n');

      raml.load(definition).should.be.rejected.with(/missing version/).and.notify(done);
    });
    it('should succeed if baseUri uses version and there is a version defined', function(done) {
      var definition = [
        '---',
        'title: MyApi',
        'version: v1',
        'baseUri: http://myapi.com/{version}'
      ].join('\n');

      var promise = raml.load(definition);
      promise.should.eventually.deep.equal({ title: 'MyApi', version: 'v1', baseUri: 'http://myapi.com/{version}' }).and.notify(done);
    });
  });
  describe('Resources', function() {
    it('should succeed extracting resource information', function(done) {
      var definition = [
        '%YAML 1.2',
        '%TAG ! tag:raml.org,0.1:',
        '---',
        'title: Test',
        '/a:',
        '  name: A',
        '  get:',
        '  /b:',
        '    name: AB',
        '    get:',
        '    put:',
        '/a/c:',
        '  name: AC',
        '  post:',
        ''
      ].join('\n');

      raml.resources(definition).should.become([
        {
          "methods": [
            "get"
          ],
          "uri": "/a",
          "name": "A",
          "line": 5,
          "column": 1
        },
        {
          "methods": [
            "get",
            "put"
          ],
          "uri": "/a/b",
          "name": "AB",
          "line": 8,
          "column": 3
        },
        {
          "methods": [
            "post"
          ],
          "uri": "/a/c",
          "name": "AC",
          "line": 12,
          "column": 1
        }
      ]).and.notify(done);
    });
    it('should fail on duplicate absolute URIs', function(done) {
      var definition = [
        '%YAML 1.2',
        '%TAG ! tag:raml.org,0.1:',
        '---',
        'title: Test',
        '/a:',
        '  name: A',
        '  /b:',
        '    name: B',
        '/a/b:',
        '  name: AB'
      ].join('\n');

      raml.load(definition).should.be.rejected.with(/two resources share same URI \/a\/b/).and.notify(done);
    });
    it('should succeed', function(done) {
      var definition = [
        '%YAML 1.2',
        '%TAG ! tag:raml.org,0.1:',
        '---',
        'title: Test',
        '/a:',
        '  name: A',
        '  /b:',
        '    name: B',
        '/a/c:',
        '  name: AC'
      ].join('\n');

      raml.load(definition).should.become({
        title: 'Test',
        resources: [
          {
            relativeUri: '/a',
            name: 'A',
            resources: [
              {
                relativeUri: '/b',
                name: 'B'
              }
            ]
          },
          {
            relativeUri: '/a/c',
            name: 'AC'
          }
        ]
      }).and.notify(done);
    });
    it('should succeed when a method is null', function(done) {
      var definition = [
          '%YAML 1.2',
          '%TAG ! tag:raml.org,0.1:',
          '---',
          'title: Test',
          '/a:',
          '  name: A',
          '  get: ~'
      ].join('\n');

      raml.load(definition).should.become({
          title: 'Test',
          resources: [
              {
                  relativeUri: '/a',
                  name: 'A',
                  methods: [
                      {
                          method: "get"
                      }
                  ]

              }
          ]
      }).and.notify(done);
    });
  });
  describe('Resource Responses', function() {
    it('should succeed with arrays as keys', function(done) {
      var definition = [
        '%YAML 1.2',
        '%TAG ! tag:raml.org,0.2:',
        '---',
        'title: Test',
        '/foo:',
        '  name: A',
        '  get:' ,
        '    description: Blah',
        '    responses:',
        '      [200, 210]:',
        '        description: Blah Blah',
        ''
      ].join('\n');

      var expected = {
        title: 'Test',
        resources: [{
          name: 'A',
          relativeUri: '/foo',
          methods:[{
            description: 'Blah',
            responses: {
              200: { description: 'Blah Blah'},
              210: { description: 'Blah Blah'}
            },
            method: 'get'
          }]
        }]
      };

      raml.load(definition).should.become(expected).and.notify(done);
    });

    it('should overwrite existing node with arrays as keys', function(done) {
      var definition = [
        '%YAML 1.2',
        '%TAG ! tag:raml.org,0.2:',
        '---',
        'title: Test',
        '/foo:',
        '  name: A',
        '  get:' ,
        '    description: Blah',
        '    responses:',
        '      200:',
        '        description: Foo Foo',
        '      [200, 210]:',
        '        description: Blah Blah',
        ''
      ].join('\n');

      var expected = {
        title: 'Test',
        resources: [{
          name: 'A',
          relativeUri: '/foo',
          methods:[{
            description: 'Blah',
            responses: {
              200: { description: 'Blah Blah'},
              210: { description: 'Blah Blah'}
            },
            method: 'get'
          }]
        }]
      };

      raml.load(definition).should.become(expected).and.notify(done);
    });

    it('should overwrite arrays as keys with new single node', function(done) {
      var definition = [
        '%YAML 1.2',
        '%TAG ! tag:raml.org,0.2:',
        '---',
        'title: Test',
        '/foo:',
        '  name: A',
        '  get:' ,
        '    description: Blah',
        '    responses:',
        '      [200, 210]:',
        '        description: Blah Blah',
        '      200:',
        '        description: Foo Foo',
        ''
      ].join('\n');

      var expected = {
        title: 'Test',
        resources: [{
          name: 'A',
          relativeUri: '/foo',
          methods:[{
            description: 'Blah',
            responses: {
              200: { description: 'Foo Foo'},
              210: { description: 'Blah Blah'}
            },
            method: 'get'
          }]
        }]
      };

      raml.load(definition).should.become(expected).and.notify(done);
    });

    it('should fail to load a yaml with hash as key', function(done) {
      var definition = [
        '%YAML 1.2',
        '%TAG ! tag:raml.org,0.2:',
        '---',
        'title: Test',
        '/foo:',
        '  name: A',
        '  get:' ,
        '    description: Blah',
        '    responses:',
        '      {200: Blah}:',
        '        description: Blah Blah',
        ''
      ].join('\n');

      raml.load(definition).should.be.rejected.with(/found unhashable key/).and.notify(done);
    });
  });
  describe('Traits', function() {
    it('should succeed when applying traits across !include boundaries', function(done) {
      var definition = [
          '%TAG ! tag:raml.org,0.1:',
          '---',
          'title: Test',
          'traits:',
          '  customTrait: !include http://localhost:9001/test/customtrait.yml',
          '/: !include http://localhost:9001/test/root.yml'
      ].join('\n');

      raml.load(definition).should.eventually.deep.equal({
          title: 'Test',
          traits: {
              customTrait: {
                  name: 'Custom Trait',
                  description: 'This is a custom trait',
                  provides: {
                      get: {
                          responses: {
                              429: {
                                  description: 'API Limit Exceeded'
                              }
                          }
                      }
                  }
              }
          },
          resources: [
              {
                  relativeUri: "/",
                  name: "Root",
                  use: [ "customTrait" ],
                  methods: [
                      {
                          method: "get",
                          responses: {
                              429: {
                                  description: 'API Limit Exceeded'
                              }
                          }
                      }
                  ],
                  resources: [
                      {
                          relativeUri: "/anotherResource",
                          name: "Another Resource",
                          use: [ "customTrait" ],
                          methods: [
                              {
                                  method: "get",
                                  responses: {
                                      429: {
                                          description: 'API Limit Exceeded'
                                      }
                                  }
                              }
                          ]
                      }
                  ]
              }
          ]
      }).and.notify(done);
    });
    it('should succeed when applying using verb question mark', function(done) {
      var definition = [
        '%YAML 1.2',
        '%TAG ! tag:raml.org,0.1:',
        '---',
        'title: Test',
        'traits:',
        '  rateLimited:',
        '    name: Rate Limited',
        '    provides:',
        '      get?:',
        '        responses:',
        '          429:',
        '            description: API Limit Exceeded',
        '/leagues:',
        '  use: [ rateLimited ]',
        '  get:',
        '    responses:',
        '      200:',
        '        description: Retrieve a list of leagues'
      ].join('\n');

      raml.load(definition).should.become({
        title: 'Test',
        traits: {
          rateLimited: {
            name: 'Rate Limited',
            provides: {
              'get?': {
                responses: {
                  '429': {
                    description: 'API Limit Exceeded'
                  }
                }
              }
            }
          }
        },
        resources: [
          {
            relativeUri: '/leagues',
            use: [ 'rateLimited' ],
            methods: [
              {
                method: 'get',
                responses: {
                  '200': {
                    description: 'Retrieve a list of leagues'
                  },
                  '429': {
                    description: 'API Limit Exceeded'
                  }
                }
              }
            ]
          }
        ]
      }).and.notify(done);
    });
    it('should succeed when applying multiple traits', function(done) {
      var definition = [
        '%YAML 1.2',
        '%TAG ! tag:raml.org,0.1:',
        '---',
        'title: Test',
        'traits:',
        '  rateLimited:',
        '    name: Rate Limited',
        '    provides:',
        '      get?:',
        '        responses:',
        '          429:',
        '            description: API Limit Exceeded',
        '  queryable:',
        '    name: Queryable',
        '    provides:',
        '      get?:',
        '        queryParameters:',
        '          q:',
        '            type: string',
        '/leagues:',
        '  use: [ rateLimited, queryable ]',
        '  get:',
        '    responses:',
        '      200:',
        '        description: Retrieve a list of leagues'
      ].join('\n');

      raml.load(definition).should.become({
        title: 'Test',
        traits: {
          rateLimited: {
            name: 'Rate Limited',
            provides: {
              'get?': {
                responses: {
                  '429': {
                    description: 'API Limit Exceeded'
                  }
                }
              }
            }
          },
          queryable: {
            name: 'Queryable',
            provides: {
              'get?': {
                queryParameters: {
                  q: {
                    type: 'string'
                  }
                }
              }
            }
          }
        },
        resources: [
          {
            relativeUri: '/leagues',
            use: [ 'rateLimited', 'queryable' ],
            methods: [
              {
                method: 'get',
                queryParameters: {
                  q: {
                    type: 'string'
                  }
                },
                responses: {
                  '200': {
                    description: 'Retrieve a list of leagues'
                  },
                  '429': {
                    description: 'API Limit Exceeded'
                  }
                }
              }
            ]
          }
        ]
      }).and.notify(done);
    });

    it('should remove nodes with question mark that are not used', function(done) {
      var definition = [
        '%YAML 1.2',
        '%TAG ! tag:raml.org,0.1:',
        '---',
        'title: Test',
        'traits:',
        '  rateLimited:',
        '    name: Rate Limited',
        '    provides:',
        '      get?:',
        '        responses:',
        '          429:',
        '            description: API Limit Exceeded',
        '      post?:',
        '        responses:',
        '          429:',
        '            description: API Limit Exceeded',
        '/leagues:',
        '  use: [ rateLimited ]',
        '  get:',
        '    responses:',
        '      200:',
        '        description: Retrieve a list of leagues'
      ].join('\n');

      raml.load(definition).should.become({
        title: 'Test',
        traits: {
          rateLimited: {
            name: 'Rate Limited',
            provides: {
              'get?': {
                responses: {
                  '429': {
                    description: 'API Limit Exceeded'
                  }
                }
              },
              'post?': {
                responses: {
                  '429': {
                    description: 'API Limit Exceeded'
                  }
                }
              }
            }
          }
        },
        resources: [
          {
            relativeUri: '/leagues',
            use: [ 'rateLimited' ],
            methods: [
              {
                method: 'get',
                responses: {
                  '200': {
                    description: 'Retrieve a list of leagues'
                  },
                  '429': {
                    description: 'API Limit Exceeded'
                  }
                }
              }
            ]
          }
        ]
      }).and.notify(done);
    });
    it('should fail if unknown property is used inside a trait', function(done) {
      var definition = [
        '%YAML 1.2',
        '%TAG ! tag:raml.org,0.1:',
        '---',
        'title: Test',
        'traits:',
        '  rateLimited:',
        '    what:',
        '      responses:',
        '        503:',
        '          description: Server Unavailable. Check Your Rate Limits.',
        '/:',
        '  use: [ throttled, rateLimited: { parameter: value } ]'
      ].join('\n');

      raml.load(definition).should.be.rejected.with(/unknown property what/).and.notify(done);
    });
    it('should fail if trait is missing provides property', function(done) {
      var definition = [
        '%YAML 1.2',
        '%TAG ! tag:raml.org,0.1:',
        '---',
        'title: Test',
        'traits:',
        '  rateLimited:',
        '    name: Rate Limited',
        '/:',
        '  use: [ rateLimited: { parameter: value } ]'
      ].join('\n');

      raml.load(definition).should.be.rejected.with(/every trait must have a provides property/).and.notify(done);
    });
    it('should fail if trait is missing name property', function(done) {
      var definition = [
        '%YAML 1.2',
        '%TAG ! tag:raml.org,0.1:',
        '---',
        'title: Test',
        'traits:',
        '  rateLimited:',
        '    provides:',
        '      get?:',
        '        responses:',
        '          503:',
        '            description: Server Unavailable. Check Your Rate Limits.',
        '/:',
        '  use: [ rateLimited: { parameter: value } ]'
      ].join('\n');

      raml.load(definition).should.be.rejected.with(/every trait must have a name property/).and.notify(done);
    });
    it('should fail if use property is not an array', function(done) {
      var definition = [
        '%YAML 1.2',
        '%TAG ! tag:raml.org,0.1:',
        '---',
        'title: Test',
        '/:',
        '  use: throttled ]'
      ].join('\n');

      raml.load(definition).should.be.rejected.with(/use property must be an array/).and.notify(done);
    });
    it('should fail on invalid trait name', function(done) {
      var definition = [
        '%YAML 1.2',
        '%TAG ! tag:raml.org,0.1:',
        '---',
        'title: Test',
        'traits:',
        '  rateLimited:',
        '    name: Rate Limited',
        '    provides:',
        '      get?:',
        '        responses:',
        '          503:',
        '            description: Server Unavailable. Check Your Rate Limits.',
        '/:',
        '  use: [ throttled, rateLimited: { parameter: value } ]'
      ].join('\n');

      raml.load(definition).should.be.rejected.with(/there is no trait named throttled/).and.notify(done);
    });
  });
  describe('Error reporting', function () {
    it('should report correct line/column for invalid trait error', function(done) {
      var noop = function () {};
      var definition = [
        '%YAML 1.2',
        '%TAG ! tag:raml.org,0.1:',
        '---',
        'title: Test',
        'traits:',
        '  rateLimited:',
        '    name: Rate Limited',
        '    provides:',
        '      get?:',
        '        responses:',
        '          503:',
        '            description: Server Unavailable. Check Your Rate Limits.',
        '/:',
        '  use: [ throttled, rateLimited: { parameter: value } ]'
      ].join('\n');

      raml.load(definition).then(noop, function (error) {
        setTimeout(function () {
          expect(error.problem_mark).to.exist;
          error.problem_mark.column.should.be.equal(9);
          error.problem_mark.line.should.be.equal(13);
          done();
        }, 0);
      });
      //raml.load(definition).should.be.rejected.with(/there is no trait named throttled/).and.notify(done);
    });
  });
});
