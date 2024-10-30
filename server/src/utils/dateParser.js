export class DateParser {
  static parseFileName(filename) {
    const patterns = [
      /(\d{1,2})[-._](\d{1,2})[-._](\d{2,4})(?:T(\d+))?/,
      /(\d{1,2})[-._](\d{1,2})[-._](\d{2,4})(?:T(\d{1,2})[-._](\d{1,2})[-._](\d{2,4}))?(?:T(\d+))?/
    ];

    for (const pattern of patterns) {
      const match = filename.match(pattern);
      if (!match) continue;

      try {
        const startDate = DateParser.createDate(match[1], match[2], match[3]);
        const duration = match[match.length - 1] ? parseInt(match[match.length - 1], 10) : null; // Last group is the duration if present

        if (match.length > 5 && match[4] && match[5] && match[6]) {
          const endDate = DateParser.createDate(match[4], match[5], match[6]);
          return { startDate, endDate, duration };
        }
        return { startDate, endDate: null, duration };
      } catch (error) {
        console.warn(`Invalid date in filename: ${filename}`, error);
        continue;
      }
    }
    return null;
  }

  static createDate(day, month, year) {
    const normalizedYear = year.length === 2 ? '20' + year : year;
    const date = new Date(
      parseInt(normalizedYear),
      parseInt(month) - 1,
      parseInt(day)
    );

    if (isNaN(date.getTime())) {
      throw new Error('Invalid date');
    }

    return date;
  }
}