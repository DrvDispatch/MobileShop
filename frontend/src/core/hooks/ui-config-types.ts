// UI Configuration Types
// Matches the structure returned by GET /api/tenant/ui-config

// ============================================
// Marquee Configuration
// ============================================

export type MarqueeIcon = 'location' | 'star' | 'wrench' | 'clock' | 'shield' | 'package';

export interface MarqueeItem {
    icon: MarqueeIcon;
    text: string;
}

// ============================================
// Label Types
// ============================================

export interface CheckoutLabels {
    couponCode: string;
    couponPlaceholder: string;
    apply: string;
    discount: string;
    confirmationNote: string;
}

export interface BookingStepTitles {
    deviceType: string;
    brand: string;
    device: string;
    repair: string;
    datetime: string;
    contact: string;
}

export interface BookingSuccessLabels {
    title: string;
    thanks: string;
    confirmationText: string;
    deviceLabel: string;
    repairLabel: string;
    priceLabel: string;
    priceOnRequest: string;
    dateLabel: string;
    timeLabel: string;
    backToHome: string;
}

export interface BookingNavigationLabels {
    previous: string;
    next: string;
    confirm: string;
}

export interface BookingFormLabels {
    nameLabel: string;
    namePlaceholder: string;
    emailLabel: string;
    emailPlaceholder: string;
    phoneLabel: string;
    phonePlaceholder: string;
    notesLabel: string;
    notesPlaceholder: string;
}

export interface BookingEmptyStates {
    noBrands: string;
    noDevices: string;
    noDevicesSearch: string;
    noRepairs: string;
}

export interface BookingDatetimeLabels {
    selectDate: string;
    selectTime: string;
}

export interface BookingRepairSectionLabels {
    repairTitle: string;
    selectDamage: string;
    onRequest: string;
}

export interface BookingSearchLabels {
    placeholder: string;
}

export interface BookingLabels {
    stepTitles: BookingStepTitles;
    success: BookingSuccessLabels;
    navigation: BookingNavigationLabels;
    form: BookingFormLabels;
    emptyStates: BookingEmptyStates;
    datetime: BookingDatetimeLabels;
    repairSection: BookingRepairSectionLabels;
    search: BookingSearchLabels;
}

export interface ReviewLabels {
    title: string;
    reviewSingular: string;
    reviewPlural: string;
    noReviews: string;
    beFirst: string;
    yourRating: string;
    name: string;
    email: string;
    reviewTitle: string;
    reviewBody: string;
    thankYou: string;
    submit: string;
    showAll: string;
}

export interface NavLabels {
    devices: string;
    accessories: string;
    repairs: string;
    about: string;
    contact: string;
}

export interface AuthLabels {
    myAccount: string;
    logout: string;
    login: string;
    register: string;
}

export interface FooterLabels {
    services: string;
    legal: string;
    terms: string;
    privacy: string;
    returns: string;
    emailPlaceholder: string;
    subscribeButton: string;
}

export interface LoadingLabels {
    loading: string;
    configError: string;
    retry: string;
}

export interface UILabels {
    checkout: CheckoutLabels;
    booking: BookingLabels;
    reviews: ReviewLabels;
    nav: NavLabels;
    auth: AuthLabels;
    footer: FooterLabels;
    loading: LoadingLabels;
}

// ============================================
// Footer Configuration
// ============================================

export interface FooterConfig {
    tagline: string;
    newsletterTitle: string;
    newsletterSubtitle: string;
    googleReviewUrl: string | null;
    googleReviewRating: string | null;
}

// ============================================
// Formatting Configuration
// ============================================

export interface FormattingConfig {
    dateLocale: string;
    dateFormat: string;
}

// ============================================
// Main UI Config Interface
// ============================================

export type TenantVertical = 'REPAIR_SHOP' | 'BARBER' | 'CAR_WASH' | 'BIKE_REPAIR' | 'GENERAL_SERVICE';

export interface UIConfig {
    vertical: TenantVertical;
    marquee: MarqueeItem[];
    footer: FooterConfig;
    formatting: FormattingConfig;
    labels: UILabels;
}
