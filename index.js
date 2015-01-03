/**
 *  Created by E.Z.Moghaddam (zaerymoghaddam@gmail.com)
 */

'use strict';

var _ = require('lodash');
var JOI = require('joi');

/**
 * Default error formatter which given an errors array (returned by calling the validate method of underlying JOI
 * framework) and generates a JSON representation of errors in following format:
 *
 * {
 *      code: 'VALIDATION_ERROR',
 *      message: 'Invalid data specified at request',
 *      errors: [
 *          {
 *              "message":"username is required",
 *              "type":"any.required",
 *              "path":"username"
 *          },
 *          {
 *              "message":"password is required",
 *              "type":"any.required",
 *              "path":"password"
 *          },
 *          {
 *              "message":"address is required",
 *              "type":"any.required",
 *              "path":"address"
 *          }
 *      ]
 * }
 *
 * The application can override this method while initializing the valid-express module in order to generate error
 * results in appropriate format
 *
 * @param {Array} errors    Collection of error objects returned from calling validate method of underlying JOI
 * framework
 *
 * @return A JSON object containing formatted error report
 */
var validExpressDefaultErrorFormatter = function(errors){
    return {
        code: 'VALIDATION_ERROR',
        message: 'Invalid data specified at request',
        errors: _.map(errors, function(errorItem){
            return {
                message: errorItem.message,
                type: errorItem.type,
                path: errorItem.path
            }
        })
    };
};

//  Default options that would be used as 'options' parameters while calling joi.validate function
var joiOptions = {
    abortEarly: false,
    convert: true,
    allowUnknown: false,
    language: {},
    presence: 'optional',
    errorFormatter: validExpressDefaultErrorFormatter
};

/**
 * The validate function would be called in any url handler methods in order to validate parameters and generate
 *
 * @param schema    An object containing joi validation options and joi validation schema to validate data against it.
 *                  The provided schema option can specify the validation options as 'params', 'query' or 'body'
 *                  attribute to validate corresponding parameters against it. Also JOI validation options can be
 *                  passed as another property named 'options'. As an example, to validate parameters in 'query' and
 *                  'body' part of the request, the validate object should be called with a schema object like this:
 *
 *                  validate({
 *                      query: {
 *                          name: joi.string().required(),
 *                          family: joi.string().required()
 *                      },
 *                      body: {
 *                          age: joi.number().min(10).max(20).optional()
 *                      }
 *                  })
 * @returns {Function}  An express middleware function to validate request parameters
 */
var validate = function(schema){

    //  Override those options specified when calling validate function. The caller can specify joi validation options
    //  when calling the validate method by passing a specific 'options' property as part of their schema definition
    var validationOptions = joiOptions;
    if(schema.options)
        validationOptions = _.defaults(schema.options, joiOptions);

    var paramsSchema = schema.params ? schema.params : null;
    var querySchema = schema.query ? schema.query : null;
    var bodySchema = schema.body ? schema.body : null;
    var allSchema = (!schema.params && !schema.body && !schema.query) ? schema : null;

//        delete allSchema.options;

    var validateExpressImpl = function(req, res, next){
        var errors = [];
        var results = null;

        if(allSchema){
            var allValues = _.apply(req.params, req.query, req.body);
            results = JOI.validate(allValues, allSchema, validationOptions);
            if(results.error){
                errors.push(results.error.details);
            }
        } else {
            if(paramsSchema){
                results = JOI.validate(req.params, paramsSchema, validationOptions);
                if(results.error){
                    errors = errors.concat(results.error.details);
                    results = null;
                }
            }

            if(!joiOptions.abortEarly || (joiOptions.abortEarly && errors.length == 0)) {
                if(querySchema){
                    results = JOI.validate(req.query, querySchema, validationOptions);
                    if(results.error){
                        errors = errors.concat(results.error.details);
                        results = null;
                    }
                }
            }

            if(!joiOptions.abortEarly || (joiOptions.abortEarly && errors.length == 0)) {
                if (bodySchema) {
                    if(req.body == undefined){
                        throw Error('req.body is undefined. Seems you have forgotten to include the body-parser middleware in your express app');
                    }
                    results = JOI.validate(req.body, bodySchema, validationOptions);
                    if (results.error) {
                        errors = errors.concat(results.error.details);
                        results = null;
                    }
                }
            }
        }

        if(errors.length > 0){
            res.status(400).json(validationOptions.errorFormatter(errors)).end();
        } else {
            return next();
        }
    };

    return validateExpressImpl;
};

module.exports = function(options){
    if(options){
        joiOptions = _.defaults(options, joiOptions);
    }

    return {
        validate: validate
    };
};