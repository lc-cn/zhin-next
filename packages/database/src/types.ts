// Core type definitions for the database driver library

// ============================================================================
// Query Type Definitions
// ============================================================================

export type QueryType = 
  | 'create' 
  | 'alter' 
  | 'drop_table' 
  | 'drop_index' 
  | 'select' 
  | 'insert' 
  | 'update' 
  | 'delete';

// ============================================================================
// Column Type Definitions
// ============================================================================

export type ColumnType = 
  | "text" 
  | "integer" 
  | "float" 
  | "boolean" 
  | "date" 
  | "json";

export interface Column<T = any> {
  type: ColumnType;
  nullable?: boolean;
  default?: T;
  primary?: boolean;
  unique?: boolean;
  length?: number;
}

export type Schema<T extends object> = {
  [P in keyof T]: Column<T[P]>;
}

// ============================================================================
// Column Alteration Types
// ============================================================================

export interface AddSchema<T = any> {
  action: "add";
  type: ColumnType;
  nullable?: boolean;
  default?: T;
  primary?: boolean;
  length?: number;
}

export interface ModifySchema<T = any> {
  action: "modify";
  type?: ColumnType;
  nullable?: boolean;
  default?: T;
  length?: number;
}

export interface DropSchema {
  action: "drop";
}

export type AlterSchema<T extends object> = {
  [P in keyof T]?:AddSchema<T[P]> | ModifySchema<T[P]> | DropSchema
};

// ============================================================================
// Condition Types
// ============================================================================

export interface ComparisonOperators<T> {
  $eq?: T;
  $ne?: T;
  $gt?: T;
  $gte?: T;
  $lt?: T;
  $lte?: T;
  $in?: T[];
  $nin?: T[];
  $like?: string;
  $nlike?: string;
}

export interface LogicOperators<T = any> {
  $and?: Condition<T>[];
  $or?: Condition<T>[];
  $not?: Condition<T>;
}

export type Condition<T = object> ={
  [P in keyof T]?: T[P] | ComparisonOperators<T[P]> | LogicOperators<T[P]>;
}|LogicOperators<T>;

// ============================================================================
// Ordering Types
// ============================================================================

export type SortDirection = "ASC" | "DESC";

export interface Ordering<T extends object> {
  field: keyof T;
  direction: SortDirection;
}

// ============================================================================
// Query Parameter Types (Discriminated Union)
// ============================================================================

export interface BaseQueryParams {
  tableName: string;
}

export interface CreateQueryParams<T extends object = any> extends BaseQueryParams {
  type: 'create';
  schema: Schema<T>;
}

export interface AlterQueryParams<T extends object = any> extends BaseQueryParams {
  type: 'alter';
  alterations: AlterSchema<T>;
}

export interface DropTableQueryParams<T extends object = any> extends BaseQueryParams {
  type: 'drop_table';
  conditions?: Condition<T>;
}

export interface DropIndexQueryParams extends BaseQueryParams {
  type: 'drop_index';
  indexName: string;
  conditions?: Condition<any>;
}

export interface SelectQueryParams<T extends object = any> extends BaseQueryParams {
  type: 'select';
  fields?: (keyof T)[];
  conditions?: Condition<T>;
  groupings?: (keyof T)[];
  orderings?: Ordering<T>[];
  limitCount?: number;
  offsetCount?: number;
}

export interface InsertQueryParams<T extends object = any> extends BaseQueryParams {
  type: 'insert';
  data: T;
}

export interface UpdateQueryParams<T extends object = any> extends BaseQueryParams {
  type: 'update';
  update: Partial<T>;
  conditions?: Condition<T>;
}

export interface DeleteQueryParams<T extends object = any> extends BaseQueryParams {
  type: 'delete';
  conditions?: Condition<T>;
}

export type QueryParams<T extends object = any> = 
  | CreateQueryParams<T>
  | AlterQueryParams<T>
  | DropTableQueryParams<T>
  | DropIndexQueryParams
  | SelectQueryParams<T>
  | InsertQueryParams<T>
  | UpdateQueryParams<T>
  | DeleteQueryParams<T>;

// ============================================================================
// Query Result Types
// ============================================================================

export interface QueryResult<T = any> {
  sql: string;
  params: any[];
}

export interface SelectResult<T> {
  rows: T[];
  count?: number;
}

export interface InsertResult<T = any> {
  insertId?: number | string;
  affectedRows?: number;
  data?: T;
}

export interface UpdateResult {
  affectedRows: number;
}

export interface DeleteResult {
  affectedRows: number;
}

// ============================================================================
// Driver Configuration Types
// ============================================================================

export interface BaseDriverConfig {
  memory?: boolean;
  timeout?: number;
  retries?: number;
}

export interface SQLiteConfig extends BaseDriverConfig {
  filename?: string;
  memory?: boolean;
}

export interface MySQLConfig extends BaseDriverConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  ssl?: boolean;
}

export interface PostgreSQLConfig extends BaseDriverConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  ssl?: boolean;
}

export type DriverConfig = SQLiteConfig | MySQLConfig | PostgreSQLConfig;

// ============================================================================
// Driver Interface Types
// ============================================================================

export interface DriverConnection {
  isConnected(): boolean;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  healthCheck(): Promise<boolean>;
}

export interface DriverQuery {
  query<T = any>(sql: string, params?: any[]): Promise<T>;
}

export interface DriverSchema {
  getTables(): Promise<string[]>;
  getTableInfo(tableName: string): Promise<TableInfo[]>;
}

export interface DriverQueryBuilder {
  buildQuery<T extends object = any>(params: QueryParams<T>): QueryResult;
}

export interface DriverLifecycle {
  dispose(): Promise<void>;
}

export interface TableInfo {
  name: string;
  type: string;
  nullable: boolean;
  defaultValue: any;
  primaryKey: boolean;
  unique: boolean;
  length?: number;
}

// ============================================================================
// Model Types
// ============================================================================

export interface ModelField {
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

export interface ModelConfig {
  driver?: string;
  timestamps?: boolean;
  softDelete?: boolean;
  relations?: ModelRelation[];
}

export interface ModelRelation {
  model: string;
  type: "belongs-to" | "has-one" | "has-many" | "many-to-many";
  foreignKey?: string;
  through?: string;
}

// ============================================================================
// Utility Types
// ============================================================================

export type NonEmptyArray<T> = [T, ...T[]];

export type RequiredKeys<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type OptionalKeys<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type DeepRequired<T> = {
  [P in keyof T]-?: T[P] extends object ? DeepRequired<T[P]> : T[P];
};

// ============================================================================
// Type Guards
// ============================================================================

export function isCreateQuery<T extends object>(params: QueryParams<T>): params is CreateQueryParams<T> {
  return params.type === 'create';
}

export function isAlterQuery<T extends object>(params: QueryParams<T>): params is AlterQueryParams<T> {
  return params.type === 'alter';
}

export function isSelectQuery<T extends object>(params: QueryParams<T>): params is SelectQueryParams<T> {
  return params.type === 'select';
}

export function isInsertQuery<T extends object>(params: QueryParams<T>): params is InsertQueryParams<T> {
  return params.type === 'insert';
}

export function isUpdateQuery<T extends object>(params: QueryParams<T>): params is UpdateQueryParams<T> {
  return params.type === 'update';
}

export function isDeleteQuery<T extends object>(params: QueryParams<T>): params is DeleteQueryParams<T> {
  return params.type === 'delete';
}

export function isDropTableQuery<T extends object>(params: QueryParams<T>): params is DropTableQueryParams<T> {
  return params.type === 'drop_table';
}

export function isDropIndexQuery(params: QueryParams): params is DropIndexQueryParams {
  return params.type === 'drop_index';
}
