// Stand-in for a page that is not built yet; each page's owner replaces it.
export function PagePlaceholder({ title, description }: { title: string; description: string }) {
  return (
    <section className="mx-auto flex w-full max-w-page flex-col gap-s2 px-s4 pt-s6 wide:px-s8">
      <h1 className="text-2xl">{title}</h1>
      <p className="text-muted">{description}</p>
    </section>
  );
}
