import { Query3 } from '../src/query3';
import { mockModel } from '../__mock__/mongoose.model';

// Dummy user data for testing
const mockData = [
  { name: 'John Doe', age: 30 },
  { name: 'Jane Doe', age: 25 },
];

describe('Query3', () => {
  let query3: Query3<any>;

  beforeEach(() => {
    jest.clearAllMocks(); // Clear all mock calls before each test
    query3 = new Query3(mockModel as any); // Instantiate Query3 with the mocked model
  });

  it('should parse query string correctly', async () => {
    const queryString = JSON.stringify({
      limit: 5,
      offset: 0,
      sort: { age: -1 },
      age: { $gte: 18 },
    });

    // Mocking countDocuments and find calls
    mockModel.countDocuments.mockResolvedValue(2);
    mockModel.exec.mockResolvedValue(mockData);

    const result = await query3.query(queryString, {
      populate: [{ path: 'role' }],
      omitFields: ['age'], // Omit age field
    });

    expect(result.records).toEqual([
      { name: 'John Doe' },
      { name: 'Jane Doe' },
    ]);
    expect(result.pagination).toEqual({ totalRows: 2, totalPages: 1 });

    // Ensure Mongoose methods were called with correct arguments
    expect(mockModel.find).toHaveBeenCalledWith({ age: { $gte: 18 } });
    expect(mockModel.skip).toHaveBeenCalledWith(0);
    expect(mockModel.limit).toHaveBeenCalledWith(5);
    expect(mockModel.sort).toHaveBeenCalledWith({ age: -1 });
  });

  it('should omit specified fields from the result', () => {
    const data = [
      { name: 'John Doe', password: '123456', age: 30 },
      { name: 'Jane Doe', password: 'abcdef', age: 25 },
    ];

    const result = (query3 as any).omitFields(data, ['password']);

    expect(result).toEqual([
      { name: 'John Doe', age: 30 },
      { name: 'Jane Doe', age: 25 },
    ]);
  });

  it('should handle pagination and sorting correctly', async () => {
    const queryString = JSON.stringify({
      limit: 1,
      offset: 1,
      sort: { age: -1 },
    });

    mockModel.countDocuments.mockResolvedValue(3);
    mockModel.exec.mockResolvedValue([{ name: 'Jane Doe', age: 25 }]);

    const result = await query3.query(queryString, {
      queryMongoose: { isActive: true },
    });

    expect(result.records).toEqual([{ name: 'Jane Doe', age: 25 }]);
    expect(result.pagination).toEqual({
      totalRows: 3,
      totalPages: 3,
    });

    expect(mockModel.find).toHaveBeenCalledWith({ isActive: true });
    expect(mockModel.sort).toHaveBeenCalledWith({ age: -1 });
    expect(mockModel.skip).toHaveBeenCalledWith(1);
    expect(mockModel.limit).toHaveBeenCalledWith(1);
  });

  it('should handle populate correctly', async () => {
    const queryString = JSON.stringify({
      limit: 2,
      offset: 0,
    });

    mockModel.countDocuments.mockResolvedValue(2);
    mockModel.exec.mockResolvedValue([
      { name: 'John Doe', role: { name: 'admin' } },
      { name: 'Jane Doe', role: { name: 'user' } },
    ]);

    const result = await query3.query(queryString, {
      populate: [{ path: 'role', select: 'name' }],
    });

    expect(result.records).toEqual([
      { name: 'John Doe', role: { name: 'admin' } },
      { name: 'Jane Doe', role: { name: 'user' } },
    ]);

    expect(mockModel.populate).toHaveBeenCalledWith([
      { path: 'role', select: 'name' },
    ]);
  });

  it('should return empty records if no documents found', async () => {
    const queryString = JSON.stringify({
      limit: 10,
      offset: 0,
    });

    mockModel.countDocuments.mockResolvedValue(0);
    mockModel.exec.mockResolvedValue([]);

    const result = await query3.query(queryString);

    expect(result.records).toEqual([]);
    expect(result.pagination).toEqual({
      totalRows: 0,
      totalPages: 0,
    });
  });
});
