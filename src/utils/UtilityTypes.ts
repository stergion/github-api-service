export type GetNestedType<T, K extends string[]> = K extends [infer First, ...infer Rest]
    ? First extends keyof T
        ? Rest extends []
            ? NonNullable<T[First]>
            : NonNullable<T[First]> extends Record<string, any>
            ? GetNestedType<NonNullable<T[First]>, Extract<Rest, string[]>>
            : never
        : never
    : never;

export type FindNestedType<T, K extends string> = K extends keyof T
    ? NonNullable<T[K]> // If the key exists directly, return its type
    : {
          [P in keyof T]: NonNullable<T[P]> extends Record<string, any>
              ? FindNestedType<NonNullable<T[P]>, K> // Recursively search in nested objects
              : never;
      }[keyof T] extends infer R
    ? R extends {}
        ? R // Return the first match found
        : never
    : never;



