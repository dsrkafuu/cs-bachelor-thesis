import * as format from '../../../src/utils/format';

describe('utils/format/fmtPlatform', () => {
  it('return 家用主机 when input is console', () => {
    expect(format.fmtPlatform('console')).toBe('家用主机');
  });
});

describe('utils/format/fmtStatus', () => {
  it('return 活动 when input is active', () => {
    expect(format.fmtStatus('active')).toBe('活动');
  });
});

describe('utils/format/fmtArch', () => {
  it('return X86', () => {
    expect(format.fmtArch('x86')).toBe('X86');
    expect(format.fmtArch('x86_64')).toBe('X86');
    expect(format.fmtArch('amd64')).toBe('X86');
  });
  it('return ARM', () => {
    expect(format.fmtArch('arm')).toBe('ARM');
    expect(format.fmtArch('arm64')).toBe('ARM');
  });
  it('return X86 when platform defined', () => {
    expect(format.fmtArch('', 'console')).toBe('X86');
  });
  it('return ARM when platform defined', () => {
    expect(format.fmtArch('', 'mobile')).toBe('ARM');
    expect(format.fmtArch('', 'tablet')).toBe('ARM');
    expect(format.fmtArch('', 'smarttv')).toBe('ARM');
    expect(format.fmtArch('', 'wearable')).toBe('ARM');
  });
  it('return 未知', () => {
    expect(format.fmtArch('')).toBe('未知');
  });
});

describe('utils/format/fmtReferrer', () => {
  it('return 直接访问 when input is dir', () => {
    expect(format.fmtReferrer('dir')).toBe('直接访问');
  });
});

describe('utils/format/fmtErrtype', () => {
  it('return 运行 when input is runtime', () => {
    expect(format.fmtErrtype('runtime')).toBe('运行');
  });
});
