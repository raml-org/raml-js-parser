/* global RAML, describe, it */

'use strict';

if (typeof window === 'undefined') {
  var raml           = require('../../lib/raml.js');
  var chai           = require('chai');
  var chaiAsPromised = require('chai-as-promised');

  chai.should();
  chai.use(chaiAsPromised);
} else {
  var raml           = RAML.Parser;

  chai.should();
}

describe('Schemas', function () {

  it('should not dereference schemas by default', function (done) {
    var expected = {
      "title": "Dereference test",
      "schemas": [
        {
          "lazyLoaded": "{\n  \"$schema\": \"http://json-schema.org/draft-04/schema#\",\n  \"type\": \"array\",\n  \"items\": {\n    \"$ref\": \"../item.json\"\n  }\n}\n"
        },
        {
          "includedByVar": "{\n  \"$schema\": \"http://json-schema.org/draft-04/schema#\",\n  \"type\": \"array\",\n  \"items\": {\n    \"$ref\": \"../item.json\"\n  }\n}\n"
        },
        {
          "inlineByVar": "{\n  \"$schema\": \"http://json-schema.org/draft-04/schema#\",\n  \"type\": \"object\",\n  \"properties\": {\n    \"items\": {\n      \"$ref\": \"schemas/item.json\"\n    }\n  }\n}\n"
        }
      ],
      "resources": [
        {
          "relativeUri": "/items",
          "resources": [
            {
              "relativeUri": "/included-lazy",
              "methods": [
                {
                  "responses": {
                    "200": {
                      "body": {
                        "application/json": {
                          "schema": "{\n  \"$schema\": \"http://json-schema.org/draft-04/schema#\",\n  \"type\": \"array\",\n  \"items\": {\n    \"$ref\": \"../item.json\"\n  }\n}\n"
                        }
                      }
                    }
                  },
                  "method": "get"
                }
              ],
              "relativeUriPathSegments": [ "included-lazy" ]
            },
            {
              "relativeUri": "/included-by-var",
              "methods": [
                {
                  "responses": {
                    "200": {
                      "body": {
                        "application/json": {
                          "schema": "{\n  \"$schema\": \"http://json-schema.org/draft-04/schema#\",\n  \"type\": \"array\",\n  \"items\": {\n    \"$ref\": \"../item.json\"\n  }\n}\n"
                        }
                      }
                    }
                  },
                  "method": "get"
                }
              ],
              "relativeUriPathSegments": [ "included-by-var" ]
            },
            {
              "relativeUri": "/inline-by-var",
              "methods": [
                {
                  "responses": {
                    "200": {
                      "body": {
                        "application/json": {
                          "schema": "{\n  \"$schema\": \"http://json-schema.org/draft-04/schema#\",\n  \"type\": \"object\",\n  \"properties\": {\n    \"items\": {\n      \"$ref\": \"schemas/item.json\"\n    }\n  }\n}\n"
                        }
                      }
                    }
                  },
                  "method": "get"
                }
              ],
              "relativeUriPathSegments": [ "inline-by-var" ]
            },
            {
              "relativeUri": "/inline",
              "methods": [
                {
                  "responses": {
                    "200": {
                      "body": {
                        "application/json": {
                          "schema": "{\n  \"$schema\": \"http://json-schema.org/draft-04/schema#\",\n  \"type\": \"object\",\n  \"properties\": {\n    \"items\": {\n      \"$ref\": \"schemas/item.json\"\n    }\n  }\n}\n"
                        }
                      }
                    }
                  },
                  "method": "get"
                }
              ],
              "relativeUriPathSegments": [ "inline" ]
            }
          ],
          "relativeUriPathSegments": [ "items" ]
        }
      ]
    };

    raml.loadFile('http://localhost:9001/test/raml-files/dereference.raml')
      .should.become(expected).and.notify(done);
  });

  it('should dereference all possible schemas with flag enabled', function (done) {
    var expected = {
      "title": "Dereference test",
      "schemas": [
        {
          "lazyLoaded": "{\"$schema\":\"http://json-schema.org/draft-04/schema#\",\"type\":\"array\",\"items\":{\"$schema\":\"http://json-schema.org/draft-04/schema#\",\"type\":\"object\",\"properties\":{\"name\":{\"type\":\"string\"}},\"required\":[\"name\"]}}"
        },
        {
          "includedByVar": "{\"$schema\":\"http://json-schema.org/draft-04/schema#\",\"type\":\"array\",\"items\":{\"$schema\":\"http://json-schema.org/draft-04/schema#\",\"type\":\"object\",\"properties\":{\"name\":{\"type\":\"string\"}},\"required\":[\"name\"]}}"
        },
        {
          "inlineByVar": "{\"$schema\":\"http://json-schema.org/draft-04/schema#\",\"type\":\"object\",\"properties\":{\"items\":{\"$schema\":\"http://json-schema.org/draft-04/schema#\",\"type\":\"object\",\"properties\":{\"name\":{\"type\":\"string\"}},\"required\":[\"name\"]}}}"
        }
      ],
      "resources": [
        {
          "relativeUri": "/items",
          "resources": [
            {
              "relativeUri": "/included-lazy",
              "methods": [
                {
                  "responses": {
                    "200": {
                      "body": {
                        "application/json": {
                          "schema": "{\"$schema\":\"http://json-schema.org/draft-04/schema#\",\"type\":\"array\",\"items\":{\"$schema\":\"http://json-schema.org/draft-04/schema#\",\"type\":\"object\",\"properties\":{\"name\":{\"type\":\"string\"}},\"required\":[\"name\"]}}"
                        }
                      }
                    }
                  },
                  "method": "get"
                }
              ],
              "relativeUriPathSegments": [ "included-lazy" ]
            },
            {
              "relativeUri": "/included-by-var",
              "methods": [
                {
                  "responses": {
                    "200": {
                      "body": {
                        "application/json": {
                          "schema": "{\"$schema\":\"http://json-schema.org/draft-04/schema#\",\"type\":\"array\",\"items\":{\"$schema\":\"http://json-schema.org/draft-04/schema#\",\"type\":\"object\",\"properties\":{\"name\":{\"type\":\"string\"}},\"required\":[\"name\"]}}"
                        }
                      }
                    }
                  },
                  "method": "get"
                }
              ],
              "relativeUriPathSegments": [ "included-by-var" ]
            },
            {
              "relativeUri": "/inline-by-var",
              "methods": [
                {
                  "responses": {
                    "200": {
                      "body": {
                        "application/json": {
                          "schema": "{\"$schema\":\"http://json-schema.org/draft-04/schema#\",\"type\":\"object\",\"properties\":{\"items\":{\"$schema\":\"http://json-schema.org/draft-04/schema#\",\"type\":\"object\",\"properties\":{\"name\":{\"type\":\"string\"}},\"required\":[\"name\"]}}}"
                        }
                      }
                    }
                  },
                  "method": "get"
                }
              ],
              "relativeUriPathSegments": [ "inline-by-var" ]
            },
            {
              "relativeUri": "/inline",
              "methods": [
                {
                  "responses": {
                    "200": {
                      "body": {
                        "application/json": {
                          "schema": "{\"$schema\":\"http://json-schema.org/draft-04/schema#\",\"type\":\"object\",\"properties\":{\"items\":{\"$schema\":\"http://json-schema.org/draft-04/schema#\",\"type\":\"object\",\"properties\":{\"name\":{\"type\":\"string\"}},\"required\":[\"name\"]}}}"
                        }
                      }
                    }
                  },
                  "method": "get"
                }
              ],
              "relativeUriPathSegments": [ "inline" ]
            }
          ],
          "relativeUriPathSegments": [ "items" ]
        }
      ]
    };

    raml.loadFile('http://localhost:9001/test/raml-files/dereference.raml', { dereferenceSchemas: true })
      .should.become(expected).and.notify(done);
  });
});
