import logger from '../../lib/logger';

describe('logger/info', () => {
  it('logs an info', () => {
    logger.info('server', 'test');
  });
});

describe('logger/error', () => {
  it('logs an error', () => {
    logger.error('server', 'test');
  });
});

describe('logger/warn', () => {
  it('logs a warning', () => {
    logger.warn('server', 'test');
  });
});
