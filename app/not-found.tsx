import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center space-y-6">
      <p className="text-6xl font-semibold text-muted-foreground/30">404</p>
      <div className="space-y-2">
        <h1 className="text-xl font-semibold">Page not found</h1>
        <p className="text-sm text-muted-foreground">The page you're looking for doesn't exist.</p>
      </div>
      <Link href="/" className="text-sm bg-foreground text-background px-5 py-2 rounded-md hover:opacity-90 transition-opacity">
        Go home
      </Link>
    </div>
  );
}
