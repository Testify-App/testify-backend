import { expect } from 'chai';
import { StatusCodes } from 'http-status-codes';
import { describe, it } from 'mocha';
import request from 'supertest';
import app from '../../../src/config/express';

const baseUrl = '/api/v1/auth';

describe('Authentication', () => {
    it('should successfully create user', (done) => {
        const payload = {
            email: 'john@template.com',
            password: 'Password@1',
            profile: {
                first_name: 'John',
                last_name: 'Doe',
            }
        };

        request(app)
            .post(`${baseUrl}/register`)
            .send(payload)
            .end((_err, response) => {
                expect(response.status).to.equal(StatusCodes.OK);
                expect(response.body.status).to.equal('success');
                expect(response.body.message).to.equal('User registered successfully');
                done();
            });
    });

    it('should not register user if email already exists', (done) => {
        const payload = {
            email: 'john@template.com',
            password: 'Password@1',
            profile: {
                first_name: 'John',
                last_name: 'Doe',
            }
        };

        request(app)
            .post(`${baseUrl}/register`)
            .send(payload)
            .end((_err, response) => {
                expect(response.status).to.equal(StatusCodes.CONFLICT);
                expect(response.body.status).to.equal('error');
                expect(response.body.message).to.equal('User already exists');
                done();
            });
    });

    it('should not login user if account is unverified', (done) => {
        const payload = {
            email: 'john@template.com',
            password: 'Password@1'
        };

        request(app)
            .post(`${baseUrl}/login`)
            .send(payload)
            .end((_err, response) => {
                expect(response.status).to.equal(StatusCodes.UNAUTHORIZED);
                expect(response.body.status).to.equal('error');
                expect(response.body.message).to.equal('Account unverified. Please verify your email');
                done();
            });
    });

    it('should not verify email if otp is wrong', (done) => {
        const payload = {
            email: 'john@template.com',
            otp: 'wrong_otp',
        };

        request(app)
            .post(`${baseUrl}/verify-otp`)
            .send(payload)
            .end((_err, response) => {
                expect(response.status).to.equal(StatusCodes.UNAUTHORIZED);
                expect(response.body.status).to.equal('error');
                expect(response.body.message).to.equal('Invalid or expired OTP');
                done();
            });
    });

    it('should verify email', (done) => {
        const payload = {
            email: 'john@template.com',
            otp: process.env.OTP_OR_HASH
        };

        request(app)
            .post(`${baseUrl}/verify-otp`)
            .send(payload)
            .end((_err, response) => {
                expect(response.status).to.equal(StatusCodes.OK);
                expect(response.body.status).to.equal('success');
                expect(response.body.message).to.equal('Token verified successfully');
                done();
            });
    });

    it('should login user if account is verified', (done) => {
        const payload = {
            email: 'john@template.com',
            password: 'Password@1'
        };

        request(app)
            .post(`${baseUrl}/login`)
            .send(payload)
            .end((_err, response) => {
                expect(response.status).to.equal(StatusCodes.OK);
                expect(response.body.status).to.equal('success');
                expect(response.body.message).to.equal('User logged in successfully');
                done();
            })
    })
});
