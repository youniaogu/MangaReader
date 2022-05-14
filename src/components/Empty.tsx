import React from 'react';
import { Center, Heading, Icon, IconButton } from 'native-base';

import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const Empty = () => {
  return (
    <Center w="full" h={48}>
      <IconButton
        icon={<Icon as={MaterialIcons} name="sentiment-neutral" size="4xl" color="gray.500" />}
      />
      <Heading color="gray.500">Not Found</Heading>
    </Center>
  );
};

export default Empty;
