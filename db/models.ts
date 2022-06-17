/**
 * User-Site            [One-to-Many]        (admin can access to all sites)
 * Site-Session         [One-to-Squillions]  (site may has millions of sessions)
 * Site/Session-View    [One-to-Squillions]  (site/session may has millions of views)
 * Site/Session-Event   [One-to-Squillions]  (site/session may has millions of events)
 * Site/Session-Vitals  [One-to-Squillions]  (site/session may has millions of vitals)
 * Site/Session-Error   [One-to-Squillions]  (site/session may has millions of errors)
 * Site/Log             [One-to-Squillions]  (site may has millions of logs)
 * [x] View-Vitals      (vitals should be grouped by pathname which may has multiple views)
 * [x] View-Error       (errors should be grouped by pathname which may has multiple views)
 * [x] Pathname         (record pathname will impact performance when insert view/vitals)
 */
import { Schema, Types, model } from 'mongoose';
import type { LogLevel, LogType } from '../lib/logger';

// add time to all documents
const schemaOptions = {
  timestamps: {
    createdAt: '_created',
    updatedAt: '_updated',
  },
};
// basic schema type
export interface Common {
  _created: Date;
  _updated: Date;
}

export interface User extends Common {
  username: string;
  password: string; // // 60-char bcryptjs
  role: 'user' | 'admin';
}

export const UserModel = model<User>(
  'User',
  new Schema<User>(
    {
      username: { type: String, unique: true, required: true },
      password: { type: String, required: true },
      role: { type: String, required: true, default: 'user' },
    },
    { collection: 'users', ...schemaOptions }
  )
);

export interface Site extends Common {
  name: string;
  domain: string;
  baseURL?: string;
  _user: Types.ObjectId;
}

export const SiteModel = model<Site>(
  'Site',
  new Schema<Site>(
    {
      name: { type: String, required: true },
      domain: { type: String, required: true },
      baseURL: { type: String },
      _user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    },
    { collection: 'sites', ...schemaOptions }
  )
);

export interface Session extends Common {
  _fp: string;
  ip?: string;
  browser?: string;
  version?: string;
  system?: string;
  platform?: string;
  model?: string;
  archtecture?: string;
  screen?: string;
  language?: string;
  location?: string; // iso 3166-1 2-char code
  _site: Types.ObjectId;
}

export const SessionModel = model<Session>(
  'Session',
  new Schema<Session>(
    {
      _fp: { type: String, required: true, unique: true },
      ip: { type: String },
      browser: { type: String },
      version: { type: String },
      system: { type: String },
      platform: { type: String },
      model: { type: String },
      archtecture: { type: String },
      screen: { type: String },
      language: { type: String },
      location: { type: String },
      _site: { type: Schema.Types.ObjectId, ref: 'Site', required: true },
    },
    { collection: 'sessions', ...schemaOptions }
  )
);

export interface View extends Common {
  pathname: string;
  title?: string;
  referrer?: string;
  _site: Types.ObjectId;
  _session: string;
}

export const ViewModel = model<View>(
  'View',
  new Schema<View>(
    {
      pathname: { type: String, required: true },
      title: { type: String },
      referrer: { type: String },
      _site: { type: Schema.Types.ObjectId, ref: 'Site', required: true },
      _session: { type: String, ref: 'Session', required: true },
    },
    { collection: 'views', ...schemaOptions }
  )
);

export interface Event extends Common {
  pathname: string;
  type: string;
  value?: string;
  _site: Types.ObjectId;
  _session: string;
}

export const EventModel = model<Event>(
  'Event',
  new Schema<Event>(
    {
      pathname: { type: String, required: true },
      type: { type: String, required: true },
      value: { type: String },
      _site: { type: Schema.Types.ObjectId, ref: 'Site', required: true },
      _session: { type: String, ref: 'Session', required: true },
    },
    { collection: 'events', ...schemaOptions }
  )
);

export interface Vital extends Common {
  pathname: string;
  cls?: number;
  fcp?: number;
  fid?: number;
  lcp?: number;
  ttfb?: number;
  _site: Types.ObjectId;
  _session: string;
}

export const VitalModel = model<Vital>(
  'Vitals',
  new Schema<Vital>(
    {
      pathname: { type: String, required: true },
      cls: { type: Number },
      fcp: { type: Number },
      fid: { type: Number },
      lcp: { type: Number },
      ttfb: { type: Number },
      _site: { type: Schema.Types.ObjectId, ref: 'Site', required: true },
      _session: { type: String, ref: 'Session', required: true },
    },
    { collection: 'vitals', ...schemaOptions }
  )
);

export interface Error extends Common {
  pathname: string;
  status: 'unresolved' | 'reviewed' | 'resolved';
  type: 'runtime' | 'promise' | 'resource';
  name: string; // TypeError, ReferenceError, etc.
  message: string;
  rmessage?: string;
  stack?: string;
  _site: Types.ObjectId;
  _session: string;
}

export const ErrorModel = model<Error>(
  'Error',
  new Schema<Error>(
    {
      pathname: { type: String, required: true },
      status: { type: String, required: true, default: 'unresolved' },
      type: { type: String, required: true },
      name: { type: String, required: true, default: 'Error' },
      message: { type: String, required: true },
      rmessage: { type: String },
      stack: { type: String },
      _site: { type: Schema.Types.ObjectId, ref: 'Site', required: true },
      _session: { type: String, ref: 'Session', required: true },
    },
    { collection: 'errors', ...schemaOptions }
  )
);

export interface Log {
  time: number;
  pid: number;
  level: LogLevel;
  type: LogType;
  msg: string;
  payload: string;
}

export const LogModel = model<Log>(
  'Log',
  new Schema<Log>(
    {
      time: { type: Number, required: true, index: true },
      pid: { type: Number, required: true },
      level: { type: String, required: true },
      type: { type: String, required: true },
      msg: { type: String, required: true },
      payload: { type: String },
    },
    { collection: 'logs' }
  )
);
