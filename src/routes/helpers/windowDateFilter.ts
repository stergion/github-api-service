export function windowDateFilter(onProperty: string, fromDate: Date, toDate: Date) {
    return (item: { [key: string]: any; }) => {
        const value = new Date(item[onProperty]);
        return fromDate <= value && value <= toDate;
    };
}
