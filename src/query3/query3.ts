import { Model, FilterQuery, PipelineStage, PopulateOptions } from 'mongoose';
import * as qs from 'qs';
import {
  Query3Options,
  ParseQueryResult,
  PaginationResult,
} from './query3.type';
import {
  DefaultLimit,
  DefaultOffset,
  DefaultAllowedOperators,
} from './query3.constant';

/**
 * Query3 - A flexible query handler for MongoDB models.
 * Supports advanced filtering, pagination, operator validation, and aggregation pipelines.
 */
export class Query3<T> {
  private model: Model<T>;

  /**
   * @param model - The MongoDB model to be queried.
   */
  constructor(model: Model<T>) {
    this.model = model;
  }

  /**
   * Validates if the operators in the query are allowed.
   * Throws an error if an operator is not part of the allowed list.
   *
   * @param query - The parsed query object.
   * @param allowedOperators - The list of operators allowed for this query.
   */
  private validateOperators(
    query: Record<string, any>,
    allowedOperators: string[],
  ): void {
    Object.entries(query).forEach(([key, value]) => {
      if (typeof value === 'object' && value !== null) {
        Object.keys(value).forEach((operator) => {
          if (!allowedOperators.includes(operator)) {
            throw new Error(`Operator '${operator}' is not allowed.`);
          }
        });
      }
    });
  }

  /**
   * Parses the query string into a structured MongoDB query object.
   *
   * @param queryString - The query string from the client (e.g., "?limit=10&offset=0").
   * @param options - Additional options for the query.
   * @returns A structured MongoDB query object with filters, limits, offsets, etc.
   */
  private parseQueryString(
    queryString: string,
    options: Query3Options<T>,
  ): ParseQueryResult<T> {
    const parsedQuery = qs.parse(queryString, {
      ignoreQueryPrefix: true,
      depth: 5, // Allow parsing nested objects
    });

    const limit = Number(parsedQuery.limit || DefaultLimit);
    const offset = Number(parsedQuery.offset || DefaultOffset);
    const sort = parsedQuery.sort || {};
    const count = parsedQuery.count === 'true';
    const justOne = parsedQuery.justOne === 'true';

    // Convert filters to their appropriate types
    const filters = Object.entries(parsedQuery)
      .filter(
        ([key]) =>
          !['limit', 'offset', 'sort', 'count', 'justOne'].includes(key),
      )
      .reduce((acc, [key, value]) => {
        if (typeof value === 'string' && value.startsWith('{')) {
          acc[key] = JSON.parse(value); // Parse JSON-like strings
        } else if (typeof value === 'object' && value !== null) {
          // Recursively parse objects
          acc[key] = Object.entries(value).reduce(
            (subAcc, [subKey, subValue]) => {
              (subAcc as Record<string, any>)[subKey] = isNaN(Number(subValue))
                ? subValue
                : Number(subValue); // Convert numeric strings to numbers
              return subAcc;
            },
            {},
          );
        } else {
          acc[key] = isNaN(Number(value)) ? value : Number(value);
        }
        return acc;
      }, {} as Record<string, any>);

    const allowedOperators =
      options.allowedOperators || DefaultAllowedOperators;
    this.validateOperators(filters, allowedOperators); // Validate operators

    return {
      filter: filters as FilterQuery<T>,
      limit,
      offset,
      sort,
      count,
      justOne,
      cacheTimeMs: 0,
    };
  }

  /**
   * Executes a query based on the provided query string and options.
   * Supports filtering, pagination, field omission, and population.
   *
   * @param queryString - The query string from the client (e.g., "?limit=10&offset=0").
   * @param options - Additional query options, such as populate, omitFields, and custom filters.
   * @returns The query results and pagination metadata.
   */
  public async query(
    queryString: string,
    options: Query3Options<T> = {},
  ): Promise<{ records: T[]; pagination: PaginationResult }> {
    const { filter, limit, offset, sort } = this.parseQueryString(
      queryString,
      options,
    );

    // Combine the parsed filters with any additional filters from the options
    const combinedFilter = { ...filter, ...options.queryMongoose };

    // Count the total number of documents matching the filter
    const totalRows = await this.model.countDocuments(combinedFilter);
    const totalPages = Math.ceil(totalRows / limit);

    // Fetch the records with pagination, sorting, and population
    const records = (await this.model
      .find(combinedFilter)
      .skip(offset)
      .limit(limit)
      .sort(sort)
      .populate(options.populate as PopulateOptions | PopulateOptions[])
      .lean()
      .exec()) as T[];

    // Return the result set along with pagination details
    return {
      records: options.omitFields
        ? this.omitFields(records, options.omitFields)
        : records,
      pagination: {
        totalRows,
        totalPages,
      },
    };
  }

  /**
   * Removes specified fields from the result set.
   *
   * @param data - The array of records to process.
   * @param fields - The list of fields to remove from each record.
   * @returns The processed array of records with specified fields removed.
   */
  private omitFields(data: T[], fields: (keyof T)[]): T[] {
    return data.map((item) => {
      const result = { ...item } as Record<string, any>;
      fields.forEach((field) => delete result[field as string]);
      return result as T;
    });
  }

  /**
   * Executes an aggregation pipeline on the model.
   *
   * @param pipeline - The aggregation pipeline stages.
   * @returns The result of the aggregation pipeline.
   */
  public async aggregate(pipeline: PipelineStage[]): Promise<any[]> {
    return this.model.aggregate(pipeline).exec();
  }
}
