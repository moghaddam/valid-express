/**
 *  Created by E.Z.Moghaddam (zaerymoghaddam@gmail.com)
 */
var express = require('express');
var bodyParserMiddleware = require('body-parser');
var joi = require('joi');
var request = require('supertest')('http://localhost:3000');
var _ = require('lodash');

var validExpress = require('../index');
var validator = validExpress();

var app = null;

describe.only('Custom error formatter', function(){

    var listeningServer = null;

    beforeEach(function(done){
        //  Prepare an instance of express app to run tests against it
        app = express();
        app.use(bodyParserMiddleware.urlencoded({extended: false}));

        //  Prepare sample schema for parameters passed in query string
        var querySchema = {
            options:{
                errorFormatter: function(errors){
                    return  _.map(errors, function(errorItem){
                            return {
                                description: errorItem.message,
                                category: errorItem.type,
                                property: errorItem.path
                            };
                        });
                }
            },
            query: joi.object().keys({
                username: joi.string().min(4).max(10).required(),
                password: joi.string().min(3).max(15)
            })
        };

        app.get('/query', validator.validate(querySchema), function (req, res, next) {
            res.send('Hello World').end();
            next();
        });

        listeningServer = app.listen(3000);
        done();
    });

    afterEach(function(done){
        listeningServer.close();
        done();
    });

    describe('for query parameters', function(){
        it('should not returns any error if required data are passed', function(done){
            request.get('/query?username=abcd&password=1234')
                .expect(200)
                .end(done);
        });

        it('should returns the json representation specified by error formatter for invalid data', function(done){
            request.get('/query')
                .expect(400)
                .expect(function(res){
                    res.body.length.should.be.exactly(1);
                    res.body[0].should.have.keys(['description', 'category', 'property']);
                })
                .end(done);
        });
    });
});