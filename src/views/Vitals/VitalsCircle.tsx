import Circle from 'react-circle';

interface SiteCircleProps {
  num: number;
}

function VitalsCircle({ num }: SiteCircleProps) {
  return (
    <Circle
      progress={num}
      progressColor={num >= 80 ? '#77ccb0' : num >= 60 ? '#ffba3b' : '#d38aa2'}
      roundedStroke
      showPercentageSymbol={false}
      size='40'
      lineWidth='50'
      textColor='rgba(0, 0, 0, 0.7)'
      textStyle={{
        fontFamily: 'inherit',
        fontSize: '120px',
        transform: 'translateY(20px)',
      }}
    />
  );
}

export default VitalsCircle;
