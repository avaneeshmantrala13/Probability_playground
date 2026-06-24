import { Brand } from "./Brand";

/** Shown when .env Firebase config is missing so the app fails gracefully. */
export function FirebaseSetupNotice() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="pp-card w-full max-w-lg p-8">
        <div className="mb-6">
          <Brand size={40} withWordmark />
        </div>
        <h1 className="text-xl font-bold text-primary mb-2">Finish Firebase setup</h1>
        <p className="text-secondary mb-5">
          The app can&apos;t find your Firebase configuration. Create a free
          (Spark plan) Firebase project in the browser, then add the values to a
          <code className="px-1.5 py-0.5 mx-1 rounded bg-surface-muted text-primary text-sm">
            .env
          </code>
          file.
        </p>
        <ol className="list-decimal list-inside space-y-2 text-secondary text-sm mb-6">
          <li>Go to console.firebase.google.com and create a project.</li>
          <li>Enable Authentication &rarr; Email/Password and Google providers.</li>
          <li>Create a Firestore database (production mode).</li>
          <li>Register a Web app and copy its config values.</li>
          <li>
            Copy <code className="text-primary">.env.example</code> to{" "}
            <code className="text-primary">.env</code> and paste the values.
          </li>
          <li>Restart the dev server.</li>
        </ol>
        <p className="text-muted text-xs">
          Detailed step-by-step instructions live in the project README.
        </p>
      </div>
    </div>
  );
}
