function wrapIcon(name, svgMarkup) {
    return `<span class="diqt-dict-icon diqt-dict-icon--${name}" aria-hidden="true">${svgMarkup}</span>`;
}

export class Icon {
    static close() {
        return wrapIcon('close', `
            <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
                <path d="M4.5 4.5L11.5 11.5" />
                <path d="M11.5 4.5L4.5 11.5" />
            </svg>
        `);
    }

    static volume() {
        return wrapIcon('volume', `
            <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 4.5L4 6.5H2.5V9.5H4L6 11.5V4.5Z" />
                <path d="M8.75 6.25C9.42 6.92 9.42 8.08 8.75 8.75" />
                <path d="M10.5 5C11.84 6.34 11.84 8.66 10.5 10" />
            </svg>
        `);
    }

    static user() {
        return wrapIcon('user', `
            <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 8C9.38 8 10.5 6.88 10.5 5.5C10.5 4.12 9.38 3 8 3C6.62 3 5.5 4.12 5.5 5.5C5.5 6.88 6.62 8 8 8Z" />
                <path d="M3.5 12.5C4.37 10.99 6.02 10 8 10C9.98 10 11.63 10.99 12.5 12.5" />
            </svg>
        `);
    }

    static edit() {
        return wrapIcon('edit', `
            <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 13L5.9 12.35L11.9 6.35L9.65 4.1L3.65 10.1L3 13Z" />
                <path d="M8.9 4.85L11.15 7.1" />
            </svg>
        `);
    }

    static externalLink() {
        return wrapIcon('external-link', `
            <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 3H13V7" />
                <path d="M7 9L13 3" />
                <path d="M11.5 9.5V12.5H3.5V4.5H6.5" />
            </svg>
        `);
    }

    static questionCircle() {
        return wrapIcon('question-circle', `
            <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 13C10.76 13 13 10.76 13 8C13 5.24 10.76 3 8 3C5.24 3 3 5.24 3 8C3 10.76 5.24 13 8 13Z" />
                <path d="M6.9 6.4C6.9 5.79 7.43 5.3 8.08 5.3C8.73 5.3 9.25 5.77 9.25 6.35C9.25 7.39 8 7.53 8 8.55" />
                <path d="M8 10.85H8.01" />
            </svg>
        `);
    }

    static alarmClock() {
        return wrapIcon('alarm-clock', `
            <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
                <path d="M4.5 4.5L3.5 3.5" />
                <path d="M11.5 4.5L12.5 3.5" />
                <path d="M8 13C10.21 13 12 11.21 12 9C12 6.79 10.21 5 8 5C5.79 5 4 6.79 4 9C4 11.21 5.79 13 8 13Z" />
                <path d="M8 7.25V9.25L9.25 10" />
                <path d="M5.5 13.5L4.75 12.75" />
                <path d="M10.5 13.5L11.25 12.75" />
            </svg>
        `);
    }

    static trash() {
        return wrapIcon('trash', `
            <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
                <path d="M3.5 4H12.5" />
                <path d="M6.5 4V3H9.5V4" />
                <path d="M4.5 4L5 13H11L11.5 4" />
                <path d="M6.5 6.5V11" />
                <path d="M8 6.5V11" />
                <path d="M9.5 6.5V11" />
            </svg>
        `);
    }
}
