import { ErrorModel, SiteModel, ViewModel, VitalModel } from '../../db/models';
import logger from '../../lib/logger';
import methods from '../../lib/methods';
import { withAuth, withDatabase } from '../../lib/middleware';
import { getPayload, validateDomain, validateObjectID } from '../../lib/utils';

/**
 * modify a site
 */
async function put(req: CoreRequest, res: CoreResponse) {
  await withDatabase();
  const { payload } = await withAuth(req);

  const id = getPayload(req, 'id', validateObjectID, 'invalid site id', 'site');
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

  const site = await SiteModel.findOneAndUpdate(
    { _id: id, _user: payload.id },
    {
      name,
      domain,
      baseURL: baseURL || undefined,
      _user: payload.id,
    },
    { overwrite: true, new: true }
  ).lean();
  logger.info('site', 'site updated', {
    auth: payload,
    _id: site?._id,
    name: site?.name,
  });
  res.status(200).send(site);
}

/**
 * delete a site
 */
async function del(req: CoreRequest, res: CoreResponse) {
  await withDatabase();
  const { payload } = await withAuth(req);

  const id = getPayload(req, 'id', validateObjectID, 'invalid site id', 'site');
  await SiteModel.findOneAndDelete({
    _id: id,
    _user: payload.id,
  }).lean();
  logger.warn('site', 'site deleted', { auth: payload, _id: id });

  await Promise.all([
    await ViewModel.deleteMany({ _site: id }).lean(),
    await VitalModel.deleteMany({ _site: id }).lean(),
    await ErrorModel.deleteMany({ _site: id }).lean(),
  ]);
  logger.warn('site', 'site data deleted', { auth: payload, _id: id });

  res.status(204).send(null);
}

export default methods({
  put,
  del,
});
