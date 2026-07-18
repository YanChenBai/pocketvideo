import type { Time } from "./time.ts";

export type AnimationValue = boolean | number | string;

/** Receives the property values calculated by an animation adapter. */
export interface AnimationPropertySink {
  set(property: string, value: AnimationValue): void;
}

/**
 * Adapter boundary for GSAP, Motion-compatible animations or a native driver.
 * Drivers are evaluated at an absolute track-local time and must not own a clock.
 */
export interface AnimationDriver {
  evaluate(time: Time, sink: AnimationPropertySink): void;
  dispose?(): void;
}

export class AnimationProperties implements AnimationPropertySink {
  readonly #values = new Map<string, AnimationValue>();

  set(property: string, value: AnimationValue): void {
    this.#values.set(property, value);
  }

  get(property: string): AnimationValue | undefined {
    return this.#values.get(property);
  }

  has(property: string): boolean {
    return this.#values.has(property);
  }

  toObject(): Readonly<Record<string, AnimationValue>> {
    return Object.freeze(Object.fromEntries(this.#values));
  }
}
