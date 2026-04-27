# Implementation Tasks: Legacy Service Patterns Migration

**Feature**: `legacy-service-patterns-migration`  
**Type**: Bugfix (Refactoring)  
**Timeline**: 3 weeks

---

## Week 1: HIGH Priority Services

### Task 1: Migrate PaymentService (Days 1-2)

- [ ] 1.1 Analyze PaymentService implementation
  - Read `src/services/payments/payment-logic.ts`
  - Document all methods and dependencies
  - Identify all call sites

- [ ] 1.2 Write preservation tests
  - Create `src/services/payments/__tests__/payment-preservation.test.ts`
  - Test initializeCheckoutForm with valid params
  - Test retrieveCheckoutResult with valid token
  - Test error handling
  - Run tests on UNFIXED code (must PASS)

- [ ] 1.3 Create server actions file
  - Create `src/app/api/payments/actions.ts`
  - Add `"use server"` directive
  - Implement initializeCheckoutFormAction
  - Implement retrieveCheckoutResultAction

- [ ] 1.4 Extract business logic to pure functions
  - Convert PaymentService class methods to pure functions
  - Rename methods: initializeCheckoutForm → initializePaymentCheckout
  - Rename methods: retrieveCheckoutResult → retrievePaymentResult
  - Keep in `payment-logic.ts`

- [ ] 1.5 Update all imports and call sites
  - Update `src/app/api/payments/initialize/route.ts`
  - Update `src/domain/usecases/payment-initiate.ts`
  - Search for any other PaymentService imports

- [ ] 1.6 Verify preservation tests pass
  - Run `npm run test:unit -- payment-preservation.test.ts`
  - Run `npm run typecheck`
  - Run `npm run build`

- [ ] 1.7 Manual testing
  - Test payment initialization flow
  - Test payment completion flow
  - Verify Iyzico integration works

- [ ] 1.8 Commit changes
  - Git commit: "refactor: migrate PaymentService to server actions"

---

### Task 2: Migrate DopingService (Days 3-4)

- [x] 2.1 Analyze DopingService implementation
  - Read `src/services/payments/doping-logic.ts`
  - Document all methods and dependencies
  - Identify all call sites

- [x] 2.2 Write preservation tests
  - Create `src/services/payments/__tests__/doping-preservation.test.ts`
  - Test applyDoping with valid params
  - Test getActiveDopings
  - Run tests on UNFIXED code (must PASS)

- [x] 2.3 Create server actions file
  - Create `src/app/api/dopings/actions.ts`
  - Add `"use server"` directive
  - Implement applyDopingAction
  - Implement getActiveDopingsAction

- [x] 2.4 Extract business logic to pure functions
  - Convert DopingService class methods to pure functions
  - Rename methods: applyDoping → applyDopingPackage
  - Rename methods: getActiveDopings → getActiveDopingsForListing
  - Keep in `doping-logic.ts`

- [x] 2.5 Update all imports and call sites
  - Update `src/app/api/payments/callback/route.ts`
  - Search for any other DopingService imports

- [x] 2.6 Verify preservation tests pass
  - Run `npm run test:unit -- doping-preservation.test.ts`
  - Run `npm run typecheck`
  - Run `npm run build`

- [x] 2.7 Manual testing
  - Test doping activation after payment
  - Verify listing visibility changes
  - Check expiration logic

- [x] 2.8 Commit changes
  - Git commit: "refactor: migrate DopingService to server actions"

---

### Task 3: Week 1 Checkpoint (Day 5)

- [x] 3.1 Run full test suite
  - `npm run test:unit`
  - `npm run typecheck`
  - `npm run lint`
  - `npm run build`

- [x] 3.2 Manual end-to-end testing
  - Test complete payment flow
  - Test doping activation
  - Verify no regressions

- [x] 3.3 Code review
  - Review all changes
  - Verify naming conventions
  - Check documentation

- [x] 3.4 User acceptance
  - Demo to stakeholders
  - Get approval to proceed

---

## Week 2: MEDIUM Priority Services

### Task 4: Migrate ChatService (Days 6-7)

- [x] 4.1 Analyze ChatService implementation
  - Read `src/services/chat/chat-service.ts`
  - Document all 7 methods
  - Identify all call sites

- [x] 4.2 Write preservation tests
  - Create `src/services/chat/__tests__/chat-preservation.test.ts`
  - Test all 7 methods
  - Run tests on UNFIXED code (must PASS)

- [x] 4.3 Create server actions file
  - Create `src/app/api/chats/actions.ts`
  - Implement 7 server actions

- [x] 4.4 Extract business logic
  - Rename `chat-service.ts` to `chat-logic.ts`
  - Convert class methods to pure functions

- [x] 4.5 Update all imports
  - Update `src/app/api/chats/route.ts`
  - Update `src/app/api/chats/[id]/messages/route.ts`
  - Update `src/app/api/chats/[id]/read/route.ts`
  - Update `src/app/api/chats/[id]/archive/route.ts`
  - Update dashboard components

- [x] 4.6 Verify and commit
  - Run tests
  - Manual testing
  - Git commit: "refactor: migrate ChatService to server actions"

---

### Task 5: Remove Client-Service Wrappers (Day 8)

- [x] 5.1 Remove ProfileService wrapper
  - Delete `src/services/profile/client-service.ts`
  - Create `src/app/api/profile/actions.ts`
  - Update all components using ProfileService

- [x] 5.2 Remove AuthService wrapper
  - Delete `src/services/auth/client-service.ts`
  - Create `src/app/api/auth/actions.ts`
  - Update all components using AuthService

- [x] 5.3 Remove ListingService wrapper
  - Delete `src/services/listings/listing-service.ts`
  - Update all components to use server actions directly

- [x] 5.4 Verify and commit
  - Run tests
  - Git commit: "refactor: remove client-service wrappers (Profile, Auth, Listing)"

---

### Task 6: Week 2 Checkpoint (Days 9-10)

- [x] 6.1 Run full test suite
- [x] 6.2 Manual testing
- [x] 6.3 Performance testing
- [x] 6.4 User acceptance

---

## Week 3: LOW Priority Services

### Task 7: Remove Remaining Wrappers (Days 11-12)

- [x] 7.1 Remove SupportService wrapper
  - Delete `src/services/support/support-service.ts`
  - Create `src/app/api/support/actions.ts`
  - Update components

- [x] 7.2 Remove NotificationService wrapper
  - Delete `src/services/notifications/client-service.ts`
  - Create `src/app/api/notifications/actions.ts`
  - Update components

- [x] 7.3 Remove ReportService wrapper
  - Delete `src/services/reports/client-service.ts`
  - Create `src/app/api/reports/actions.ts`
  - Update components

- [x] 7.4 Verify and commit
  - Run tests
  - Git commit: "refactor: remove remaining client-service wrappers"

---

### Task 8: Final Verification (Days 13-14)

- [x] 8.1 Run complete test suite
  - Unit tests
  - Integration tests
  - E2E tests (if available)

- [x] 8.2 Performance testing
  - Measure response times
  - Check for N+1 queries
  - Verify no performance degradation

- [x] 8.3 Security audit
  - Verify RLS policies
  - Check authentication/authorization
  - Review error handling

- [x] 8.4 Documentation review
  - Update AGENTS.md if needed
  - Add JSDoc comments
  - Create service READMEs (optional)

---

### Task 9: Final Checkpoint (Day 15)

- [x] 9.1 User acceptance testing
- [x] 9.2 Stakeholder demo
- [x] 9.3 Production deployment plan
- [x] 9.4 Celebrate! 🎉

---

## Success Criteria

- [ ] All 9 services migrated
- [ ] All tests passing
- [ ] 0 TypeScript errors
- [ ] 0 ESLint errors
- [ ] Build succeeds
- [ ] No regressions
- [ ] Documentation updated
- [ ] User acceptance approved

---

## Notes

- Each service migration is a separate commit
- Test BEFORE and AFTER each migration
- Manual testing is mandatory for critical services
- Rollback plan: `git revert <commit-hash>`
