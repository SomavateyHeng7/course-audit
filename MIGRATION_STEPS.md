# Curriculum Schema Migration Steps

## 1. Delete Existing Curricula (Safe)
- Go to your chairperson dashboard
- Delete "Test 2" and "Test-1" curricula using the delete buttons
- This ensures no data conflicts during migration

## 2. Run the Migration
```bash
npx prisma migrate dev --name add_start_end_id_to_curriculum
```

## 3. What the Migration Will Do
- ✅ Add `startId` field to curriculum table
- ✅ Add `endId` field to curriculum table  
- ✅ Change unique constraint from `[year, version, departmentId]` to `[year, startId, endId]`
- ✅ No data loss (table is empty after step 1)

## 4. New Duplication Logic
**Before:** Duplicate if same year + version + department
**After:** Duplicate if same year + startId + endId

### Examples:
- ✅ **Allowed:** Year 2024, ID 63001-63999 AND Year 2024, ID 64001-64999
- ✅ **Allowed:** Year 2024, ID 63001-63999 AND Year 2025, ID 63001-63999
- ❌ **Blocked:** Year 2024, ID 63001-63999 AND Year 2024, ID 63001-63999

## 5. UI Changes Made
### Curriculum List (/chairperson)
- Now shows: `2025 • v1.0 • ID: 63001-63999`
- Displays both start and end ID ranges

### Create Form (/chairperson/create)
- Added "Academic Year" input field (defaults to current year)
- Enhanced ID field placeholders with examples
- Added helper text: "Sample: 63xxx, 64xxx, 65xxx (first 2 digits = batch year)"

## 6. Sample Data Format
```
Academic Year: 2024
ID Start: 63001
ID End: 63999
```

This creates a curriculum for 2024 batch students with IDs 63001-63999.
