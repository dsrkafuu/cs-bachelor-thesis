import styles from './StackViewer.module.scss';
import { ErrorsSingleData } from '../../utils/types';
import { Radio, RadioChangeEvent, Spin } from 'antd';
import { useCallback, useState } from 'react';
import Label from '../../components/basics/Label';

interface StackViewerProps {
  data: ErrorsSingleData | null;
  loading: boolean;
}

function StackViewer({ data, loading }: StackViewerProps) {
  const options = [
    { label: '解析堆栈', value: 'stack' },
    { label: '原始数据', value: 'source' },
  ];
  const [mode, setMode] = useState('stack');
  const handleModeChange = useCallback((e: RadioChangeEvent) => {
    setMode(e.target.value);
  }, []);

  const stack = data?.stack || [];

  return (
    <div className={styles.container}>
      <div className={styles.title}>错误堆栈</div>
      <Radio.Group
        optionType='button'
        options={options}
        value={mode}
        onChange={handleModeChange}
      />
      <Spin spinning={loading}>
        {mode === 'source' ? (
          <div className={styles.conts}>
            {stack.map((line, idx) => (
              <div key={idx}>{line.source}</div>
            ))}
          </div>
        ) : (
          <div className={styles.conts}>
            {stack.map((line, idx) => (
              <div key={idx} className={styles.prow}>
                <Label className={styles.code}>
                  {line.fileName || '<anonymous>'}
                </Label>
                {line.functionName && (
                  <>
                    <span className={styles.label}>位置</span>
                    <Label className={styles.code}>{line.functionName}</Label>
                  </>
                )}
                {line.lineNumber && (
                  <>
                    <span className={styles.label}>行</span>
                    <Label className={styles.code}>
                      {(line.lineNumber || '?') +
                        ':' +
                        (line.columnNumber || '?')}
                    </Label>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </Spin>
    </div>
  );
}

export default StackViewer;
