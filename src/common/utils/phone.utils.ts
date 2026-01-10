/**
 * Normalizes a phone number by removing the leading zero if it exists.
 * @param phoneNumber The phone number to normalize.
 * @returns The normalized phone number.
 */
export function normalizePhoneNumber<T extends string | undefined | null>(phoneNumber: T): T {
    if (!phoneNumber || typeof phoneNumber !== 'string') return phoneNumber;

    // Trim white space
    let cleaned = phoneNumber.trim();

    // If phone number starts with '0', remove only the first '0'
    if (cleaned.startsWith('0')) {
        cleaned = cleaned.substring(1);
    }

    return cleaned as T;
}
