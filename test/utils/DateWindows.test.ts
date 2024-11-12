import { describe, expect, it } from "vitest";
import { DateWindows, getDate, yearly, monthly, weekly, daily } from "../../src/utils/DateWindows";

describe("DateWindows", () => {
    const baseDate = new Date("2023-01-01T00:00:00.000Z");

    describe("Constructor", () => {
        it("should create instance with date and year offset", () => {
            const windows = new DateWindows(baseDate, { years: 1 });
            expect(windows.toDate).toEqual(new Date("2023-01-01T23:59:59.999Z"));
            expect(windows.fromDate).toEqual(new Date("2022-01-02T00:00:00.000Z"));
        });

        it("should create instance with date and month offset", () => {
            const windows = new DateWindows(baseDate, { months: 1 });
            expect(windows.toDate).toEqual(new Date("2023-01-01T23:59:59.999Z"));
            expect(windows.fromDate).toEqual(new Date("2022-12-02T00:00:00.000Z"));
        });

        it("should create instance with date and day offset", () => {
            const windows = new DateWindows(baseDate, { days: 1 });
            expect(windows.toDate).toEqual(new Date("2023-01-01T23:59:59.999Z"));
            expect(windows.fromDate).toEqual(new Date("2023-01-01T00:00:00.000Z"));
        });

        it("should create instance given a start and an end date", () => {
            const fromDate = new Date("2022-01-01T00:00:00.000Z");
            const windows = new DateWindows(baseDate, fromDate);
            expect(windows.toDate).toEqual(new Date("2023-01-01T23:59:59.999Z"));
            expect(windows.fromDate).toEqual(new Date("2022-01-01T00:00:00.000Z"));
        });
    });

    describe("Window Calculations", () => {
        it("should calculate yearly windows", () => {
            const windows = new DateWindows(baseDate, { years: 2 });
            const yearlyWindows = windows.yearly();
            expect(yearlyWindows).toHaveLength(2);
            expect(yearlyWindows[1][0]).toEqual(new Date("2021-01-02T00:00:00.000Z"));
            expect(yearlyWindows[1][1]).toEqual(new Date("2022-01-01T23:59:59.999Z"));
            expect(yearlyWindows[0][0]).toEqual(new Date("2022-01-02T00:00:00.000Z"));
            expect(yearlyWindows[0][1]).toEqual(new Date("2023-01-01T23:59:59.999Z"));
        });

        it("should calculate monthly windows", () => {
            const windows = new DateWindows(baseDate, { months: 2 });
            const monthlyWindows = windows.monthly();
            expect(monthlyWindows).toHaveLength(2);
            expect(monthlyWindows[1][0]).toEqual(new Date("2022-11-02T00:00:00.000Z"));
            expect(monthlyWindows[1][1]).toEqual(new Date("2022-12-01T23:59:59.999Z"));
            expect(monthlyWindows[0][0]).toEqual(new Date("2022-12-02T00:00:00.000Z"));
            expect(monthlyWindows[0][1]).toEqual(new Date("2023-01-01T23:59:59.999Z"));
        });

        it("should calculate weekly windows", () => {
            const windows = new DateWindows(baseDate, { days: 15 });
            const weeklyWindows = windows.weekly();
            expect(weeklyWindows).toHaveLength(3);
            expect(weeklyWindows[2][0]).toEqual(new Date("2022-12-18T00:00:00.000Z"));
            expect(weeklyWindows[2][1]).toEqual(new Date("2022-12-18T23:59:59.999Z"));
            expect(weeklyWindows[1][0]).toEqual(new Date("2022-12-19T00:00:00.000Z"));
            expect(weeklyWindows[1][1]).toEqual(new Date("2022-12-25T23:59:59.999Z"));
            expect(weeklyWindows[0][0]).toEqual(new Date("2022-12-26T00:00:00.000Z"));
            expect(weeklyWindows[0][1]).toEqual(new Date("2023-01-01T23:59:59.999Z"));
        });

        it("should calculate daily windows", () => {
            const windows = new DateWindows(baseDate, { days: 2 });
            const dailyWindows = windows.daily();
            expect(dailyWindows).toHaveLength(2);
            expect(dailyWindows[1][0]).toEqual(new Date("2022-12-31T00:00:00.000Z"));
            expect(dailyWindows[1][1]).toEqual(new Date("2022-12-31T23:59:59.999Z"));
            expect(dailyWindows[0][0]).toEqual(new Date("2023-01-01T00:00:00.000Z"));
            expect(dailyWindows[0][1]).toEqual(new Date("2023-01-01T23:59:59.999Z"));
        });

        it("should return empty array for invalid window range", () => {
            const windowsDays = new DateWindows(baseDate, { days: 0 });
            const dailyWindows = windowsDays.daily();
            expect(dailyWindows).toHaveLength(0);

            const windowsMonths = new DateWindows(baseDate, { months: 0 });
            const monthlyWindows = windowsMonths.monthly();
            expect(monthlyWindows).toHaveLength(0);

            const windowsYears = new DateWindows(baseDate, { years: 0 });
            const yearlyWindows = windowsYears.yearly();
            expect(yearlyWindows).toHaveLength(0);

            const fromDate = new Date(baseDate);
            fromDate.setUTCDate(fromDate.getUTCDate() + 1);
            const windows = new DateWindows(baseDate, fromDate);
            const yearlyWindows2 = windows.yearly();
            expect(yearlyWindows2).toHaveLength(0);
        });
    });

    describe("Utility Functions", () => {
        it("should get date with end of day time", () => {
            const result = getDate(baseDate);
            expect(result).toEqual(new Date("2023-01-01T23:59:59.999Z"));
        });

        it("should calculate yearly windows with utility function", () => {
            const windows = yearly(2, baseDate);
            expect(windows).toHaveLength(2);
            expect(windows[1][0]).toEqual(new Date("2021-01-02T00:00:00.000Z"));
            expect(windows[1][1]).toEqual(new Date("2022-01-01T23:59:59.999Z"));
            expect(windows[0][0]).toEqual(new Date("2022-01-02T00:00:00.000Z"));
            expect(windows[0][1]).toEqual(new Date("2023-01-01T23:59:59.999Z"));
        });

        it("should calculate monthly windows with utility function", () => {
            const windows = monthly(2, baseDate);
            expect(windows).toHaveLength(2);
            expect(windows[1][0]).toEqual(new Date("2022-11-02T00:00:00.000Z"));
            expect(windows[1][1]).toEqual(new Date("2022-12-01T23:59:59.999Z"));
            expect(windows[0][0]).toEqual(new Date("2022-12-02T00:00:00.000Z"));
            expect(windows[0][1]).toEqual(new Date("2023-01-01T23:59:59.999Z"));
        });

        it("should calculate weekly windows with utility function", () => {
            const windows = weekly(2, baseDate);
            expect(windows).toHaveLength(2);
            expect(windows[1][0]).toEqual(new Date("2022-12-19T00:00:00.000Z"));
            expect(windows[1][1]).toEqual(new Date("2022-12-25T23:59:59.999Z"));
            expect(windows[0][0]).toEqual(new Date("2022-12-26T00:00:00.000Z"));
            expect(windows[0][1]).toEqual(new Date("2023-01-01T23:59:59.999Z"));
        });

        it("should calculate daily windows with utility function", () => {
            const windows = daily(2, baseDate);
            expect(windows).toHaveLength(2);
            expect(windows[1][0]).toEqual(new Date("2022-12-31T00:00:00.000Z"));
            expect(windows[1][1]).toEqual(new Date("2022-12-31T23:59:59.999Z"));
            expect(windows[0][0]).toEqual(new Date("2023-01-01T00:00:00.000Z"));
            expect(windows[0][1]).toEqual(new Date("2023-01-01T23:59:59.999Z"));
        });

        it("should throw error for invalid inputs", () => {
            expect(() => yearly(0)).toThrow("Please provide variable 'years'.");
            expect(() => monthly(0)).toThrow("Please provide variable 'months'.");
            expect(() => weekly(0)).toThrow("Please provide variable 'weeks'.");
            expect(() => daily(0)).toThrow("Please provide variable 'days'.");
        });
    });
});
