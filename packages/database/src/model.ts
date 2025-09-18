import { Database } from "./database.js";

export class Model<
  T extends Record<string, Model.Field> = Record<string, Model.Field>
> {
  constructor(
    public database: Database,
    public name: string,
    public schema: T,
    public config: Model.Config = {}
  ) {}
  get driver() {
    return this.database.getDriver(this.config.driver);
  }
  async alter<S extends Partial<T>>(schema: S) {
    Object.assign(this.schema, schema);
    if (this.database.has_init) {
      await this.driver.alterModel(this, schema);
    }
  }
  select<K extends keyof T>(...fields: K[]) {
    return this.database.select<Model.Data<T>,K>(this.name, fields, this.config.driver);
  }
  create(data: Model.Data<T>) {
    return this.database.insert<Model.Data<T>>(this.name, data, this.driver.name);
  }
  update(update: Partial<Model.Data<T>>) {
    return this.database.update<Model.Data<T>>(this.name,update, this.config.driver);
  }
  delete(condition:Database.Condition<Model.Data<T>>) {
    return this.database.delete(this.name, this.config.driver).where(condition);
  }
  async sync() {
    if (this.database.has_init) {
      await this.driver.syncModels([this]);
    }
  }
  belongsTo<M extends Model>(model: M, foreignKey?: string) {
    this.config.relations = this.config.relations || [];
    this.config.relations.push({
      model: model.name,
      type: "belongs-to",
      foreignKey,
    });
  }
  hasOne<M extends Model>(model: M, foreignKey?: string) {
    this.config.relations = this.config.relations || [];
    this.config.relations.push({
      model: model.name,
      type: "has-one",
      foreignKey,
    });
  }
  hasMany<M extends Model>(model: M, foreignKey?: string) {
    this.config.relations = this.config.relations || [];
    this.config.relations.push({
      model: model.name,
      type: "has-many",
      foreignKey,
    });
  }
  manyToMany<M extends Model>(model: M, through: string, foreignKey?: string) {
    this.config.relations = this.config.relations || [];
    this.config.relations.push({
      model: model.name,
      type: "many-to-many",
      foreignKey,
      through,
    });
  }
}
export namespace Model {
  export interface Field {
    type:
      | "string"
      | "integer"
      | "number"
      | "float"
      | "json"
      | "boolean"
      | "date"
      | "object"
      | "array";
    initial?: any;
    length?: number;
    primary?: boolean;
    autoIncrement?: boolean;
    unique?: boolean;
    notNull?: boolean;
  }
  export type Data<T extends Record<string, Field>> = {
    [K in keyof T]: T[K]["type"] extends "integer" | "number" | "float"
      ? number
      : T[K]["type"] extends "boolean"
      ? boolean
      : T[K]["type"] extends "date"
      ? Date
      : T[K]["type"] extends "json"
      ? any
        : T[K]["type"] extends "object"
        ? Record<string, any>
        : T[K]["type"] extends "array"
        ? any[]
        : string;
  };
  export type PartialData<T extends Record<string, Field>> = Partial<Data<T>>;
  export interface Config {
    driver?: string;
    timestamps?: boolean;
    softDelete?: boolean;
    relations?: {
      model: string;
      type: "belongs-to" | "has-one" | "has-many" | "many-to-many";
      foreignKey?: string;
      through?: string;
    }[];
  }
}
