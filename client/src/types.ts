// internal

export type CollectRoute = 'view' | 'event' | 'vital' | 'error';

export type CollectData = {
  href: string;
  [key: string]: string | undefined | null;
};

// external

export interface Options {
  autoView?: boolean;
  autoHistory?: boolean;
  autoVital?: boolean;
  autoError?: boolean;
}

export type ViewHandler = (
  href: string,
  title?: string,
  referrer?: string
) => void;

export interface VitalData {
  cls?: number;
  fcp?: number;
  fid?: number;
  lcp?: number;
  ttfb?: number;
}

export type VitalHandler = (href: string, value: VitalData) => void;

export type ErrorType = 'runtime' | 'promise' | 'resource';

export type ErrorHandler = (
  href: string,
  type: ErrorType,
  error: Error
) => void;

export interface DSRA {
  sendView: ViewHandler;
  sendVital: VitalHandler;
  sendError: ErrorHandler;
}
