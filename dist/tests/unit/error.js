"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = __importDefault(require("chai"));
const expect = chai_1.default.expect;
const errors_1 = require("../../src/shared/lib/errors");
describe('Custom HTTP Exception Classes', () => {
    it('should create InternalServerErrorException', () => {
        const exception = new errors_1.InternalServerErrorException();
        expect(exception).to.be.an.instanceOf(Error);
        expect(exception.code).to.equal(500);
        expect(exception.message).to.equal('Internal Server Error');
    });
    it('should create ConflictException', () => {
        const exception = new errors_1.ConflictException();
        expect(exception).to.be.an.instanceOf(Error);
        expect(exception.code).to.equal(409);
        expect(exception.message).to.equal('conflict');
    });
    it('should create BadException', () => {
        const exception = new errors_1.BadException();
        expect(exception).to.be.an.instanceOf(Error);
        expect(exception.code).to.equal(400);
        expect(exception.message).to.equal('Bad Request');
    });
    it('should create ForbiddenException', () => {
        const exception = new errors_1.ForbiddenException();
        expect(exception).to.be.an.instanceOf(Error);
        expect(exception.code).to.equal(403);
        expect(exception.message).to.equal('Forbidden');
    });
    it('should create UnAuthorizedException', () => {
        const exception = new errors_1.UnAuthorizedException();
        expect(exception).to.be.an.instanceOf(Error);
        expect(exception.code).to.equal(401);
        expect(exception.message).to.equal('UNAUTHORIZED');
    });
    it('should create NotFoundException', () => {
        const exception = new errors_1.NotFoundException();
        expect(exception).to.be.an.instanceOf(Error);
        expect(exception.code).to.equal(404);
        expect(exception.message).to.equal('Not Found');
    });
    it('should create InternalServerErrorException with custom message', () => {
        const customMessage = 'Custom Internal Server Error';
        const exception = new errors_1.InternalServerErrorException(customMessage);
        expect(exception).to.be.an.instanceOf(Error);
        expect(exception.code).to.equal(500);
        expect(exception.message).to.equal(customMessage);
    });
    it('should create ConflictException with custom message', () => {
        const customMessage = 'Custom Conflict';
        const exception = new errors_1.ConflictException(customMessage);
        expect(exception).to.be.an.instanceOf(Error);
        expect(exception.code).to.equal(409);
        expect(exception.message).to.equal(customMessage);
    });
    it('should create BadException with custom message', () => {
        const customMessage = 'Custom Bad Request';
        const exception = new errors_1.BadException(customMessage);
        expect(exception).to.be.an.instanceOf(Error);
        expect(exception.code).to.equal(400);
        expect(exception.message).to.equal(customMessage);
    });
    it('should create ForbiddenException with custom message', () => {
        const customMessage = 'Custom Forbidden';
        const exception = new errors_1.ForbiddenException(customMessage);
        expect(exception).to.be.an.instanceOf(Error);
        expect(exception.code).to.equal(403);
        expect(exception.message).to.equal(customMessage);
    });
    it('should create UnAuthorizedException with custom message', () => {
        const customMessage = 'Custom UNAUTHORIZED';
        const exception = new errors_1.UnAuthorizedException(customMessage);
        expect(exception).to.be.an.instanceOf(Error);
        expect(exception.code).to.equal(401);
        expect(exception.message).to.equal(customMessage);
    });
    it('should create NotFoundException with custom message', () => {
        const customMessage = 'Custom Not Found';
        const exception = new errors_1.NotFoundException(customMessage);
        expect(exception).to.be.an.instanceOf(Error);
        expect(exception.code).to.equal(404);
        expect(exception.message).to.equal(customMessage);
    });
});
//# sourceMappingURL=error.js.map