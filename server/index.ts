import 'dotenv/config';
import process from 'process';
import connect from 'connect';
import Router from 'router';
import history from 'connect-history-api-fallback';
import serveStatic from 'serve-static';
import routes from './router';

const app = connect();
const router = Router();
router.use('/api', routes);
app.use(router);

if (process.env.NODE_ENV !== 'development') {
  const setHeaders: any = (res: CoreResponse, path: string) => {
    const mime = serveStatic.mime.lookup(path);
    switch (mime) {
      case 'text/html':
        res.setHeader('Cache-Control', 'private, max-age=0, must-revalidate');
        break;
      case 'text/css':
      case 'text/javascript':
      case 'application/javascript':
      case 'application/json':
        res.setHeader('Cache-Control', 'public, max-age=31536000');
        break;
      case 'font/woff2':
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        break;
    }
  };
  // react spa fallback
  app.use((history as any)());
  app.use(serveStatic('dist', { setHeaders }));
}

const port = process.env.NODE_ENV === 'development' ? 3001 : 3000;
app.listen(port, () => {
  if (port === 3001) {
    console.log(`dsra api server (proxy) listening on port ${port}`);
  } else {
    console.log(`dsra server started on port ${port}`);
  }
});
