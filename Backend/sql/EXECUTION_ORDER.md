# SQL Files Execution Order Guide

This document provides a clear execution order for all SQL migration files in the Hawker Urban Vending System. Each file has been analyzed for dependencies and execution order.

## ⚠️ CRITICAL: Foundation File

**01_hawker_schema.sql** must be run first as it creates the base database structure and core tables.

---

## Execution Order by Phase

### Phase 1: Database Foundation (REQUIRED - Run in order)

1. **01_hawker_schema.sql**
   - Creates database `hawker`
   - Creates core tables: users, vendor_profiles, vendor_documents, license_applications, etc.
   - BEFORE: All other files
   - AFTER: Nothing

---

### Phase 2: Core Enhancements (REQUIRED - Run in order)

2. **02_hawker_demo_data.sql**
   - Inserts demo users (admin, vendors)
   - BEFORE: Data-dependent features
   - AFTER: 01_hawker_schema.sql

3. **03_license_application_schema.sql**
   - Creates license_types, vending_zones tables
   - Enhances license_applications
   - BEFORE: 04, 07, 12, 18, 37, 35
   - AFTER: 01_hawker_schema.sql

4. **04_demo_data_license_app.sql**
   - Inserts license types and vending zones demo data
   - BEFORE: Schema-dependent features
   - AFTER: 03_license_application_schema.sql

5. **05_fix_license_application_status.sql**
   - Updates license_applications status ENUM
   - BEFORE: 12, 13
   - AFTER: 01_hawker_schema.sql

6. **06_add_profile_picture.sql**
   - Adds profile picture columns to vendor_profiles
   - BEFORE: 16_add_profile_picture_blob.sql
   - AFTER: 01_hawker_schema.sql

---

### Phase 3: Admin & Complaint System (REQUIRED - Run in order)

7. **07_admin_feature_schema.sql**
   - Creates generated_reports, vendor_complaints tables
   - BEFORE: 08, 10
   - AFTER: 03_license_application_schema.sql

8. **08_final_admin_setup.sql**
   - Creates application_audit_logs, admin_notifications, application_status_history
   - BEFORE: 09, 24
   - AFTER: 07_admin_feature_schema.sql

9. **09_vendor_license_renewal_schema.sql**
   - Creates vendor_licenses, license_renewals tables
   - BEFORE: 18
   - AFTER: 08_final_admin_setup.sql

10. **09_vendor_notifications_schema.sql**
    - Creates vendor_notifications, vendor_notification_preferences
    - BEFORE: 15, 16, 17, 34
    - AFTER: 08_final_admin_setup.sql

11. **10_vendor_complaints_evidence.sql**
    - Creates complaint_evidence table
    - Modifies vendor_complaints
    - BEFORE: 11
    - AFTER: 07_admin_feature_schema.sql

12. **11_complaint_comments.sql**
    - Creates complaint_comments table
    - BEFORE: 14, 23
    - AFTER: 10_vendor_complaints_evidence.sql

---

### Phase 4: License Management (REQUIRED - Run in order)

13. **12_add_license_fileds.sql**
    - Adds license_number, issued_at, expires_at to license_applications
    - BEFORE: 13, 17
    - AFTER: 03_license_application_schema.sql, 05_fix_license_application_status.sql

14. **13_fix_approved_licenses.sql**
    - Updates approved licenses with generated license numbers
    - BEFORE: 17
    - AFTER: 12_add_license_fileds.sql

15. **17_fix_approved_license_fields.sql**
    - Fixes allocated zone and goods authorized for approved licenses
    - BEFORE: Data dependent features
    - AFTER: 13_fix_approved_licenses.sql, 15_populate_vending_zones.sql

---

### Phase 5: Notifications Management (Run in order)

16. **14_verify_and_populate_notifications.sql**
    - Verifies and populates vendor_notifications
    - BEFORE: 17
    - AFTER: 09_vendor_notifications_schema.sql, 11_complaint_comments.sql

17. **15_add_notification_hidden_field.sql**
    - Adds is_hidden field to vendor_notifications
    - BEFORE: 16, 17
    - AFTER: 09_vendor_notifications_schema.sql

18. **15_populate_vending_zones.sql**
    - Populates vending_zones table
    - BEFORE: 17, 19
    - AFTER: 03_license_application_schema.sql

19. **16_add_profile_picture_blob.sql**
    - Adds BLOB columns to vendor_profiles
    - BEFORE: Profile picture features
    - AFTER: 06_add_profile_picture.sql

20. **16_enhance_notifications_schema.sql**
    - Adds action_type and related fields to vendor_notifications
    - BEFORE: 36
    - AFTER: 15_add_notification_hidden_field.sql

21. **17_update_existing_notifications.sql**
    - Updates existing notifications with proper data
    - BEFORE: 18, 36
    - AFTER: 14_verify_and_populate_notifications.sql, 15_add_notification_hidden_field.sql

22. **18_insert_test_notification.sql**
    - Inserts test notification
    - BEFORE: Optional
    - AFTER: 17_update_existing_notifications.sql

23. **18_sync_vendor_profile_data.sql**
    - Syncs vendor profile data with licenses
    - BEFORE: Data dependent features
    - AFTER: 09_vendor_license_renewal_schema.sql, 15_populate_vending_zones.sql

24. **19_add_zone_details.sql**
    - Adds additional fields to vending_zones
    - BEFORE: Zone dependent features
    - AFTER: 15_populate_vending_zones.sql

---

### Phase 6: Payment System (Run in order)

25. **20_vendor_payment_schema.sql**
    - Creates payment_types, payment_methods, discount_codes
    - BEFORE: 21, 22
    - AFTER: 01_hawker_schema.sql

26. **21_create_missing_payment_tables.sql**
    - Creates vendor_payments, vendor_dues
    - BEFORE: 22, 23
    - AFTER: 20_vendor_payment_schema.sql

27. **22_insert_discount_codes.sql**
    - Inserts sample discount codes
    - BEFORE: Payment features
    - AFTER: 21_create_missing_payment_tables.sql

28. **23_add_license_payment_connection.sql**
    - Links payments to license_applications
    - BEFORE: Payment verification
    - AFTER: 21_create_missing_payment_tables.sql, 03_license_application_schema.sql

---

### Phase 7: Settings & Inspections (Run in order)

29. **24_vendor_settings_schema.sql**
    - Creates vendor_settings table
    - BEFORE: 25
    - AFTER: 09_vendor_notifications_schema.sql, 08_final_admin_setup.sql

30. **25_inspections_schema.sql**
    - Creates inspectors, inspection_templates, inspections
    - BEFORE: Inspection features
    - AFTER: 24_vendor_settings_schema.sql

---

### Phase 8: Women Vendor Support (Run in order)

31. **26_women_vendor_support_schema.sql**
    - Creates women support tables (schemes, mentors, success_stories, posts)
    - BEFORE: 27, 28, 32, 33
    - AFTER: 01_hawker_schema.sql

32. **27_add_gender_column.sql**
    - Adds gender column to vendor_profiles
    - BEFORE: Women features
    - AFTER: 26_women_vendor_support_schema.sql

33. **28_enhance_women_scheme_applications.sql**
    - Enhances women_scheme_applications table
    - BEFORE: Women scheme features
    - AFTER: 26_women_vendor_support_schema.sql

34. **32_women_community_features_simple.sql**
    - Creates women_post_likes, comments, saves, shares
    - BEFORE: 33
    - AFTER: 26_women_vendor_support_schema.sql

35. **33_add_community_post_counts.sql**
    - Adds count columns to women_community_posts
    - BEFORE: Community features
    - AFTER: 32_women_community_features_simple.sql

---

### Phase 9: Feedback & Announcements

36. **29_feedback_system.sql**
    - Creates feedback tables
    - BEFORE: Feedback features
    - AFTER: 01_hawker_schema.sql

37. **30_announcement_system.sql**
    - Creates announcements tables
    - BEFORE: Announcement features
    - AFTER: 01_hawker_schema.sql

---

### Phase 10: Data Integrity & Advanced Features (Run in order)

38. **34_fix_corrupted_notifications.sql**
    - Fixes corrupted notification data
    - BEFORE: Optional
    - AFTER: 09_vendor_notifications_schema.sql

39. **35_multi_step_approval_workflow.sql**
    - Adds multi-step approval fields and new user roles
    - BEFORE: 36
    - AFTER: 01_hawker_schema.sql, 03_license_application_schema.sql

40. **36_update_notification_action_types.sql**
    - Updates notification action_type ENUM
    - BEFORE: Workflow features
    - AFTER: 35_multi_step_approval_workflow.sql, 16_enhance_notifications_schema.sql

41. **37_add_zone_rectangle_coordinates.sql**
    - Adds zone rectangle to license_applications
    - BEFORE: Zone mapping features
    - AFTER: 03_license_application_schema.sql

---

## Quick Reference: Dependency Summary

| File | Depends On | Required Before   |
| ---- | ---------- | ----------------- |
| 01   | -          | Everything        |
| 02   | 01         | Optional          |
| 03   | 01         | 04,07,12,18,37,35 |
| 04   | 03         | Optional          |
| 05   | 01         | 12,13             |
| 06   | 01         | 16                |
| 07   | 03         | 08,10             |
| 08   | 07         | 09,24             |
| 09R  | 08         | 18                |
| 09N  | 08         | 15,16,17,34       |
| 10   | 07         | 11                |
| 11   | 10         | 14,23             |
| 12   | 03,05      | 13,17             |
| 13   | 12         | 17                |
| 14   | 09N,11     | 17                |
| 15H  | 09N        | 16,17             |
| 15Z  | 03         | 17,19             |
| 16B  | 06         | Optional          |
| 16E  | 15H        | 36                |
| 17A  | 13,15Z     | Optional          |
| 17B  | 14,15H     | 18,36             |
| 18N  | 17B        | Optional          |
| 18S  | 09R,15Z    | Optional          |
| 19   | 15Z        | Optional          |
| 20   | 01         | 21,22             |
| 21   | 20         | 22,23             |
| 22   | 21         | Optional          |
| 23   | 21,03      | Optional          |
| 24   | 09N,08     | 25                |
| 25   | 24         | Optional          |
| 26   | 01         | 27,28,32,33       |
| 27   | 26         | Optional          |
| 28   | 26         | Optional          |
| 32   | 26         | 33                |
| 33   | 32         | Optional          |
| 29   | 01         | Optional          |
| 30   | 01         | Optional          |
| 34   | 09N        | Optional          |
| 35   | 01,03      | 36                |
| 36   | 35,16E     | Optional          |
| 37   | 03         | Optional          |

---

## Recommended Execution Groups

For easier management, files can be executed in these groups:

**Group 1 (Foundation):**

```
01, 02, 03, 04, 05, 06
```

**Group 2 (Admin System):**

```
07, 08, 09R, 09N, 10, 11
```

**Group 3 (License Management):**

```
12, 13, 14, 15H, 15Z, 16B, 16E, 17A, 17B, 18N, 18S, 19
```

**Group 4 (Payment System):**

```
20, 21, 22, 23
```

**Group 5 (Settings & Inspections):**

```
24, 25
```

**Group 6 (Women Vendor Support):**

```
26, 27, 28, 32, 33
```

**Group 7 (Feedback & Announcements):**

```
29, 30
```

**Group 8 (Finalization):**

```
34, 35, 36, 37
```

---

## Notes

- Each file has been updated with comments indicating its execution dependencies
- Files with the same prefix number (e.g., 09_vendor_license_renewal_schema and 09_vendor_notifications_schema) can be run in any order after their dependencies are satisfied
- Optional files can be skipped if not needed for your specific setup
- Always run files in the specified order to avoid foreign key constraint errors
