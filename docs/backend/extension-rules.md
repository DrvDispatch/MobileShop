# Extension Rules

## Adding a New Feature

### 1. Database Schema

```prisma
// prisma/schema.prisma

model NewEntity {
  id        String   @id @default(uuid())
  tenantId  String   // ← Always required
  tenant    Tenant   @relation(fields: [tenantId], references: [id])
  
  // Your fields
  name      String
  createdAt DateTime @default(now())
}
```

Run migration:
```bash
npx prisma migrate dev --name add_new_entity
```

### 2. NestJS Module

```
modules/new-feature/
├── new-feature.module.ts
├── new-feature.controller.ts
├── new-feature.service.ts
└── dto/
    ├── create-new-feature.dto.ts
    └── update-new-feature.dto.ts
```

### 3. DTOs with Validation

```typescript
// dto/create-new-feature.dto.ts

import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateNewFeatureDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;
}
```

### 4. Service with Tenant Isolation

```typescript
// new-feature.service.ts

@Injectable()
export class NewFeatureService {
  constructor(private prisma: PrismaService) {}
  
  // ✅ Always include tenantId
  findAll(tenantId: string) {
    return this.prisma.newEntity.findMany({
      where: { tenantId }
    });
  }
  
  create(tenantId: string, dto: CreateNewFeatureDto) {
    return this.prisma.newEntity.create({
      data: {
        tenantId,
        ...dto,
      },
    });
  }
}
```

### 5. Controller with Guards

```typescript
// new-feature.controller.ts

@Controller('new-feature')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'STAFF')
export class NewFeatureController {
  constructor(private service: NewFeatureService) {}
  
  @Get()
  findAll(@TenantId() tenantId: string) {
    return this.service.findAll(tenantId);
  }
  
  @Post()
  @Roles('ADMIN')  // Override: ADMIN only
  create(
    @TenantId() tenantId: string,
    @Body() dto: CreateNewFeatureDto,
  ) {
    return this.service.create(tenantId, dto);
  }
}
```

### 6. Register Module

```typescript
// app.module.ts

import { NewFeatureModule } from './modules/new-feature/new-feature.module';

@Module({
  imports: [
    // ...
    NewFeatureModule,
  ],
})
export class AppModule {}
```

---

## Adding a Feature Flag

### 1. Update TenantFeature Schema

```prisma
model TenantFeature {
  // Existing fields...
  
  newFeatureEnabled Boolean @default(false)
}
```

### 2. Update Frontend Types

```typescript
// frontend/src/contexts/FeatureContext.tsx

interface FeatureFlags {
  // Existing...
  newFeatureEnabled: boolean;
}

const DEFAULT_FEATURES: FeatureFlags = {
  // Existing...
  newFeatureEnabled: false,
};
```

### 3. Add to Owner Panel

Add toggle in tenant features form.

### 4. Use in Code

**Backend**:
```typescript
const features = await this.featuresService.getFeatures(tenantId);
if (!features.newFeatureEnabled) {
  throw new ForbiddenException('Feature not enabled');
}
```

**Frontend**:
```typescript
const features = useFeatures();
if (!features.newFeatureEnabled) return null;
```

---

## Adding TenantConfig Fields

### 1. Update Schema

```prisma
model TenantConfig {
  // Existing...
  newField String?
}
```

### 2. Update DTO

```typescript
// owner/dto/update-config.dto.ts

export class UpdateConfigDto {
  // Existing...
  
  @IsString()
  @IsOptional()
  newField?: string;
}
```

### 3. Update Frontend Types

```typescript
// lib/tenant-types.ts

interface TenantBranding {
  // or appropriate category
  newField: string | null;
}
```

### 4. Add to Owner Panel

Add field to tenant config form.

---

## Never Do

| ❌ Don't | Why |
|----------|-----|
| Query without `tenantId` | Cross-tenant data leak |
| Use `any` type | Type safety |
| Skip `@TenantId()` decorator | Tenant isolation |
| Hardcode tenant data | Multi-tenant violation |
| Add public admin endpoints | Security |

---

## Related Docs

- [API Overview](./api-overview.md)
- [Tenant Model](../platform/tenant-model.md)
