"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const base_entity_1 = require("../../src/shared/utils/base-entity");
class TestEntity extends base_entity_1.BaseEntity {
}
describe('BaseEntity', () => {
    it('should assign properties correctly', () => {
        const props = { id: 1, name: 'John' };
        const entity = new TestEntity(props);
        (0, chai_1.expect)(entity).to.deep.equal(props);
    });
    it('should assign properties correctly with partial props', () => {
        const existingProps = { id: 1, name: 'John' };
        const newProps = { name: 'Doe' };
        const expected = { id: 1, name: 'Doe' };
        const entity = new TestEntity(existingProps);
        Object.assign(entity, newProps);
        (0, chai_1.expect)(entity).to.deep.equal(expected);
    });
    it('should assign properties correctly with no props', () => {
        const entity = new TestEntity();
        (0, chai_1.expect)(entity).to.deep.equal({});
    });
});
//# sourceMappingURL=base-entity.js.map