import React from 'react';
import { Platform, View } from 'react-native';
import { FullWindowOverlay } from 'react-native-screens';
import { NotifierRoot } from './Notifier';
import type { ShowNotificationParams } from './types';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface NotifierWrapperProps extends ShowNotificationParams {
  children: React.ReactNode;
}

export const NotifierWrapper = ({
  children,
  ...defaultParams
}: NotifierWrapperProps) => {
  const Tag = Platform.OS === 'ios' ? FullWindowOverlay : React.Fragment;
  const { top } = useSafeAreaInsets();
  return (
    <>
      {children}
      <Tag>
        <View style={{ marginTop: top }}>
          <NotifierRoot {...defaultParams} />
        </View>
      </Tag>
    </>
  );
};
