type EnumKeys<Enum> = Exclude<keyof Enum, number>;

export class EnumUtils {
  static enumObject<Enum extends Record<string, number | string>>(e: Enum) {
    const copy = { ...e } as { [K in EnumKeys<Enum>]: Enum[K] };
    Object.values(e).forEach(
      (value) => typeof value === 'number' && delete copy[value],
    );
    return copy;
  }

  static enumKeys<Enum extends Record<string, number | string>>(e: Enum) {
    return Object.keys(this.enumObject(e)) as EnumKeys<Enum>[];
  }

  static enumValues<Enum extends Record<string, number | string>>(e: Enum) {
    return [
      ...new Set(Object.values(this.enumObject(e))),
    ] as Enum[EnumKeys<Enum>][];
  }
}
