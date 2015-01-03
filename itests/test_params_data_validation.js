/**
 *  Created by E.Z.Moghaddam (zaerymoghaddam@gmail.com)
 */
var express = require('express');
var bodyParserMiddleware = require('body-parser');
var joi = require('joi');
var request = require('supertest')('http://localhost:3000');

var validExpress = require('../index');
var validator = validExpress();

var app = null;

describe('Params data validator', function(){

    var listeningServer = null;

    beforeEach(function(done) {
        //  Prepare an instance of express app to run tests against it
        app = express();
        app.use(bodyParserMiddleware.urlencoded({extended: false}));

        //  Prepare sample schema for parameters passed in parameters of in URL
        var paramsSchema = {
            params: joi.object().keys({
                username: joi.string().min(4).max(10).required(),
                password: joi.string().min(3).max(15)
            })
        };

        app.get('/params/:username/:password', validator.validate(paramsSchema), function (req, res, next) {
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

    describe('for params parameters', function(){
        it('should not returns any error if required data are passed', function(done){
            request.get('/params/abcd/1234')
                .expect(200)
                .end(done);
        });

        it('should returns the json representation of given errors for invalid data', function(done){
            request.get('/params/a/5')
                .expect(400)
                .expect(function(res){
                    res.body.code.should.be.exactly('VALIDATION_ERROR');
                    res.body.message.should.be.exactly('Invalid data specified at request');
                    res.body.errors.length.should.be.exactly(2);
                    res.body.errors[0].should.have.keys(['message', 'type', 'path']);
                })
                .end(done);
        });
    });
});