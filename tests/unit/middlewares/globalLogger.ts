import sinon from 'sinon';
import { Request, Response } from 'express';
import { GlobalErrorCatcherMiddleware } from '../../../src/shared/middlewares/global-error-catcher.middleware';

describe('GlobalErrorCatcherMiddleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: sinon.SinonSpy;

  beforeEach(() => {
    mockReq = {};
    mockRes = {
      status: sinon.stub().returnsThis(),
      send: sinon.stub(),
    };
    mockNext = sinon.spy();
  });

  it('should handle non-HttpException errors', () => {
    const err = new Error('Some unexpected error');

    GlobalErrorCatcherMiddleware(
      err,
      mockReq as Request,
      mockRes as Response,
      mockNext,
    );

    sinon.assert.calledWith(mockRes.status as sinon.SinonSpy, 500);
    sinon.assert.calledWith(
      mockRes.send as sinon.SinonSpy,
      'Internal Server Error',
    );
  });

  it('should handle undefined error', () => {
    GlobalErrorCatcherMiddleware(
      undefined,
      mockReq as Request,
      mockRes as Response,
      mockNext,
    );

    sinon.assert.calledWith(mockRes.status as sinon.SinonSpy, 500);
    sinon.assert.calledWith(
      mockRes.send as sinon.SinonSpy,
      'Internal Server Error',
    );
  });
});
