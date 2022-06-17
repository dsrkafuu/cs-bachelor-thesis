import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

export type { Dayjs };
export default dayjs;

export const tzdb = [
  // UTC-10:00
  'Pacific/Honolulu',
  // UTC-09:00
  'America/Anchorage',
  // UTC-08:00
  'America/Santa_Isabel',
  'America/Los_Angeles',
  // UTC-07:00
  'America/Phoenix',
  'America/Denver',
  // UTC-06:00
  'America/Chicago',
  'America/Mexico_City',
  // UTC-05:00
  'America/Bogota',
  'America/New_York',
  // UTC-04:30
  'America/Caracas',
  // UTC-04:00
  'America/Halifax',
  'America/Santiago',
  // UTC-03:30
  'America/St_Johns',
  // UTC-03:00
  'America/Sao_Paulo',
  'America/Godthab',
  // UTC
  'UTC',
  'Africa/Casablanca',
  'Atlantic/Reykjavik',
  'Europe/London',
  // UTC+01:00
  'Europe/Berlin',
  'Europe/Paris',
  'Africa/Lagos',
  'Europe/Budapest',
  'Europe/Warsaw',
  // UTC+02:00
  'Europe/Istanbul',
  'Europe/Kiev',
  'Africa/Cairo',
  'Asia/Damascus',
  'Asia/Jerusalem',
  // UTC+03:00
  'Asia/Baghdad',
  'Europe/Minsk',
  // UTC+04:00
  'Europe/Moscow',
  'Asia/Dubai',
  // UTC+05:00
  'Asia/Tashkent',
  // UTC+06:00
  'Asia/Yekaterinburg',
  // UTC+06:30
  'Asia/Yangon',
  // UTC+07:00
  'Asia/Bangkok',
  'Asia/Novosibirsk',
  // UTC+08:00
  'Asia/Ulaanbaatar',
  'Asia/Shanghai',
  'Asia/Hong_Kong',
  'Australia/Perth',
  'Asia/Singapore',
  'Asia/Taipei',
  // UTC+09:00
  'Asia/Irkutsk',
  'Asia/Tokyo',
  'Asia/Seoul',
  // UTC+09:30
  'Australia/Adelaide',
  'Australia/Darwin',
  // UTC+10:00
  'Australia/Sydney',
  // UTC+11:00
  'Asia/Vladivostok',
  'Pacific/Guadalcanal',
  // UTC+12:00
  'Pacific/Fiji',
  'Asia/Magadan',
  // UTC+13:00
  'Pacific/Apia',
].sort();
