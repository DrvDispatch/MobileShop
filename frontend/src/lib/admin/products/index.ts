/**
 * Products Admin Module - Public API
 */

// Product listing hook
export {
    useProducts,
} from './useProducts';

export type {
    Product,
    ProductCategory,
    UseProductsReturn,
} from './useProducts';

// Product creation hook (manual)
export {
    useProductCreate,
    BRANDS,
    STORAGE_OPTIONS,
    CONDITION_OPTIONS,
    DEVICE_GRADES,
    generateSlug,
    sortAssets,
    extractAssetInfo,
} from './useProductCreate';

export type {
    Condition,
    DeviceGrade,
    ProductType,
    ImageAnalysis,
    ProductContent,
    Asset,
    UseProductCreateReturn,
} from './useProductCreate';

// Product AI creation hook
export {
    useProductAI,
    PRODUCT_TYPES,
    CONDITIONS,
    PLACEHOLDER_IMAGE,
} from './useProductAI';

export type {
    WizardStep,
    UseProductAIReturn,
    ProductType as AIProductType,
    Condition as AICondition,
    DeviceGrade as AIDeviceGrade,
} from './useProductAI';

// Product edit hook
export {
    useProductEdit,
    STORAGE_OPTIONS as EDIT_STORAGE_OPTIONS,
    COLOR_OPTIONS,
    GRADE_OPTIONS,
} from './useProductEdit';

export type {
    Condition as EditCondition,
    DeviceGrade as EditDeviceGrade,
    ExistingImage,
    NewImage,
    ProductFormData,
    UseProductEditReturn,
} from './useProductEdit';
