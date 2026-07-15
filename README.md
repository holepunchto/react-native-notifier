# react-native-notifier

[![npm](https://img.shields.io/npm/v/react-native-notifier)](https://www.npmjs.com/package/react-native-notifier)
[![npm bundle size](https://img.shields.io/bundlephobia/min/react-native-notifier?color=yellow)](https://bundlephobia.com/result?p=react-native-notifier)
![platforms: ios, android, web](https://img.shields.io/badge/platform-ios%2C%20android%2C%20web%2C%20expo-orange)
[![license MIT](https://img.shields.io/badge/license-MIT-brightgreen)](https://github.com/seniv/react-native-notifier/blob/master/LICENSE)

Fast, simple, and customizable in-app notifications for React Native

![Demo of package](https://raw.githubusercontent.com/seniv/react-native-notifier/master/demo.gif)

## Requirements

This library uses [react-native-gesture-handler](https://github.com/software-mansion/react-native-gesture-handler), a perfect library for swipes, and other gesture events.
Please check their installation guide to install it properly: https://docs.swmansion.com/react-native-gesture-handler/docs/installation

Animations are driven by [react-native-reanimated](https://docs.swmansion.com/react-native-reanimated) v4, which
**requires the New Architecture and React Native 0.78+**. Install `react-native-reanimated` and
`react-native-worklets`, and add the worklets babel plugin to your app's `babel.config.js` — it must
stay last in the plugin list:

```js
module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: ['react-native-worklets/plugin'],
};
```

This library also uses [react-native-screens](https://github.com/software-mansion/react-native-screens) to display toasts at the top most layer.

## Installation
```sh
yarn add react-native-notifier
```
Or
```sh
npm install --save react-native-notifier
```

## Usage

Wrap your app with `NotifierWrapper`
```js
import { NotifierWrapper } from 'react-native-notifier';

const App = () => (
  <NotifierWrapper>
    <Navigation />
  </NotifierWrapper>
);
```
Then call `Notifier.showNotification()` anywhere in code
```js
import { Notifier, Easing } from 'react-native-notifier';

Notifier.showNotification({
  title: 'John Doe',
  description: 'Hello! Can you help me with notifications?',
  duration: 0,
  animationDuration: 800,
  showEasing: Easing.bounce,
  onHidden: () => console.log('Hidden'),
  onPress: () => console.log('Press'),
});
```
---

Or add `NotifierRoot` at end of your App.js component. With this approach you can show notification using reference to the `NotifierRoot`.

Note that `NotifierRoot` should be the last component to display notifications correctly. `Notifier.showNotification` is also available.
```js
import { NotifierRoot } from 'react-native-notifier';

function App() {
  const notifierRef = useRef();
  return (
    <>
      <Button
        title="Show Notification"
        onPress={() => notifierRef.current?.showNotification({ title: 'Using refs' })}
      />
      <NotifierRoot ref={notifierRef} />
    </>
  );
}
```

## Props

Both `NotifierWrapper` and `NotifierRoot` receive the same props.

Name                  | Type             | Default                       | Description
----------------------|------------------|-------------------------------|-------------
omitGlobalMethodsHookup| Boolean         | false                         | If set to `true`, global `Notifier` methods will not control this component. It's useful in case you have more than one `NotifierWrapper` or `NotifierRoot` rendered. If enabled, the only way to display notifications is using refs.

All parameters of the [`showNotification`](#showNotification) function can be passed as props to `NotifierWrapper` or `NotifierRoot`. In this case, they will be used as default parameters when calling the [`showNotification`](#showNotification) function. This can be useful for setting default [`Component`](#custom-component) parameter.

## API

### `showNotification`

```
Notifier.showNotification(params: object);
```
Show notification with params.

`params`

Name                  | Type             | Default                       | Description
----------------------|------------------|-------------------------------|-------------
title                 | String           | null                          | Title of notification. __Passed to `Component`.__
description           | String           | null                          | Description of notification. __Passed to `Component`.__
duration              | Number           | 3000                          | Time after notification will disappear. Set to `0` to not hide notification automatically
Component             | Component        | NotifierComponents.Notification | Component of the notification body. You can use one of the [built-in components](#components), or your [custom component](#custom-component).
componentProps        | Object           | {}                            | Additional props that are passed to `Component`. See all available props of built-in components in the [components section](#components).
queueMode             | String           | 'reset'                       | Determines the order in which notifications are shown. Read more in the [Queue Mode](#queue-mode) section.
swipeEnabled          | Boolean          | true                          | Can notification be hidden by swiping it out
animationDuration     | Number           | 300                           | How fast notification will appear/disappear
easing                | Easing           | null                          | Animation easing. Details: https://docs.swmansion.com/react-native-reanimated/docs/utilities/Easing
showEasing            | Easing           | easing \|\| null              | Show Animation easing.
hideEasing            | Easing           | easing \|\| null              | Hide Animation easing.
onShown               | () => void       | null                          | Function called when entering animation is finished
onHidden              | () => void       | null                          | Function called when notification completely hidden
onPress               | () => void       | null                          | Function called when user press on notification
top                   | Number           | null                          | Top inset applied to the notification body.

Easing values are Reanimated easings — import `Easing` from this package, or from
`react-native-reanimated` directly. A **custom** easing function runs on the UI thread
and must carry a `'worklet'` directive:

```ts
const showEasing = (x: number) => {
  'worklet';
  return 1 - (1 - x) ** 5;
};
```

### `hideNotification`

```
Notifier.hideNotification(onHiddenCallback?: (finished: boolean) => void);
```

Hide notification and run callback function when notification completely hidden.
### `clearQueue`

```
Notifier.clearQueue(hideDisplayedNotification?: boolean);
```

Clear [notifications queue](#queue-mode) and optionally hide currently displayed notification. Might be useful to run after logout, after which queued notifications should not be displayed.

## Queue Mode

Queue mode is used to define the order in which the notification appears in case other notifications are being displayed at the moment.

For example, if you have some important information like chat messages and you want the user to see all the notifications, then you can use `standby` mode. Or if you want to display something like an error message, then you can use `reset` mode.

By default, `reset` mode is used, which means every new notification clears the queue and gets displayed immediately.

In most cases, you will probably use only `reset` or `standby` modes.

All possible modes:
Mode       | Effect
-----------|---------
reset      | Clear notification queue and immediately display the new notification. Used by default.
standby    | Add notification to the end of the queue.
next       | Put notification in the first place in the queue. Will be shown right after the current notification disappears.
immediate  | Similar to `next`, but also it will hide currently displayed notification.
skipDuplicate    | Skip the notification if the same notification is already showing or in the queue.

## Components

Currently, there are 2 components out of the box. If none of them fits your needs, then you can easily create your [Custom Component](#custom-component).

### `NotifierComponents.Notification`

![Demo of Notification component](https://raw.githubusercontent.com/seniv/react-native-notifier/master/notification-component.png)

Perfect for something like chat messages and notifications like "Someone left a comment". This component is used by default.

```js
import { Notifier, NotifierComponents } from 'react-native-notifier';

Notifier.showNotification({
  title: 'Check this image!',
  description: 'Cool, right?',
  Component: NotifierComponents.Notification,
  componentProps: {
    imageSource: require('./react.jpg'),
  },
});
```
Available params:
Name                               | Type       | Default      | Description
-----------------------------------|------------|--------------|-------------
title                              | String     | null         | Title of notification.
description                        | String     | null         | Description of notification.
componentProps.titleStyle          | TextStyle  | null         | The style to use for rendering title.
componentProps.descriptionStyle    | TextStyle  | null         | The style to use for rendering description.
componentProps.imageSource         | Object     | null         | Passed to `<Image />` as `source` param.
componentProps.imageStyle          | ImageStyle | null         | The style to use for rendering image.
componentProps.containerStyle      | ViewStyle  | null         | The style to use for notification container.
componentProps.maxTitleLines       | number     | null         | The maximum number of lines to use for rendering title.
componentProps.maxDescriptionLines | number     | null         | The maximum number of lines to use for rendering description.

### `NotifierComponents.Alert`

![Demo of Alert component](https://raw.githubusercontent.com/seniv/react-native-notifier/master/alert-component.png)

Perfect to use as a system alerts, like "Something went wrong" or "Operation was succeed".

```js
import { Notifier, NotifierComponents } from 'react-native-notifier';

Notifier.showNotification({
  title: 'The request was failed',
  description: 'Check your internet connection, please',
  Component: NotifierComponents.Alert,
  componentProps: {
    alertType: 'error',
  },
});
```
Available params:
Name                               | Type      | Default      | Description
-----------------------------------|-----------|--------------|-------------
title                              | String    | null         | Title of notification.
description                        | String    | null         | Description of notification.
componentProps.titleStyle          | TextStyle | null         | The style to use for rendering title.
componentProps.descriptionStyle    | TextStyle | null         | The style to use for rendering description.
componentProps.alertType           | String    | 'success'    | Background color will be changed depending on the type. Available values: `error`(red), `success`(green), `warn`(orange) and `info`(blue).
componentProps.backgroundColor     | String    | null         | While the background of the alert depends on `alertType`, you can also set the other color you want.
componentProps.textColor           | String    | 'white'      | Color of `title` and `description`.
componentProps.maxTitleLines       | number    | null         | The maximum number of lines to use for rendering title.
componentProps.maxDescriptionLines | number    | null         | The maximum number of lines to use for rendering description.

## Custom Component

To customize look of the notification you can pass your own `Component` to [`showNotification`](#showNotification) function.

This makes customization much simpler than passing "style" params. With custom components you can make notification look exactly like you want.

This component will receive props `title`, `description` and anything else that you pass to `componentProps` object when calling [`showNotification`](#showNotification).

### Example
```js
import React from 'react';
import { StyleSheet, View, Text, SafeAreaView } from 'react-native';

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: 'orange',
  },
  container: {
    padding: 20,
  },
  title: { color: 'white', fontWeight: 'bold' },
  description: { color: 'white' },
});

const CustomComponent = ({ title, description }) => (
  <SafeAreaView style={styles.safeArea}>
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
    </View>
  </SafeAreaView>
);

// ...

// Then show notification with the component

Notifier.showNotification({
  title: 'Custom',
  description: 'Example of custom component',
  Component: CustomComponent,
});
```
![Demo of custom component](https://raw.githubusercontent.com/seniv/react-native-notifier/master/custom-component.jpg)

## Using with `react-native-navigation`
If you are using `react-native-navigation`, this issue might be helpful to use notifier with native-navigation: https://github.com/seniv/react-native-notifier/issues/16

If you have any solutions or improvements in how to use notifier with native-navigation, then feel free to write comments in that thread!

## Troubleshooting

### PanGestureHandler must be used as a descendant of GestureHandlerRootView
Check this comment: https://github.com/seniv/react-native-notifier/issues/85#issuecomment-1603741147

## 📦 Publishing

To build and publish the package to npm:

```sh
npm install
npm run build
npm publish
```

### Notes

- Make sure you are logged in to npm:
  ```sh
  npm login
  ```

- Ensure build output (e.g. `lib/`) is included in the published package

## License

MIT
