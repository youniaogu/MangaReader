import React, {
  memo,
  useState,
  forwardRef,
  useImperativeHandle,
  ForwardRefRenderFunction,
} from 'react';
import { Slider } from 'native-base';

export interface PageSliderRef {
  changePage: (newPage: number) => void;
}
interface PageSliderProps {
  defaultValue: number;
  onSliderChangeEnd?: (page: number) => void;
  min?: number;
  max: number;
  disabled?: boolean;
}

const PageSlider: ForwardRefRenderFunction<PageSliderRef, PageSliderProps> = (
  { defaultValue, min = 1, max, onSliderChangeEnd, disabled = false },
  ref
) => {
  const [page, setPage] = useState(defaultValue);

  useImperativeHandle(ref, () => ({
    changePage: (newPage) => setPage(newPage),
  }));

  const handleSliderChange = (value: number) => {
    !disabled && setPage(Math.floor(value));
  };
  const handleSliderChangeEnd = (newPage: number) => {
    !disabled && onSliderChangeEnd && onSliderChangeEnd(newPage);
  };

  return (
    <Slider
      shadow={9}
      w="full"
      size="sm"
      defaultValue={page}
      value={page}
      step={1}
      minValue={min}
      maxValue={max}
      colorScheme={disabled ? 'gray' : 'purple'}
      onChange={handleSliderChange}
      onChangeEnd={handleSliderChangeEnd}
    >
      <Slider.Track>
        <Slider.FilledTrack />
      </Slider.Track>
      <Slider.Thumb />
    </Slider>
  );
};

export default memo(forwardRef(PageSlider));
