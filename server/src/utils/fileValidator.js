import { DateParser } from './dateParser.js';


export function isValidFile(filename) {
    const parsedDate = DateParser.parseFileName(filename);
    if (!parsedDate) {
    return false;
    }

    const now = new Date();
    const { startDate, endDate } = parsedDate;

    if (startDate > now) {
    return false; // Start date is in the future
    }

    if (endDate && endDate < now) {
    return false; // End date is in the past
    }

    // If there is no end date, ensure the start date is today
    if (!endDate) {
        const startDateString = startDate.toISOString().split('T')[0];
        const nowString = now.toISOString().split('T')[0];
        return startDateString === nowString;
    }


    return true;
}