"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const firebase_1 = require("../../config/firebase");
const errors_1 = require("../lib/errors");
class FirestoreServiceImpl {
    constructor() {
        this.db = firebase_1.firebaseFirestore;
    }
    get(collection, docId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const snap = yield this.db.collection(collection).doc(docId).get();
                if (!snap.exists) {
                    throw new errors_1.NotFoundException(`Document '${docId}' not found in '${collection}'.`);
                }
                return Object.assign({ id: snap.id }, snap.data());
            }
            catch (error) {
                if (error instanceof errors_1.NotFoundException)
                    throw error;
                throw new errors_1.InternalServerErrorException(`Firestore get failed: ${error.message}`);
            }
        });
    }
    set(collection, docId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.db.collection(collection).doc(docId).set(data);
            }
            catch (error) {
                throw new errors_1.InternalServerErrorException(`Firestore set failed: ${error.message}`);
            }
        });
    }
    update(collection, docId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const ref = this.db.collection(collection).doc(docId);
                const snap = yield ref.get();
                if (!snap.exists) {
                    throw new errors_1.NotFoundException(`Document '${docId}' not found in '${collection}'.`);
                }
                yield ref.update(data);
            }
            catch (error) {
                if (error instanceof errors_1.NotFoundException)
                    throw error;
                throw new errors_1.InternalServerErrorException(`Firestore update failed: ${error.message}`);
            }
        });
    }
    delete(collection, docId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const ref = this.db.collection(collection).doc(docId);
                const snap = yield ref.get();
                if (!snap.exists) {
                    throw new errors_1.NotFoundException(`Document '${docId}' not found in '${collection}'.`);
                }
                yield ref.delete();
            }
            catch (error) {
                if (error instanceof errors_1.NotFoundException)
                    throw error;
                throw new errors_1.InternalServerErrorException(`Firestore delete failed: ${error.message}`);
            }
        });
    }
    query(collection, field, operator, value) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const snap = yield this.db
                    .collection(collection)
                    .where(field, operator, value)
                    .get();
                return snap.docs.map((doc) => (Object.assign({ id: doc.id }, doc.data())));
            }
            catch (error) {
                throw new errors_1.InternalServerErrorException(`Firestore query failed: ${error.message}`);
            }
        });
    }
}
const FirestoreService = new FirestoreServiceImpl();
exports.default = FirestoreService;
//# sourceMappingURL=firestore.js.map