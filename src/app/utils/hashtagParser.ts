import hashtagRegex from 'hashtag-regex';

// Extracts hashtags from a string (last word only, if it's a hashtag)
export function extractLastHashtag(str: string): string | null {
    const trimmed = str.trim();
    if (!trimmed) return null;

    const regex = hashtagRegex();
    const matches = trimmed.match(regex);
    
    if (matches && matches.length > 0) {
        // Get the last hashtag from the string
        const lastMatch = matches[matches.length - 1];
        // Check if this is the last word in the string
        if (trimmed.endsWith(lastMatch)) {
            return lastMatch;
        }
    }
    return null;
}

// Removes the last hashtag from the string (if present)
export function removeLastHashtag(str: string): string {
    const trimmed = str.trim();
    if (!trimmed) return str;

    const regex = hashtagRegex();
    const matches = trimmed.match(regex);
    
    if (matches && matches.length > 0) {
        const lastMatch = matches[matches.length - 1];
        if (trimmed.endsWith(lastMatch)) {
            return trimmed.substring(0, trimmed.length - lastMatch.length).trim();
        }
    }
    return str;
}