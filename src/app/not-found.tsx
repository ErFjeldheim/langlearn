import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 text-center">
      <p className="text-5xl">🤔</p>
      <h1 className="mt-3 text-xl font-semibold">Esa lección no existe.</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Vuelve a la lista de lecciones.
      </p>
      <Link
        href="/lessons"
        className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
      >
        Ver lecciones
      </Link>
    </div>
  );
}
