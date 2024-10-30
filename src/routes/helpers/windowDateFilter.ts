export function windowDateFilter(onProperty: string, fromDate: Date, toDate: Date) {
    return (item: Record<string, any>|null) => {
        if (!item) return false;
        const value = new Date(item[onProperty]);
        return fromDate <= value && value <= toDate;
    };
}
