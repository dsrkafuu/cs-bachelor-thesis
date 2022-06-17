interface PVUVItem {
  pv: number;
  uv: number;
}

export interface CentralData {
  ds: number;
  today: PVUVItem;
  lastday: PVUVItem;
  month: PVUVItem;
  lastmonth: PVUVItem;
  total: PVUVItem;
}

export interface RealtimeData {
  tenMins: number | string;
  oneHour: number | string;
  halfDay: number | string;
  perHour: number[];
}

export interface LogItem {
  _fp: string;
  pathname: string;
  ip: string;
  browser: string;
  platform: string;
  location: string;
  _created: string;
  status: string;
}

export interface LogData {
  total: number;
  data: LogItem[];
}

export interface SessionData {
  _id: string;
  _fp: string;
  _created: string;
  ip?: string;
  browser?: string;
  version?: string;
  system?: string;
  platform?: string;
  model?: string;
  archtecture?: string;
  screen?: string;
  language?: string;
  location?: string;
}

export interface PagesItem extends PVUVItem {
  path: string;
  title: string;
}

export interface PagesData {
  total: number;
  data: PagesItem[];
}

export interface PagesRangesItem extends PVUVItem {
  date: string;
}

export type PagesRangesData = Array<{
  path: string;
  ranges: PagesRangesItem[];
}>;

export interface TrendItem extends PVUVItem {
  date: string;
  es: number;
  des: number;
  vt: number;
}

export type TrendData = TrendItem[];

export interface ReferrerItem extends PVUVItem {
  ref: string;
}

export interface ReferrerData {
  total: number;
  data: ReferrerItem[];
}

export interface ReferrerRangesItem extends PVUVItem {
  date: string;
}

export type ReferrerRangesData = Array<{
  ref: string;
  ranges: ReferrerRangesItem[];
}>;

export type RefregItem = PVUVItem;

export type RefregData = {
  dir: RefregItem;
  sch: RefregItem;
  ref: RefregItem;
};

export interface RefregRangesItem {
  date: string;
  dir: RefregItem;
  sch: RefregItem;
  ref: RefregItem;
}

export type RefregRangesData = RefregRangesItem[];

export interface RefregSearchItem extends PVUVItem {
  name: string;
}

export type RefregSearchData = RefregSearchItem[];

export interface SystemItem extends PVUVItem {
  name: string;
}

export interface SystemData {
  total: number;
  data: SystemItem[];
}

export interface SystemRangesItem {
  date: string;
  pvs: Array<{ name: string; value: number }>;
  uvs: Array<{ name: string; value: number }>;
}

export type SystemRangesData = SystemRangesItem[];

export interface SystemPlatfromItem extends PVUVItem {
  p: string;
}

export type SystemPlatfromData = SystemPlatfromItem[];

export interface LocationItem extends PVUVItem {
  c: string;
}

export type LocationData = LocationItem[];

interface WebVitals {
  nes: number;
  fcp: number;
  lcp: number;
  cls: number;
  fid: number;
  ttfb: number;
}

export interface VitalsItem extends WebVitals {
  path: string;
  count: number;
}

export interface VitalsData {
  total: number;
  data: VitalsItem[];
}

export interface VitalsSiteData extends WebVitals {
  count: number;
}

export interface VitalsRangesItem extends WebVitals {
  date: string;
}

export type VitalsRangesData = VitalsRangesItem[];

export interface ErrorsItem extends PVUVItem {
  eid: string;
  type: string;
  name: string;
  message: string;
  first: string;
  last: string;
}

export interface ErrorsData {
  total: number;
  data: ErrorsItem[];
}

export interface ErrorsSingleData extends ErrorsItem {
  rmessages: string[];
  stack: StackFrame[];
  status: string;
  sessions: Array<{
    browser: string;
    version: string;
    system: string;
    platform: string;
    arch: string;
    pv: number;
    uv: number;
  }>;
}
