
export const createCalendarUrl = (book, reminderDate, note = '') => {
    if (!reminderDate) return null;

    const titlePrefix = book.status === 'loan' ? 'Return:' : 'Read:';
    const eventTitle = `${titlePrefix} ${book.title}`;

    // Create start/end time
    // Google Calendar link format requires YYYYMMDDTHHMMSSZ or YYYYMMDD
    // Simple date (all day)
    const date = new Date(reminderDate);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const dateStr = `${y}${m}${d}`;

    // Details
    let details = `Author: ${book.author || 'Unknown'}\n`;
    if (note) details += `Note: ${note}\n`;
    if (book.isbn) details += `ISBN: ${book.isbn}\n`;

    const params = new URLSearchParams({
        action: 'TEMPLATE',
        text: eventTitle,
        details: details,
        dates: `${dateStr}/${dateStr}` // Single day event
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
};
