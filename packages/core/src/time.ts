const ZERO = 0n;
const ONE = 1n;

function absolute(value: bigint): bigint {
  return value < ZERO ? -value : value;
}

function greatestCommonDivisor(left: bigint, right: bigint): bigint {
  let a = absolute(left);
  let b = absolute(right);

  while (b !== ZERO) {
    const remainder = a % b;
    a = b;
    b = remainder;
  }

  return a;
}

function toBigInt(value: bigint | number, name: string): bigint {
  if (typeof value === "number" && !Number.isSafeInteger(value)) {
    throw new RangeError(`${name} must be a safe integer, got ${value}.`);
  }

  return BigInt(value);
}

/**
 * An exact rational value used for frame rates, timestamps and playback rates.
 * Keeping time rational avoids drift at rates such as 30000/1001 fps.
 */
export class Rational {
  readonly numerator: bigint;
  readonly denominator: bigint;

  constructor(numerator: bigint | number, denominator: bigint | number = ONE) {
    const rawNumerator = toBigInt(numerator, "Rational numerator");
    const rawDenominator = toBigInt(denominator, "Rational denominator");

    if (rawDenominator === ZERO) {
      throw new RangeError("A rational denominator cannot be zero.");
    }

    const sign = rawDenominator < ZERO ? -ONE : ONE;
    const divisor = greatestCommonDivisor(rawNumerator, rawDenominator);

    this.numerator = (rawNumerator / divisor) * sign;
    this.denominator = absolute(rawDenominator) / divisor;
  }

  static zero(): Rational {
    return new Rational(ZERO);
  }

  static one(): Rational {
    return new Rational(ONE);
  }

  add(value: Rational): Rational {
    return new Rational(
      this.numerator * value.denominator + value.numerator * this.denominator,
      this.denominator * value.denominator,
    );
  }

  subtract(value: Rational): Rational {
    return new Rational(
      this.numerator * value.denominator - value.numerator * this.denominator,
      this.denominator * value.denominator,
    );
  }

  multiply(value: Rational): Rational {
    return new Rational(this.numerator * value.numerator, this.denominator * value.denominator);
  }

  divide(value: Rational): Rational {
    if (value.numerator === ZERO) {
      throw new RangeError("Cannot divide by zero.");
    }

    return new Rational(this.numerator * value.denominator, this.denominator * value.numerator);
  }

  compare(value: Rational): -1 | 0 | 1 {
    const difference = this.numerator * value.denominator - value.numerator * this.denominator;

    if (difference === ZERO) return 0;
    return difference < ZERO ? -1 : 1;
  }

  equals(value: Rational): boolean {
    return this.compare(value) === 0;
  }

  toNumber(): number {
    return Number(this.numerator) / Number(this.denominator);
  }

  toString(): string {
    if (this.denominator === ONE) return this.numerator.toString();
    return `${this.numerator}/${this.denominator}`;
  }
}

export type FrameRate = Rational;
export type Time = Rational;

export function frameRate(
  numerator: bigint | number,
  denominator: bigint | number = ONE,
): FrameRate {
  const rate = new Rational(numerator, denominator);

  if (rate.compare(Rational.zero()) <= 0) {
    throw new RangeError("A frame rate must be greater than zero.");
  }

  return rate;
}

export function seconds(numerator: bigint | number, denominator: bigint | number = ONE): Time {
  return new Rational(numerator, denominator);
}

export function frameToTime(frame: number, rate: FrameRate): Time {
  assertFrame(frame);
  return new Rational(frame).divide(rate);
}

export function assertFrame(frame: number): void {
  if (!Number.isSafeInteger(frame) || frame < 0) {
    throw new RangeError(`Frame must be a non-negative safe integer, got ${frame}.`);
  }
}
