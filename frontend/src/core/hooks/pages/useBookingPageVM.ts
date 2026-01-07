/**
 * @core-only
 * 
 * Book Repair Page View Model
 * 
 * Wraps useBookingFlow and useUIConfig to provide all data for the BookRepair skin page.
 */

'use client';

import { useBookingFlow, BookingStep } from '@/lib/booking';
import { useUIConfig, interpolate } from '@/lib/useUIConfig';

// Re-export BookingStep for use in skin
export { BookingStep } from '@/lib/booking';

// Re-export interpolate for use in skin
export { interpolate } from '@/lib/useUIConfig';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface BookingPageVM {
    // The entire booking flow hook result
    booking: ReturnType<typeof useBookingFlow>;
    // UI Config
    uiConfig: ReturnType<typeof useUIConfig>['uiConfig'];
}

export function useBookingPageVM(): BookingPageVM {
    const booking = useBookingFlow();
    const { uiConfig } = useUIConfig();

    return {
        booking,
        uiConfig,
    };
}
