import type { Options } from './types';
import useDSRA from './index';

function main() {
  const script = document.querySelector('script[data-id]');
  if (!script) {
    return;
  }

  const getAttr = (name: string) => script.getAttribute(`data-${name}`);
  const id = getAttr('id');
  if (!id || id.length !== 24) {
    return;
  }
  const host = getAttr('host');
  if (!host) {
    return;
  }
  const opts: Options = {
    autoView: getAttr('auto-view') !== 'false',
    autoVital: getAttr('auto-vital') !== 'false',
    autoError: getAttr('auto-error') !== 'false',
  };

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const dsra = useDSRA(id, host, opts);
  (window as any).$dsra = dsra;
}

main();
