import { ErrorModel, SiteModel, ViewModel, VitalModel } from '../../db/models';
import logger from '../../lib/logger';
import methods from '../../lib/methods';
import { withAuth, withDatabase } from '../../lib/middleware';
import { getPayload, validateDomain } from '../../lib/utils';

/**
 * get all sites
 */
async function get(req: CoreRequest, res: CoreResponse) {
  await withDatabase();
  const { payload } = await withAuth(req);

  const sites = await SiteModel.find({
    _user: payload.id,
  })
    .select('domain name baseURL _created')
    .lean();
  res.status(200).send(sites);
}

/**
 * create a new site
 */
async function post(req: CoreRequest, res: CoreResponse) {
  await withDatabase();
  const { payload } = await withAuth(req);

  const name = getPayload(
    req,
    'name',
    (v) => v.length > 0,
    'invalid site name',
    'site'
  );
  const domain = getPayload(
    req,
    'domain',
    validateDomain,
    'invalid domain',
    'site'
  );
  const baseURL = getPayload(req, 'baseURL');

  const site = await SiteModel.create({
    _user: payload.id,
    name,
    domain,
    baseURL: baseURL || undefined,
  });
  logger.info('site', 'site created', {
    auth: payload,
    _id: site._id,
    name: site.name,
  });
  res.status(201).send(site);
}

/**
 * delete many site
 */
async function del(req: CoreRequest, res: CoreResponse) {
  await withDatabase();
  const { payload } = await withAuth(req);

  const ids = getPayload(
    req,
    'ids',
    (v) => Array.isArray(v),
    'invalid site ids',
    'site'
  );

  await SiteModel.deleteMany({
    _id: { $in: ids },
    _user: payload.id,
  }).lean();
  logger.warn('site', 'site deleted', { auth: payload, _ids: ids });

  await Promise.all([
    await ViewModel.deleteMany({ _site: { $in: ids } }).lean(),
    await VitalModel.deleteMany({ _site: { $in: ids } }).lean(),
    await ErrorModel.deleteMany({ _site: { $in: ids } }).lean(),
  ]);
  logger.warn('site', 'sites data deleted', { auth: payload, _ids: ids });

  res.status(204).send(null);
}

export default methods({
  get,
  post,
  del,
});
