import type { ElementType } from 'react';
import type { WithTimingConfig } from 'react-native-reanimated';

import type NotificationComponent from './components/Notification';

/** Easing accepted by Reanimated's `withTiming`.
 *
 * Custom easing functions run on the UI thread, so they must be workletized:
 * add a `'worklet'` directive to any function passed here. Values from
 * Reanimated's own `Easing` (re-exported by this package) already are. */
export type NotifierEasing = NonNullable<WithTimingConfig['easing']>;

export interface ShowParams {
  /** How fast notification will appear/disappear
   * @default 300 */
  animationDuration?: number;

  /** Animation easing. Details: https://docs.swmansion.com/react-native-reanimated/docs/utilities/Easing
   * @default null */
  easing?: NotifierEasing;

  /** Show Animation easing.
   * @default easing || null */
  showEasing?: NotifierEasing;

  /** Hide Animation easing.
   * @default easing || null */
  hideEasing?: NotifierEasing;

  /** Function called when entering animation is finished
   * @default null */
  onShown?: () => void;

  /** Function called when notification completely hidden
   * @default null */
  onHidden?: () => void;

  /** Function called when user press on notification
   * @default null */
  onPress?: () => void;

  /** Time after notification will disappear. Set to `0` to not hide notification automatically
   * @default 3000 */
  duration?: number;
}

export type QueueMode =
  | 'immediate'
  | 'next'
  | 'standby'
  | 'reset'
  | 'skipDuplicate';

export interface ShowNotificationParams<
  ComponentType extends ElementType = ElementType,
> extends ShowParams {
  /** Title of notification. __Passed to `Component`.__
   * @default null */
  title?: string;

  /** Description of notification. __Passed to `Component`.__
   * @default null */
  description?: string;

  /** Can notification be hidden by swiping it out
   * @default true */
  swipeEnabled?: boolean;

  /** Component of the notification body. You can use one of the [built-in components](https://github.com/seniv/react-native-notifier#components), or your [custom component](https://github.com/seniv/react-native-notifier#custom-component).
   * @default NotifierComponents.Notification */
  Component?: ComponentType;

  /** Additional props that are passed to `Component`. See all available props of built-in components in the [components section](https://github.com/seniv/react-native-notifier#components)
   * @default {} */
  componentProps?: Omit<
    React.ComponentProps<ComponentType>,
    'title' | 'description'
  >;

  /** Determines the order in which notifications are shown. Read more in the [Queue Mode](https://github.com/seniv/react-native-notifier#queue-mode) section.
   * @default 'reset' */
  queueMode?: QueueMode;

  /** Top insets */
  top?: number;
}

export interface StateInterface {
  title?: string;
  description?: string;
  swipeEnabled: boolean;
  Component: ElementType;
  componentProps: Record<string, any>;
}

export interface NotifierInterface {
  showNotification<
    ComponentType extends ElementType = typeof NotificationComponent,
  >(
    params: ShowNotificationParams<ComponentType>
  ): void;
  hideNotification(onHidden?: (finished: boolean) => void): void;
  clearQueue(hideDisplayedNotification?: boolean): void;
}
