export class ResError extends Error {
  statusCode: number;
  message: string;
  [key: string]: any;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.message = message;
  }
}

export function sendError(res: CoreResponse, err: ResError) {
  res.statusCode = err.statusCode;
  return res.send(err.message);
}
