import { 
  Database, 
  SQLiteDialect, 
  Schema, 
  Condition,
  NonEmptyArray 
} from './index.js';
export interface User{
    id:number
    name:string
    email:string
    age:number,
    created_at:Date
}

// Example usage of the new architecture with strict typing
async function example() {
  // Create a SQLite dialect with typed config
  const dialect = new SQLiteDialect({ 
    filename: 'example.db',
    memory: false,
    timeout: 5000,
    retries: 3
  });
  
  // Create a database instance with typed dialect
  const db = new Database<SQLiteDialect, {users:User}>(dialect, {
    users:{
        id: { type: 'integer', primary: true,default:NaN },
        name: { type: 'text', nullable: false,default:'' },
        email: { type: 'text', nullable: false, unique: true,default:'' },
        age: { type: 'integer',default:NaN },
        created_at: { type: 'date', default: new Date() }
      }
  });
  
  // Start
  await db.start();
  const model=db.model('users')
  // Insert data
  const newUser = {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    age: 30,
    created_at: new Date()
  };
  
  await model.create(newUser);
  console.log('User inserted');
  
  // Select data with conditions and strict typing
  const users = await model.select('id', 'name', 'email')
    .where({ name: { $gte: 'John' } })
    .orderBy('name', 'ASC')
    .limit(10);
  
  console.log('Users found:', users);
  
  // Update data
  await model.update({ age: 31 })
    .where({ id: 1 });
  
  console.log('User updated');
  
  // Delete data
  await model.delete({ age: { $lt: 18 } })
  
  console.log('Users deleted');
  
  // Alter table
  await model.alter({
    name:{ action: 'add', type: 'text', nullable: true },
    age:{ action: 'modify', type: 'integer', nullable: false }
  });
  
  console.log('Table altered');
  
  // Stop
  await db.stop();
  console.log('Stopped from database');
}

// Run the example
example().catch(console.error);
