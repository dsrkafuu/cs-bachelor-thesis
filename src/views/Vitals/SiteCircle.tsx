import Circle from 'react-circle';

interface SiteCircleProps {
  num: number;
}

function SiteCircle({ num }: SiteCircleProps) {
  return (
    <Circle
      progress={Math.ceil(num)}
      progressColor={
        Math.ceil(num) >= 80
          ? '#77ccb0'
          : Math.ceil(num) >= 60
          ? '#ffba3b'
          : '#d38aa2'
      }
      roundedStroke
      showPercentageSymbol={false}
      size='120'
      lineWidth='45'
      textColor='rgba(0, 0, 0, 0.7)'
      textStyle={{
        fontFamily: 'inherit',
        fontSize: '120px',
        transform: 'translateY(20px)',
      }}
    />
  );
}

export default SiteCircle;
