import { 
  Database, 
  SQLiteDialect, 
  MySQLDialect, 
  PostgreSQLDialect,
  Dialect,
  Schema, 
  Condition
} from './index.js';

// Example showing how the new architecture makes it easy to support multiple databases
// with minimal code duplication

interface User {
  id: number;
  name: string;
  email: string;
  age: number;
  created_at: Date;
}

const userSchema: Schema<User> = {
  id: { type: 'integer', primary: true },
  name: { type: 'text', nullable: false },
  email: { type: 'text', nullable: false, unique: true },
  age: { type: 'integer' },
  created_at: { type: 'date', default: new Date() }
};

// Generic function that works with any database dialect
async function createUserTable<T extends Dialect<any>>(db: Database<T>) {
  console.log(`Creating users table with ${db.dialect.name} dialect`);
  
  // The SQL building is completely abstracted away
  // Each dialect handles its own SQL dialect differences
  await db.create<User>('users', userSchema);
  console.log('Table created successfully');
}

// Generic function to insert and query users
async function manageUsers<T extends Dialect<any>>(db: Database<T>) {
  const newUser: User = {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    age: 30,
    created_at: new Date()
  };
  
  // Insert user - SQL generation is handled by the dialect
  await db.insert<User>('users', newUser);
  console.log('User inserted');
  
  // Query users - each database will generate appropriate SQL
  const users = await db.select<User, 'id' | 'name' | 'email'>('users', ['id', 'name', 'email'])
    .where({ age: { $gte: 25 } } as Condition<User>)
    .orderBy('name', 'ASC')
    .limit(10);
  
  console.log('Users found:', users);
}

// Example with SQLite
async function sqliteExample() {
  console.log('\n=== SQLite Example ===');
  const sqliteDialect = new SQLiteDialect({ 
    filename: 'example.db',
    memory: false 
  });
  const sqliteDb = new Database(sqliteDialect, {});
  
  await sqliteDb.connect();
  await createUserTable(sqliteDb);
  await manageUsers(sqliteDb);
  await sqliteDb.disconnect();
}

// Example with MySQL
async function mysqlExample() {
  console.log('\n=== MySQL Example ===');
  const mysqlDialect = new MySQLDialect({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'password',
    database: 'testdb'
  });
  const mysqlDb = new Database(mysqlDialect, {});
  
  await mysqlDb.connect();
  await createUserTable(mysqlDb);
  await manageUsers(mysqlDb);
  await mysqlDb.disconnect();
}

// Example with PostgreSQL
async function postgresqlExample() {
  console.log('\n=== PostgreSQL Example ===');
  const postgresqlDialect = new PostgreSQLDialect({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'password',
    database: 'testdb'
  });
  const postgresqlDb = new Database(postgresqlDialect, {});
  
  await postgresqlDb.connect();
  await createUserTable(postgresqlDb);
  await manageUsers(postgresqlDb);
  await postgresqlDb.disconnect();
}

// Demonstrate SQL generation differences
async function demonstrateSQLGeneration() {
  console.log('\n=== SQL Generation Differences ===');
  
  // SQLite SQL
  const sqliteDialect = new SQLiteDialect({});
  const sqliteQuery = sqliteDialect.buildQuery({
    type: 'create',
    tableName: 'users',
    schema: userSchema
  });
  console.log('SQLite CREATE TABLE:');
  console.log(sqliteQuery.sql);
  
  // MySQL SQL
  const mysqlDialect = new MySQLDialect({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'password',
    database: 'testdb'
  });
  const mysqlQuery = mysqlDialect.buildQuery({
    type: 'create',
    tableName: 'users',
    schema: userSchema
  });
  console.log('\nMySQL CREATE TABLE:');
  console.log(mysqlQuery.sql);
  
  // PostgreSQL SQL
  const postgresqlDialect = new PostgreSQLDialect({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'password',
    database: 'testdb'
  });
  const postgresqlQuery = postgresqlDialect.buildQuery({
    type: 'create',
    tableName: 'users',
    schema: userSchema
  });
  console.log('\nPostgreSQL CREATE TABLE:');
  console.log(postgresqlQuery.sql);
}

// Run all examples
async function runExamples() {
  try {
    await sqliteExample();
    await mysqlExample();
    await postgresqlExample();
    await demonstrateSQLGeneration();
  } catch (error) {
    console.error('Error running examples:', error);
  }
}

export { 
  runExamples, 
  createUserTable, 
  manageUsers,
  demonstrateSQLGeneration 
};
