# Services Audit

Total service files: 75

| File | use server | Admin Client | Server Client | .from | rpc | tables | security wrappers |
|---|---|---|---|---|---|---|---|
| src/services/admin/analytics.ts | yes | yes | no | yes | get_listings_by_status_count | profiles, listings, market_stats | none |
| src/services/admin/inventory.ts | yes | yes | no | yes | - | listings | none |
| src/services/admin/listing-moderation.ts | no | yes | no | yes | - | listings, listing_images, favorites, reports | none |
| src/services/admin/market-aggregator.ts | yes | yes | no | yes | - | listings, market_stats | none |
| src/services/admin/moderation-actions.ts | yes | yes | no | yes | - | admin_actions | none |
| src/services/admin/persistence-health.ts | yes | yes | no | no | - | - | none |
| src/services/admin/plans.ts | yes | yes | no | yes | - | pricing_plans, payments | none |
| src/services/admin/questions.ts | no | yes | no | yes | - | listing_questions | none |
| src/services/admin/reference.ts | yes | no | no | no | - | - | none |
| src/services/admin/roles.ts | yes | yes | no | yes | - | profiles, custom_roles | none |
| src/services/admin/settings-types.ts | yes | no | no | no | - | - | none |
| src/services/admin/settings.ts | yes | yes | no | yes | - | platform_settings | none |
| src/services/admin/support.ts | yes | yes | no | yes | - | tickets | none |
| src/services/admin/user-actions.ts | yes | yes | no | yes | - | profiles, admin_actions, listing_dopings | none |
| src/services/admin/user-details.ts | no | yes | no | yes | - | profiles, payments, listings, credit_transactions, doping_applications | none |
| src/services/admin/user-list.ts | yes | yes | no | yes | - | profiles | none |
| src/services/admin/users.ts | no | no | no | no | - | - | none |
| src/services/ai/ai-actions.ts | yes | no | yes | no | - | - | none |
| src/services/ai/ai-logic.ts | no | no | no | no | - | - | none |
| src/services/chat/chat-logic.ts | no | no | yes | yes | - | chats, messages | none |
| src/services/email/email-service.ts | yes | no | no | no | - | - | none |
| src/services/email/email-templates.ts | no | no | no | no | - | - | none |
| src/services/exchange/exchange-offers.ts | no | no | yes | yes | - | exchange_offers, listings | none |
| src/services/expertiz/ogs-client.ts | no | yes | no | yes | - | vehicle_history, listings | none |
| src/services/favorites/favorite-records.ts | no | no | yes | yes | - | favorites | none |
| src/services/favorites/favorites-storage.ts | no | no | no | no | - | - | none |
| src/services/gallery/index.ts | no | yes | yes | yes | - | profiles, listings, gallery_views | none |
| src/services/listings/catalog/index.ts | no | no | no | no | - | - | none |
| src/services/listings/commands/archive-listing.ts | no | no | no | no | - | - | none |
| src/services/listings/commands/create-listing.ts | no | no | no | no | - | - | none |
| src/services/listings/commands/delete-listing.ts | no | no | no | no | - | - | none |
| src/services/listings/commands/update-listing.ts | no | no | no | no | - | - | none |
| src/services/listings/constants.ts | no | no | no | no | - | - | none |
| src/services/listings/listing-card-insights.ts | no | no | no | no | - | - | none |
| src/services/listings/listing-documents.ts | no | yes | no | no | - | - | none |
| src/services/listings/listing-filters.ts | no | no | no | no | - | - | none |
| src/services/listings/listing-images.ts | no | no | no | no | - | - | none |
| src/services/listings/listing-limits.ts | no | yes | no | no | - | - | none |
| src/services/listings/listing-price-history.ts | no | yes | no | yes | - | listings, listing_price_history, market_stats | none |
| src/services/listings/listing-submission-helpers.ts | no | no | no | no | - | - | none |
| src/services/listings/listing-submission-moderation.ts | no | yes | no | yes | - | listings, profiles | none |
| src/services/listings/listing-submission-persistence.ts | no | no | yes | yes | - | listing_images, listings | none |
| src/services/listings/listing-submission-query.ts | no | yes | no | yes | - | listings, cities | none |
| src/services/listings/listing-submissions.ts | no | yes | no | yes | - | listings | none |
| src/services/listings/listing-views.ts | no | yes | no | yes | - | listing_views, listings | none |
| src/services/listings/mappers/listing-row.mapper.ts | no | no | no | no | - | - | none |
| src/services/listings/marketplace-listings.ts | no | no | no | yes | - | listings | none |
| src/services/listings/plate-lookup.ts | yes | no | yes | yes | - | brands, models | none |
| src/services/listings/pricing-engine.ts | no | no | no | no | - | - | none |
| src/services/listings/queries/get-listings.ts | no | no | yes | no | - | - | none |
| src/services/listings/questions.ts | yes | no | yes | yes | - | listing_questions | none |
| src/services/market/market-stats.ts | no | yes | no | yes | - | listings, market_stats | none |
| src/services/market/price-estimation.ts | no | yes | no | yes | - | market_stats | none |
| src/services/notifications/notification-preferences.ts | no | yes | no | yes | - | notification_preferences | none |
| src/services/notifications/notification-records.ts | no | yes | yes | yes | - | notifications | none |
| src/services/offers/offer-service.ts | no | no | yes | yes | - | offers, listings | none |
| src/services/payments/doping-logic.ts | no | no | yes | yes | - | doping_packages | none |
| src/services/payments/iyzico-client.ts | no | no | no | no | - | - | none |
| src/services/payments/payment-logic.ts | no | no | yes | yes | - | profiles, payments | none |
| src/services/profile/profile-records.ts | no | yes | yes | yes | - | profiles, admin_actions | none |
| src/services/profile/profile-restrictions.ts | no | no | no | no | - | - | none |
| src/services/profile/profile-trust.ts | no | no | no | no | - | - | none |
| src/services/profile/seller-reviews.ts | no | no | yes | yes | - | seller_reviews, profiles | none |
| src/services/reference/live-reference-data.ts | no | no | no | no | - | - | none |
| src/services/reference/reference-records.ts | no | yes | no | yes | - | brands, models, car_trims, cities, districts | none |
| src/services/reports/report-submissions.ts | no | yes | no | yes | - | reports | none |
| src/services/reservations/reservation-service.ts | no | no | yes | yes | - | reservations, listings, reservation_events | none |
| src/services/saved-searches/saved-search-records.ts | no | no | yes | yes | - | saved_searches | none |
| src/services/saved-searches/saved-search-utils.ts | no | no | no | no | - | - | none |
| src/services/support/ticket-service.ts | no | yes | yes | yes | - | tickets, profiles | none |
| src/services/system/compensating-processor.ts | no | yes | no | yes | - | compensating_actions, wallets | none |
| src/services/system/compliance-vacuum.ts | no | no | yes | yes | - | listings, profiles, user_encryption_keys | none |
| src/services/system/outbox-processor.ts | no | yes | no | yes | - | transaction_outbox | none |
| src/services/system/reconciliation-worker.ts | no | no | yes | yes | - | profiles, payments | none |
| src/services/system/saved-search-notifier.ts | no | yes | no | yes | - | saved_searches | none |
