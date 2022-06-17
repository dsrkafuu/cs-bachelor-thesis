import { ResError } from './error';
import logger from './logger';

export interface CoreHandlers {
  get?: CoreHandler;
  post?: CoreHandler;
  put?: CoreHandler;
  del?: CoreHandler;
  options?: CoreHandler;
}

export default (handlers: CoreHandlers) => {
  return async (req: CoreRequest, res: CoreResponse) => {
    let handler: CoreHandler | undefined;
    switch (req.method) {
      case 'GET':
        handler = handlers.get;
        break;
      case 'POST':
        handler = handlers.post;
        break;
      case 'PUT':
        handler = handlers.put;
        break;
      case 'DELETE':
        handler = handlers.del;
        break;
      case 'OPTIONS':
        handler = handlers.options;
        break;
    }
    if (handler) {
      try {
        await handler(req, res);
      } catch (e) {
        if (e instanceof ResError) {
          res.statusCode = e.statusCode;
          res.send(e.message);
        } else {
          logger.error('server', 'internal server error', e);
          res.statusCode = 500;
          res.send('internal server error');
        }
      }
    } else {
      logger.error('server', 'method not allowed', { method: req.method });
      res.statusCode = 405;
      res.send('method not allowed');
    }
  };
};
