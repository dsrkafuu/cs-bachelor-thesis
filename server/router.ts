import Router from 'router';
import bridge from './bridge';
import Collect from '../api/collect';
import AuthLogin from '../api/auth/login';
import AuthVerify from '../api/auth/verify';
import Sites from '../api/sites';
import Sites_ID_ from '../api/sites/[id]';
import Users from '../api/users';
import Users_ID_ from '../api/users/[id]';
import Logs from '../api/logs';
import Metrics_ID_IndexCentral from '../api/metrics/[id]/index/central';
import Metrics_ID_LogList from '../api/metrics/[id]/log/list';
import Metrics_ID_LogRealtime from '../api/metrics/[id]/log/realtime';
import Metrics_ID_PagesList from '../api/metrics/[id]/pages/list';
import Metrics_ID_PagesRanges from '../api/metrics/[id]/pages/ranges';
import Metrics_ID_RefregList from '../api/metrics/[id]/refreg/list';
import Metrics_ID_RefregRanges from '../api/metrics/[id]/refreg/ranges';
import Metrics_ID_RefregSearch from '../api/metrics/[id]/refreg/search';
import Metrics_ID_ReferrerList from '../api/metrics/[id]/referrer/list';
import Metrics_ID_ReferrerRanges from '../api/metrics/[id]/referrer/ranges';
import Metrics_ID_Trend from '../api/metrics/[id]/trend';
import Metrics_ID_SystemList from '../api/metrics/[id]/system/list';
import Metrics_ID_SystemRanges from '../api/metrics/[id]/system/ranges';
import Metrics_ID_SystemPlatform from '../api/metrics/[id]/system/platform';
import Metrics_ID_Location from '../api/metrics/[id]/location';
import Metrics_ID_VitalsSingle from '../api/metrics/[id]/vitals/single';
import Metrics_ID_VitalsList from '../api/metrics/[id]/vitals/list';
import Metrics_ID_VitalsRanges from '../api/metrics/[id]/vitals/ranges';
import Metrics_ID_ErrorsList from '../api/metrics/[id]/errors/list';
import Metrics_ID_Errors_EID_ from '../api/metrics/[id]/errors/[eid]';
import Metrics_ID_Sessions_FP_ from '../api/metrics/[id]/sessions/[fp]';

const router = Router();

// collect route
router.use('/collect', bridge(Collect));
// basic auth & login routes
router.use('/auth/login', bridge(AuthLogin));
router.use('/auth/verify', bridge(AuthVerify));
// metrics (site id) data routes
router.use('/metrics/:id/index/central', bridge(Metrics_ID_IndexCentral));
router.use('/metrics/:id/log/list', bridge(Metrics_ID_LogList));
router.use('/metrics/:id/log/realtime', bridge(Metrics_ID_LogRealtime));
router.use('/metrics/:id/pages/list', bridge(Metrics_ID_PagesList));
router.use('/metrics/:id/pages/ranges', bridge(Metrics_ID_PagesRanges));
router.use('/metrics/:id/refreg/list', bridge(Metrics_ID_RefregList));
router.use('/metrics/:id/refreg/ranges', bridge(Metrics_ID_RefregRanges));
router.use('/metrics/:id/refreg/search', bridge(Metrics_ID_RefregSearch));
router.use('/metrics/:id/referrer/list', bridge(Metrics_ID_ReferrerList));
router.use('/metrics/:id/referrer/ranges', bridge(Metrics_ID_ReferrerRanges));
router.use('/metrics/:id/trend', bridge(Metrics_ID_Trend));
router.use('/metrics/:id/system/list', bridge(Metrics_ID_SystemList));
router.use('/metrics/:id/system/ranges', bridge(Metrics_ID_SystemRanges));
router.use('/metrics/:id/system/platform', bridge(Metrics_ID_SystemPlatform));
router.use('/metrics/:id/location', bridge(Metrics_ID_Location));
router.use('/metrics/:id/vitals/list', bridge(Metrics_ID_VitalsList));
router.use('/metrics/:id/vitals/single', bridge(Metrics_ID_VitalsSingle));
router.use('/metrics/:id/vitals/ranges', bridge(Metrics_ID_VitalsRanges));
router.use('/metrics/:id/errors/list', bridge(Metrics_ID_ErrorsList));
router.use('/metrics/:id/errors/:eid', bridge(Metrics_ID_Errors_EID_));
router.use('/metrics/:id/sessions/:fp', bridge(Metrics_ID_Sessions_FP_));
// management routes
router.use('/sites/:id', bridge(Sites_ID_));
router.use('/sites', bridge(Sites));
router.use('/users/:id', bridge(Users_ID_));
router.use('/users', bridge(Users));
router.use('/logs', bridge(Logs));

export default router;
