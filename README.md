# valid-express

Flexible validation framework for express.js

[![npm version](https://badge.fury.io/js/valid-express.svg)](http://badge.fury.io/js/valid-express)
[![npm](https://img.shields.io/npm/v/npm.svg)]()
[![Gemnasium](https://img.shields.io/gemnasium/moghaddam/valid-express.svg)]()
[![Travis](https://img.shields.io/travis/moghaddam/valid-express.svg)]()
[![David](https://img.shields.io/david/dev/moghaddam/valid-express.svg)]()
[![npm](https://img.shields.io/npm/l/valid-express.svg)]()
[![GitHub issues](https://img.shields.io/github/issues/moghaddam/valid-express.svg)]()
[![npm](https://img.shields.io/npm/dm/valid-express.svg)]()

Main features includes:

- Easily declare validation rules for:
  * Query string parameters (e.g. /users?id=12)
  * Request body parameters (e.g. as json or url-encoded)
  * Parameters in URL (e.g. /users/:id)

- Customize output format by passing a an `errorFormatter` function
- Integrate smoothly with [express.js](https://www.npmjs.com/package/express) to handle parameter validation process

## Installation

```sh
$ npm install valid-express
```

## Usage

```javascript
var express = require('express');
var bodyParserMiddleware = require('body-parser');
var joi = require('joi');

//  Initialize valid-express module
var validExpress = require('valid-express');
var validator = validExpress();

//  Prepare an instance of express app to run tests against it
var app = express();
app.use(bodyParserMiddleware.json());

//  Prepare sample schema for parameters passed in body part of the request
var bodySchema = {
	body: joi.object().keys({
	    username: joi.string().min(4).max(10).required(),
    	password: joi.string().min(3).max(15)
	})
};

app.post('/body', validator.validate(bodySchema), function (req, res, next) {
	res.send('Hello World').end();
    next();
});

app.listen(3000);

```

### Validating `query` parameters (e.g. /users?id=2)
In order to specify a validation rule for query string items, you have to pass include a property named `query` in your validation schema having a valid `joi` object as validation definitions.

```javascript
var querySchema = {
	query: joi.object().keys({
	    username: joi.string().min(4).max(10).required(),
    	password: joi.string().min(3).max(15)
	})
};

app.post('/users', validator.validate(querySchema), function (req, res, next) {
	res.send('Hello World').end();
    next();
});
```

### Validating `body` parameters (e.g. json or url-encoded)
The valid-express reads body parameters from `req.body`. So you have to include the `body-parser` middleware before making any call to `validExpress.validate`. Specifying validation rules for body part of the request is can be accomplished by providing a `body` property for validation schema haviand providing a valid `joi` object as its value.

```javascript
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())
.
.
.
var bodySchema = {
	body: joi.object().keys({
	    username: joi.string().min(4).max(10).required(),
    	password: joi.string().min(3).max(15)
	})
};

app.post('/users', validator.validate(bodySchema), function (req, res, next) {
	res.send('Hello World').end();
    next();
});
```

### Validating `params` parameters (e.g. /users/:id)
The `params` property of a validation schema is used to specify validation rules for parameters passed as part of URL. Its value should be a valid `joi` object.

```javascript
var paramsSchema = {
	params: joi.object().keys({
	    username: joi.string().min(4).max(10).required(),
    	password: joi.string().min(3).max(15)
	})
};

app.post('/users', validator.validate(paramsSchema), function (req, res, next) {
	res.send('Hello World').end();
    next();
});
```

### Validating parameters in query, body or params simultaniously
In order to specify multiple validation scheme, you can pass each one as its own property in validation schema.

```javascript
var loginSchema = {
	params: joi.object().keys({
	    token: joi.string().min(4).max(10).required()
	},
    body: joi.object().keys({
	    username: joi.string().min(4).max(10).required(),
    	password: joi.string().min(3).max(15)
    }),
    query: joi.object().keys({
	    id: joi.string().min(1).max(12).required()
    })
};

app.post('/users/:token', validator.validate(loginSchema), function (req, res, next) {
	res.send('Hello World').end();
    next();
});
```

## Default error ouput format
In case of any error in validating input parameters, the `400` HTTP response code will be retured to the client with details of errors in JSON. For example, in above samples, the `username` property is declared as mandatory, so if there is no `username` property in request body, the validation output would be:

```javascript
	{
        code: 'VALIDATION_ERROR',
        message: 'Invalid data specified at request',
        errors:[{
        	message: 'username is required',
            type: 'joi.required',
            path: 'username'
        }]
    }
```
If you're familiar with `joi` validation rules, you may noticed that the value of `message`, `type` and `path` properties (including property names) are exactly the same as returned value of the validate method of `joi`.

## Customizing format of the error result 
In order to customize the format of the error result, you can pass an `options` parameter to `valid-express` constructor containing a property named `errorFormatter` that is a function accepting an array of error objects as input and generates a JSON object that should be returned to the client. This formatter function would be called by valid-express in order to generate an appropriate error report to client. It gives an array of error object each having three property: `message`, `type` and `path` and returns a JSON object.

For example if you want to generate a simple array containing the name of invalid proeprteis with their corresponding validation message, you can override the errorFormatter options with something like this:

```javascript
//  Initialize valid-express module
var validExpress = require('valid-express');
var validator = validExpress({
	errorFormatter: function(errors){
    	var result = [];
    	for(var i=0; i<errors.length; i++){
        	result.push({
            	name: errors[i].path,
                description: errors[i].message
            });
        }
        
        return result;
    }
});

app.post('/users/:token', validator.validate(someSchema), function (req, res, next) {
	res.send('Hello World').end();
    next();
});
```

## Test

Tests are implemented using [mocha](https://www.npmjs.com/package/mocha), [should](https://www.npmjs.com/package/should) and [supertest](https://www.npmjs.com/package/supertest). Each test case starts a sample expres application and runs the test against it and then stops the app.

```sh
npm test
```

## License

The MIT License (MIT)

Copyright (c) 2014 Ehsan Zaery Moghaddam

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
