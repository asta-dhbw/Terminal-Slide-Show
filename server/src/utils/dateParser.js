export class DateParser {
  static parseFileName(filename) {
    const patterns = [
      /(\d{1,2})[-._](\d{1,2})[-._](\d{2,4})@(\d{1,2})[-._](\d{1,2})[-._](\d{2,4})/,
      /(\d{1,2})[-._](\d{1,2})[-._](\d{2,4})(?:T(\d+))?/
    ];

    for (const pattern of patterns) {
      const match = filename.match(pattern);
      if (!match) continue;

      try {
        const startDate = DateParser.createDate(match[1], match[2], match[3]);
        if (match.length > 4) {
          const endDate = DateParser.createDate(match[4], match[5], match[6]);
          return { startDate, endDate };
        }
        return { startDate, endDate: null };
      } catch (error) {
        console.warn(`Invalid date in filename: ${filename}`, error);
        continue;
      }
    }
    return null;
  }

  static createDate(day, month, year) {
    const normalizedYear = year.length === 2 ? '20' + year : year;
    
    // Create a UTC date by explicitly setting UTC components
    const date = new Date(Date.UTC(
      parseInt(normalizedYear),
      parseInt(month) - 1, // Months are 0-based in JavaScript
      parseInt(day),
      0, // Hours
      0, // Minutes
      0, // Seconds
      0  // Milliseconds
    ));

    if (isNaN(date.getTime())) {
      throw new Error('Invalid date');
    }

    return date;
  }
}