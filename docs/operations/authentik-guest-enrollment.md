# Authentik Guest Enrollment Flow

This document describes guest enrollment options for Karaoke Eternal.

## Overview

When a guest scans a QR code, they see a landing page with two options:
1. **Login with Account** - Uses OIDC login flow
2. **Join as Guest** - Creates an app-managed guest session (recommended)

## Guest Join Options

### Option 1: App-Managed Guests (Recommended)

The app creates guest sessions internally without involving Authentik:
- Guest clicks "Join as Guest" on landing page
- App creates local guest user with JWT session
- No Authentik account created
- Session tied to room via invitation token

This is simpler and doesn't pollute Authentik with guest accounts.

### Option 2: Authentik Enrollment Flow (Legacy)

For scenarios requiring Authentik guest accounts:

**Flow name**: `karaoke-guest-enrollment`
**Slug**: `karaoke-guest-enrollment`
**Designation**: Enrollment

#### Stages

##### Stage 1: Prompt (Capture URL Parameters)

**Name**: `karaoke-guest-prompt`
**Type**: Prompt Stage

Create two fields:

| Field Key | Type | Label | Required |
|-----------|------|-------|----------|
| `guest_name` | Text | Guest Name | No |
| `itoken` | Hidden | - | No |

##### Stage 2: User Write (Create Account)

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

suggested = context.get('prompt_data', {}).get('guest_name', '').strip()

if not suggested:
    adjectives = ['Red', 'Blue', 'Green', 'Gold', 'Silver', 'Swift', 'Bright', 'Lucky']
    animals = ['Penguin', 'Dolphin', 'Tiger', 'Eagle', 'Wolf', 'Fox', 'Bear', 'Hawk']
    suggested = random.choice(adjectives) + random.choice(animals)

username = suggested
counter = 1
while User.objects.filter(username=username).exists():
    username = f"{suggested}{counter}"
    counter += 1

return username
```

##### Stage 3: User Login

**Name**: `karaoke-guest-login`
**Type**: User Login Stage

##### Stage 4: Redirect

**Name**: `karaoke-guest-redirect`
**Type**: Redirect Stage

**URL Expression**:

```python
itoken = context.get('prompt_data', {}).get('itoken', '')
if itoken:
    return f"/join?itoken={itoken}"
return "/"
```

#### Flow Bindings

| Order | Stage |
|-------|-------|
| 10 | `karaoke-guest-prompt` |
| 20 | `karaoke-guest-user-write` |
| 30 | `karaoke-guest-login` |
| 40 | `karaoke-guest-redirect` |

## Group Configuration

Create a group for guests:

**Name**: `karaoke-guests`

This group is used by the app to identify guest users (via OIDC `groups` claim).

## Testing

### App-Managed Guest Test

1. Scan QR code (unauthenticated)
2. Click "Join as Guest"
3. Should land in room library immediately

### Authentik Enrollment Test

1. Visit enrollment URL:
```
https://auth.example.com/if/flow/karaoke-guest-enrollment/?guest_name=TestUser&itoken=abc123
```
2. Account should be created
3. User redirected back to app
4. OIDC login completes the flow

## Security Considerations

1. **No password required**: Guests authenticate via SSO only.
2. **itoken validation**: The app validates the itoken, not Authentik.
3. **Rate limiting**: Consider enabling rate limiting on the enrollment flow.
4. **Guest cleanup**: Guest accounts accumulate over time. Consider a separate cleanup job (outside the app).
