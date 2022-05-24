import React, {
  memo,
  useState,
  forwardRef,
  useImperativeHandle,
  ForwardRefRenderFunction,
} from 'react';
import { Flex, Slider } from 'native-base';

export interface PageSliderRef {
  changePage: (newPage: number) => void;
}
interface PageSliderProps {
  defaultValue: number;
  onSliderChangeEnd?: (page: number) => void;
  min?: number;
  max: number;
}

const PageSlider: ForwardRefRenderFunction<PageSliderRef, PageSliderProps> = (
  { defaultValue, min = 1, max, onSliderChangeEnd },
  ref
) => {
  const [page, setPage] = useState(defaultValue);

  useImperativeHandle(ref, () => ({
    changePage: (newPage) => setPage(newPage),
  }));

  const handleSliderChange = (value: number) => {
    setPage(Math.floor(value));
  };

  return (
    <Flex
      w="full"
      position="absolute"
      bottom={12}
      alignItems="center"
      justifyContent="center"
      safeAreaLeft
      safeAreaRight
      safeAreaBottom
    >
      <Slider
        w="3/4"
        size="sm"
        defaultValue={page}
        value={page}
        step={1}
        minValue={min}
        maxValue={max}
        colorScheme="purple"
        onChange={handleSliderChange}
        onChangeEnd={onSliderChangeEnd}
      >
        <Slider.Track>
          <Slider.FilledTrack />
        </Slider.Track>
        <Slider.Thumb />
      </Slider>
    </Flex>
  );
};

export default memo(forwardRef(PageSlider));
