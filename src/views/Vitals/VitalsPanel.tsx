import styles from './VitalsPanel.module.scss';
import {
  clsThres,
  fcpThres,
  fidThres,
  getScore,
  lcpThres,
} from '../../../lib/vitals';
import { Dayjs } from '../../../lib/dayjs';
import { VitalsSiteData } from '../../utils/types';
import { useMemo, useState } from 'react';
import VitalsCircle from './VitalsCircle';
import { Button } from 'antd';
import RangesChart from './RangesChart';

const getColor = (score: number) =>
  score >= 80 ? '#77ccb0' : score >= 60 ? '#ffba3b' : '#d38aa2';

interface VitalsPanelProps {
  data?: VitalsSiteData | null;
  times: [Dayjs, Dayjs];
  mode: string;
}

function VitalsPanel({ data, times, mode }: VitalsPanelProps) {
  const fcp = Math.ceil(data?.fcp || 0);
  const fcpScore = Math.ceil(getScore(fcp, fcpThres));
  const lcp = Math.ceil(data?.lcp || 0);
  const lcpScore = Math.ceil(getScore(lcp, lcpThres));
  const cls = (data?.cls || 0).toFixed(4);
  const clsScore = Math.ceil(getScore(+cls, clsThres));
  const fid = Math.ceil(data?.fid || 0);
  const fidScore = Math.ceil(getScore(fid, fidThres));
  const ttfb = Math.ceil(data?.ttfb || 0);
  const ttfbScore = Math.ceil(getScore(ttfb, [2000, 4000]));

  const [tab, setTab] = useState('fcp');
  const panels = useMemo(
    () => [
      {
        mkey: 'fcp',
        title: '首次内容绘制（FCP）',
        desc: '首次内容绘制（FCP）指标测量页面从开始加载到页面内容的任何部分在屏幕上完成渲染的时间。其中包括文本、图像（包括背景图像）、SVG 元素或非白色的 Canvas 元素。',
        score: fcpScore,
      },
      {
        mkey: 'lcp',
        title: '最大内容绘制（LCP）',
        desc: '最大内容绘制（LCP）指标根据页面首次开始加载的时间，计算可视区域内可见的内容完成渲染的相对时间。对于该指标，"内容" 指的是文本和图像（包括背景图像）元素。',
        score: lcpScore,
      },
      {
        mkey: 'cls',
        title: '累积布局偏移（CLS）',
        desc: '累积布局偏移（CLS）指整个页面生命周期内发生的所有意外布局偏移中最大一连串的布局偏移分数。最大的一连串是指窗口内所有布局偏移累计分数最大的会话窗口。',
        score: clsScore,
      },
      {
        mkey: 'fid',
        title: '首次输入延迟（FID）',
        desc: '首次输入延迟（FID）测量从用户第一次与页面交互（例如单击链接、点按按钮）直到浏览器对交互作出响应，并实际能够开始处理事件处理程序所经过的时间。',
        score: fidScore,
      },
      {
        mkey: 'ttfb',
        title: '首字节时间（TTFB）',
        desc: '首字节时间（TTFB）测量从发送资源请求到响应的第一个字节被返回所花费的时间，其中的流程包括 DNS 时间、TLS 握手时间、Service Worker 初始化时间和重定向时间等。',
        score: ttfbScore,
      },
    ],
    [clsScore, fcpScore, fidScore, lcpScore, ttfbScore]
  );
  const curPanel = panels.find((panel) => panel.mkey === tab);

  return (
    <div className={styles.vitals}>
      <div className={styles.vitalstabs}>
        <div
          className={styles.vtabin}
          style={{
            borderBottom:
              tab === 'fcp' ? '3px solid #7793cc' : '1px solid #eee',
          }}
          onClick={() => setTab('fcp')}
        >
          <div>首次内容绘制（FCP）</div>
          <div className={styles.box}>
            <div className={styles.score}>
              <span style={{ color: getColor(fcpScore) }}>{fcp}</span> ms
            </div>
            <VitalsCircle num={fcpScore} />
          </div>
        </div>
        <div
          className={styles.vtabin}
          style={{
            borderBottom:
              tab === 'lcp' ? '3px solid #7793cc' : '1px solid #eee',
          }}
          onClick={() => setTab('lcp')}
        >
          <div>最大内容绘制（LCP）</div>
          <div className={styles.box}>
            <div className={styles.score}>
              <span style={{ color: getColor(lcpScore) }}>{lcp}</span> ms
            </div>
            <VitalsCircle num={lcpScore} />
          </div>
        </div>
        <div
          className={styles.vtabin}
          style={{
            borderBottom:
              tab === 'cls' ? '3px solid #7793cc' : '1px solid #eee',
          }}
          onClick={() => setTab('cls')}
        >
          <div>累积布局偏移（CLS）</div>
          <div className={styles.box}>
            <div className={styles.score}>
              <span style={{ color: getColor(clsScore) }}>{cls}</span>
            </div>
            <VitalsCircle num={clsScore} />
          </div>
        </div>
        <div
          className={styles.vtabin}
          style={{
            borderBottom:
              tab === 'fid' ? '3px solid #7793cc' : '1px solid #eee',
          }}
          onClick={() => setTab('fid')}
        >
          <div>首次输入延迟（FID）</div>
          <div className={styles.box}>
            <div className={styles.score}>
              <span style={{ color: getColor(fidScore) }}>{fid}</span>
            </div>
            <VitalsCircle num={fidScore} />
          </div>
        </div>
        <div
          className={styles.vtabin}
          style={{
            borderBottom:
              tab === 'ttfb' ? '3px solid #7793cc' : '1px solid #eee',
          }}
          onClick={() => setTab('ttfb')}
        >
          <div>首字节时间（TTFB）</div>
          <div className={styles.box}>
            <div className={styles.score}>
              <span style={{ color: getColor(ttfbScore) }}>{ttfb}</span>
            </div>
            <VitalsCircle num={ttfbScore} />
          </div>
        </div>
      </div>
      <div className={styles.vitalschart}>
        <div className={styles.detail}>
          <div>{curPanel?.desc}</div>
          <Button href={`https://web.dev/${curPanel?.mkey}/`} target='_blank'>
            了解更多
          </Button>
        </div>
        <RangesChart times={times} mode={mode} mkey={curPanel?.mkey || 'nes'} />
      </div>
    </div>
  );
}

export default VitalsPanel;
