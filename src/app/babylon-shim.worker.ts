/**
 * Babylon will run with limited features in webworkers quite happily using the
 * NullEngine, however typescript is not happy when checking the library as it's
 * external d.ts files contain a large number of references to DOM only APIs.
 * So, in this file we declare all those types as any, to make the TS compiler
 * happy about features that we're not going to use anyway.
 */
// @ts-ignore
declare type Animation = any;
declare type AudioBuffer = any;
declare type AudioContext = any;
declare type AudioNode = any;
declare type ClientRect = any;
declare type ClipboardEvent = any;
declare type DeviceOrientationEvent = any;
declare type Document = any;
declare type FocusEvent = any;
declare type GainNode = any;
declare type GamepadButton = any;
declare type HTMLButtonElement = any;
declare type HTMLElement = any;
declare type HTMLImageElement = any;
declare type KeyboardEvent = any;
declare type MediaStream = any;
declare type MediaStreamConstraints = any;
declare type MediaStreamTrack = any;
declare type MediaTrackConstraints = any;
declare type MouseWheelEvent = any;
declare type MSGesture = any;
declare type NavigatorUserMediaErrorCallback = any;
declare type NavigatorUserMediaSuccessCallback = any;
declare type PointerEvent = any;
declare type PointerEventInit = any;
