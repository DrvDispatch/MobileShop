# Project Hierarchy

## Frontend
```text
frontend
└── src
    ├── app
    │   ├── (auth)
    │   │   ├── forgot-password
    │   │   │   └── page.tsx
    │   │   ├── layout.tsx
    │   │   ├── login
    │   │   │   └── page.tsx
    │   │   ├── register
    │   │   │   └── page.tsx
    │   │   ├── reset-password
    │   │   │   └── page.tsx
    │   │   └── verify-email
    │   │       └── page.tsx
    │   ├── [slug]
    │   │   └── page.tsx
    │   ├── accessories
    │   │   └── page.tsx
    │   ├── account
    │   │   ├── afspraken
    │   │   │   └── page.tsx
    │   │   ├── orders
    │   │   │   ├── [id]
    │   │   │   └── page.tsx
    │   │   ├── page.tsx
    │   │   ├── settings
    │   │   │   └── page.tsx
    │   │   └── wishlist
    │   │       └── page.tsx
    │   ├── admin
    │   │   ├── appointments
    │   │   │   └── page.tsx
    │   │   ├── audit-logs
    │   │   │   └── page.tsx
    │   │   ├── banners
    │   │   │   └── page.tsx
    │   │   ├── devices
    │   │   │   └── page.tsx
    │   │   ├── discounts
    │   │   │   └── page.tsx
    │   │   ├── export
    │   │   │   └── page.tsx
    │   │   ├── gallery
    │   │   │   └── page.tsx
    │   │   ├── inventory
    │   │   │   └── page.tsx
    │   │   ├── invoice
    │   │   │   └── page.tsx
    │   │   ├── layout.tsx
    │   │   ├── login
    │   │   │   └── page.tsx
    │   │   ├── marketing
    │   │   │   └── page.tsx
    │   │   ├── orders
    │   │   │   ├── [id]
    │   │   │   └── page.tsx
    │   │   ├── page.tsx
    │   │   ├── products
    │   │   │   ├── [id]
    │   │   │   ├── new
    │   │   │   ├── new-ai
    │   │   │   └── page.tsx
    │   │   ├── refunds
    │   │   │   └── page.tsx
    │   │   ├── repairs
    │   │   │   └── page.tsx
    │   │   ├── settings
    │   │   │   └── page.tsx
    │   │   ├── shipping
    │   │   │   └── page.tsx
    │   │   ├── system
    │   │   │   └── logs
    │   │   ├── tickets
    │   │   │   └── page.tsx
    │   │   └── users
    │   │       └── page.tsx
    │   ├── api
    │   │   ├── [...path]
    │   │   │   └── route.ts
    │   │   └── tenant
    │   │       └── config
    │   ├── auth
    │   │   ├── callback
    │   │   │   └── page.tsx
    │   │   └── error
    │   │       └── page.tsx
    │   ├── cart
    │   │   └── page.tsx
    │   ├── checkout
    │   │   ├── page.tsx
    │   │   └── success
    │   │       └── page.tsx
    │   ├── contact
    │   │   └── page.tsx
    │   ├── globals.css
    │   ├── impersonate
    │   │   └── page.tsx
    │   ├── layout.tsx
    │   ├── over-ons
    │   │   └── page.tsx
    │   ├── page.tsx
    │   ├── phones
    │   │   ├── [slug]
    │   │   │   └── page.tsx
    │   │   └── page.tsx
    │   ├── privacy
    │   │   └── page.tsx
    │   ├── products
    │   │   └── [id]
    │   │       └── page.tsx
    │   ├── rating
    │   │   └── [token]
    │   │       └── page.tsx
    │   ├── repair
    │   │   ├── book
    │   │   │   └── page.tsx
    │   │   └── page.tsx
    │   ├── returns
    │   │   └── page.tsx
    │   ├── search
    │   │   └── page.tsx
    │   ├── support
    │   │   └── page.tsx
    │   ├── suspended
    │   │   └── page.tsx
    │   ├── terms
    │   │   └── page.tsx
    │   ├── track
    │   │   └── page.tsx
    │   └── unsubscribe
    │       └── page.tsx
    ├── components
    │   ├── FeatureAwareChatWidget.tsx
    │   ├── admin
    │   │   ├── admin-layout.tsx
    │   │   ├── appointments
    │   │   │   ├── AnalyticsDashboard.tsx
    │   │   │   ├── AppointmentCard.tsx
    │   │   │   ├── AppointmentDetailModal.tsx
    │   │   │   ├── CalendarView.tsx
    │   │   │   └── index.ts
    │   │   ├── index.ts
    │   │   ├── invoice
    │   │   │   ├── CreateInvoiceTab.tsx
    │   │   │   ├── InvoiceListTab.tsx
    │   │   │   ├── RepairPickerModal.tsx
    │   │   │   ├── SettingsTab.tsx
    │   │   │   └── index.ts
    │   │   ├── marketing
    │   │   │   ├── ConfirmationModal.tsx
    │   │   │   ├── EmailForm.tsx
    │   │   │   ├── FeaturedProducts.tsx
    │   │   │   ├── LivePreview.tsx
    │   │   │   ├── PreviewModal.tsx
    │   │   │   ├── ProductPickerModal.tsx
    │   │   │   ├── SegmentSelector.tsx
    │   │   │   ├── TemplatesModal.tsx
    │   │   │   ├── UserPreviewModal.tsx
    │   │   │   └── index.ts
    │   │   ├── orders
    │   │   │   ├── OrderItemsList.tsx
    │   │   │   ├── OrderStatusBanner.tsx
    │   │   │   ├── OrderTimeline.tsx
    │   │   │   ├── RefundModal.tsx
    │   │   │   └── index.ts
    │   │   └── users
    │   │       ├── ResetPasswordModal.tsx
    │   │       ├── UserDetailModal.tsx
    │   │       └── index.ts
    │   ├── auth
    │   │   ├── forgot-password-form.tsx
    │   │   ├── google-button.tsx
    │   │   ├── index.ts
    │   │   ├── login-form.tsx
    │   │   ├── register-form.tsx
    │   │   └── reset-password-form.tsx
    │   ├── chat-widget.tsx
    │   ├── cms
    │   │   ├── CmsPage.tsx
    │   │   ├── TipTapRenderer.tsx
    │   │   └── index.ts
    │   ├── landing
    │   │   ├── categories.tsx
    │   │   ├── footer.tsx
    │   │   ├── hero.tsx
    │   │   ├── index.ts
    │   │   ├── navbar.tsx
    │   │   ├── promotional-banner.tsx
    │   │   └── repairs-section.tsx
    │   ├── product-reviews.tsx
    │   ├── related-products.tsx
    │   ├── stock-notification-form.tsx
    │   ├── storefront
    │   │   ├── cart-drawer.tsx
    │   │   ├── category-tabs.tsx
    │   │   ├── featured-products.tsx
    │   │   ├── filter-sidebar.tsx
    │   │   ├── index.ts
    │   │   ├── product-card.tsx
    │   │   └── product-grid.tsx
    │   ├── ui
    │   │   ├── badge.tsx
    │   │   ├── button.tsx
    │   │   ├── card.tsx
    │   │   ├── dialog.tsx
    │   │   ├── index.ts
    │   │   ├── input.tsx
    │   │   ├── label.tsx
    │   │   ├── select.tsx
    │   │   ├── separator.tsx
    │   │   ├── smart-image.tsx
    │   │   └── table.tsx
    │   └── wishlist-button.tsx
    ├── contexts
    │   └── FeatureContext.tsx
    └── lib
        ├── TenantAnalytics.tsx
        ├── TenantProvider.tsx
        ├── account
        │   ├── index.ts
        │   └── useAccountData.ts
        ├── admin
        │   ├── adminApi.ts
        │   ├── appointments
        │   │   ├── index.ts
        │   │   └── useAppointmentsAdmin.ts
        │   ├── audit-logs
        │   │   ├── index.ts
        │   │   └── useAuditLogs.ts
        │   ├── banners
        │   │   ├── index.ts
        │   │   └── useBanners.ts
        │   ├── dashboard
        │   │   ├── index.ts
        │   │   └── useDashboard.ts
        │   ├── devices
        │   │   ├── index.ts
        │   │   └── useDevices.ts
        │   ├── discounts
        │   │   ├── index.ts
        │   │   └── useDiscounts.ts
        │   ├── export
        │   │   ├── index.ts
        │   │   └── useExport.ts
        │   ├── gallery
        │   │   ├── index.ts
        │   │   └── useGallery.ts
        │   ├── index.ts
        │   ├── inventory
        │   │   ├── index.ts
        │   │   └── useInventory.ts
        │   ├── invoice
        │   │   ├── index.ts
        │   │   ├── types.ts
        │   │   ├── useInvoice.ts
        │   │   ├── useInvoiceCreate.ts
        │   │   ├── useInvoiceList.ts
        │   │   ├── useInvoiceSettings.ts
        │   │   └── useRepairPicker.ts
        │   ├── marketing
        │   │   ├── index.ts
        │   │   ├── types.ts
        │   │   └── useMarketing.ts
        │   ├── orders
        │   │   ├── configs.ts
        │   │   ├── index.ts
        │   │   ├── types.ts
        │   │   ├── useOrderDetail.ts
        │   │   └── useOrders.ts
        │   ├── products
        │   │   ├── index.ts
        │   │   ├── types.ts
        │   │   ├── useProductAI.ts
        │   │   ├── useProductCreate.ts
        │   │   ├── useProductEdit.ts
        │   │   └── useProducts.ts
        │   ├── refunds
        │   │   ├── index.ts
        │   │   └── useRefunds.ts
        │   ├── repairs
        │   │   ├── index.ts
        │   │   ├── useRepairs.ts
        │   │   └── useRepairsCatalog.ts
        │   ├── settings
        │   │   ├── index.ts
        │   │   ├── useSettings.ts
        │   │   └── useSettingsForm.ts
        │   ├── shipping
        │   │   ├── index.ts
        │   │   └── useShipping.ts
        │   ├── statusConfigs.ts
        │   ├── tickets
        │   │   ├── index.ts
        │   │   ├── useTickets.ts
        │   │   └── useTicketsAdmin.ts
        │   ├── useAdmin.ts
        │   ├── useAdminCRUD.ts
        │   ├── useAdminDataFetching.ts
        │   ├── useAdminPagination.ts
        │   ├── useAdminSearch.ts
        │   ├── useAdminTable.ts
        │   └── users
        │       ├── index.ts
        │       └── useUsers.ts
        ├── api.ts
        ├── auth
        │   ├── index.ts
        │   └── useAuth.ts
        ├── booking
        │   ├── bookingApi.ts
        │   ├── index.ts
        │   └── useBookingFlow.ts
        ├── chat
        │   ├── index.ts
        │   ├── types.ts
        │   └── useChatWidget.ts
        ├── checkout
        │   ├── checkoutApi.ts
        │   ├── index.ts
        │   └── useCheckout.ts
        ├── image-utils.ts
        ├── products
        │   ├── index.ts
        │   └── useProductList.ts
        ├── reviews
        │   ├── index.ts
        │   └── useProductReviews.ts
        ├── store
        │   ├── cart.ts
        │   ├── index.ts
        │   └── settings.ts
        ├── tenant-types.ts
        ├── ui-config-types.ts
        ├── useUIConfig.ts
        └── utils.ts
```

## Backend
```text
backend
├── app
├── prisma
│   ├── check-tenants.ts
│   ├── cleanup-demo-data.ts
│   ├── create-test-tenant.ts
│   ├── export-master-data.ts
│   ├── fix-owner-user.ts
│   ├── import-master-data.ts
│   ├── schema.prisma
│   ├── seed-default-tenant.ts
│   ├── seed.ts
│   ├── test-ticket-isolation.ts
│   ├── update-brand-logos.js
│   ├── update-brand-logos.ts
│   ├── upload-all-assets.js
│   └── upload-brand-logos.js
├── prisma.config.ts
├── scripts
│   ├── bulk-import-devices.ts
│   ├── check-stripe-session.ts
│   ├── cleanup-products.ts
│   ├── clear-products.ts
│   ├── clear-repair-data.ts
│   ├── clear-repairs.ts
│   ├── copy-brand-logos.ts
│   ├── debug-orders.ts
│   ├── delete-admins.ts
│   ├── delete-extra-users.ts
│   ├── delete-legacy-admin.ts
│   ├── delete-products-without-images.ts
│   ├── delete-users.ts
│   ├── fix-orders.ts
│   ├── import-devices-json.ts
│   ├── import-devices.ts
│   ├── import-direct.ts
│   ├── import-tablets.ts
│   ├── migrate-image-urls.ts
│   ├── regenerate-descriptions.ts
│   ├── test-order-update.ts
│   ├── update-banners.ts
│   ├── update-brand-logos.ts
│   ├── upload-assets-to-minio.ts
│   ├── upload-assets.js
│   ├── upload-assets.ts
│   └── view-orders.ts
├── src
│   ├── app.controller.spec.ts
│   ├── app.controller.ts
│   ├── app.module.ts
│   ├── app.service.ts
│   ├── common
│   │   ├── decorators
│   │   │   ├── admin-user.decorator.ts
│   │   │   ├── index.ts
│   │   │   ├── public.decorator.ts
│   │   │   └── tenant.decorator.ts
│   │   ├── dto
│   │   │   ├── api-response.dto.ts
│   │   │   ├── index.ts
│   │   │   └── pagination.dto.ts
│   │   ├── filters
│   │   │   ├── all-exceptions.filter.ts
│   │   │   ├── http-exception.filter.ts
│   │   │   ├── index.ts
│   │   │   └── prisma-exception.filter.ts
│   │   ├── index.ts
│   │   ├── interceptors
│   │   │   ├── index.ts
│   │   │   ├── response-transform.interceptor.ts
│   │   │   └── timing.interceptor.ts
│   │   └── pipes
│   │       ├── index.ts
│   │       └── validation.pipe.ts
│   ├── main.ts
│   ├── modules
│   │   ├── analytics
│   │   │   ├── analytics.controller.ts
│   │   │   ├── analytics.module.ts
│   │   │   └── analytics.service.ts
│   │   ├── appointments
│   │   │   ├── appointment-email.service.ts
│   │   │   ├── appointments.controller.ts
│   │   │   ├── appointments.module.ts
│   │   │   ├── appointments.service.ts
│   │   │   ├── dto
│   │   │   │   └── index.ts
│   │   │   └── index.ts
│   │   ├── audit-logs
│   │   │   ├── audit-log.controller.ts
│   │   │   ├── audit-log.module.ts
│   │   │   └── audit-log.service.ts
│   │   ├── auth
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── decorators
│   │   │   │   ├── current-user.decorator.ts
│   │   │   │   ├── index.ts
│   │   │   │   └── roles.decorator.ts
│   │   │   ├── dto
│   │   │   │   ├── auth.dto.ts
│   │   │   │   └── index.ts
│   │   │   ├── guards
│   │   │   │   ├── feature.guard.ts
│   │   │   │   ├── google-auth.guard.ts
│   │   │   │   ├── index.ts
│   │   │   │   ├── jwt-auth.guard.ts
│   │   │   │   └── roles.guard.ts
│   │   │   ├── index.ts
│   │   │   ├── services
│   │   │   │   └── google-oauth.service.ts
│   │   │   └── strategies
│   │   │       ├── google.strategy.ts
│   │   │       ├── index.ts
│   │   │       └── jwt.strategy.ts
│   │   ├── banners
│   │   │   ├── banners.controller.ts
│   │   │   ├── banners.module.ts
│   │   │   ├── banners.service.ts
│   │   │   ├── dto
│   │   │   │   └── index.ts
│   │   │   └── index.ts
│   │   ├── categories
│   │   │   ├── categories.controller.ts
│   │   │   ├── categories.module.ts
│   │   │   ├── categories.service.ts
│   │   │   └── index.ts
│   │   ├── cloudflare
│   │   │   ├── cloudflare.module.ts
│   │   │   ├── cloudflare.service.ts
│   │   │   └── index.ts
│   │   ├── discounts
│   │   │   ├── discounts.controller.ts
│   │   │   ├── discounts.module.ts
│   │   │   ├── discounts.service.ts
│   │   │   ├── dto
│   │   │   │   └── index.ts
│   │   │   └── index.ts
│   │   ├── email
│   │   │   ├── email.module.ts
│   │   │   ├── email.service.ts
│   │   │   └── index.ts
│   │   ├── export
│   │   │   ├── export-tax.service.ts
│   │   │   ├── export.controller.ts
│   │   │   ├── export.module.ts
│   │   │   └── export.service.ts
│   │   ├── feedback
│   │   │   ├── dto
│   │   │   │   └── index.ts
│   │   │   ├── feedback.controller.ts
│   │   │   ├── feedback.module.ts
│   │   │   └── feedback.service.ts
│   │   ├── gemini
│   │   │   ├── gemini.controller.ts
│   │   │   ├── gemini.module.ts
│   │   │   ├── gemini.service.ts
│   │   │   └── index.ts
│   │   ├── inventory
│   │   │   ├── inventory.controller.ts
│   │   │   ├── inventory.module.ts
│   │   │   └── inventory.service.ts
│   │   ├── invoice
│   │   │   ├── dto
│   │   │   │   ├── index.ts
│   │   │   │   └── invoice.dto.ts
│   │   │   ├── index.ts
│   │   │   ├── invoice-crud.service.ts
│   │   │   ├── invoice-pdf.service.ts
│   │   │   ├── invoice-settings.service.ts
│   │   │   ├── invoice.controller.ts
│   │   │   ├── invoice.module.ts
│   │   │   └── invoice.service.ts
│   │   ├── marketing
│   │   │   ├── dto
│   │   │   │   └── index.ts
│   │   │   ├── marketing.controller.ts
│   │   │   ├── marketing.module.ts
│   │   │   └── marketing.service.ts
│   │   ├── orders
│   │   │   ├── dto
│   │   │   │   ├── index.ts
│   │   │   │   └── orders.dto.ts
│   │   │   ├── index.ts
│   │   │   ├── order-checkout.service.ts
│   │   │   ├── order-fulfillment.service.ts
│   │   │   ├── order-webhook.service.ts
│   │   │   ├── orders.controller.ts
│   │   │   ├── orders.module.ts
│   │   │   └── orders.service.ts
│   │   ├── owner
│   │   │   ├── dto
│   │   │   │   └── user.dto.ts
│   │   │   ├── guards
│   │   │   │   ├── index.ts
│   │   │   │   └── owner.guard.ts
│   │   │   ├── index.ts
│   │   │   ├── owner.controller.ts
│   │   │   ├── owner.module.ts
│   │   │   ├── owner.service.ts
│   │   │   ├── product-seeder.service.ts
│   │   │   ├── tenant-features.service.ts
│   │   │   └── tenant-seeder.service.ts
│   │   ├── pages
│   │   │   ├── index.ts
│   │   │   ├── owner-pages.controller.ts
│   │   │   ├── pages.controller.ts
│   │   │   ├── pages.module.ts
│   │   │   └── pages.service.ts
│   │   ├── products
│   │   │   ├── dto
│   │   │   │   ├── index.ts
│   │   │   │   └── products.dto.ts
│   │   │   ├── index.ts
│   │   │   ├── product-import.service.ts
│   │   │   ├── products.controller.ts
│   │   │   ├── products.module.ts
│   │   │   └── products.service.ts
│   │   ├── refunds
│   │   │   ├── dto
│   │   │   │   └── index.ts
│   │   │   ├── refunds.controller.ts
│   │   │   ├── refunds.module.ts
│   │   │   └── refunds.service.ts
│   │   ├── repairs
│   │   │   ├── dto
│   │   │   │   ├── index.ts
│   │   │   │   └── repairs.dto.ts
│   │   │   ├── repairs.controller.ts
│   │   │   ├── repairs.module.ts
│   │   │   └── repairs.service.ts
│   │   ├── reviews
│   │   │   ├── google-reviews.service.ts
│   │   │   ├── reviews.controller.ts
│   │   │   ├── reviews.module.ts
│   │   │   └── reviews.service.ts
│   │   ├── settings
│   │   │   ├── dto
│   │   │   │   ├── index.ts
│   │   │   │   └── settings.dto.ts
│   │   │   ├── index.ts
│   │   │   ├── settings.controller.ts
│   │   │   ├── settings.module.ts
│   │   │   └── settings.service.ts
│   │   ├── shipping
│   │   │   ├── shipping.controller.ts
│   │   │   ├── shipping.module.ts
│   │   │   └── shipping.service.ts
│   │   ├── sms
│   │   │   ├── index.ts
│   │   │   ├── sms.module.ts
│   │   │   └── sms.service.ts
│   │   ├── stock-notifications
│   │   │   ├── stock-notifications.controller.ts
│   │   │   ├── stock-notifications.module.ts
│   │   │   └── stock-notifications.service.ts
│   │   ├── supported-devices
│   │   │   ├── dto.ts
│   │   │   ├── supported-devices.controller.ts
│   │   │   ├── supported-devices.module.ts
│   │   │   └── supported-devices.service.ts
│   │   ├── tenant
│   │   │   ├── index.ts
│   │   │   ├── tenant.controller.ts
│   │   │   ├── tenant.decorator.ts
│   │   │   ├── tenant.middleware.ts
│   │   │   ├── tenant.module.ts
│   │   │   ├── tenant.service.ts
│   │   │   └── ui-config.service.ts
│   │   ├── tickets
│   │   │   ├── dto
│   │   │   │   └── index.ts
│   │   │   ├── index.ts
│   │   │   ├── ticket-email.service.ts
│   │   │   ├── tickets.controller.ts
│   │   │   ├── tickets.gateway.ts
│   │   │   ├── tickets.module.ts
│   │   │   └── tickets.service.ts
│   │   ├── upload
│   │   │   ├── index.ts
│   │   │   ├── upload.controller.ts
│   │   │   ├── upload.module.ts
│   │   │   └── upload.service.ts
│   │   ├── users
│   │   │   ├── dto
│   │   │   │   └── index.ts
│   │   │   ├── users.controller.ts
│   │   │   ├── users.module.ts
│   │   │   └── users.service.ts
│   │   └── wishlist
│   │       ├── wishlist.controller.ts
│   │       ├── wishlist.module.ts
│   │       └── wishlist.service.ts
│   ├── prisma
│   │   ├── index.ts
│   │   ├── prisma.module.ts
│   │   └── prisma.service.ts
│   └── utils
│       ├── image-url.ts
│       ├── index.ts
│       └── tenant-branding.ts
└── test
    └── app.e2e-spec.ts
```

## Owner-app
```text
owner-app
└── src
    ├── app
    │   ├── globals.css
    │   ├── layout.tsx
    │   ├── login
    │   │   └── page.tsx
    │   ├── page.tsx
    │   └── tenants
    │       ├── [tenantId]
    │       │   ├── audit
    │       │   ├── client-layout.tsx
    │       │   ├── cms
    │       │   ├── config
    │       │   ├── domains
    │       │   ├── features
    │       │   ├── layout.tsx
    │       │   ├── page.tsx
    │       │   ├── tenant-context.tsx
    │       │   └── users
    │       └── page.tsx
    ├── components
    │   ├── DashboardLayout.tsx
    │   ├── TipTapEditor.tsx
    │   └── ui
    │       ├── Button.tsx
    │       ├── Card.tsx
    │       └── StatusBadge.tsx
    ├── lib
    │   ├── api-client.ts
    │   └── owner-api.ts
    ├── middleware.ts
    └── types
        └── index.ts
```

