# Reusable Code Patterns from nue-ionic Monorepo

**Index of Extractable Patterns & Guides**

This document catalogs all reusable patterns, services, and code from the nue-ionic monorepo that can be adapted for SkillSense or future projects.

---

## 📁 Guides Available

Each guide is a standalone markdown file in `plans/guides-scaffolds/` with:
- Complete working code examples
- Implementation steps
- Integration patterns
- Best practices

### Backend Patterns

1. **`nestjs-global-module-pattern.md`** ✅
   - @Global() SharedModule pattern
   - Service dependency injection
   - Module exports pattern
   - Firebase/Firestore integration

2. **`nestjs-firebase-setup.md`** ✅
   - Firebase Admin SDK initialization
   - Firestore service patterns
   - Storage service patterns
   - Lazy-loading Firestore pattern

3. **`nestjs-vertex-ai-integration.md`** ✅
   - Vertex AI setup
   - Gemini Pro usage
   - Function calling patterns
   - Text generation with tools

4. **`firestore-queue-system.md`** ✅
   - Complete job queue implementation (~2227 lines)
   - Rate limiting patterns
   - Resource slot management
   - Retry logic

5. **`nestjs-logging-interceptor.md`** ✅
   - Request/response logging
   - Error tracking
   - Performance monitoring
   - HTTP interceptor pattern

6. **`nestjs-config-management.md`** ✅
   - Environment configuration
   - Feature flags with Firestore
   - Dynamic configuration updates
   - Config caching patterns

### Frontend Patterns

7. **`angular-standalone-components.md`** ✅
   - Standalone component pattern
   - Public API exports
   - Library structure
   - Component isolation

8. **`angular-state-management.md`** ✅
   - NgRx SignalStore patterns
   - BehaviorSubject patterns
   - State synchronization
   - Observable patterns

9. **`angular-auth-guards.md`** ✅
   - CanActivate guards
   - Admin guards
   - Auth state management
   - Route protection

10. **`angular-translation-system.md`** ✅
    - Multi-language support
    - Translation pipe
    - Dynamic language switching
    - JSON translation files

11. **`angular-notification-system.md`** ✅
    - Push notifications (Capacitor)
    - In-app notifications
    - Notification service
    - Deep linking

12. **`ionic-capacitor-setup.md`** ✅
    - Capacitor configuration
    - Native plugin integration
    - Platform detection
    - Camera/BLE plugins

### Database Patterns

13. **`firestore-crud-service.md`** ✅
    - Complete Firestore CRUD operations
    - Collection management
    - Query patterns
    - Batch operations

14. **`firebase-storage-service.md`** ✅
    - File upload with progress
    - Download URL generation
    - Storage buckets
    - Resumable uploads

15. **`firestore-security-rules.md`** ✅
    - User-based access control
    - Role-based permissions
    - Data validation rules
    - Security best practices

### Integration Patterns

16. **`http-interceptors.md`** ✅
    - Auth token injection
    - Error handling
    - Retry logic
    - Request caching

17. **`api-service-pattern.md`** ✅
    - HTTP client wrapper
    - Type-safe API calls
    - Error mapping
    - Response transformation

18. **`third-party-integrations.md`** ✅
    - Intercom integration
    - Analytics integration
    - Payment providers (Stripe/Airwallex)
    - Social OAuth

### Mobile Patterns

19. **`ble-integration.md`** 🆕
    - Bluetooth Low Energy patterns
    - Web Bluetooth API
    - Cordova BLE plugin
    - Device discovery and connection

20. **`camera-integration.md`** 🆕
    - Camera plugin usage
    - Image capture
    - Image processing
    - Upload patterns

21. **`capacitor-plugins-guide.md`** 🆕
    - Push notifications
    - Privacy screen
    - In-app browser
    - Native features

### Cloud Run Patterns

22. **`cloud-run-deployment.md`** ✅
    - Dockerfile patterns
    - Environment configuration
    - Service deployment
    - Cloud Build integration

23. **`cloud-run-video-processing.md`** 🆕
    - Video processing patterns
    - EML parsing
    - Batch processing
    - Worker patterns

24. **`cloud-run-ai-service.md`** ✅
    - NestJS AI service
    - Express to NestJS migration
    - Vertex AI integration
    - Background processing

### UI Components

25. **`ionic-ui-components.md`** 🆕
    - Reusable UI components
    - Modal patterns
    - Bottom drawer
    - Card components

26. **`angular-forms-patterns.md`** 🆕
    - Reactive forms
    - Form validation
    - Dynamic forms
    - Custom validators

27. **`angular-routing-patterns.md`** 🆕
    - Lazy loading
    - Route guards
    - Route parameters
    - Child routes

### Analytics & Monitoring

28. **`analytics-integration.md`** 🆕
    - Google Analytics 4
    - Firebase Analytics
    - Custom event tracking
    - User properties

29. **`monitoring-logging.md`** 🆕
    - Cloud Logging
    - Error reporting
    - Performance monitoring
    - Custom metrics

30. **`admin-dashboard-patterns.md`** 🆕
    - User management
    - Permissions system
    - Content moderation
    - Analytics dashboards

---

## 🔧 Utility Services

### 31. Common Services
**File:** `projects/nue-util/src/lib/services/state/common.service.ts`

**Features:**
- User state management
- Toast notifications
- Profile caching
- Read cache
- Session management

**Code Size:** ~500 lines  
**Reusability:** High

---

### 32. Internal Storage Service
**File:** `projects/nue-util/src/lib/services/auth/internal-storage.service.ts`

**Features:**
- Local storage wrapper
- Capacitor preferences
- Type-safe storage
- Async storage operations

**Code Size:** ~242 lines  
**Reusability:** High

---

### 33. Logger Service
**File:** `projects/nue-util/src/lib/services/state/logger.service.ts`

**Features:**
- Console logging
- Error tracking
- Log aggregation
- Debug levels

**Code Size:** ~150 lines  
**Reusability:** High

---

### 34. Translation Service
**File:** `projects/nue-util/src/lib/services/translation/translation.service.ts`

**Features:**
- Multi-language support
- Dynamic translation loading
- Translation pipe
- Language detection

**Code Size:** ~300 lines  
**Reusability:** High

---

### 35. Calendar Service
**File:** `projects/nue-util/src/lib/services/db/calendar.service.ts`

**Features:**
- Event management
- Date utilities
- Calendar integration
- Booking system

**Code Size:** ~421 lines  
**Reusability:** Medium

---

## 📊 Complete Modules

### 36. Payment Module
**Path:** `projects/nue-payments/`

**Features:**
- Stripe integration
- Airwallex integration
- Subscription management
- Checkout component
- Payment history

**Files:**
- Checkout component
- Payment service
- Subscription service
- Invoice generation

**Reusability:** High (with minor config changes)

---

### 37. Community/Chat Module
**Path:** `projects/nue-community/`

**Features:**
- Real-time chat
- Group chats
- Direct messages
- Attachments
- AI chat integration

**Files:**
- Chat components
- Chat service
- Message models
- Presence tracking

**Reusability:** High

---

### 38. Admin Module
**Path:** `projects/nue-admin/`

**Features:**
- User management
- Permissions
- Notifications admin
- Content moderation
- Analytics

**Files:**
- User list component
- Permissions component
- Notification management
- Admin guards

**Reusability:** High

---

### 39. IV Patch Module
**Path:** `projects/nue-iv-patch/`

**Features:**
- Article system
- History tracking
- Account settings
- Onboarding flows

**Files:**
- Articles component
- History component
- Settings component
- Splash screen

**Reusability:** Medium (specific to health domain)

---

### 40. Clients & Booking Module
**Path:** `projects/nue-clients-and-booking/`

**Features:**
- Client management
- Session booking
- Calendar integration
- Transformation tracking

**Files:**
- Client list
- Session add/edit
- Booking calendar
- Transformation timeline

**Reusability:** High

---

## 🎨 UI Library Patterns

### 41. NUE UI Components
**Path:** `projects/nue-ui/`

**Components:**
- Navigation components
- Card components
- Modal patterns
- Bottom drawer
- FAQs
- About pages
- Subscription modals

**Reusability:** High (customizable)

---

## 🔐 Security Patterns

### 42. Auth Module
**Path:** `projects/nue-auth/`

**Features:**
- Login/signup
- Password reset
- Email verification
- Social auth
- Auth guards

**Files:**
- Login page
- Signup page
- Reset password
- Auth service
- Guards

**Reusability:** Very High

---

### 43. Privacy Service
**File:** `projects/nue-util/src/lib/services/state/privacy.service.ts`

**Features:**
- Privacy controls
- Data export
- GDPR compliance
- User consent
- Privacy screen

**Reusability:** High

---

## 📱 Device Integration

### 44. BLE Service
**Path:** `projects/nue-device/src/lib/`

**Features:**
- BLE device discovery
- Connection management
- Data reading/writing
- Web Bluetooth API
- Cordova BLE plugin
- Unified BLE service

**Files:**
- `unified-ble.service.ts` - Cross-platform BLE
- `ble-connection.service.ts` - Connection handling
- `ble-read.service.ts` - Data reading
- `ble-integration.service.ts` - Integration layer
- `ble-connect.page.ts` - Connection UI
- `ble-read.page.ts` - Native reading UI
- `ble-read-web.page.ts` - Web reading UI

**Code Size:** ~3000+ lines  
**Reusability:** High (for IoT projects)

---

### 45. Camera Service
**Path:** `projects/nue-camera/`

**Features:**
- Camera capture
- Image processing
- Gallery integration
- Photo editing

**Reusability:** High

---

## 🎨 Color/AI Specialized

### 46. Color Service
**File:** `projects/nue-util/src/lib/services/color/color.service.ts`

**Features:**
- LAB color conversions
- Color matching
- Pigment calculations
- Color transformations

**Code Size:** ~936 lines  
**Reusability:** Low (domain-specific)

---

### 47. Color Recommendation Service
**File:** `projects/nue-util/src/lib/services/color/color-recommendation.service.ts`

**Features:**
- AI-powered recommendations
- Color analysis
- Recipe generation
- Ingredient management

**Reusability:** Low (but good AI pattern example)

---

## 🌐 Web Scraping

### 48. Scrapper Service
**File:** `projects/nue-util/src/lib/services/db/scrapper.service.ts`

**Features:**
- Web scraping
- Data extraction
- Proxy management
- Rate limiting

**Reusability:** High (for web scraping projects)

---

### 49. Node Scraper Projects
**Path:** `node projects/scrapper/`

**Features:**
- Product scraping
- Multi-vendor support
- Proxy rotation
- Data normalization

**Reusability:** High

---

## 📹 Video Processing

### 50. Cloud Run Video Service
**Path:** `cloud-run/video/video-processing-service/`

**Features:**
- EML file processing
- Batch processing
- Video analysis
- Duplicate detection
- Queue management
- GCS integration

**Files:**
- NestJS modules (7 modules)
- Shared services
- Worker patterns
- Duplicate checker
- Parser service
- Status determiner

**Code Size:** ~10,000+ lines  
**Reusability:** Medium (adaptable for file processing)

---

## 🤖 AI Services

### 51. Cloud Run AI Service
**Path:** `cloud-run/ai/nestjs-ai/`

**Features:**
- Vertex AI integration
- Text generation
- AI tools support
- Background processing
- Firestore integration

**Files:**
- AI module
- AI service
- Firebase module
- DTOs
- Constants

**Reusability:** Very High

---

### 52. AI Chat Service
**File:** `projects/nue-util/src/lib/services/community/ai-chat/ai-chat.service.ts`

**Features:**
- AI chat integration
- Message handling
- Context management
- Tool integration

**Reusability:** High

---

## 🔧 Build & Deployment

### 53. Capacitor Config
**File:** `capacitor.config.ts`

**Features:**
- Multi-platform configuration
- Plugin setup
- Deep linking
- Push notifications
- Privacy screen

**Reusability:** Very High

---

### 54. Angular Build Config
**File:** `angular.json`

**Features:**
- Workspace configuration
- Project structure
- Build optimization
- Multiple projects

**Reusability:** High

---

### 55. Firebase Functions
**Path:** `functions/src/index.ts`

**Features:**
- Cloud Functions
- Airwallex integration
- Vertex AI proxy
- Video processing triggers
- Intercom hash generation

**Code Size:** ~1000+ lines  
**Reusability:** Medium

---

## 📚 Documentation Patterns

### 56. Compodoc Documentation
**Path:** `documentation/`

**Features:**
- Auto-generated docs
- Component documentation
- Service documentation
- Coverage reports

**Tool:** Compodoc  
**Reusability:** Very High

---

## 🗂️ Project Structure Patterns

### 57. Monorepo Structure
**Root:** `nue-ionic/`

**Features:**
- Multiple projects
- Shared libraries
- Shell apps pattern
- Library exports

**Projects:**
- 12+ shell applications
- 15+ library projects
- Shared utilities
- Cloud Run services

**Reusability:** Very High (blueprint for new monorepos)

---

## 📊 Data Models

### 58. DTOs/Interfaces
**File:** `projects/nue-util/src/lib/interfaces/DTOs.ts`

**Models:**
- Profile
- Client
- Session
- Payment
- LABColor
- Course
- Notification
- Articles
- IvPatch

**Reusability:** Medium (adapt to your domain)

---

## 🧪 Testing Patterns

### 59. Test Configuration
**Files:**
- `karma.conf.js`
- `tsconfig.spec.json`
- Test specs throughout

**Patterns:**
- Unit test structure
- Service mocking
- Component testing

**Reusability:** High

---

## 🎯 Priority Implementation Order

### Immediate (Week 1-2)
1. **nestjs-global-module-pattern.md** ✅ - Foundation
2. **nestjs-firebase-setup.md** ✅ - Database
3. **firestore-crud-service.md** ✅ - Data operations
4. **angular-standalone-components.md** ✅ - Frontend structure
5. **angular-state-management.md** ✅ - State handling

### Short-term (Week 3-4)
6. **nestjs-vertex-ai-integration.md** ✅ - AI features
7. **firestore-queue-system.md** ✅ - Background jobs
8. **angular-auth-guards.md** ✅ - Security
9. **angular-notification-system.md** ✅ - Notifications
10. **cloud-run-deployment.md** ✅ - Deployment

### Medium-term (Month 2-3)
11. **analytics-integration.md** 🆕 - Tracking
12. **admin-dashboard-patterns.md** 🆕 - Admin features
13. **payment-module.md** 🆕 - Monetization
14. **third-party-integrations.md** ✅ - External services

### Long-term (Month 4+)
15. **ble-integration.md** 🆕 - IoT features (if needed)
16. **community-chat-module.md** 🆕 - Social features
17. **video-processing-patterns.md** 🆕 - Media handling (if needed)

---

## 📝 Notes

**Legend:**
- ✅ Ready to extract (high-value, standalone)
- 🆕 Needs extraction (not yet documented)
- ❌ Low priority (too specific to original project)

**Total Patterns:** 59  
**High Reusability:** 45  
**Medium Reusability:** 10  
**Low Reusability:** 4

---

## 🚀 Next Actions

1. Choose which guides to create first
2. Extract patterns into standalone markdown files
3. Test patterns in isolated environment
4. Create code templates in `guides-scaffolds/`
5. Document integration steps
6. Create examples for each pattern

---

**Last Updated:** November 8, 2025  
**Maintained By:** AI Agent Team
