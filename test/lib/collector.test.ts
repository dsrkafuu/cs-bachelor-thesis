import { getCollectMeta, getSessionMeta } from '../../lib/collector';
import { ResError } from '../../lib/error';

describe('collector/getCollectMeta', () => {
  it('request origin not found', () => {
    const req = {
      query: { id: '6239c1cda8cc0d130a00f53e' },
      headers: {},
    } as any;
    expect(() => getCollectMeta(req)).toThrow(
      new ResError(400, 'invalid request origin')
    );
  });
  it('invalid request origin', () => {
    const req = {
      query: { id: '6239c1cda8cc0d130a00f53e' },
      headers: { origin: 'f889&*(^d' },
    } as any;
    expect(() => getCollectMeta(req)).toThrow(
      new ResError(400, 'invalid request origin')
    );
  });
  it('returns collect meta', () => {
    const req = {
      query: {
        id: '6239c1cda8cc0d130a00f53e',
        href: 'https://example.org/test',
      },
      headers: { origin: 'https://example.org' },
    } as any;
    const meta = getCollectMeta(req);
    expect(meta.sid).toBe('6239c1cda8cc0d130a00f53e');
    expect(meta.origin.origin).toBe('https://example.org');
    expect(meta.href.pathname).toBe('/test');
  });
});

describe('collector/getSessionMeta', () => {
  const UA =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:99.0) Gecko/20100101 Firefox/99.0';
  const req = {
    query: {},
    headers: { 'user-agent': UA },
  } as any;
  it('returns session meta', () => {
    const meta = getSessionMeta(req, '6239c1cda8cc0d130a00f53e');
    expect(meta).toMatchObject({
      ua: UA,
      ip: '',
      browser: 'Firefox',
      version: '99.0',
      system: 'Windows',
      platform: 'desktop',
      model: '',
      arch: 'amd64',
      screen: '',
      language: '',
      cvsfp: '',
      fp: 'b324ddefdb3227b1af583029ad6e3129',
    });
  });
});
