import { Model } from "./model.js";
import { Dialect } from "./dialect.js";
import { 
  QueryParams, 
  Schema,
  AlterSchema,
  Condition, 
  Ordering,
  NonEmptyArray,
} from "./types.js";

export class Database<
  D extends Dialect<any>,
  S extends Record<string, object> = Record<string, object>> {
  private has_started = false;
  private models:Map<keyof S,Model<any,D>>=new Map();
  constructor(public readonly dialect: D,public readonly schemas: Database.Schemas<S>) {}
  
  get isStarted(): boolean {
    return this.has_started && this.dialect.isConnected();
  }
  
  create<T extends object>(
    name: string,
    schema: Schema<T>
  ): Database.Creation<T> {
    return new Database.Creation<T>(this.dialect, name, schema);
  }
  model<T extends keyof S>(name:T){
    const model=this.models.get(name)
    if(model) return model as Model<S[T],D>
    const result=new Model<S[T],D>(this,name as string)
    this.models.set(name,result)
    return result
  }
  alter<T extends object>(
    name: string,
    alterations: AlterSchema<T>
  ): Database.Alteration<T> {
    return new Database.Alteration<T>(this.dialect, name, alterations);
  }
  
  dropTable<T extends object = any>(name: string): Database.DroppingTable<T> {
    return new Database.DroppingTable<T>(this.dialect, name);
  }
  
  dropIndex(indexName: string, tableName: string): Database.DroppingIndex {
    return new Database.DroppingIndex(this.dialect, indexName, tableName);
  }

  select<T extends object, K extends keyof T>(
    name: string,
    fields: NonEmptyArray<K>
  ): Database.Selection<Pick<T, K>, K> {
    return new Database.Selection<Pick<T, K>, K>(this.dialect, name, fields);
  }
  
  update<T extends object>(
    name: string,
    update: Partial<T>
  ): Database.Updation<T> {
    return new Database.Updation<T>(this.dialect, name, update);
  }
  
  insert<T extends object>(name: string, data: T): Database.Insertion<T> {
    return new Database.Insertion<T>(this.dialect, name, data);
  }
  
  delete<T extends object = any>(name: string): Database.Deletion<T> {
    return new Database.Deletion<T>(this.dialect, name);
  }
  
  async start(): Promise<void> {
    await this.dialect.connect();
    for(const [name, schema] of Object.entries(this.schemas)){
      await this.create(name, schema)
    }
    this.has_started = true;
  }
  
  async stop(): Promise<void> {
    await this.dialect.disconnect();
    this.has_started = false;
  }
}

abstract class ThenableQuery<T = any>
  implements PromiseLike<T>, AsyncIterable<T>
{
  protected constructor(protected readonly dialect: Dialect) {}
  
  // Abstract method to get query parameters
  protected abstract getQueryParams(): QueryParams;
  
  then<TResult1 = T, TResult2 = never>(
    onfulfilled?:
      | ((value: T) => TResult1 | PromiseLike<TResult1>)
      | undefined
      | null,
    onrejected?:
      | ((reason: any) => TResult2 | PromiseLike<TResult2>)
      | undefined
      | null
  ): Promise<TResult1 | TResult2> {
    const params = this.getQueryParams();
    const { sql, params: queryParams } = this.dialect.buildQuery(params);
    return this.dialect.query<T>(sql, queryParams).then(onfulfilled, onrejected);
  }
  
  catch<TResult = never>(
    onrejected?:
      | ((reason: any) => TResult | PromiseLike<TResult>)
      | undefined
      | null
  ): Promise<any | TResult> {
    const params = this.getQueryParams();
    const { sql, params: queryParams } = this.dialect.buildQuery(params);
    return this.dialect.query(sql, queryParams).catch(onrejected);
  }
  
  finally(onfinally?: (() => void) | undefined | null): Promise<any> {
    const params = this.getQueryParams();
    const { sql, params: queryParams } = this.dialect.buildQuery(params);
    return this.dialect.query(sql, queryParams).finally(onfinally);
  }
  
  async *[Symbol.asyncIterator](): AsyncIterator<T, void, unknown> {
    const params = this.getQueryParams();
    const { sql, params: queryParams } = this.dialect.buildQuery(params);
    const rows = await this.dialect.query(sql, queryParams);
    for (const row of Array.isArray(rows) ? rows : [rows]) {
      yield row;
    }
  }
}
export namespace Database {
  export type Schemas<S extends Record<string, object>> = {
    [K in keyof S]: Schema<S[K]>;
  };
  export class Alteration<T extends object> extends ThenableQuery<void> {
    constructor(
      dialect: Dialect,
      private readonly tableName: string,
      private readonly alterations: AlterSchema<T>
    ) {
      super(dialect);
    }
    
    protected getQueryParams(): QueryParams<T> {
      return {
        type: 'alter',
        tableName: this.tableName,
        alterations: this.alterations
      };
    }
  }
  export class DroppingTable<T extends object = any> extends ThenableQuery<number> {
    private conditions: Condition<T> = {};
    
    constructor(
      dialect: Dialect, 
      private readonly tableName: string
    ) {
      super(dialect);
    }
    
    where(query: Condition<T>): this {
      this.conditions = { ...this.conditions, ...query };
      return this;
    }
    
    protected getQueryParams(): QueryParams<T> {
      return {
        type: 'drop_table',
        tableName: this.tableName,
        conditions: this.conditions
      };
    }
  }
  export class DroppingIndex extends ThenableQuery<number> {
    private conditions: Condition<any> = {};
    
    constructor(
      dialect: Dialect,
      private readonly indexName: string,
      private readonly tableName: string
    ) {
      super(dialect);
    }
    
    where(query: Condition<any>): this {
      this.conditions = { ...this.conditions, ...query };
      return this;
    }
    
    protected getQueryParams(): QueryParams {
      return {
        type: 'drop_index',
        tableName: this.tableName,
        indexName: this.indexName,
        conditions: this.conditions
      };
    }
  }
  export class Creation<T extends object> extends ThenableQuery<void> {
    constructor(
      dialect: Dialect,
      private readonly tableName: string,
      private readonly schema: Schema<T>
    ) {
      super(dialect);
    }
    
    protected getQueryParams(): QueryParams<T> {
      return {
        type: 'create',
        tableName: this.tableName,
        schema: this.schema
      };
    }
  }
  export class Selection<
    T extends object,
    K extends keyof T
  > extends ThenableQuery<Pick<T, K>[]> {
    private conditions: Condition<T> = {};
    private groupings: (keyof T)[] = [];
    private orderings: Ordering<T>[] = [];
    private limitCount?: number;
    private offsetCount?: number;
    
    constructor(
      dialect: Dialect,
      private readonly modelName: string,
      private readonly fields: NonEmptyArray<K>
    ) {
      super(dialect);
    }
    
    where(query: Condition<T>): this {
      this.conditions = { ...this.conditions, ...query };
      return this;
    }
    
    groupBy(...fields: (keyof T)[]): this {
      this.groupings.push(...fields);
      return this;
    }
    
    orderBy(field: keyof T, direction: "ASC" | "DESC" = "ASC"): this {
      this.orderings.push({ field, direction });
      return this;
    }
    
    limit(count: number): this {
      this.limitCount = count;
      return this;
    }
    
    offset(count: number): this {
      this.offsetCount = count;
      return this;
    }
    
    protected getQueryParams(): QueryParams<T> {
      return {
        type: 'select',
        tableName: this.modelName,
        fields: this.fields,
        conditions: this.conditions,
        groupings: this.groupings,
        orderings: this.orderings,
        limitCount: this.limitCount,
        offsetCount: this.offsetCount
      };
    }
  }
  export class Insertion<T extends object> extends ThenableQuery<T> {
    constructor(
      dialect: Dialect, 
      private readonly modelName: string, 
      private readonly data: T
    ) {
      super(dialect);
    }
    
    protected getQueryParams(): QueryParams<T> {
      return {
        type: 'insert',
        tableName: this.modelName,
        data: this.data
      };
    }
  }
  export class Updation<T extends object> extends ThenableQuery<number> {
    private conditions: Condition<T> = {};
    
    constructor(
      dialect: Dialect,
      private readonly modelName: string,
      private readonly update: Partial<T>
    ) {
      super(dialect);
    }
    
    where(query: Condition<T>): this {
      this.conditions = { ...this.conditions, ...query };
      return this;
    }
    
    protected getQueryParams(): QueryParams<T> {
      return {
        type: 'update',
        tableName: this.modelName,
        update: this.update,
        conditions: this.conditions
      };
    }
  }
  export class Deletion<T extends object = any> extends ThenableQuery<number> {
    private conditions: Condition<T> = {};
    
    constructor(
      dialect: Dialect, 
      private readonly modelName: string
    ) {
      super(dialect);
    }
    
    where(query: Condition<T>): this {
      this.conditions = { ...this.conditions, ...query };
      return this;
    }
    
    protected getQueryParams(): QueryParams<T> {
      return {
        type: 'delete',
        tableName: this.modelName,
        conditions: this.conditions
      };
    }
  }
  export interface DialectConfig {
    memory?: boolean;
  }
  export interface Config extends DialectConfig {
    default?: string;
  }
  export type DialectConstructor<T> = {
    new (config: T): Dialect<T>;
  };

  export function isDialectConstructor<T>(
    fn: DialectFactory<T>
  ): fn is DialectConstructor<T> {
    return fn.prototype && fn.prototype.constructor === fn;
  }

  export type DialectCreator<T> = (config: T) => Dialect<T>;
  export type DialectFactory<T> = DialectConstructor<T> | DialectCreator<T>;
}
