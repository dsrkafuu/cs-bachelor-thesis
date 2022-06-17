declare type IncomingMessage = import('http').IncomingMessage;
declare type ServerResponse = import('http').ServerResponse;

declare type CoreRequestQuery = {
  [key: string]: string;
};
declare type CoreRequestCookies = {
  [key: string]: string;
};

declare type CoreRequest = IncomingMessage & {
  query: CoreRequestQuery;
  cookies: CoreRequestCookies;
  body?: any;
};

declare type CoreResponse = ServerResponse & {
  status: (statusCode: number) => CoreResponse;
  send: (body: any) => CoreResponse;
};

declare type CoreHandler = (
  req: CoreRequest,
  res: CoreResponse
) => Promise<void>;
