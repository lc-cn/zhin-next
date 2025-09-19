import { Database } from "./database.js";
import { Dialect } from "./dialect.js";
import { 
  ModelField, 
  ModelConfig, 
  ModelRelation, 
  Condition, 
  AlterSchema,
  NonEmptyArray 
} from "./types.js";

export class Model<O extends object = object,D extends Dialect<any>=Dialect<any>> {
  constructor(
    public readonly database: Database<D,any>,
    public readonly name: string,
    public readonly config: ModelConfig = {}
  ) {}
  
  get dialect(): D {
    return this.database.dialect;
  }
  alter(alterations: AlterSchema<O>): Database.Alteration<O> {
    return this.database.alter<O>(this.name, alterations);
  }
  select<K extends keyof O>(...fields: NonEmptyArray<K>): Database.Selection<Pick<O, K>, K> {
    return this.database.select<O, K>(this.name, fields);
  }
  
  create(data: O): Database.Insertion<O> {
    return this.database.insert<O>(this.name, data);
  }
  
  update(update: Partial<O>): Database.Updation<O> {
    return this.database.update<O>(this.name, update);
  }
  
  delete(condition: Condition<O>): Database.Deletion<O> {
    return this.database.delete<O>(this.name).where(condition);
  }
  
  belongsTo<T extends object>(model: Model<T,D>, foreignKey?: string): this {
    this.config.relations = this.config.relations || [];
    this.config.relations.push({
      model: model.name,
      type: "belongs-to",
      foreignKey,
    });
    return this;
  }
  
  hasOne<T extends object>(model: Model<T,D>, foreignKey?: string): this {
    this.config.relations = this.config.relations || [];
    this.config.relations.push({
      model: model.name,
      type: "has-one",
      foreignKey,
    });
    return this;
  }
  
  hasMany<T extends object>(model: Model<T,D>, foreignKey?: string): this {
    this.config.relations = this.config.relations || [];
    this.config.relations.push({
      model: model.name,
      type: "has-many",
      foreignKey,
    });
    return this;
  }
  
  manyToMany<T extends object>(model: Model<T,D>, through: string, foreignKey?: string): this {
    this.config.relations = this.config.relations || [];
    this.config.relations.push({
      model: model.name,
      type: "many-to-many",
      foreignKey,
      through,
    });
    return this;
  }
}
export namespace Model {
  // Re-export types from types.ts for backward compatibility
  export type Field = ModelField;
  export type Config = ModelConfig;
  export type Relation = ModelRelation;
}
