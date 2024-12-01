"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mockModel = void 0;
exports.mockModel = {
    find: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    populate: jest.fn().mockReturnThis(),
    lean: jest.fn().mockReturnThis(),
    exec: jest.fn(),
    countDocuments: jest.fn(),
    aggregate: jest.fn().mockReturnThis(),
};
//# sourceMappingURL=mongoose.model.js.map