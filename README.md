
# `@sotatech/query3`

A powerful and flexible query handler for MongoDB models using Mongoose.  
`@sotatech/query3` simplifies handling advanced queries, pagination, filtering, and aggregation pipelines in a clean and type-safe manner.

---

## **Features**
- **Advanced Query Parsing**: Supports filtering, pagination, and sorting.
- **Operator Validation**: Prevents the use of unauthorized operators to ensure query security.
- **Field Omissions**: Removes sensitive fields from results.
- **Population**: Supports Mongoose `populate` for relational data.
- **Aggregation Pipelines**: Easily handle complex MongoDB pipelines.
- **Type-Safe**: Leverages TypeScript to ensure safety and consistency.

---

## **Installation**

```bash
npm install @sotatech/query3
```

---

## **Getting Started**

### **Setup**
Import `Query3` and integrate it with your Mongoose model.

#### Example:
```typescript
import { Query3 } from '@sotatech/query3';
import { UserModel } from './models/user.model'; // Your Mongoose model
```

### **Basic Query Usage**
#### Example:
```typescript
import qs from 'qs';

const queryString = qs.stringify({
  limit: 10,
  offset: 0,
  sort: { age: -1 },
  age: { $gte: 18 },
});

const query = new Query3(UserModel);

const result = await query.query(queryString, {
  populate: [{ path: 'role', select: 'name' }],
  omitFields: ['password'], // Exclude sensitive fields
  allowedOperators: ['$gte', '$lte', '$eq'], // Restrict allowed operators
});

console.log(result);
/**
 * {
 *   records: [
 *     { name: 'John Doe', age: 30, role: { name: 'Admin' } },
 *     { name: 'Jane Doe', age: 25, role: { name: 'User' } }
 *   ],
 *   pagination: {
 *     totalRows: 50,
 *     totalPages: 5
 *   }
 * }
 */
```

---

## **API Documentation**

### **1. Constructor**
#### **`new Query3<T>(model: Model<T>)`**
- **`T`**: The type of the Mongoose model being queried.
- **`model`**: The Mongoose model instance.

#### Example:
```typescript
const query = new Query3(UserModel);
```

---

### **2. Query**
#### **`query(queryString: string, options?: Query3Options<T>)`**
Executes a query on the provided model.

- **`queryString`**: A JSON string representing the query parameters (e.g., `filter`, `limit`, `offset`, etc.).
- **`options`** (optional): Custom options for the query.

#### **`Query3Options<T>`**
| Option            | Type                                                                                   | Description                                      |
|-------------------|----------------------------------------------------------------------------------------|--------------------------------------------------|
| `populate`        | `PopulateOptions` or `Array<PopulateOptions>`                                          | Defines relationships to populate.              |
| `omitFields`      | `Array<keyof T>`                                                                       | Fields to omit from the results.                |
| `queryMongoose`   | `FilterQuery<T>`                                                                       | Additional Mongoose filters to apply.           |
| `allowedOperators`| `Array<string>`                                                                        | Restrict allowed MongoDB operators.             |

#### Example:
```typescript
const result = await query.query(queryString, {
  populate: [{ path: 'role', select: 'name' }],
  omitFields: ['password'],
  queryMongoose: { isActive: true },
  allowedOperators: ['$gte', '$lte'],
});
```

---

### **3. Aggregation**
#### **`aggregateQuery(pipeline: PipelineStage[]): Promise<any[]>`**
Executes an aggregation pipeline on the model.

- **`pipeline`**: An array of MongoDB aggregation stages.

#### Example:
```typescript
const pipeline = [
  { $match: { age: { $gte: 18 } } },
  { $group: { _id: '$role', count: { $sum: 1 } } },
];

const result = await query.aggregateQuery(pipeline);

console.log(result);
/**
 * [
 *   { _id: 'admin', count: 5 },
 *   { _id: 'user', count: 10 }
 * ]
 */
```

---

### **4. Field Omission**
#### **`omitFields(data: T[], fields: (keyof T)[]): T[]`**
Removes specified fields from the result set.

- **`data`**: The array of documents to process.
- **`fields`**: The list of fields to remove.

#### Example:
```typescript
const data = [
  { name: 'John Doe', password: '123456', age: 30 },
  { name: 'Jane Doe', password: 'abcdef', age: 25 },
];

const result = query.omitFields(data, ['password']);
console.log(result);
/**
 * [
 *   { name: 'John Doe', age: 30 },
 *   { name: 'Jane Doe', age: 25 }
 * ]
 */
```

---

## **Query String Format**

The `queryString` parameter accepts a JSON string with the following properties:

| Property | Type                  | Description                                      |
|----------|-----------------------|--------------------------------------------------|
| `filter` | `object`              | MongoDB query filters.                          |
| `limit`  | `number` (default: 20)| Maximum number of records to return.            |
| `offset` | `number` (default: 0) | Number of records to skip (for pagination).      |
| `sort`   | `object`              | Sorting configuration (e.g., `{ age: -1 }`).    |

#### Example:
```json
{
  "limit": 10,
  "offset": 0,
  "sort": { "createdAt": -1 },
  "age": { "$gte": 18 }
}
```

---

## **Error Handling**

### **Operator Validation**
If an unsupported operator is used, an error will be thrown.

#### Example:
```typescript
const queryString = qs.stringify({
  age: { $invalidOperator: 30 },
});

try {
  await query.query(queryString, { allowedOperators: ['$gte', '$lte'] });
} catch (error) {
  console.error(error.message); // "Operator '$invalidOperator' is not allowed."
}
```

---

## **Contributing**
Contributions are welcome! To contribute:
1. Fork the repository.
2. Create a new branch (`feature/your-feature`).
3. Commit your changes.
4. Open a pull request.

---

## **License**
This project is licensed under the [MIT License](LICENSE).

---

## **Support**
For issues or questions, please open an issue on [GitHub](https://github.com/sotatech/query3/issues).

Happy Coding! 🚀
