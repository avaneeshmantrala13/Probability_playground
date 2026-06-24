# Probability Playground

A Brilliant-inspired, learn-by-doing platform for high-school probability and
introductory statistics. Students manipulate interactive simulations, watch
charts update in real time, then answer questions and get instant feedback.

Built with **React + TypeScript + Vite + TailwindCSS + React Router**, backed by
**Firebase Authentication + Firestore** on the **Spark (free) plan**. No Cloud
Functions, no paid services, no AI features.

## Quick start

```bash
npm install
cp .env.example .env   # then fill in your Firebase values (see below)
npm run dev
```

Open http://localhost:5173.

## Firebase setup (free Spark plan, browser only)

You only need a browser. Everything below works on the free tier.

1. Go to https://console.firebase.google.com and click **Add project**.
   Give it a name and finish the wizard (Google Analytics is optional).
2. In the left sidebar open **Build -> Authentication -> Get started**.
   - Enable the **Email/Password** provider.
   - Enable the **Google** provider (pick a support email).
3. Open **Build -> Firestore Database -> Create database**.
   - Choose **Production mode** and a location near you.
4. Paste the contents of [`firestore.rules`](firestore.rules) into
   **Firestore -> Rules** and click **Publish**.
5. Open **Project settings** (gear icon) -> **General** -> scroll to
   **Your apps** -> click the **Web** icon (`</>`) to register a web app.
6. Copy the `firebaseConfig` values into your `.env` file:

   ```
   VITE_FIREBASE_API_KEY=...
   VITE_FIREBASE_AUTH_DOMAIN=...
   VITE_FIREBASE_PROJECT_ID=...
   VITE_FIREBASE_STORAGE_BUCKET=...
   VITE_FIREBASE_MESSAGING_SENDER_ID=...
   VITE_FIREBASE_APP_ID=...
   ```

7. Restart `npm run dev`.

If `.env` is missing or incomplete, the app shows a friendly setup screen
instead of crashing.

## Authentication model

- **Sign up** collects username + email + password.
- A public `usernameMappings/{username}` document maps a username to its email
  so that username logins can be resolved client-side (no Cloud Functions).
- **Log in** accepts a username *or* an email, plus the password. Google
  sign-in is also supported.
- There is no guest mode; authentication is required to access lessons.

## Deploying to Vercel

The frontend deploys to Vercel; Firebase stays as the backend (no server code).

1. Push this repo to GitHub/GitLab and import it in Vercel.
2. Framework preset: **Vite**. Build command `npm run build`, output `dist`.
3. In **Vercel -> Project -> Settings -> Environment Variables**, add the same
   `VITE_FIREBASE_*` values from your `.env` (for Production and Preview).
4. Deploy. `vercel.json` rewrites all routes to `index.html` so client-side
   routes (e.g. `/lessons/lesson_1`) work on refresh.
5. In **Firebase Console -> Authentication -> Settings -> Authorized domains**,
   add your Vercel domain so Google sign-in works in production.

## Scripts

| Script                     | Description                          |
| -------------------------- | ------------------------------------ |
| `npm run dev`              | Start the Vite dev server            |
| `npm run build`            | Type-check and build                 |
| `npm run preview`          | Preview the production build         |
| `npm run validate:content` | Validate the lesson content files    |

## Project structure

```
src/
  components/      UI primitives, layout, (later) simulations
  context/         React Context providers (Auth, Theme, Progress)
  content/         Lesson JSON + types (added in later stages)
  lib/             Firebase init + auth service
  pages/           Route-level screens
firestore.rules    Security rules (Spark-plan safe)
```

## Build stages

This MVP is built in staged increments. A summary of each completed stage lives
in [`docs/`](docs).
