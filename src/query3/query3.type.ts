import { PopulateOptions, FilterQuery, PipelineStage } from 'mongoose';

/**
 * Query3Parse - Represents the raw query string parsed into a key-value object.
 */
export type Query3Parse = {
  [key: string]: any; // Supports dynamic keys with any value type
};

/**
 * Query3Options - Represents the options available for customizing a query.
 *
 * @template T - The type of the Mongoose model being queried.
 */
export type Query3Options<T> = {
  /**
   * Specifies the relationships to populate in the query results.
   * Can be a single PopulateOptions or an array of PopulateOptions.
   */
  populate?: PopulateOptions | Array<PopulateOptions>;

  /**
   * Specifies the fields to omit from the results.
   * Each field must be a key of the model type T.
   */
  omitFields?: (keyof T)[];

  /**
   * Additional filters to combine with the parsed query filters.
   * Must conform to the Mongoose FilterQuery type.
   */
  queryMongoose?: FilterQuery<T>;

  /**
   * Specifies the list of allowed operators for query validation.
   * Defaults to a predefined set of common MongoDB operators.
   */
  allowedOperators?: string[];
};

/**
 * ParseQueryResult - Represents the result of parsing a query string into a structured query.
 *
 * @template T - The type of the Mongoose model being queried.
 */
export type ParseQueryResult<T> = {
  /**
   * The parsed filter object to be used in the query.
   */
  filter: FilterQuery<T>;

  /**
   * The limit for pagination, representing the maximum number of documents to return.
   */
  limit: number;

  /**
   * The offset for pagination, representing the starting point of the query.
   */
  offset: number;

  /**
   * The sort configuration for the query.
   */
  sort: any;

  /**
   * Flag indicating whether to return only the count of documents matching the query.
   */
  count: boolean;

  /**
   * Flag indicating whether to return only a single document.
   */
  justOne: boolean;

  /**
   * Cache time in milliseconds, used for caching query results.
   */
  cacheTimeMs: number;
};

/**
 * PaginationResult - Represents metadata for paginated query results.
 */
export type PaginationResult = {
  /**
   * The total number of documents matching the query.
   */
  totalRows: number;

  /**
   * The total number of pages based on the document count and pagination limit.
   */
  totalPages: number;
};
