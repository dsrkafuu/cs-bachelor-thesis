import styles from './Label.module.scss';
import clsx from 'clsx';

interface LabelProps {
  children: React.ReactNode;
  color?: string;
  bgColor?: string;
  className?: string;
  onClick?: () => void;
}

function Label({ children, color, bgColor, className, onClick }: LabelProps) {
  return (
    <span
      style={{
        backgroundColor: bgColor,
        color: color,
      }}
      className={clsx(
        styles.label,
        {
          [styles.clickable]: !!onClick,
        },
        className
      )}
      onClick={onClick}
    >
      {children}
    </span>
  );
}

export default Label;
