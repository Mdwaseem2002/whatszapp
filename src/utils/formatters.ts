/**
 * Formats an ISO timestamp into a human-readable format
 * @param isoString ISO timestamp string
 * @returns Formatted time string
 */
export function formatTimestamp(isoString: string): string {
    try {
      const date = new Date(isoString);
      
      // For today's messages, just show the time
      const today = new Date();
      const isToday = date.getDate() === today.getDate() &&
                    date.getMonth() === today.getMonth() &&
                    date.getFullYear() === today.getFullYear();
      
      if (isToday) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      
      // For yesterday's messages
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const isYesterday = date.getDate() === yesterday.getDate() &&
                         date.getMonth() === yesterday.getMonth() &&
                         date.getFullYear() === yesterday.getFullYear();
      
      if (isYesterday) {
        return 'Yesterday';
      }
      
      // For this week, show the day name
      const diffDays = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays < 7) {
        return date.toLocaleDateString([], { weekday: 'short' });
      }
      
      // For older messages, show the date
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch (e) {
      console.error('Error formatting timestamp:', e);
      return '';
    }
  }
  
  /**
   * Formats a phone number in a consistent way
   * @param phoneNumber Phone number string
   * @returns Formatted phone number
   */
  export function formatPhoneNumber(phoneNumber: string): string {
    // Remove all non-digit characters except the plus sign at the beginning
    let cleaned = phoneNumber.replace(/[^\d+]/g, '');
    
    // Make sure it starts with a plus sign
    if (!cleaned.startsWith('+')) {
      cleaned = '+' + cleaned;
    }
    
    // For US/Canada format: +1 (XXX) XXX-XXXX
    if (cleaned.startsWith('+1') && cleaned.length === 12) {
      return `+1 (${cleaned.substring(2, 5)}) ${cleaned.substring(5, 8)}-${cleaned.substring(8)}`;
    }
    
    // For other countries, just add spaces for readability
    if (cleaned.length > 6) {
      const countryCode = cleaned.substring(0, cleaned.length - 6);
      const middle = cleaned.substring(cleaned.length - 6, cleaned.length - 3);
      const end = cleaned.substring(cleaned.length - 3);
      return `${countryCode} ${middle} ${end}`;
    }
    
    return cleaned;
  }