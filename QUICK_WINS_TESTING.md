# Quick Wins Testing Guide

This guide provides step-by-step browser testing instructions for the 4 quick wins implemented.

---

## Prerequisites

1. Ensure the backend server is running: `npm run dev` (in root directory)
2. Ensure the frontend server is running: `cd frontend && npm run dev`
3. Open browser to `http://localhost:5173` (or appropriate frontend URL)

---

## Test 1: Email Validation Messages ✉️

**Goal:** Verify that invalid email addresses show user-friendly error messages.

### Steps:

1. **Navigate to Login Page**
   - Go to `/login` or click "Sign In" from landing page
   - Click on "Register" tab

2. **Test Invalid Email - Short Format**
   - Enter the following:
     - Email: `x@x`
     - Password: `testpassword123`
     - Name: `Test User`
   - Click "Register"
   - **Expected:** Error message displays: "Please enter a valid email address"
   - **Not Expected:** Generic "Invalid request" message

3. **Test Invalid Email - Missing @**
   - Clear form and enter:
     - Email: `notemail.com`
     - Password: `testpassword123`
     - Name: `Test User`
   - Click "Register"
   - **Expected:** Error message displays: "Please enter a valid email address"

4. **Test Short Password**
   - Clear form and enter:
     - Email: `valid@email.com`
     - Password: `short`
     - Name: `Test User`
   - Click "Register"
   - **Expected:** Error message displays: "Password must be at least 8 characters"

5. **Test Valid Registration**
   - Clear form and enter:
     - Email: `validuser@anima.labs`
     - Password: `password123`
     - Name: `Valid User`
   - Click "Register"
   - **Expected:** Registration succeeds, user is logged in

### Success Criteria:
- ✅ Email validation shows clear, user-friendly error messages
- ✅ Password validation shows clear message for minimum length
- ✅ Valid credentials register successfully

---

## Test 2: Delete Ranking System 🗑️

**Goal:** Verify that ranking systems can be deleted by authorized users.

### Steps:

1. **Login as Admin/Researcher**
   - If not logged in as admin/researcher, create a test account
   - The first user automatically gets admin role
   - Otherwise login as: `researcher@anima.labs` / `password123`

2. **Navigate to Rankings Page**
   - Click on "⭐ Rankings" in left sidebar
   - Or go directly to `/rankings`

3. **Create a Test Ranking System**
   - Click "+ Create Ranking System" button
   - Fill in:
     - Name: `Test System for Deletion`
     - Description: `This will be deleted`
     - Category: `Custom`
   - Click "+ Add Criterion"
   - Fill criterion:
     - Name: `Test Criterion`
     - Description: `Test`
     - Min: `1`
     - Max: `5`
   - Click "Create System"
   - **Expected:** System appears in list

4. **Verify Delete Button Visibility**
   - Find the "Test System for Deletion" in the list
   - **Expected:** Two buttons visible: "✏️ Edit" and "🗑️ Delete"
   - **Note:** Delete button only appears if you're the owner or admin

5. **Delete the Ranking System**
   - Click "🗑️ Delete" button
   - **Expected:** Confirmation dialog appears: "Delete ranking system 'Test System for Deletion'? This cannot be undone."
   - Click "Cancel" first to verify it doesn't delete
   - **Expected:** System still appears in list
   - Click "🗑️ Delete" again
   - Click "OK" to confirm
   - **Expected:** System is removed from the list

6. **Verify Deletion Persists**
   - Refresh the page
   - **Expected:** "Test System for Deletion" does not appear in list

### Permission Testing (Optional):

7. **Test as Non-Owner (if multiple users available)**
   - Create a ranking system as User A
   - Logout and login as User B (non-admin)
   - Navigate to `/rankings`
   - **Expected:** User B should NOT see Edit/Delete buttons on User A's system
   - Login back as Admin
   - **Expected:** Admin should see Edit/Delete buttons on all systems

### Success Criteria:
- ✅ Delete button appears for system owner and admins
- ✅ Delete button does not appear for non-owners (unless admin)
- ✅ Confirmation dialog appears before deletion
- ✅ System is removed after confirmation
- ✅ Deletion persists after page refresh

---

## Test 3: Negative Values Prevention in Rating Creation 🚫

**Goal:** Verify that negative values cannot be entered for rating scale min/max.

### Steps:

1. **Navigate to Rankings Page**
   - Ensure you're logged in as researcher/admin
   - Go to `/rankings`

2. **Start Creating New Ranking System**
   - Click "+ Create Ranking System"
   - Fill in basic info:
     - Name: `Negative Test System`
     - Description: `Testing negative value prevention`
     - Category: `Custom`

3. **Test Negative Min Value**
   - Click "+ Add Criterion"
   - Fill criterion name and description
   - Try to enter Min: `-5`
   - **Expected:** Browser prevents entering negative number OR value defaults to 0
   - **Note:** HTML5 `min="0"` attribute should prevent negative values in most browsers

4. **Test Negative Max Value**
   - Try to enter Max: `-10`
   - **Expected:** Browser prevents entering negative number OR value defaults to 0

5. **Test Valid Positive Values**
   - Enter Min: `0`
   - Enter Max: `10`
   - **Expected:** Values are accepted without issue
   - Complete the form and create the system
   - **Expected:** System is created successfully

6. **Test During Edit**
   - Click "✏️ Edit" on a system
   - Try to change Min/Max to negative values
   - **Expected:** Same behavior - negative values prevented

### Success Criteria:
- ✅ Cannot enter negative values in Min field
- ✅ Cannot enter negative values in Max field
- ✅ Positive values (including 0) work correctly
- ✅ Prevention works in both Create and Edit modes

---

## Test 4: Model Update Without Emoji Requirement ✅

**Goal:** Verify that models can be updated without the emoji/avatar field being required.

### Steps:

1. **Navigate to Models Page**
   - Ensure you're logged in as researcher/admin
   - Go to `/models`

2. **Check Existing Models**
   - If no models exist, create one first:
     - Click "+ Add Model"
     - Fill in:
       - Name: `Test Model`
       - Description: `For testing`
       - Provider: `anthropic`
       - Model ID: `test-model-001`
       - Avatar: `🤖` (or any emoji)
       - Color: (any color)
     - Click "Add Model"

3. **Edit Existing Model**
   - Click the "✏️" button on any model
   - Modal opens with model details pre-filled

4. **Test Update Without Changing Emoji**
   - Clear the Avatar field completely (delete the emoji)
   - Change Name: `Test Model - Updated`
   - **Expected:** "Update Model" button should be ENABLED
   - Click "Update Model"
   - **Expected:** Update succeeds
   - **Expected:** Model shows with updated name
   - **Note:** If no avatar, model should show first letter of name or default icon

5. **Test Create Without Emoji**
   - Click "+ Add Model"
   - Fill in:
     - Name: `No Emoji Model`
     - Description: `Testing no emoji`
     - Provider: `openai`
     - Model ID: `no-emoji-001`
     - Avatar: (leave empty or delete content)
     - Color: (any color)
   - **Expected:** "Add Model" button should be ENABLED
   - Click "Add Model"
   - **Expected:** Model is created successfully
   - **Expected:** Model displays with fallback avatar (🤖 or first letter)

6. **Verify Required Fields**
   - Try to create/update a model with:
     - Name: (empty)
     - Model ID: `test-123`
   - **Expected:** Button should be DISABLED
   - Fill in Name: `Test`
   - **Expected:** Button should be ENABLED

### Success Criteria:
- ✅ Model can be updated without avatar/emoji field
- ✅ Model can be created without avatar/emoji field
- ✅ Save button is enabled when name and model_id are filled
- ✅ Save button is disabled only when name or model_id is empty
- ✅ Models without avatars display with fallback icon

---

## Summary Checklist

After completing all tests, verify:

- [ ] **Email Validation**: User-friendly error messages appear for invalid emails
- [ ] **Delete Ranking**: Systems can be deleted with proper permissions
- [ ] **Negative Values**: Cannot enter negative min/max values in criteria
- [ ] **Model Emoji**: Models can be saved without emoji field

---

## Troubleshooting

### If tests fail:

1. **Check Console for Errors**
   - Open browser DevTools (F12)
   - Check Console tab for errors
   - Check Network tab for failed API requests

2. **Verify Server is Running**
   - Backend: Check terminal running `npm run dev`
   - Frontend: Check terminal running frontend dev server

3. **Clear Browser Cache**
   - Sometimes cached code causes issues
   - Hard refresh: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)

4. **Check Permissions**
   - Ensure you're logged in as a user with appropriate roles
   - First user is automatically admin
   - Other test users may need researcher role

---

## Expected Results Summary

All 4 features should work as described above with no console errors or unexpected behavior.

**Total Testing Time:** ~15-20 minutes

---

*Last Updated: November 22, 2025*

