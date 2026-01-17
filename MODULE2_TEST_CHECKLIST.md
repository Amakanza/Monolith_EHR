# Module 2 Test Checklist

## Database Migration & Schema
- [ ] Run `20250117000000_module2_harden.sql` migration successfully
- [ ] Verify `clinics.slug` column exists and is unique
- [ ] Verify `clinic_memberships` unique constraint exists
- [ ] Verify role check constraint exists
- [ ] Verify `user_profiles.active_clinic_id` column exists

## RLS Security Testing
- [ ] Test that users can only see clinics they belong to
- [ ] Test that non-members cannot access clinic data
- [ ] Test that only admins/owners can add members
- [ ] Test that only owners can add other owners
- [ ] Test that last owner cannot be removed/demoted
- [ ] Test that users can only set active_clinic_id to clinics they belong to

## Clinic Creation & Management
- [ ] Create a new clinic - should automatically create owner membership
- [ ] Verify `user_profiles.active_clinic_id` is set after clinic creation
- [ ] Test clinic list shows role for each clinic
- [ ] Test clinic switcher in navbar works correctly

## Member Management
- [ ] Add new member with clinician role (as owner/admin)
- [ ] Verify new member appears in members list
- [ ] Update member role from clinician to admin
- [ ] Try to add owner as admin (should fail)
- [ ] Remove member (as owner/admin)
- [ ] Try to remove last owner (should fail)

## Multi-User Scenarios
- [ ] Create second user account
- [ ] Second user should see "You don't belong to any clinics yet" initially
- [ ] Add second user as member to existing clinic
- [ ] Verify second user can now see the clinic in their list
- [ ] Verify second user's role is displayed correctly

## UI Functionality
- [ ] My Clinics page loads without errors
- [ ] Clinics list shows role badges
- [ ] "Open" button works and sets active clinic
- [ ] Clinic Members page loads and shows all members
- [ ] Member role dropdown works for admins/owners
- [ ] Add member form works
- [ ] Remove member confirmation works

## Error Handling
- [ ] Test "Failed to fetch clinics" error is resolved
- [ ] Test proper error messages for invalid operations
- [ ] Test validation for required fields
- [ ] Test duplicate member addition error

## Performance & Edge Cases
- [ ] Test with no clinics (empty state)
- [ ] Test with single clinic
- [ ] Test with multiple clinics
- [ ] Test rapid clinic switching
- [ ] Test concurrent member operations

## Data Integrity
- [ ] Verify no duplicate clinic names can exist (or at least duplicate slugs)
- [ ] Verify memberships are unique (clinic_id, user_id)
- [ ] Verify all clinics have at least one owner
- [ ] Verify all user_profiles rows exist for authenticated users

## Cleanup
- [ ] Remove test clinics and members if needed
- [ ] Verify no orphaned memberships exist
- [ ] Verify all RLS policies are working correctly

## Notes
- Run the migration first: `supabase db push` or apply the SQL directly
- Test with multiple browser sessions to simulate different users
- Check browser console for any remaining errors
- Verify database logs show no RLS violations