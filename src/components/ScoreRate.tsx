import React, { useMemo } from 'react';
import { Box, Center, HStack } from 'native-base';

interface ScoreRateProps {
  score?: number;
  max?: number;
}

const ScoreRate = ({ score = 0, max = 5 }: ScoreRateProps) => {
  const rateList = useMemo(() => Array.from({ length: max }, (_v, i) => i < score), [score, max]);

  return (
    <HStack>
      {rateList.map((actived, index) => (
        <Center w={4} h={3} overflow="hidden">
          <Box
            w={2}
            h={5}
            style={{ transform: [{ rotate: '30deg' }] }}
            key={index}
            bgColor={actived ? 'purple.300' : 'gray.300'}
          />
        </Center>
      ))}
    </HStack>
  );
};

export default ScoreRate;
