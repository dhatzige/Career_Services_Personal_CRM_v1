# Invite-Only Registration Flow

## How the System Works

### 1. Master Account Can Invite Users

Since public signups are disabled in Supabase, new users can ONLY join through invitations.

### 2. Sending an Invitation (as Master)

When logged in as master user, you would:

1. Call the API endpoint `POST /api/invitations` with:
   ```json
   {
     "email": "newuser@example.com",
     "role": "user",
     "expiresInDays": 7
   }
   ```

2. This generates a unique invitation token and URL like:
   ```
   http://localhost:5173/register?token=abc123def456...
   ```

3. You would send this URL to the invited user (via email, Slack, etc.)

### 3. User Registration Process

The invited user:
1. Clicks the invitation link
2. Goes to your app's registration page (NOT Supabase's)
3. Enters their password
4. Submits to `/api/auth/register` with the token

### 4. Behind the Scenes

Our backend:
1. Verifies the invitation token is valid and not expired
2. Uses the SERVICE_ROLE_KEY to create the user in Supabase (bypassing public signup restrictions)
3. Creates the user in our users table with the assigned role
4. Marks the invitation as used

### 5. Important Notes

- **Public signups remain disabled** - This is correct and intentional
- **Email confirmation**: For the master account, you can ignore the Supabase email. The account is already active.
- **Port 3000 issue**: This is a Supabase default. We've updated the config to use port 5173.
- **Invited users**: They will receive a confirmation email from Supabase, but with the correct URL now.

## Testing the Flow

To test inviting a user:

1. Login as master account
2. Create an invitation via API
3. Use the generated URL to register the new user
4. The new user can then login normally

## Email Service Integration

For production, you would:
1. Use the Resend integration we set up
2. Automatically email invitation links to invited users
3. Customize the Supabase email templates in the dashboard to match your branding