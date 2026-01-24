# Authentik Guest Enrollment Flow

This document describes how to configure Authentik to handle guest enrollment for Karaoke Eternal.

## Overview

When a guest scans a QR code, they see a landing page with two options:
1. **Login with Account** - Uses existing Authentik outpost (no changes needed)
2. **Join as Guest** - Creates a new guest account via this enrollment flow

The enrollment flow:
1. Captures `guest_name` and `itoken` from URL parameters
2. Creates a user account (handling username collisions)
3. Logs the user in
4. Redirects back to `/join?itoken=xxx` to complete the room join

## Flow Configuration

**Flow name**: `karaoke-guest-enrollment`
**Slug**: `karaoke-guest-enrollment`
**Designation**: Enrollment

This slug must match the `KES_AUTHENTIK_ENROLLMENT_FLOW` environment variable.

## Stages

### Stage 1: Prompt (Capture URL Parameters)

**Name**: `karaoke-guest-prompt`
**Type**: Prompt Stage

Create two fields:

| Field Key | Type | Label | Required | Placeholder |
|-----------|------|-------|----------|-------------|
| `guest_name` | Text | Guest Name | No | (leave empty - populated from URL) |
| `itoken` | Hidden | - | No | - |

**Settings**:
- Check "Fields are editable by user" for `guest_name` only
- The hidden `itoken` field passes through to the redirect stage

### Stage 2: User Write (Create Account)

**Name**: `karaoke-guest-user-write`
**Type**: User Write Stage

**Settings**:
- Create users if they don't exist: **Yes**
- User type: **Internal**
- Groups: Add `karaoke-guests` group
- Path: `guests/`

**Username Expression** (handles collisions):

```python
from authentik.core.models import User
import random

# Get suggested name from prompt
suggested = context.get('prompt_data', {}).get('guest_name', '').strip()

# Fallback: generate random name if none provided
if not suggested:
    adjectives = ['Red', 'Blue', 'Green', 'Gold', 'Silver', 'Swift', 'Bright', 'Lucky']
    animals = ['Penguin', 'Dolphin', 'Tiger', 'Eagle', 'Wolf', 'Fox', 'Bear', 'Hawk']
    suggested = random.choice(adjectives) + random.choice(animals)

# Handle username collision by appending numbers
username = suggested
counter = 1
while User.objects.filter(username=username).exists():
    username = f"{suggested}{counter}"
    counter += 1

return username
```

**Password**: Set to generate a random password (guests authenticate via SSO, not password).

### Stage 3: User Login

**Name**: `karaoke-guest-login`
**Type**: User Login Stage

**Settings**:
- Session duration: Use default or match your main authentication flow
- Stay signed in offset: Optional

This issues the session cookie that Authentik uses to identify the user.

### Stage 4: Redirect

**Name**: `karaoke-guest-redirect`
**Type**: Redirect Stage

**Mode**: Static
**URL Expression**:

```python
# Pass itoken back to the app to complete the join
itoken = context.get('prompt_data', {}).get('itoken', '')
if itoken:
    return f"/join?itoken={itoken}"
return "/"
```

This redirects back to the landing page with the itoken. The app will:
1. Detect the user is now logged in (via Authentik headers)
2. Auto-complete the join using the itoken
3. Redirect to the library

## Flow Bindings

Bind the stages in order:

| Order | Stage |
|-------|-------|
| 10 | `karaoke-guest-prompt` |
| 20 | `karaoke-guest-user-write` |
| 30 | `karaoke-guest-login` |
| 40 | `karaoke-guest-redirect` |

## Group Configuration

Create a group for guests:

**Name**: `karaoke-guests`

This group is used by the app to identify guest users. Guests have limited permissions (e.g., cannot be admins).

## Testing

### 1. Direct Flow Test

Visit the enrollment URL directly:
```
https://auth.example.com/if/flow/karaoke-guest-enrollment/?guest_name=TestUser&itoken=abc123
```

Expected:
- Account created as `TestUser` (or `TestUser1` if collision)
- Redirects to `/join?itoken=abc123`

### 2. Collision Test

1. Create a user named `RedPenguin`
2. Visit enrollment with `guest_name=RedPenguin`
3. Should create `RedPenguin1`

### 3. Full Flow Test

1. Scan QR code (unauthenticated)
2. See landing page with room name
3. Click "Join as [GuestName]"
4. Should redirect through Authentik enrollment
5. Should end up in the room's library

## Troubleshooting

### "User already exists" error
The username expression isn't handling collisions. Check the Python expression in the User Write stage.

### Redirect goes to `/` instead of `/join?itoken=...`
The itoken isn't being captured. Ensure:
1. The prompt stage has an `itoken` hidden field
2. The redirect expression reads from `context.get('prompt_data', {}).get('itoken', '')`

### User not in `karaoke-guests` group
Check the User Write stage has the group configured.

## Security Considerations

1. **No password required**: Guests authenticate via SSO only. Random password is set to prevent password-based login.

2. **itoken validation**: The app validates the itoken, not Authentik. Authentik just passes it through.

3. **Rate limiting**: Consider enabling rate limiting on the enrollment flow to prevent abuse.

4. **Guest cleanup**: Guest accounts accumulate over time. Consider a separate cleanup job (outside the app - see "Janitor Prohibition" in CLAUDE.md).
