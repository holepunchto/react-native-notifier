# Migration Guide

This fork (`@holepunchto/react-native-notifier`) versions independently of upstream
[`seniv/react-native-notifier`](https://github.com/seniv/react-native-notifier). Two
different `3.0.0` releases are documented below — read the one that matches the package
you are upgrading.

- [`@holepunchto/react-native-notifier` v3.0.0 — Reanimated](#holepunch-v300--migrate-to-reanimated) (this fork)
- [`react-native-notifier` v3.0.0 — safe area](#upstream-v300--safe-area) (upstream)

---

## v3.0.0 — migrate to Reanimated

Animations moved from React Native's `Animated` to
[Reanimated](https://docs.swmansion.com/react-native-reanimated) v4. Reanimated 4 works
**only with the New Architecture** and supports **React Native 0.78+**.

### 1. Install the new peer dependencies

```bash
npm install --save react-native-reanimated react-native-worklets
```

Add the worklets babel plugin to your app's `babel.config.js`, last in the list:

```js
module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: ['react-native-worklets/plugin'],
};
```

### 2. Custom easing functions must be worklets

Easing now runs on the UI thread. Any **custom** easing function you pass to `easing`,
`showEasing` or `hideEasing` needs a `'worklet'` directive:

```diff
-export const showEasing = (x: number) => 1 - (1 - x) ** 5
+export const showEasing = (x: number) => {
+  'worklet'
+  return 1 - (1 - x) ** 5
+}
```

Values taken from `Easing` (e.g. `Easing.ease`) already are — but note `Easing` is now
re-exported from `react-native-reanimated` rather than `react-native`. If you import it
from this package, nothing changes.

### 3. `hideNotification` callback signature

```diff
-Notifier.hideNotification((result: Animated.EndResult) => console.log(result.finished))
+Notifier.hideNotification((finished: boolean) => console.log(finished))
```

### 4. Removed parameters

These had no equivalent worth carrying across and are gone:

| Removed | Notes |
|---|---|
| `containerStyle` (function form) | The custom-animations API. A plain function can no longer produce an animated style; this would now have to be a worklet consumed inside the library's `useAnimatedStyle`. Removed rather than redesigned — reopen if you need it. |
| `containerProps` | Props of the animated container. |
| `translucentStatusBar` | Android status-bar padding. |
| `swipePixelsToClose` / `swipeAnimationDuration` / `swipeEasing` | Now fixed internal constants. |
| `onStartHiding` | Use `onHidden`. |

Note that `componentProps.containerStyle` — the style of the notification **body**, passed
to `NotifierComponents.Notification` — is unaffected and still supported.

---

## Upstream v3.0.0 — safe area

> There is a lot of text, but don't worry, [only point **#1**](#1-install-react-native-safe-area-context) is required for everyone, all other points are necessary only if you use some specific parameters.

Below you’ll find the key changes introduced in upstream **v3.0.0** and how to update your existing code.

For a full list of changes, see the [**Changelog**](https://github.com/seniv/react-native-notifier/blob/main/CHANGELOG.md) in the repository.

---

### 1. Install `react-native-safe-area-context`

**What Changed?**
The library now relies on [react-native-safe-area-context](https://github.com/th3rdwave/react-native-safe-area-context) internally for safe area handling.

**Action Required:**

1. Install the dependency:

```bash
yarn add react-native-safe-area-context
# or
npm install --save react-native-safe-area-context
```

2. Install Pods and build your application

3. Wrap the **root** of your app (or the `NotifierRoot` / `NotifierWrapper`) with `<SafeAreaProvider>`:

```ts
import { SafeAreaProvider } from 'react-native-safe-area-context';

const App = () => (
  <SafeAreaProvider>
    <NotifierWrapper>
      {/* ... your app code ... */}
    </NotifierWrapper>
  </SafeAreaProvider>
);
```

### 2. Alert Component: `alertType` → `type`

**What Changed?**

- **Alert** now uses `type` prop instead of `alertType`. The `alertType` prop is still available but deprecated.

**Action Required:**

- Switch `alertType="error"` etc. to `type="error"` in your code.

### 3. Removed Animation Parameters & New Animation Config

**What Changed?**

- **Removed**: `animationDuration`, `showAnimationDuration`, `hideAnimationDuration`, `swipeAnimationDuration`, `easing`, `showEasing`, `hideEasing`, `swipeEasing`.
- **Use**: `showAnimationConfig`, `hideAnimationConfig`, `swipeOutAnimationConfig`, `resetSwipeAnimationConfig` instead.

**Action Required:**

- Replace old params with new config objects:

```ts
Notifier.showNotification({
  // Old:
  showAnimationDuration: 800,
  showEasing: Easing.bounce,

  // New:
  showAnimationConfig: {
    method: 'timing',
    config: {
      duration: 800,
      easing: Easing.bounce,
    },
  },
  // ...
});
```

- If `Component !== NotifierComponents.Alert`, `showAnimationConfig` defaults to a **spring** animation.

### 4. Swiping & Removed `swipeEnabled`

**What Changed?**

- `swipeEnabled` has been **removed**. To disable swiping, set `swipeDirection: 'none'`.

**Action Required:**

- Remove `swipeEnabled` usage. Use `swipeDirection: 'none'` to disable swipe-to-dismiss.

### 5. `containerStyle` & New `animationFunction` (only Custom Animation)

**What Changed?**

- `containerStyle` now only accepts **simple** style objects (e.g., background color, margins).
- For **custom animations**, use the new `animationFunction` parameter.

**Suggestion:**
- If you used custom animations to display notification at the bottom, use `position` parameter instead.

**Action Required:**

1. **Remove** any animation logic from `containerStyle`.
2. **Implement** animations via `animationFunction`. Example:

```ts
Notifier.showNotification({
  // ...
  animationFunction: ({
    animationState,
    shakingTranslationX,
    shakingTranslationY,
  }: AnimationFunctionParams) => {
    return {
      opacity: animationState,
      transform: [
        {
          translateX: shakingTranslationX,
        },
        {
          translateY: shakingTranslationY,
        },
      ],
    };
  },
});
```

### 6. Hide Timer Behavior (`duration`)

**What Changed?**  
The `duration` timer now begins **after** the “appearing” animation finishes (instead of at animation start). If you use a **long** appear animation, your notification remains on screen longer than before.

**Action Required:**

- Lower `duration` if you want the on-screen time to match previous behavior.

### 7. Unmounting of Component (only for Custom Components)

**What Changed?**
`Component` is now fully unmounted while the notification is not visible. Now you can, for example use `useEffect` hook to do something when notification appears/disappears. For example, play sound, etc.

**Action Required:**

- If you relied on notification component persisting, consider updating your logic.

---

## Suggestions:

### 1. Position & Directions

**What Changed?**

- **`position`** places a notification at the top, bottom, or any screen edge.
- **`enterFrom`**, **`exitTo`**, **`swipeDirection`** for custom entering/exiting/swipe directions.

**Suggestion:**

- Explore these new props if you want advanced positioning or direction-based animations.

### 2. Multiple Instances & Broadcasting

**What Changed?**

- You can mount **multiple** `NotifierWrapper` / `NotifierRoot` components.
- Global `Notifier.*` methods control the last mounted instance.
- `Notifier.broadcast.*` commands all mounted instances simultaneously.

**Suggestion:**

- You can mount `NotifierWrapper` / `NotifierRoot` inside of a modals, and shown notification with `Notifier.showNotification` as you usually do. No need to provide a `ref`.

### 3. Notification IDs, `idStrategy`, & `duplicateBehavior`

**What Changed?**

- Each notification has a unique ID by default, generated via `idStrategy` if not provided.
- `duplicateBehavior` defines how to handle a new notification if one with the same ID is already visible.

**Suggestion:**

- If you track notifications manually, note that IDs are now automatically assigned unless you set them.
- Use `duplicateBehavior` to handle duplicates gracefully.

### 4. New Methods: `updateNotification`, `shakeNotification`, & ID Variants

**What Changed?**

- `updateNotification`, `shakeNotification`, `hideNotification` are joined by `updateById`, `shakeById`, `isVisibleById`, `hideById` — these affect a notification **only** if the ID matches.
- `isNotificationVisible` returns whether **any** notification is currently displayed.

**Suggestion:**

- Use the `ById` variants for more precise targeting of notifications if needed.

### 5. `type` and other new props in `Notification` component

**What Changed?**

- **Notification** now has a `type` prop; any value other than `'classic'` (`success`, `error`, etc.) shows an icon and left border with different colors.
- There is also more new props added to the Notification component for better customization, such us `useTypeColorForTitle`, `useTypeColorForDescription`, `iconSource`, `safeAreaStyle`, `iconContainerStyle`, `iconStyle`, `textContainerStyle`,

**Suggestion:**

- Explore these new props to see new variations of the Notification component.

### 6. `useRNScreensOverlay` & `rnScreensOverlayViewStyle`

**What Changed?**

- Can now be passed both as props on `NotifierRoot`/`NotifierWrapper` **and** as parameters to `showNotification`.

**Suggestion:**

- If you want to display the notifications above `native-stack` modals on ios, set `useRNScreensOverlay` to `true`

---

## Known Issue

- When `useRNScreensOverlay` is `true`, `SafeAreaView` may not behave correctly.
- Use the `ViewWithOffsets` component in your custom components to handle safe area insets if needed.

## Summary

**To upgrade** to `v3.0.0`:

1. **Install** `react-native-safe-area-context` & wrap your app root with `SafeAreaProvider`.
2. **Remove** old animation params (e.g., `animationDuration`, `easing`) and switch to `*AnimationConfig` or `animationFunction`.
3. **Adjust** `duration` if you rely on the old timing (it now starts after appear animation finishes).
4. **Set `swipeDirection: 'none'`** if you want to disable swiping (`swipeEnabled` was removed).
5. **Optionally** explore new features like `duplicateBehavior`, `idStrategy`, `ById` methods, advanced positioning, or directions.
