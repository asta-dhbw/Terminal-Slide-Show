import { DateParser } from './dateParser.js';

/**
 * Validates if a filename's embedded dates are valid for current display
 * @param {string} filename - Filename to validate (e.g., "01-01-2024.jpg" or "01-01@31-12.jpg")
 * @returns {boolean} True if file should be displayed based on current date
 * 
 * @example
 * // Single date file (must be today)
 * isValidFile("25-03-2024.jpg") // true if today is March 25, 2024
 * 
 * @example
 * // Date range
 * isValidFile("01-01-2024@31-12-2024.jpg") // true if current date is within 2024
 */
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

    // For single-date files (no end date),
    // ensure the start date matches today's date
    if (!endDate) {
        const startDateString = startDate.toISOString().split('T')[0];
        const nowString = now.toISOString().split('T')[0];
        return startDateString === nowString;
    }

    return true;
}