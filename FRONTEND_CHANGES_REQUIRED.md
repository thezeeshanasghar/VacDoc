# Frontend Changes Required for IsOnline Separation

## Overview
The backend has been updated to separate `IsOnline` status between Doctors and Personal Assistants (PAs). The frontend needs to be updated to use the appropriate endpoints based on user type.

## Changes Required

### 1. PA Service (`pa.service.ts`)
- **Add new method**: `updatePaClinicOnlineStatus(paAccessId: number, isOnline: boolean)` 
  - Calls: `PUT /api/paaccess/{paAccessId}/isonline`
  - Body: `true` or `false`

### 2. Clinic Page (`clinic.page.ts`)
- **Update `setOnlineClinic` method**: 
  - Check user type (DOCTOR vs PA)
  - If DOCTOR: Use existing `clinicService.changeOnlineClinic()` 
  - If PA: Use new `paService.updatePaClinicOnlineStatus()` with `PaAccessId`
- **Update `getClinics` method**:
  - For PA: Store `PaAccessId` from response (new field in API response)
- **Update `loadClinicsForDropdown` method**:
  - For PA: Store `PaAccessId` when finding online clinic

### 3. Personal Assistant Page (`personal-assistant.page.ts`)
- **Update `setOnlineClinic` method**:
  - Check user type
  - If PA: Use `paService.updatePaClinicOnlineStatus()` with `PaAccessId`
  - If DOCTOR: Use existing `clinicService.changeOnlineClinic()`
- **Update `loadClinics` method**:
  - For PA: Store `PaAccessId` from response

### 4. Other Pages Using `setOnlineClinic`
These pages need to check user type and use appropriate endpoint:
- `child/add/add.page.ts`
- `doctor/vacation/vacation.page.ts`
- `doctor/schedule/schedule.page.ts`
- `doctor/password/password.page.ts`

### 5. API Response Structure Change
The PA clinics endpoint now returns:
```typescript
{
  Id: number,
  Name: string,
  // ... other clinic fields
  IsOnline: boolean,  // From PaAccess, not Clinic
  PaAccessId: number  // NEW: Required for updating IsOnline
}
```

## Implementation Notes

1. **Storage**: Need to store `PaAccessId` for PA users when clinic is selected
2. **User Type Check**: Always check `usertype.UserType === 'PA'` before using PA-specific endpoints
3. **Backward Compatibility**: Doctor functionality should remain unchanged
