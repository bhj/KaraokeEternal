# Architecture: SSO Integration Overlay

This document visualizes how the "Smart QR" system overlays onto the standard Forward Auth architecture.

## The Standard Flow (Strict Forward Auth)
In a standard setup, the Proxy (Caddy) enforces authentication for 100% of requests.

```mermaid
graph TD
    User((User)) -->|HTTPS| Caddy{Caddy Proxy}
    Caddy -->|Check Auth| Authentik[Authentik Outpost]
    
    Authentik --"401 Unauthorized"--> Caddy
    Caddy --"Redirect"--> Login[Login Page]
    
    Authentik --"200 OK + Headers"--> Caddy
    Caddy --"Request + X-Headers"--> App[Karaoke App]
```

## The Overlay Flow (Smart QR Bypass)
To support a unified entry point for Guests and Users, we poke a specific hole in the Proxy layer.

```mermaid
graph TD
    User((User / Guest)) -->|Scan QR| URL["/api/rooms/join/..."]
    URL --> Caddy{Caddy Proxy}
    
    subgraph "Infrastructure Layer"
        Caddy -- "Path matches /join/* ?" --> Decision{Bypass?}
    end
    
    Decision -- "YES (Bypass)" --> AppLogic[App: Join Handler]
    Decision -- "NO (Default)" --> Authentik[Authentik Check]
    
    subgraph "Application Logic"
        AppLogic -- "Check Cookie" --> Session{Logged In?}
        Session -- "YES" --> Join[Set Cookie & Join Room]
        Session -- "NO" --> Redirect[Redirect to Authentik Enrollment]
    end
    
    Authentik -->|Auth OK| App[App: Protected Routes]
    Redirect --> AuthentikEnroll[Authentik Guest Flow]
    AuthentikEnroll -->|Success| App
```

## Why this is necessary
1.  **Context Awareness:** The *Proxy* doesn't know if the user intends to "Join a Room" or "Hack the Admin Panel". It just sees "Not Logged In".
2.  **The App Knows:** The *App* knows that `/join/123/abc` is a special intent. It can make the intelligent decision to send guests to a specific *Enrollment Flow* (for that room) rather than a generic Login Page.
3.  **Friction Reduction:** Existing users (who have a cookie) skip the Authentik check entirely for this specific action, preventing "User Already Exists" errors from the enrollment flow.
