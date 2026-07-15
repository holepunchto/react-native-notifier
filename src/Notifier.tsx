import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  TouchableWithoutFeedback,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import styles from './Notifier.styles';
import { Notification as NotificationComponent } from './components';
import {
  DEFAULT_ANIMATION_DURATION,
  DEFAULT_COMPONENT_HEIGHT,
  DEFAULT_DURATION,
  DEFAULT_SWIPE_ENABLED,
  MAX_TRANSLATE_Y,
  MIN_TRANSLATE_Y,
  SWIPE_ANIMATION_DURATION,
  SWIPE_PIXELS_TO_CLOSE,
} from './constants';
import type {
  NotifierInterface,
  ShowNotificationParams,
  ShowParams,
  StateInterface,
} from './types';

export const Notifier: NotifierInterface = {
  showNotification: () => {},
  hideNotification: () => {},
  clearQueue: () => {},
};

type NotificationParams = Pick<ShowNotificationParams, 'title' | 'description'>;

const isSameNotification = (
  prevNotif: NotificationParams,
  notif: NotificationParams
) => {
  if (
    !prevNotif.title &&
    !prevNotif.description &&
    !notif.title &&
    !notif.description
  ) {
    return false;
  }
  return (
    prevNotif.title === notif.title &&
    prevNotif.description === notif.description
  );
};

export const NotifierRoot = (props: ShowNotificationParams) => {
  const [state, setState] = useState<StateInterface>({
    Component: NotificationComponent,
    swipeEnabled: DEFAULT_SWIPE_ENABLED,
    componentProps: {},
  });

  // The imperative API reads props and state from outside of render.
  const propsRef = useRef(props);
  propsRef.current = props;
  const stateRef = useRef(state);
  stateRef.current = state;

  const isShown = useRef(false);
  const isHiding = useRef(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showParams = useRef<ShowParams | null>(null);
  const callStack = useRef<Array<ShowNotificationParams>>([]);
  const hiddenComponentValue = useRef(-DEFAULT_COMPONENT_HEIGHT);
  const wasHidingWhenGestureStarted = useRef(false);
  const showNotificationRef = useRef<(params: any) => void>(() => {});

  const translateY = useSharedValue(MIN_TRANSLATE_Y);
  const gestureOffset = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: Math.min(
          Math.max(translateY.value, MIN_TRANSLATE_Y),
          MAX_TRANSLATE_Y
        ),
      },
    ],
  }));

  const onStartHiding = useCallback(() => {
    isHiding.current = true;
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
    }
  }, []);

  const onHidden = useCallback(() => {
    gestureOffset.value = 0;
    showParams.current?.onHidden?.();
    isShown.current = false;
    isHiding.current = false;
    showParams.current = null;
    translateY.value = MIN_TRANSLATE_Y;

    const nextNotification = callStack.current.shift();
    if (nextNotification) {
      showNotificationRef.current(nextNotification);
    }
  }, [gestureOffset, translateY]);

  const hideNotification = useCallback(
    (callback?: (finished: boolean) => void) => {
      if (!isShown.current || isHiding.current) {
        return;
      }

      translateY.value = withTiming(
        hiddenComponentValue.current,
        {
          duration:
            showParams.current?.animationDuration ?? DEFAULT_ANIMATION_DURATION,
          easing: showParams.current?.hideEasing ?? showParams.current?.easing,
        },
        (finished) => {
          'worklet';
          if (finished) {
            scheduleOnRN(onHidden);
          }
          if (callback) {
            scheduleOnRN(callback, !!finished);
          }
        }
      );

      onStartHiding();
    },
    [translateY, onHidden, onStartHiding]
  );

  const setHideTimer = useCallback(() => {
    const { duration = DEFAULT_DURATION } = showParams.current ?? {};
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
    }
    if (duration && !isNaN(duration)) {
      hideTimer.current = setTimeout(() => hideNotification(), duration);
    }
  }, [hideNotification]);

  const showNotification = useCallback(
    <ComponentType extends React.ElementType = typeof NotificationComponent>(
      functionParams: ShowNotificationParams<ComponentType>
    ) => {
      const params = {
        ...propsRef.current,
        ...functionParams,
        componentProps: {
          ...propsRef.current?.componentProps,
          ...functionParams?.componentProps,
        },
      };

      if (isShown.current) {
        switch (params.queueMode) {
          case 'standby': {
            callStack.current.push(params);
            break;
          }
          case 'next': {
            callStack.current.unshift(params);
            break;
          }
          case 'immediate': {
            callStack.current.unshift(params);
            hideNotification();
            break;
          }
          case 'skipDuplicate': {
            const isShowing = isSameNotification(stateRef.current, params);
            const isInQueue = callStack.current.some((notif) =>
              isSameNotification(notif, params)
            );
            if (isShowing || isInQueue) {
              break;
            }
            callStack.current.unshift(params);
            break;
          }
          default: {
            callStack.current = [params];
            hideNotification();
            break;
          }
        }
        return;
      }

      const {
        title,
        description,
        swipeEnabled,
        Component,
        componentProps,
        onShown,
        ...restParams
      } = params;

      setState({
        title,
        description,
        Component: Component ?? NotificationComponent,
        swipeEnabled: swipeEnabled ?? DEFAULT_SWIPE_ENABLED,
        componentProps,
      });

      showParams.current = restParams;
      isShown.current = true;

      setHideTimer();

      translateY.value = -DEFAULT_COMPONENT_HEIGHT;
      translateY.value = withTiming(
        MAX_TRANSLATE_Y,
        {
          duration: restParams.animationDuration ?? DEFAULT_ANIMATION_DURATION,
          easing: restParams.showEasing ?? restParams.easing,
        },
        () => {
          'worklet';
          if (onShown) {
            scheduleOnRN(onShown);
          }
        }
      );
    },
    [hideNotification, setHideTimer, translateY]
  );
  showNotificationRef.current = showNotification;

  const clearQueue = useCallback(
    (hideDisplayedNotification?: boolean) => {
      callStack.current = [];

      if (hideDisplayedNotification) {
        hideNotification();
      }
    },
    [hideNotification]
  );

  const onGestureStart = useCallback(() => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
    }
    wasHidingWhenGestureStarted.current = isHiding.current;
    isHiding.current = false;
  }, []);

  const onGestureEnd = useCallback(
    (currentValue: number) => {
      if (wasHidingWhenGestureStarted.current) {
        wasHidingWhenGestureStarted.current = false;
        isHiding.current = false;

        translateY.value = withTiming(
          MAX_TRANSLATE_Y,
          { duration: SWIPE_ANIMATION_DURATION },
          () => {
            'worklet';
            scheduleOnRN(hideNotification);
          }
        );

        return;
      }
      setHideTimer();

      const isSwipedOut = currentValue < -SWIPE_PIXELS_TO_CLOSE;

      translateY.value = withTiming(
        isSwipedOut ? hiddenComponentValue.current : MAX_TRANSLATE_Y,
        { duration: SWIPE_ANIMATION_DURATION },
        (finished) => {
          'worklet';
          if (isSwipedOut && finished) {
            scheduleOnRN(onHidden);
          }
        }
      );

      if (isSwipedOut) {
        onStartHiding();
      }
    },
    [translateY, hideNotification, setHideTimer, onHidden, onStartHiding]
  );

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .enabled(state.swipeEnabled)
        .onStart(() => {
          'worklet';
          // Replaces the old `stopAnimation` + `_value` read: cancelling and
          // reading is synchronous on the UI thread.
          cancelAnimation(translateY);
          gestureOffset.value = translateY.value;
          scheduleOnRN(onGestureStart);
        })
        .onUpdate((event) => {
          'worklet';
          translateY.value = gestureOffset.value + event.translationY;
        })
        .onEnd(() => {
          'worklet';
          cancelAnimation(translateY);
          const currentValue = translateY.value;
          gestureOffset.value = 0;
          scheduleOnRN(onGestureEnd, currentValue);
        }),
    [
      state.swipeEnabled,
      translateY,
      gestureOffset,
      onGestureStart,
      onGestureEnd,
    ]
  );

  const onPress = useCallback(() => {
    showParams.current?.onPress?.();
    hideNotification();
  }, [hideNotification]);

  const onLayout = useCallback(({ nativeEvent }: LayoutChangeEvent) => {
    const heightWithMargin = nativeEvent.layout.height + 50;
    hiddenComponentValue.current = -Math.max(
      heightWithMargin,
      DEFAULT_COMPONENT_HEIGHT
    );
  }, []);

  // Assigned during render, not in an effect: children of NotifierWrapper are
  // rendered before NotifierRoot but their mount effects run first, and they
  // may show a notification from one.
  Notifier.showNotification = showNotification;
  Notifier.hideNotification = hideNotification;
  Notifier.clearQueue = clearQueue;

  useEffect(
    () => () => {
      if (hideTimer.current) {
        clearTimeout(hideTimer.current);
      }
    },
    []
  );

  const { title, description, Component, componentProps } = state;

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[styles.container, animatedStyle]}>
        <TouchableWithoutFeedback onPress={onPress}>
          <View onLayout={onLayout} style={{ marginTop: props.top }}>
            <Component
              title={title}
              description={description}
              {...componentProps}
            />
          </View>
        </TouchableWithoutFeedback>
      </Animated.View>
    </GestureDetector>
  );
};
