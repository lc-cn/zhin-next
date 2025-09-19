import { 
  QueryParams, 
  QueryResult, 
  CreateQueryParams, 
  SelectQueryParams, 
  InsertQueryParams, 
  UpdateQueryParams, 
  DeleteQueryParams, 
  AlterQueryParams, 
  DropTableQueryParams, 
  DropIndexQueryParams,
  AddSchema,
  ModifySchema,
  DropSchema,
  Condition,
  isCreateQuery,
  isSelectQuery,
  isInsertQuery,
  isUpdateQuery,
  isDeleteQuery,
  isAlterQuery,
  isDropTableQuery,
  isDropIndexQuery,
  Column,
} from './types.js';

// ============================================================================
// Database Dialect Interface
// ============================================================================


// ============================================================================
// SQL Builder Base Class
// ============================================================================

export abstract class Dialect<T = any> {
  public readonly name: string;
  public readonly config: T;
  
  protected constructor(name: string, config: T) {
    this.name = name;
    this.config = config;
  }
  
  // Abstract methods that must be implemented by concrete dialects
  abstract isConnected(): boolean;
  abstract connect(): Promise<void>;
  abstract disconnect(): Promise<void>;
  abstract healthCheck(): Promise<boolean>;
  abstract query<U = any>(sql: string, params?: any[]): Promise<U>;
  abstract mapColumnType(type: string): string;
  abstract quoteIdentifier(identifier: string): string;
  abstract getParameterPlaceholder(index: number): string;
  abstract getStatementTerminator(): string;
  abstract formatBoolean(value: boolean): string;
  abstract formatDate(value: Date): string;
  abstract formatJson(value: any): string;
  abstract escapeString(value: string): string;
  abstract formatDefaultValue(value: any): string;
  abstract formatLimit(limit: number): string;
  abstract formatOffset(offset: number): string;
  abstract formatLimitOffset(limit: number, offset: number): string;
  abstract formatCreateTable(tableName: string, columns: string[]): string;
  abstract formatAlterTable(tableName: string, alterations: string[]): string;
  abstract formatDropTable(tableName: string, ifExists?: boolean): string;
  abstract formatDropIndex(indexName: string, tableName: string, ifExists?: boolean): string;
  abstract dispose(): Promise<void>;
  
  // SQL generation method
  buildQuery<U extends object = any>(params: QueryParams<U>): QueryResult {
    if (isCreateQuery(params)) {
      return this.buildCreateQuery(params);
    } else if (isSelectQuery(params)) {
      return this.buildSelectQuery(params);
    } else if (isInsertQuery(params)) {
      return this.buildInsertQuery(params);
    } else if (isUpdateQuery(params)) {
      return this.buildUpdateQuery(params);
    } else if (isDeleteQuery(params)) {
      return this.buildDeleteQuery(params);
    } else if (isAlterQuery(params)) {
      return this.buildAlterQuery(params);
    } else if (isDropTableQuery(params)) {
      return this.buildDropTableQuery(params);
    } else if (isDropIndexQuery(params)) {
      return this.buildDropIndexQuery(params);
    } else {
      throw new Error(`Unsupported query type: ${(params as any).type}`);
    }
  }
  
  // ========================================================================
  // CREATE TABLE Query
  // ========================================================================
  
  protected buildCreateQuery<T extends object>(params: CreateQueryParams<T>): QueryResult {
    const columnDefs = Object.entries(params.schema).map(([field, column]) => this.formatColumnDefinition(field,column as Column));
    const sql = this.formatCreateTable(params.tableName, columnDefs);
    return { sql, params: [] };
  }
  
  // ========================================================================
  // SELECT Query
  // ========================================================================
  
  protected buildSelectQuery<T extends object>(params: SelectQueryParams<T>): QueryResult {
    const fields = params.fields && params.fields.length
      ? params.fields.map(f => this.quoteIdentifier(String(f))).join(', ')
      : '*';
    
    let sql = `SELECT ${fields} FROM ${this.quoteIdentifier(params.tableName)}`;
    const queryParams: any[] = [];
    
    // WHERE clause
    if (params.conditions) {
      const [condition, conditionParams] = this.parseCondition(params.conditions);
      if (condition) {
        sql += ` WHERE ${condition}`;
        queryParams.push(...conditionParams);
      }
    }
    
    // GROUP BY clause
    if (params.groupings && params.groupings.length) {
      const groupings = params.groupings.map(f => this.quoteIdentifier(String(f))).join(', ');
      sql += ` GROUP BY ${groupings}`;
    }
    
    // ORDER BY clause
    if (params.orderings && params.orderings.length) {
      const orderings = params.orderings
        .map(o => `${this.quoteIdentifier(String(o.field))} ${o.direction}`)
        .join(', ');
      sql += ` ORDER BY ${orderings}`;
    }
    
    // LIMIT and OFFSET
    if (params.limitCount !== undefined && params.offsetCount !== undefined) {
      sql += ` ${this.formatLimitOffset(params.limitCount, params.offsetCount)}`;
    } else if (params.limitCount !== undefined) {
      sql += ` ${this.formatLimit(params.limitCount)}`;
    } else if (params.offsetCount !== undefined) {
      sql += ` ${this.formatOffset(params.offsetCount)}`;
    }
    
    return { sql, params: queryParams };
  }
  
  // ========================================================================
  // INSERT Query
  // ========================================================================
  
  protected buildInsertQuery<T extends object>(params: InsertQueryParams<T>): QueryResult {
    const keys = Object.keys(params.data);
    const columns = keys.map(k => this.quoteIdentifier(k)).join(', ');
    const placeholders = keys.map((_, index) => this.getParameterPlaceholder(index)).join(', ');
    
    const sql = `INSERT INTO ${this.quoteIdentifier(params.tableName)} (${columns}) VALUES (${placeholders})`;
    const values = Object.values(params.data);
    
    return { sql, params: values };
  }
  
  // ========================================================================
  // UPDATE Query
  // ========================================================================
  
  protected buildUpdateQuery<T extends object>(params: UpdateQueryParams<T>): QueryResult {
    const updateKeys = Object.keys(params.update);
    const setClause = updateKeys
      .map((k, index) => `${this.quoteIdentifier(k)} = ${this.getParameterPlaceholder(index)}`)
      .join(', ');
    
    let sql = `UPDATE ${this.quoteIdentifier(params.tableName)} SET ${setClause}`;
    const queryParams: any[] = [...Object.values(params.update)];
    
    // WHERE clause
    if (params.conditions) {
      const [condition, conditionParams] = this.parseCondition(params.conditions);
      if (condition) {
        sql += ` WHERE ${condition}`;
        queryParams.push(...conditionParams);
      }
    }
    
    return { sql, params: queryParams };
  }
  
  // ========================================================================
  // DELETE Query
  // ========================================================================
  
  protected buildDeleteQuery<T extends object>(params: DeleteQueryParams<T>): QueryResult {
    let sql = `DELETE FROM ${this.quoteIdentifier(params.tableName)}`;
    const queryParams: any[] = [];
    
    // WHERE clause
    if (params.conditions) {
      const [condition, conditionParams] = this.parseCondition(params.conditions);
      if (condition) {
        sql += ` WHERE ${condition}`;
        queryParams.push(...conditionParams);
      }
    }
    
    return { sql, params: queryParams };
  }
  
  // ========================================================================
  // ALTER TABLE Query
  // ========================================================================
  
  protected buildAlterQuery<T extends object>(params: AlterQueryParams<T>): QueryResult {
    const alterations = Object.entries(params.alterations).map(([field,alteration]) => this.formatAlteration(field, alteration as AddSchema<T> | ModifySchema<T> | DropSchema));
    const sql = this.formatAlterTable(params.tableName, alterations);
    return { sql, params: [] };
  }
  
  // ========================================================================
  // DROP TABLE Query
  // ========================================================================
  
  protected buildDropTableQuery<T extends object>(params: DropTableQueryParams<T>): QueryResult {
    const sql = this.formatDropTable(params.tableName, true);
    return { sql, params: [] };
  }
  
  // ========================================================================
  // DROP INDEX Query
  // ========================================================================
  
  protected buildDropIndexQuery(params: DropIndexQueryParams): QueryResult {
    const sql = this.formatDropIndex(params.indexName, params.tableName, true);
    return { sql, params: [] };
  }
  
  // ========================================================================
  // Helper Methods
  // ========================================================================
  
  protected formatColumnDefinition<T =any>(field: string, column: Column<T>): string {
    const name = this.quoteIdentifier(String(field));
    const type = this.mapColumnType(column.type);
    const length = column.length ? `(${column.length})` : '';
    const nullable = column.nullable === false ? ' NOT NULL' : '';
    const primary = column.primary ? ' PRIMARY KEY' : '';
    const unique = column.unique ? ' UNIQUE' : '';
    const defaultVal = column.default !== undefined 
      ? ` DEFAULT ${this.formatDefaultValue(column.default)}` 
      : '';
    
    return `${name} ${type}${length}${primary}${unique}${nullable}${defaultVal}`;
  }
  
  protected formatAlteration<T=any>(field:string,alteration: AddSchema<T> | ModifySchema<T> | DropSchema): string {
    const name = this.quoteIdentifier(field);
    
    switch (alteration.action) {
      case 'add':
        // 将 alteration 转换为 Column 格式
        const addColumn: Column<T> = {
          type: alteration.type,
          nullable: alteration.nullable,
          default: alteration.default,
          primary: alteration.primary,
          length: alteration.length
        };
        return `ADD COLUMN ${this.formatColumnDefinition(field, addColumn)}`;
      case 'modify':
        const type = alteration.type ? this.mapColumnType(alteration.type) : '';
        const length = alteration.length ? `(${alteration.length})` : '';
        const nullable = alteration.nullable !== undefined 
          ? (alteration.nullable ? ' NULL' : ' NOT NULL') 
          : '';
        const defaultVal = alteration.default !== undefined 
          ? ` DEFAULT ${this.formatDefaultValue(alteration.default)}` 
          : '';
        return `MODIFY COLUMN ${name} ${type}${length}${nullable}${defaultVal}`;
      case 'drop':
        return `DROP COLUMN ${name}`;
      default:
        throw new Error(`Unsupported alteration action`);
    }
  }
  
  protected parseCondition<T extends object>(condition: Condition<T>): [string, any[]] {
    const clauses: string[] = [];
    const params: any[] = [];

    for (const key in condition) {
      if (key === '$and' && Array.isArray((condition as any).$and)) {
        const subClauses: string[] = [];
        for (const subCondition of (condition as any).$and) {
          const [subClause, subParams] = this.parseCondition(subCondition);
          if (subClause) {
            subClauses.push(`(${subClause})`);
            params.push(...subParams);
          }
        }
        if (subClauses.length) {
          clauses.push(subClauses.join(' AND '));
        }
      } else if (key === '$or' && Array.isArray((condition as any).$or)) {
        const subClauses: string[] = [];
        for (const subCondition of (condition as any).$or) {
          const [subClause, subParams] = this.parseCondition(subCondition);
          if (subClause) {
            subClauses.push(`(${subClause})`);
            params.push(...subParams);
          }
        }
        if (subClauses.length) {
          clauses.push(subClauses.join(' OR '));
        }
      } else if (key === '$not' && (condition as any).$not) {
        const [subClause, subParams] = this.parseCondition((condition as any).$not);
        if (subClause) {
          clauses.push(`NOT (${subClause})`);
          params.push(...subParams);
        }
      } else {
        const value = (condition as any)[key];
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          for (const op in value) {
            const quotedKey = this.quoteIdentifier(key);
            const placeholder = this.getParameterPlaceholder(params.length);
            
            switch (op) {
              case '$eq':
                clauses.push(`${quotedKey} = ${placeholder}`);
                params.push(value[op]);
                break;
              case '$ne':
                clauses.push(`${quotedKey} <> ${placeholder}`);
                params.push(value[op]);
                break;
              case '$gt':
                clauses.push(`${quotedKey} > ${placeholder}`);
                params.push(value[op]);
                break;
              case '$gte':
                clauses.push(`${quotedKey} >= ${placeholder}`);
                params.push(value[op]);
                break;
              case '$lt':
                clauses.push(`${quotedKey} < ${placeholder}`);
                params.push(value[op]);
                break;
              case '$lte':
                clauses.push(`${quotedKey} <= ${placeholder}`);
                params.push(value[op]);
                break;
              case '$in':
                if (Array.isArray(value[op]) && value[op].length) {
                  const placeholders = value[op].map(() => this.getParameterPlaceholder(params.length + value[op].indexOf(value[op])));
                  clauses.push(`${quotedKey} IN (${placeholders.join(', ')})`);
                  params.push(...value[op]);
                } else {
                  clauses.push('1=0'); // Empty IN clause should yield no results
                }
                break;
              case '$nin':
                if (Array.isArray(value[op]) && value[op].length) {
                  const placeholders = value[op].map(() => this.getParameterPlaceholder(params.length + value[op].indexOf(value[op])));
                  clauses.push(`${quotedKey} NOT IN (${placeholders.join(', ')})`);
                  params.push(...value[op]);
                }
                break;
              case '$like':
                clauses.push(`${quotedKey} LIKE ${placeholder}`);
                params.push(value[op]);
                break;
              case '$nlike':
                clauses.push(`${quotedKey} NOT LIKE ${placeholder}`);
                params.push(value[op]);
                break;
            }
          }
        } else {
          const quotedKey = this.quoteIdentifier(key);
          const placeholder = this.getParameterPlaceholder(params.length);
          clauses.push(`${quotedKey} = ${placeholder}`);
          params.push(value);
        }
      }
    }

    return [clauses.join(' AND '), params];
  }
}
