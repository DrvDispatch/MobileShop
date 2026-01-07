/**
 * Barbershop Skin - Configuration
 * 
 * Minimal appointment-focused skin for service businesses like barbershops,
 * salons, and other appointment-based services.
 */

export const BarbershopSkinConfig = {
    name: 'barbershop',
    displayName: 'Barbershop',
    description: 'Minimal appointment-focused layout for service businesses',
    version: '1.0.0',
    features: {
        // This skin is optimized for appointments, not e-commerce
        primaryFocus: 'appointments',
        showProducts: false,
        showFooter: false, // Minimal footer only
        singlePageBooking: true,
    },
};
