import { Model } from "./model.js";

export class Database {
  public drivers: Map<string, Database.Driver<any>> = new Map();
  public models: Map<string, Model<any>> = new Map();
  has_init = false;
  #default_driver_name: string = "memory";
  setDefaultDriver(name: string) {
    this.#default_driver_name = name;
  }
  select<T extends object, K extends keyof T>(
    name: string,
    fields: K[],
    driver_name?: string
  ) {
    const driver = this.getDriver(driver_name);
    return new Database.Selection<T, K>(driver, name, fields);
  }
  update<T extends object>(
    name: string,
    update: Partial<T>,
    driver_name?: string
  ) {
    const driver = this.getDriver(driver_name);
    return new Database.Updation<T>(driver, name, update);
  }
  insert<T extends object>(name: string, data: T, driver_name?: string) {
    const driver = this.getDriver(driver_name);
    return new Database.Insertion<T>(driver, name, data);
  }
  delete(name: string, driver_name?: string) {
    const driver = this.getDriver(driver_name);
    return new Database.Deletion(driver, name);
  }
  getDriver(name?: string) {
    if (!name) return this.defaultDriver;
    const result = this.drivers.get(name);
    if (!result) throw new Error(`No database driver found for ${name}`);
    return result;
  }
  get defaultDriver() {
    const result = this.drivers.get(this.#default_driver_name);
    if (!result)
      throw new Error(
        `No database driver found for default driver ${
          this.#default_driver_name
        }`
      );
    return result;
  }
  defineModel<
    T extends Record<string, Model.Field> = Record<string, Model.Field>
  >(name: string, schema: T, config: Model.Config = {}) {
    let model = this.models.get(name);
    if (!model) {
      model = new Model<T>(this, name, schema, config);
      this.models.set(name, model);
      if (this.has_init) model.alter(schema);
    }
    return model as Model<T>;
  }
  register<T extends Database.Driver<any>>(driver: T) {
    this.drivers.set(driver.name, driver);
  }
  async init() {
    for (const driver of this.drivers.values()) {
      await driver.connect();
      await driver.syncModels(Array.from(this.models.values()));
    }
    this.has_init = true;
  }
}
abstract class ThenableQuery<T = any>
  implements PromiseLike<T>, AsyncIterable<T>
{
  protected constructor(public driver: Database.Driver) {}
  protected abstract buildQuery(): { sql: string; params: any[] };
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
    const { sql, params } = this.buildQuery();
    return this.driver.query<T>(sql, params).then(onfulfilled, onrejected);
  }
  catch<TResult = never>(
    onrejected?:
      | ((reason: any) => TResult | PromiseLike<TResult>)
      | undefined
      | null
  ): Promise<any | TResult> {
    const { sql, params } = this.buildQuery();
    return this.driver.query(sql, params).catch(onrejected);
  }
  finally(onfinally?: (() => void) | undefined | null): Promise<any> {
    const { sql, params } = this.buildQuery();
    return this.driver.query(sql, params).finally(onfinally);
  }
  async *[Symbol.asyncIterator](): AsyncIterator<T, void, unknown> {
    const { sql, params } = this.buildQuery();
    const rows = await this.driver.query(sql, params);
    for (const row of Array.isArray(rows) ? rows : [rows]) {
      yield row;
    }
  }
}
export namespace Database {
  export type Condition<T extends object> =
    | {
        [K in keyof T]?:
          | T[K]
          | {
              $eq?: T[K];
              $ne?: T[K];
              $gt?: T[K];
              $gte?: T[K];
              $lt?: T[K];
              $lte?: T[K];
              $in?: T[K][];
              $nin?: T[K][];
              $like?: string;
              $nlike?: string;
            };
      }
    | LogicLocCondition<T>;
  export interface LogicLocCondition<T extends object> {
    $and?: Condition<T>[];
    $or?: Condition<T>[];
    $not?: Condition<T>;
  }
  export class Selection<
    T extends object,
    K extends keyof T
  > extends ThenableQuery<Pick<T, K>[]> {
    constructor(
      driver: Driver,
      private modelName: string,
      private fields: K[]
    ) {
      super(driver);
    }
    #conditions: Database.Condition<T> = {};
    #groupings: (keyof T)[] = [];
    #orderings: { field: keyof T; direction: "ASC" | "DESC" }[] = [];
    #limitCount?: number;
    #offsetCount?: number;
    where(query: Database.Condition<T>) {
      this.#conditions = { ...this.#conditions, ...query };
      return this;
    }
    groupBy(...fields: (keyof T)[]) {
      this.#groupings.push(...fields);
      return this;
    }
    orderBy(field: keyof T, direction: "ASC" | "DESC" = "ASC") {
      this.#orderings.push({ field, direction });
      return this;
    }
    limit(count: number) {
      this.#limitCount = count;
      return this;
    }
    offset(count: number) {
      this.#offsetCount = count;
      return this;
    }
    protected buildQuery() {
      let sql = `SELECT ${
        this.fields.length
          ? this.fields.map((f) => `"${String(f)}"`).join(", ")
          : "*"
      } FROM "${this.modelName}"`;
      const [condition, params] = parseCondition(this.#conditions);
      if (condition) {
        sql += " WHERE " + condition;
      }
      if (this.#groupings.length) {
        sql +=
          " GROUP BY " +
          this.#groupings.map((f) => `"${String(f)}"`).join(", ");
      }
      if (this.#orderings.length) {
        sql +=
          " ORDER BY " +
          this.#orderings
            .map((o) => `"${String(o.field)}" ${o.direction}`)
            .join(", ");
      }
      if (this.#limitCount !== undefined) {
        sql += " LIMIT " + this.#limitCount;
      }
      if (this.#offsetCount !== undefined) {
        sql += " OFFSET " + this.#offsetCount;
      }
      return { sql, params };
    }
  }
  export class Insertion<T extends object> extends ThenableQuery<T> {
    constructor(driver: Driver, private modelName: string, private data: T) {
      super(driver);
    }
    protected buildQuery() {
      const keys = Object.keys(this.data);
      const placeholders = keys.map(() => "?").join(", ");
      const sql = `INSERT INTO "${this.modelName}" (${keys
        .map((k) => `"${k}"`)
        .join(", ")}) VALUES (${placeholders})`;
      return { sql, params: Object.values(this.data) };
    }
  }
  export class Updation<T extends object> extends ThenableQuery<number> {
    constructor(
      driver: Driver,
      private modelName: string,
      private update: Partial<T>
    ) {
      super(driver);
    }
    #conditions: Database.Condition<T> = {};
    where(query: Database.Condition<T>) {
      this.#conditions = { ...this.#conditions, ...query };
      return this;
    }
    protected buildQuery() {
      const updateKeys = Object.keys(this.update);
      let sql = `UPDATE "${this.modelName}" SET ${updateKeys
        .map((k) => `"${k}" = ?`)
        .join(", ")}`;
      const [condition, params] = parseCondition(this.#conditions);
      if (condition) {
        sql += " WHERE " + condition;
      }
      return { sql, params: [...Object.values(this.update), ...params] };
    }
  }
  export class Deletion<T extends object> extends ThenableQuery<number> {
    constructor(driver: Driver, private modelName: string) {
      super(driver);
    }
    #conditions: Database.Condition<T> = {};
    where(query: Database.Condition<T>) {
      this.#conditions = { ...this.#conditions, ...query };
      return this;
    }
    protected buildQuery() {
      const queryKeys = Object.keys(this.#conditions);
      let sql = `DELETE FROM "${this.modelName}"`;
      const [condition, params] = parseCondition(this.#conditions);
      if (condition) {
        sql += " WHERE " + condition;
      }
      return { sql, params };
    }
  }
  function parseCondition<T extends object>(
    condition: Condition<T>
  ): [string, any[]] {
    const clauses: string[] = [];
    const params: any[] = [];

    for (const key in condition) {
      if (
        key === "$and" &&
        Array.isArray((condition as Database.LogicLocCondition<T>).$and)
      ) {
        const subClauses: string[] = [];
        for (const subCondition of (condition as Database.LogicLocCondition<T>)
          .$and!) {
          const [subClause, subParams] = parseCondition(subCondition);
          if (subClause) {
            subClauses.push(`(${subClause})`);
            params.push(...subParams);
          }
        }
        if (subClauses.length) {
          clauses.push(subClauses.join(" AND "));
        }
      } else if (
        key === "$or" &&
        Array.isArray((condition as Database.LogicLocCondition<T>).$or)
      ) {
        const subClauses: string[] = [];
        for (const subCondition of (condition as Database.LogicLocCondition<T>)
          .$or!) {
          const [subClause, subParams] = parseCondition(subCondition);
          if (subClause) {
            subClauses.push(`(${subClause})`);
            params.push(...subParams);
          }
        }
        if (subClauses.length) {
          clauses.push(subClauses.join(" OR "));
        }
      } else if (
        key === "$not" &&
        (condition as Database.LogicLocCondition<T>).$not
      ) {
        const [subClause, subParams] = parseCondition(
          (condition as Database.LogicLocCondition<T>).$not!
        );
        if (subClause) {
          clauses.push(`NOT (${subClause})`);
          params.push(...subParams);
        }
      } else {
        const value = (condition as any)[key];
        if (value && typeof value === "object" && !Array.isArray(value)) {
          for (const op in value) {
            switch (op) {
              case "$eq":
                clauses.push(`"${key}" = ?`);
                params.push(value[op]);
                break;
              case "$ne":
                clauses.push(`"${key}" <> ?`);
                params.push(value[op]);
                break;
              case "$gt":
                clauses.push(`"${key}" > ?`);
                params.push(value[op]);
                break;
              case "$gte":
                clauses.push(`"${key}" >= ?`);
                params.push(value[op]);
                break;
              case "$lt":
                clauses.push(`"${key}" < ?`);
                params.push(value[op]);
                break;
              case "$lte":
                clauses.push(`"${key}" <= ?`);
                params.push(value[op]);
                break;
              case "$in":
                if (Array.isArray(value[op]) && value[op].length) {
                  clauses.push(
                    `"${key}" IN (${value[op].map(() => "?").join(", ")})`
                  );
                  params.push(...value[op]);
                } else {
                  clauses.push("1=0"); // Empty IN clause should yield no results
                }
                break;
              case "$nin":
                if (Array.isArray(value[op]) && value[op].length) {
                  clauses.push(
                    `"${key}" NOT IN (${value[op].map(() => "?").join(", ")})`
                  );
                  params.push(...value[op]);
                }
                break;
              case "$like":
                clauses.push(`"${key}" LIKE ?`);
                params.push(value[op]);
                break;
              case "$nlike":
                clauses.push(`"${key}" NOT LIKE ?`);
                params.push(value[op]);
                break;
            }
          }
        } else {
          clauses.push(`"${key}" = ?`);
          params.push(value);
        }
      }
    }

    return [clauses.join(" AND "), params];
  }
  export abstract class Driver<T = any> {
    protected constructor(public name: string, public config: T) {}
    abstract syncModels(models: Model<any>[]): Promise<void>;
    abstract alterModel<T extends Record<string, Model.Field>>(
      model: Model<T>,
      schema: Partial<T>
    ): Promise<void>;
    abstract connect(): Promise<void>;
    abstract disconnect(): Promise<void>;
    abstract isConnected(): boolean;
    abstract query<U = any>(sql: string, params?: any[]): Promise<T>;
    abstract healthCheck(): Promise<boolean>;
    abstract getTables(): Promise<string[]>;
    abstract getTableInfo(tableName: string): Promise<any[]>;
    abstract dispose(): Promise<void>;
  }
  export interface DriverConfig {
    memory?:boolean
  }
  export interface Config extends DriverConfig{
    default?: string;
  }
  export type DriverConstructor<T> = {
    new (config:T): Driver<T>;
  };

  export function isDriverConstructor<T>(
    fn: DriverFactory<T>
  ): fn is DriverConstructor<T> {
    return fn.prototype && fn.prototype.constructor === fn;
  }

  export type DriverCreator<T> = (config: T) => Driver<T>;
  export type DriverFactory<T> =
    | DriverConstructor<T>
    | DriverCreator<T>;
}
