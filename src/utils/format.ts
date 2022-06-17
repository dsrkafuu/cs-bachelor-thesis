export const platform = {
  desktop: '桌面设备',
  console: '家用主机',
  mobile: '智能手机',
  tablet: '平板电脑',
  smarttv: '智能电视',
  wearable: '可穿戴设备',
  embedded: '嵌入式设备',
} as any;

export function fmtPlatform(input?: string) {
  return (input ? platform[input] : '未知') || '未知';
}

export const status = {
  active: '活动',
  inactive: '非活动',
  terminated: '已终止',
} as any;

export function fmtStatus(input?: string) {
  return (input ? status[input] : '未知') || '未知';
}

export function fmtArch(arch?: string, platform?: string) {
  let res = '';
  switch (arch) {
    case 'x86':
    case 'x86_64':
    case 'amd64':
      res = 'X86';
      break;
    case 'arm':
    case 'arm64':
      res = 'ARM';
      break;
  }
  if (!res && platform) {
    switch (platform) {
      case 'console':
        res = 'X86';
        break;
      case 'mobile':
      case 'tablet':
      case 'smarttv':
      case 'wearable':
        res = 'ARM';
        break;
    }
  }
  return res || '未知';
}

export const referrer = {
  dir: '直接访问',
  sch: '搜索引擎',
  ref: '外部链接',
} as any;

export function fmtReferrer(input?: string) {
  return (input ? referrer[input] : '未知') || '未知';
}

export const errtype = {
  runtime: '运行',
  promise: '异步',
  resource: '资源',
} as any;

export function fmtErrtype(input?: string) {
  return (input ? errtype[input] : '未知') || '未知';
}
