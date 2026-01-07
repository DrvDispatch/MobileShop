/**
 * Marketing Admin Module - Public API
 */

export {
    useMarketing,
    EMAIL_TEMPLATES,
    SEGMENT_ICONS,
    getSegmentIconName,
} from './useMarketing';

export type {
    MarketingSegment,
    MarketingProduct,
    EmailTemplate,
    MarketingUser,
    SendResult,
    UseMarketingReturn,
} from './useMarketing';
