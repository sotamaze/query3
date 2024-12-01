// __mocks__/mongoose.model.ts
export const mockModel = {
  find: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  sort: jest.fn().mockReturnThis(),
  populate: jest.fn().mockReturnThis(),
  lean: jest.fn().mockReturnThis(),
  exec: jest.fn(),
  countDocuments: jest.fn(),
  aggregate: jest.fn(),
};
