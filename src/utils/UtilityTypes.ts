export type RemoveReadonly<T> = T extends readonly [...infer R] ? R : T;

export type InferNestedType<TData, TPath extends readonly string[]> = 
    TPath extends string[] // Check if TPath is a general string array
        ? unknown               // If it's a general array, return any
        : GetNestedType<TData, TPath>; // If it's a tuple, use GetNestedType


export type GetNestedType<T, K extends readonly string[]> = 
    RemoveReadonly<K> extends [infer First, ...infer Rest]
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

export type DateKeys = "createdAt" | "updatedAt" | "publishedAt" | "lastEditedAt"
