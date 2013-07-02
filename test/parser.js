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
      
      raml.load(definition).should.be.rejected.with(/incompatible YAML/).and.notify(done);
    });
    it('should succeed', function(done) {
      var definition = [
        '---',
        'title: MyApi',
        'baseUri: http://myapi.com',
        '/:',
        '  name: Root'
      ].join('\n');
      
      promise = raml.load(definition).should.become({ title: 'MyApi', baseUri: 'http://myapi.com', resources: [ { relativeUri: '/', name: 'Root' } ] }).and.notify(done);
    });
    it('should fail if no title', function(done) {
      var definition = [
        '---',
        'baseUri: http://myapi.com',
      ].join('\n');
      
      raml.load(definition).should.be.rejected.with(/missing title/).and.notify(done);
    });
    it('should fail if baseUri value its not really a URI', function(done) {
      var definition = [
        '---',
        'title: MyApi',
        'baseUri: http://{myapi.com',
      ].join('\n');
      
      raml.load(definition).should.be.rejected.with(/unclosed brace/).and.notify(done);
    });
    it('should fail if baseUri uses version but there is no version defined', function(done) {
      var definition = [
        '---',
        'title: MyApi',
        'baseUri: http://myapi.com/{version}',
      ].join('\n');
      
      raml.load(definition).should.be.rejected.with(/missing version/).and.notify(done);
    });
    it('should succeed if baseUri uses version and there is a version defined', function(done) {
      var definition = [
        '---',
        'title: MyApi',
        'version: v1',
        'baseUri: http://myapi.com/{version}',
      ].join('\n');
      
      promise = raml.load(definition);
      promise.should.eventually.deep.equal({ title: 'MyApi', version: 'v1', baseUri: 'http://myapi.com/{version}' }).and.notify(done);
    });
    it('should fail if there is a root property with wrong name', function(done) {
      var definition = [
        '---',
        'title: MyApi',
        'version: v1',
        'wrongPropertyName: http://myapi.com/{version}',
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
        '    content: !include http://localhost:9001/test/gettingstarted.md',
      ].join('\n');
      
      raml.load(definition).should.eventually.deep.equal({ title: 'MyApi', documentation: [ { title: 'Getting Started', content: '# Getting Started\n\nThis is a getting started guide.' } ] }).and.notify(done);
    });
    it('should succeed on including another YAML file with .yml extension', function(done) {
      var definition = [
        '%TAG ! tag:raml.org,0.1:',
        '---',
        '!include http://localhost:9001/test/external.yml',
      ].join('\n');
      
      raml.load(definition).should.eventually.deep.equal({ title: 'MyApi', documentation: [ { title: 'Getting Started', content: '# Getting Started\n\nThis is a getting started guide.' } ] }).and.notify(done);
    });
    it('should succeed on including another YAML file with .yaml extension', function(done) {
      var definition = [
        '%TAG ! tag:raml.org,0.1:',
        '---',
        '!include http://localhost:9001/test/external.yaml',
      ].join('\n');
      
      raml.load(definition).should.eventually.deep.equal({ title: 'MyApi', documentation: [ { title: 'Getting Started', content: '# Getting Started\n\nThis is a getting started guide.' } ] }).and.notify(done);
    });
    it('should succeed on including another YAML file mid-document', function(done) {
      var definition = [
          '%TAG ! tag:raml.org,0.1:',
          '---',
          'title: Test',
          'traits:',
          '  customTrait: !include http://localhost:9001/test/customtrait.yml',
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
  describe('Resources', function() {
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
        '  name: AB',
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
        '  name: AC',
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
        '        description: Retrieve a list of leagues',
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
        '        description: Retrieve a list of leagues',
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
        '        description: Retrieve a list of leagues',
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
        '  use: [ throttled, rateLimited: { parameter: value } ]',
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
        '  use: [ rateLimited: { parameter: value } ]',
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
        '  use: [ rateLimited: { parameter: value } ]',
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
        '  use: throttled ]',
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
        '  use: [ throttled, rateLimited: { parameter: value } ]',
      ].join('\n');
      
      raml.load(definition).should.be.rejected.with(/there is no trait named throttled/).and.notify(done);
    });
  });
});