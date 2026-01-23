import chaiHttp from 'chai-http';
import chai, { expect } from 'chai';
import { describe, it } from 'mocha';
import { StatusCodes } from 'http-status-codes';
import app from '../../src/config/express';

chai.use(chaiHttp);

describe('Integration test', () => {
  it('Welcome', (done) => {
    chai.request(app)
      .get('/api/v1')
      .end((_err, res) => {
        expect(res.statusCode).to.equal(StatusCodes.OK);
        expect(res.body.message).to.equal('Welcome to Testify API.');
        done();
      });
  });

  it('Healthcheck', (done) => {
    chai.request(app)
      .get('/api/v1/healthcheck/ping')
      .end((_err, res) => {
        expect(res.statusCode).to.equal(StatusCodes.OK);
        expect(res.body.message).to.equal('PONG');
        done();
      });
  });
});
