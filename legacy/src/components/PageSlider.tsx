import React, {
  memo,
  useState,
  forwardRef,
  useImperativeHandle,
  ForwardRefRenderFunction,
} from 'react';
import { ISliderProps, Slider } from 'native-base';

export interface PageSliderRef {
  changePage: (newPage: number) => void;
}
interface PageSliderProps extends ISliderProps {
  defaultValue: number;
  onSliderChangeEnd?: (page: number) => void;
  min?: number;
  max: number;
  disabled?: boolean;
}

const PageSlider: ForwardRefRenderFunction<PageSliderRef, PageSliderProps> = (
  { defaultValue, min = 1, max, onSliderChangeEnd, disabled = false, ...props },
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
      shadow="icon"
      bg="transparent"
      size="sm"
      defaultValue={page}
      value={page}
      step={1}
      minValue={min}
      maxValue={max}
      colorScheme={disabled ? 'gray' : 'purple'}
      onChange={handleSliderChange}
      onChangeEnd={handleSliderChangeEnd}
      {...props}
    >
      <Slider.Track shadow={1}>
        <Slider.FilledTrack />
      </Slider.Track>
      <Slider.Thumb />
    </Slider>
  );
};

export default memo(forwardRef(PageSlider));
