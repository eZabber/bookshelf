
export const createCalendarUrl = (book, reminderDate, note = '') => {
    if (!reminderDate) return null;

    const titlePrefix = book.status === 'loan' ? 'Return:' : 'Read:';
    const eventTitle = `${titlePrefix} ${book.title}`;

    // Create start/end time
    // Google Calendar link format requires YYYYMMDDTHHMMSSZ or YYYYMMDD
    // All-day event requires dates=Start/End (End is exclusive, so Start+1 day)
    const startDate = new Date(reminderDate);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 1);

    const format = (d) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}${m}${day}`;
    };

    const datesStr = `${format(startDate)}/${format(endDate)}`;

    // Details
    let details = `Author: ${book.author || 'Unknown'}\n`;
    if (note) details += `Note: ${note}\n`;
    if (book.isbn) details += `ISBN: ${book.isbn}\n`;

    // Loan specific details
    if (book.status === 'loan') {
        if (book.loanType === 'borrowed') {
            details += `Borrowed From: ${book.borrowedFromName || book.borrowedFromType || 'Unknown'}\n`;
        } else if (book.loanType === 'loanedOut') {
            details += `Loaned To: ${book.loanedToName || 'Unknown'}\n`;
        }
    }

    const params = new URLSearchParams({
        action: 'TEMPLATE',
        text: eventTitle,
        details: details,
        dates: datesStr
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
};
