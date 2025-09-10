export interface DateConversionResult {
    success: boolean;
    originalText: string;
    convertedDate?: string;
    formats?: string[];
    error?: string;
}

export function convertToReadableDate(text: string): DateConversionResult {
    const trimmedText = text.trim();
    
    if (!trimmedText) {
        return {
            success: false,
            originalText: text,
            error: "No text provided"
        };
    }

    const formats: string[] = [];
    let parsedDate: Date | null = null;

    // Try various date parsing strategies
    const parseStrategies = [
        // Unix timestamp (seconds)
        () => {
            const num = parseInt(trimmedText);
            if (!isNaN(num) && num > 946684800 && num < 4102444800) { // Between 2000-2100
                const date = new Date(num * 1000);
                if (!isNaN(date.getTime())) {
                    formats.push("Unix timestamp (seconds)");
                    return date;
                }
            }
            return null;
        },
        
        // Unix timestamp (milliseconds)
        () => {
            const num = parseInt(trimmedText);
            if (!isNaN(num) && num > 946684800000 && num < 4102444800000) { // Between 2000-2100
                const date = new Date(num);
                if (!isNaN(date.getTime())) {
                    formats.push("Unix timestamp (milliseconds)");
                    return date;
                }
            }
            return null;
        },

        // ISO 8601 formats
        () => {
            const date = new Date(trimmedText);
            if (!isNaN(date.getTime())) {
                formats.push("ISO 8601 format");
                return date;
            }
            return null;
        },

        // Common date formats with regex
        () => {
            const datePatterns = [
                // YYYY-MM-DD
                /^(\d{4})-(\d{1,2})-(\d{1,2})$/,
                // MM/DD/YYYY or DD/MM/YYYY
                /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
                // DD-MM-YYYY
                /^(\d{1,2})-(\d{1,2})-(\d{4})$/,
                // YYYY/MM/DD
                /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/,
            ];

            for (const pattern of datePatterns) {
                const match = trimmedText.match(pattern);
                if (match) {
                    const date = new Date(trimmedText);
                    if (!isNaN(date.getTime())) {
                        formats.push("Standard date format");
                        return date;
                    }
                }
            }
            return null;
        },

        // Relative time parsing (basic)
        () => {
            const relativePatterns = [
                { pattern: /(\d+)\s*days?\s*ago/i, multiplier: -24 * 60 * 60 * 1000 },
                { pattern: /(\d+)\s*hours?\s*ago/i, multiplier: -60 * 60 * 1000 },
                { pattern: /(\d+)\s*minutes?\s*ago/i, multiplier: -60 * 1000 },
                { pattern: /(\d+)\s*seconds?\s*ago/i, multiplier: -1000 },
            ];

            for (const { pattern, multiplier } of relativePatterns) {
                const match = trimmedText.match(pattern);
                if (match) {
                    const amount = parseInt(match[1]);
                    const date = new Date(Date.now() + amount * multiplier);
                    formats.push("Relative time format");
                    return date;
                }
            }
            return null;
        }
    ];

    // Try each parsing strategy
    for (const strategy of parseStrategies) {
        try {
            parsedDate = strategy();
            if (parsedDate) break;
        } catch (error) {
            // Continue to next strategy
        }
    }

    if (!parsedDate) {
        return {
            success: false,
            originalText: text,
            error: "Could not parse as a valid date"
        };
    }

    // Format the date in multiple readable formats
    const readableFormats = [
        parsedDate.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        }),
        parsedDate.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }),
        parsedDate.toISOString(),
        `${parsedDate.getTime()} (Unix timestamp ms)`,
        `${Math.floor(parsedDate.getTime() / 1000)} (Unix timestamp s)`
    ];

    return {
        success: true,
        originalText: text,
        convertedDate: readableFormats[0], // Primary readable format
        formats: readableFormats
    };
}
