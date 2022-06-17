import process from 'process';
import { connect as _connect, connection } from 'mongoose';

// ensure models compiles
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as _ from './models';

const dbURL = process.env.DATABASE_URL;
if (!dbURL) {
  throw new Error('environment `DATABASE_URL` not set');
}

// serverless compatible cache
const ctx: any = global || {};
let dbcache = ctx.dbcache;
if (!dbcache) {
  dbcache = ctx.dbcache = { connected: null, promise: null };
}

export async function connect() {
  if (dbcache.connected) {
    return dbcache.connected;
  }
  if (!dbcache.promise) {
    dbcache.promise = _connect(dbURL as string, {
      bufferCommands: false,
    }).then((mongoose) => {
      return mongoose;
    });
  }
  dbcache.connected = await dbcache.promise;
  return dbcache.connected;
}

export async function disconnect() {
  if (dbcache.connected) {
    await connection.close();
  }
}
