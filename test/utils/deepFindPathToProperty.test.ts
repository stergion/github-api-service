import { describe, it, expect } from "vitest";
import { deepFindPathToProperty, get, set } from "../../src/utils/deepFindPathToProperty";

describe("deepFindPathToProperty", () => {
    it("should find property at root level", () => {
        const obj = { target: "value" };
        expect(deepFindPathToProperty(obj, "target")).toEqual([]);
    });

    it("should find nested property", () => {
        const obj = {
            a: {
                b: {
                    c: { target: "found" },
                },
            },
        };
        expect(deepFindPathToProperty(obj, "target")).toEqual(["a", "b", "c"]);
    });

    it("should return null when property not found", () => {
        const obj = { a: 1, b: { c: 2 } };
        expect(deepFindPathToProperty(obj, "notFound")).toBeNull();
    });

    it("should ignore array values", () => {
        const obj = {
            arr: ["target"],
            nested: { target: "value" },
        };
        expect(deepFindPathToProperty(obj, "target")).toEqual(["nested"]);
    });

    it("should return null when object is empty", () => {
        expect(deepFindPathToProperty({}, "target")).toBeNull();
    });
});

describe("get", () => {
    const testObj = {
        a: 1,
        b: {
            c: 2,
            d: [1, 2, 3],
            e: null,
        },
        "x.y": "dot",
    };

    it("should get direct properties", () => {
        expect(get(testObj, ["a"])).toBe(1);
        expect(get(testObj, ["b"])).toEqual({ c: 2, d: [1, 2, 3], e: null });
    });

    it("should get nested properties", () => {
        expect(get(testObj, ["b", "c"])).toBe(2);
        expect(get(testObj, ["b", "d"])).toEqual([1, 2, 3]);
    });

    it("should get array elements", () => {
        expect(get(testObj, ["b", "d", "1"])).toBe(2);
    });

    it("should handle missing properties", () => {
        expect(get(testObj, ["missing"])).toBeUndefined();
        expect(get(testObj, ["b", "missing"])).toBeUndefined();
    });

    it("should handle null values", () => {
        expect(get(testObj, ["b", "e"])).toBeNull();
    });

    it("should handle property names with dots", () => {
        expect(get(testObj, ["x.y"])).toBe("dot");
    });
});

describe.todo("set");
