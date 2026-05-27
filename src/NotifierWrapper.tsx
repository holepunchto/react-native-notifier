import React from 'react';
import { Platform } from 'react-native';
import { FullWindowOverlay } from 'react-native-screens';
import { NotifierRoot } from './Notifier';
import type { ShowNotificationParams } from './types';

interface NotifierWrapperProps extends ShowNotificationParams {
  children: React.ReactNode;
}

export const NotifierWrapper = ({
  children,
  ...defaultParams
}: NotifierWrapperProps) => {
  const Tag = Platform.OS === 'ios' ? FullWindowOverlay : React.Fragment;
  return (
    <>
      {children}
      <Tag>
        <NotifierRoot {...defaultParams} />
      </Tag>
    </>
  );
};
