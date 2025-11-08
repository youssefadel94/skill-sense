# Pattern Extraction Roadmap

**Purpose:** Guide for extracting reusable code patterns from nue-ionic monorepo  
**Target:** New SkillSense monorepo (standalone)  
**Timeline:** 4 weeks

---

## Week 1: Foundation Patterns (Must Have)

### Day 1-2: Backend Core

**1. NestJS Global Module Pattern**
```
Source: cloud-run/ai/nestjs-ai/src/modules/firebase/
Target: guides-scaffolds/nestjs-global-module-pattern.md
Size: ~500 lines
Priority: CRITICAL
```

**What to Extract:**
- `@Global()` decorator usage
- Lazy-loaded service providers
- ConfigService integration
- Circular dependency resolution
- Module export pattern

**Code Snippet Preview:**
```typescript
@Global()
@Module({
  providers: [
    {
      provide: FirebaseApp,
      useFactory: async (configService: ConfigService) => {
        // Lazy load to avoid circular deps
        const { initializeApp } = await import('firebase-admin/app');
        const { getFirestore } = await import('firebase-admin/firestore');
        // ...
      },
      inject: [ConfigService],
    },
  ],
  exports: [FirebaseApp, Firestore],
})
export class SharedModule {}
```

---

**2. Firebase/Firestore Setup Pattern**
```
Source: multiple services in nue-util/src/lib/services/db/
Target: guides-scaffolds/firebase-firestore-setup.md
Size: ~800 lines
Priority: CRITICAL
```

**What to Extract:**
- Firebase Admin SDK initialization
- Firestore client setup
- Connection pooling
- Error handling
- TypeScript interfaces

---

**3. Vertex AI Integration Pattern**
```
Source: cloud-run/ai/nestjs-ai/src/services/
Target: guides-scaffolds/nestjs-vertex-ai-integration.md
Size: ~600 lines
Priority: HIGH
```

**What to Extract:**
- `@google-cloud/vertexai` setup
- Gemini Pro Vision integration
- Function calling pattern
- Text embeddings
- Streaming responses
- Error handling + retries

**Features:**
- Resume parsing
- Skill extraction
- Embeddings generation
- Streaming chat
- Function calling

---

### Day 3-4: Frontend Core

**4. Angular Standalone Components**
```
Source: All shell apps in projects/
Target: guides-scaffolds/angular-standalone-components.md
Size: ~400 lines
Priority: CRITICAL
```

**What to Extract:**
- Component decorator with `standalone: true`
- Imports array pattern
- Router configuration
- Lazy loading
- Public API exports

**Code Example:**
```typescript
@Component({
  selector: 'app-feature',
  standalone: true,
  imports: [CommonModule, IonicModule, RouterModule],
  template: `...`,
})
export class FeatureComponent {}
```

---

**5. NgRx SignalStore Pattern**
```
Source: projects/nue-*/src/lib/store/
Target: guides-scaffolds/angular-state-management.md
Size: ~300 lines
Priority: CRITICAL
```

**What to Extract:**
- `signalStore()` definition
- `withState()` pattern
- `withComputed()` pattern
- `withMethods()` pattern
- Service integration

**Code Example:**
```typescript
export const CVStore = signalStore(
  { providedIn: 'root' },
  withState<CVState>({ cvs: [], loading: false }),
  withComputed(({ cvs }) => ({
    totalCVs: computed(() => cvs().length),
  })),
  withMethods((store, cvService = inject(CVService)) => ({
    async loadCVs() { ... },
  }))
);
```

---

### Day 5: Review & Documentation

- Test all Week 1 patterns in isolation
- Create working examples
- Document integration steps
- Create `WEEK-1-COMPLETE.md` checklist

---

## Week 2: Supporting Patterns (Should Have)

### Day 6-7: Background Processing

**6. Firestore Job Queue System**
```
Source: cloud-run/video/video-processing-service/src/services/QueueManager.js
Target: guides-scaffolds/firestore-queue-system.md
Size: ~2227 lines → Simplify to ~200 lines
Priority: HIGH
```

**What to Extract:**
- Queue structure (collections/docs)
- Job status enum
- Worker pattern
- Retry logic
- Error handling
- Transaction safety

**Simplification Goals:**
- Remove video-specific code
- Generic job processor
- Configurable handlers
- Better TypeScript types

---

**7. Angular Auth Guards**
```
Source: projects/nue-util/src/lib/services/auth/
Target: guides-scaffolds/angular-auth-guards.md
Size: ~400 lines
Priority: HIGH
```

**What to Extract:**
- `CanActivate` guard
- `AdminGuard` with role checking
- Route protection
- Redirect logic
- Token validation

---

### Day 8-9: Utilities & Services

**8. Translation/i18n System**
```
Source: projects/nue-util/src/lib/services/translation/
Target: guides-scaffolds/angular-translation-system.md
Size: ~300 lines
Priority: MEDIUM
```

**What to Extract:**
- Translation service
- Language switching
- Async loading
- Pipe implementation
- Translation files structure

---

**9. Notification System**
```
Source: projects/nue-util/src/lib/services/notification/
Target: guides-scaffolds/angular-notification-system.md
Size: ~500 lines
Priority: HIGH
```

**What to Extract:**
- Push notification setup
- In-app notification service
- Permission handling
- FCM integration
- Notification UI components

---

**10. Storage Service**
```
Source: projects/nue-util/src/lib/services/storage/
Target: guides-scaffolds/firebase-storage-service.md
Size: ~400 lines
Priority: MEDIUM
```

**What to Extract:**
- File upload
- Download URLs
- Progress tracking
- Image optimization
- Security rules

---

### Day 10: Review & Testing

- Test all Week 2 patterns
- Integration testing
- Create `WEEK-2-COMPLETE.md`

---

## Week 3: Integration Patterns (Nice to Have)

### Day 11-12: Third-Party Services

**11. Payment Integration**
```
Source: projects/nue-payments/
Target: guides-scaffolds/payment-module.md
Size: ~1200 lines
Priority: LOW (for MVP)
```

**What to Extract:**
- Stripe checkout
- Airwallex setup
- Subscription management
- Webhook handlers
- Payment UI components

---

**12. Analytics Integration**
```
Source: projects/nue-analytics/
Target: guides-scaffolds/analytics-integration.md
Size: ~600 lines
Priority: MEDIUM
```

**What to Extract:**
- GA4 setup
- Firebase Analytics
- Event tracking
- Custom dimensions
- Dashboard integration

---

### Day 13-14: Admin Patterns

**13. Admin Dashboard Module**
```
Source: projects/nue-admin/
Target: guides-scaffolds/admin-dashboard-patterns.md
Size: ~2000 lines
Priority: MEDIUM
```

**What to Extract:**
- User management UI
- Permission system
- Notification admin
- Analytics dashboard
- CRUD tables

---

**14. Community/Chat Module**
```
Source: projects/nue-community/
Target: guides-scaffolds/community-chat-module.md
Size: ~1500 lines
Priority: LOW (future feature)
```

**What to Extract:**
- Real-time chat service
- Message UI components
- Group/Direct messages
- AI chat integration
- Presence tracking

---

### Day 15: Review

- Test all Week 3 patterns
- Create `WEEK-3-COMPLETE.md`

---

## Week 4: Advanced Patterns (Optional)

### Day 16-17: Mobile-Specific

**15. BLE Integration**
```
Source: projects/nue-device/src/lib/unified-ble.service.ts
Target: guides-scaffolds/ble-integration.md
Size: ~3000 lines
Priority: LOW (only if IoT needed)
```

**What to Extract:**
- Web Bluetooth API
- Cordova BLE plugin
- Cross-platform service
- Device discovery
- Data parsing

---

**16. Camera Integration**
```
Source: projects/nue-camera/
Target: guides-scaffolds/camera-integration.md
Size: ~800 lines
Priority: LOW
```

**What to Extract:**
- Capacitor Camera plugin
- Image capture
- Gallery access
- Image processing
- Upload integration

---

### Day 18-19: Cloud Patterns

**17. Cloud Run Deployment**
```
Source: cloud-run/*/Dockerfile, cloudbuild.yaml
Target: guides-scaffolds/cloud-run-deployment.md
Size: ~400 lines
Priority: HIGH
```

**What to Extract:**
- Multi-stage Dockerfile
- Cloud Build config
- Service configuration
- Environment variables
- Secrets management

---

**18. Video Processing Service**
```
Source: cloud-run/video/video-processing-service/
Target: guides-scaffolds/video-processing-service.md
Size: ~10,000 lines
Priority: LOW (future feature)
```

**What to Extract:**
- FFmpeg integration
- Queue processing
- Storage management
- Progress tracking
- Error recovery

---

### Day 20: Final Review

- Test all extracted patterns
- Create integration examples
- Document dependencies
- Create `EXTRACTION-COMPLETE.md`

---

## Extraction Template

For each pattern, create:

### 1. Overview Section
```markdown
# Pattern Name

**Purpose:** What problem does this solve?
**Use Case:** When should you use this?
**Dependencies:** What does it require?
**Complexity:** Low/Medium/High
**Size:** Estimated lines of code
```

### 2. Installation
```markdown
## Installation

npm install @package/name
```

### 3. Complete Code
```markdown
## Implementation

Full working code with no placeholders
```

### 4. Usage Examples
```markdown
## Usage

Concrete examples showing how to use it
```

### 5. Integration Guide
```markdown
## Integration

Step-by-step integration with other services
```

### 6. Best Practices
```markdown
## Best Practices

- Type safety
- Error handling
- Testing
- Performance
```

### 7. Common Issues
```markdown
## Troubleshooting

Common problems and solutions
```

---

## Progress Tracking

### Week 1 (Foundation) ⏭️
- [ ] NestJS Global Module
- [ ] Firebase/Firestore Setup
- [ ] Vertex AI Integration
- [ ] Angular Standalone Components
- [ ] NgRx SignalStore

### Week 2 (Supporting) ⏭️
- [ ] Firestore Queue System
- [ ] Auth Guards
- [ ] Translation System
- [ ] Notification System
- [ ] Storage Service

### Week 3 (Integration) ⏭️
- [ ] Payment Module
- [ ] Analytics Integration
- [ ] Admin Dashboard
- [ ] Community/Chat

### Week 4 (Advanced) ⏭️
- [ ] BLE Integration (optional)
- [ ] Camera Integration (optional)
- [ ] Cloud Run Deployment
- [ ] Video Processing (optional)

---

## Success Metrics

### Quality Criteria
- ✅ Complete working code (no TODOs)
- ✅ Full TypeScript types
- ✅ Error handling included
- ✅ Usage examples provided
- ✅ Integration documented
- ✅ Best practices explained

### Testing Criteria
- ✅ Code compiles without errors
- ✅ Can run in isolation
- ✅ Dependencies documented
- ✅ Integration tested
- ✅ Examples work

### Documentation Criteria
- ✅ Clear purpose stated
- ✅ Use cases explained
- ✅ All parameters documented
- ✅ Return values documented
- ✅ Error cases covered

---

## Post-Extraction

### New Monorepo Setup
1. Create fresh repo
2. Run scaffold.sh
3. Copy extracted patterns
4. Test integration
5. Deploy to staging

### Validation
1. Build successful
2. Tests passing
3. No TypeScript errors
4. Linting clean
5. Production ready

---

**Current Status:** Planning complete, ready to begin extraction  
**Next Action:** Create Week 1 pattern guides  
**Timeline:** 4 weeks to complete all extractions  
**Priority:** Week 1 patterns are critical for MVP
