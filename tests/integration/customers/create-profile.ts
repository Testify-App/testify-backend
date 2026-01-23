import chaiHttp from 'chai-http';
import chai, { expect } from 'chai';
import { describe, it } from 'mocha';
import { StatusCodes } from 'http-status-codes';
import app from '../../../src/config/express';

chai.use(chaiHttp);

const baseURL = '/api/v1/customers';
describe('CustomerController -> createProfile', () => {
  it('should create profile successfully', (done) => {
    chai.request(app)
      .post(`${baseURL}/`)
      .send({ profile_id: '1234567890' })
      .end((_err, res) => {
        expect(res.statusCode).to.equal(StatusCodes.CREATED);
        expect(res.body.message).to.equal(`fetch profile from db: 1234567890`);
        done();
      });
  });
});
