# Capsulex Auth SDK

The official JavaScript/TypeScript SDK for Capsulex Auth, a robust multi-tenant authentication platform.

## Installation

```bash
npm install capsulex-auth
# or
yarn add capsulex-auth
```

## Features

- Fully typed with TypeScript.
- Frictionless Passwordless Email OTP Flow.
- Standard Email/Password login flows.
- Built-in React Hooks & Context provider.
- Automatic auth state observer pattern (`onAuthStateChange`).
- Secure auto-managed JWT storage logic.

## Usage (React / Next.js)

The SDK ships with a powerful React Provider and hooks out of the box.

### 1. Setup the Provider

Wrap your application in the `<CapsulexProvider>`. You must provide your specific Project API Key.

```tsx
import { CapsulexProvider } from 'capsulex-auth/react';

function App() {
  return (
    <CapsulexProvider 
      apiKey="proj_YOUR_API_KEY_HERE" 
      baseUrl="https://your-capsulex-api.com"
    >
      <YourApplication />
    </CapsulexProvider>
  );
}
```

### 2. Using Authentication Hooks

Use the `useCapsulexAuth` hook anywhere inside the provider to access the current user, or trigger authentication flows.

```tsx
import { useCapsulexAuth } from 'capsulex-auth/react';

function Dashboard() {
  const { user, requestOtp, verifyOtp, logout, isLoading } = useCapsulexAuth();

  if (isLoading) return <p>Loading...</p>;

  if (!user) {
    return (
      <div>
        <h2>Login</h2>
        <button onClick={() => requestOtp('user@example.com')}>
          Send Login Code
        </button>
        <button onClick={() => verifyOtp('user@example.com', '123456')}>
          Verify Code
        </button>
      </div>
    );
  }

  return (
    <div>
      <h1>Welcome, {user.email}!</h1>
      <button onClick={logout}>Sign Out</button>
    </div>
  );
}
```

## Usage (Vanilla JS / TypeScript)

If you aren't using React, you can use the core SDK directly.

```ts
import { CapsulexAuth } from 'capsulex-auth';

const auth = new CapsulexAuth('proj_YOUR_API_KEY_HERE', {
  baseUrl: 'https://your-capsulex-api.com'
});

// Listen to auth state changes anywhere in your app (Firebase style!)
auth.onAuthStateChange((user) => {
  if (user) {
    console.log("Logged in as:", user.email);
  } else {
    console.log("Logged out.");
  }
});

// Request OTP
await auth.requestOtp('user@example.com');

// Verify OTP (this will automatically trigger onAuthStateChange)
await auth.verifyOtp('user@example.com', '123456');

// Logout
auth.logout();
```
