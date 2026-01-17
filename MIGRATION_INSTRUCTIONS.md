# Module 2 Migration Instructions

## To Apply the Migration

The migration has been created at:
`supabase/migrations/20250117000000_module2_harden.sql`

### Option 1: Via Supabase Dashboard (Recommended)
1. Go to your Supabase dashboard: https://norniesjpvyssadehswv.supabase.co
2. Navigate to SQL Editor
3. Copy and paste the entire contents of the migration file
4. Run the SQL statement

### Option 2: Via psql (if you have access)
```bash
psql -h norniesjpvyssadehswv.supabase.co -U postgres -d postgres < supabase/migrations/20250117000000_module2_harden.sql
```

### Option 3: Via Supabase CLI (if you can link the project)
```bash
supabase link
supabase db push
```

## What the Migration Does

1. **Adds missing slug column** to clinics table
2. **Generates unique slugs** from clinic names (handles duplicates)
3. **Adds constraints** for uniqueness and role validation
4. **Creates non-recursive RLS functions** with SECURITY DEFINER
5. **Implements RPC functions** for secure member management
6. **Updates RLS policies** to use the new functions
7. **Adds active_clinic_id** to user_profiles with validation

## After Migration

1. **Test the application** using the MODULE2_TEST_CHECKLIST.md
2. **Check browser console** for any remaining errors
3. **Verify multi-user scenarios** work correctly

## Troubleshooting

If you get any errors during migration:
1. Check if any of the functions/tables already exist
2. Run individual sections if the full migration fails
3. Check the error messages in Supabase dashboard

The migration is designed to be safe to run multiple times (uses `IF NOT EXISTS` and `DROP IF EXISTS`).