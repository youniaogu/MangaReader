import React, { Fragment, FC, memo } from 'react';
import { Box, Actionsheet, ScrollView } from 'native-base';

interface ActionsheetSelectProps {
  title?: string;
  isOpen?: boolean;
  options: { label: string; value: string }[];
  onClose?: () => void;
  onChange?: (value: string) => void;
}

const ActionsheetSelect: FC<ActionsheetSelectProps> = ({
  title,
  options,
  isOpen,
  onClose,
  onChange,
}) => {
  const handleClose = () => {
    onClose && onClose();
  };
  const handleChange = (value: string) => {
    return () => {
      onChange && onChange(value);
      handleClose();
    };
  };

  return (
    <Fragment>
      <Actionsheet isOpen={isOpen} onClose={handleClose}>
        <Actionsheet.Content>
          {title && (
            <Box
              w="100%"
              h={60}
              px={4}
              _text={{ color: 'gray.500', fontSize: 16 }}
              justifyContent="center"
            >
              {title}
            </Box>
          )}
          <ScrollView w="100%">
            {options.map((item) => (
              <Actionsheet.Item key={item.value} onPress={handleChange(item.value)}>
                {item.label}
              </Actionsheet.Item>
            ))}
          </ScrollView>
        </Actionsheet.Content>
      </Actionsheet>
    </Fragment>
  );
};

export default memo(ActionsheetSelect);
