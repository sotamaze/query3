import { Query3 } from '../src/query3';
import { mockModel } from '../__mock__/mongoose.model';
import * as qs from 'qs';

// Dummy data for testing
const mockData = [
  { name: 'John Doe', age: 30 },
  { name: 'Jane Doe', age: 25 },
];

describe('Query3', () => {
  let query3: Query3<any>;

  beforeEach(() => {
    jest.clearAllMocks();
    query3 = new Query3(mockModel as any);
  });

  it('should parse query string and execute query correctly', async () => {
    const queryString = qs.stringify({
      limit: 5,
      offset: 0,
      sort: { age: -1 },
      age: { $gte: 18 },
    });

    // Mock Mongoose methods
    mockModel.find.mockImplementation(() => ({
      skip: jest.fn().mockImplementation(() => ({
        limit: jest.fn().mockImplementation(() => ({
          sort: jest.fn().mockImplementation(() => ({
            populate: jest.fn().mockImplementation(() => ({
              lean: jest.fn().mockImplementation(() => ({
                exec: jest.fn().mockResolvedValue(mockData),
              })),
            })),
          })),
        })),
      })),
    }));
    mockModel.countDocuments.mockResolvedValue(2);

    const result = await query3.query(queryString);

    expect(result.records).toEqual(mockData);
    expect(result.pagination).toEqual({
      totalRows: 2,
      totalPages: 1,
    });

    expect(mockModel.find).toHaveBeenCalledWith({ age: { $gte: 18 } });
    expect(mockModel.countDocuments).toHaveBeenCalledWith({ age: { $gte: 18 } });
  });

  it('should handle pagination and sorting correctly', async () => {
    const queryString = qs.stringify({
      limit: 1,
      offset: 1,
      sort: { age: 1 },
    });

    mockModel.find.mockImplementation(() => ({
      skip: jest.fn().mockImplementation(() => ({
        limit: jest.fn().mockImplementation(() => ({
          sort: jest.fn().mockImplementation(() => ({
            populate: jest.fn().mockImplementation(() => ({
              lean: jest.fn().mockImplementation(() => ({
                exec: jest.fn().mockResolvedValue([{ name: 'Jane Doe', age: 25 }]),
              })),
            })),
          })),
        })),
      })),
    }));
    mockModel.countDocuments.mockResolvedValue(2);

    const result = await query3.query(queryString);

    expect(result.records).toEqual([{ name: 'Jane Doe', age: 25 }]);
    expect(result.pagination).toEqual({
      totalRows: 2,
      totalPages: 2,
    });
  });

  it('should omit specified fields from the result', async () => {
    const queryString = qs.stringify({});

    mockModel.find.mockImplementation(() => ({
      skip: jest.fn().mockImplementation(() => ({
        limit: jest.fn().mockImplementation(() => ({
          sort: jest.fn().mockImplementation(() => ({
            populate: jest.fn().mockImplementation(() => ({
              lean: jest.fn().mockImplementation(() => ({
                exec: jest.fn().mockResolvedValue([
                  { name: 'John Doe', password: '123456', age: 30 },
                  { name: 'Jane Doe', password: 'abcdef', age: 25 },
                ]),
              })),
            })),
          })),
        })),
      })),
    }));
    mockModel.countDocuments.mockResolvedValue(2);

    const result = await query3.query(queryString, { omitFields: ['password'] });

    expect(result.records).toEqual([
      { name: 'John Doe', age: 30 },
      { name: 'Jane Doe', age: 25 },
    ]);
  });

  it('should handle aggregation pipelines correctly', async () => {
    const pipeline = [
      { $match: { age: { $gte: 18 } } },
      { $group: { _id: '$role', count: { $sum: 1 } } },
    ];

    mockModel.aggregate.mockImplementation(() => ({
      exec: jest.fn().mockResolvedValue([
        { _id: 'admin', count: 5 },
        { _id: 'user', count: 10 },
      ]),
    }));

    const result = await query3.aggregate(pipeline);

    expect(result).toEqual([
      { _id: 'admin', count: 5 },
      { _id: 'user', count: 10 },
    ]);
    expect(mockModel.aggregate).toHaveBeenCalledWith(pipeline);
  });

  it('should return empty records if no documents found', async () => {
    const queryString = qs.stringify({
      limit: 10,
      offset: 0,
    });

    mockModel.find.mockImplementation(() => ({
      skip: jest.fn().mockImplementation(() => ({
        limit: jest.fn().mockImplementation(() => ({
          sort: jest.fn().mockImplementation(() => ({
            populate: jest.fn().mockImplementation(() => ({
              lean: jest.fn().mockImplementation(() => ({
                exec: jest.fn().mockResolvedValue([]),
              })),
            })),
          })),
        })),
      })),
    }));
    mockModel.countDocuments.mockResolvedValue(0);

    const result = await query3.query(queryString);

    expect(result.records).toEqual([]);
    expect(result.pagination).toEqual({
      totalRows: 0,
      totalPages: 0,
    });
  });

  it('should validate operators and throw error for invalid ones', async () => {
    const queryString = qs.stringify({
      age: { $invalidOperator: 30 },
    });

    await expect(() =>
      query3.query(queryString, {
        allowedOperators: ['$gte', '$lte'], // Only $gte and $lte are allowed
      }),
    ).rejects.toThrowError("Operator '$invalidOperator' is not allowed.");
  });

  it('should parse JSON-like filters from query string', async () => {
    const queryString = qs.stringify({
      age: { $gte: 18 },
    });

    mockModel.find.mockImplementation(() => ({
      skip: jest.fn().mockImplementation(() => ({
        limit: jest.fn().mockImplementation(() => ({
          sort: jest.fn().mockImplementation(() => ({
            populate: jest.fn().mockImplementation(() => ({
              lean: jest.fn().mockImplementation(() => ({
                exec: jest.fn().mockResolvedValue([{ name: 'Jane Doe', age: 25 }]),
              })),
            })),
          })),
        })),
      })),
    }));
    mockModel.countDocuments.mockResolvedValue(1);

    const result = await query3.query(queryString);

    expect(result.records).toEqual([{ name: 'Jane Doe', age: 25 }]);
    expect(mockModel.find).toHaveBeenCalledWith({ age: { $gte: 18 } });
  });
});
