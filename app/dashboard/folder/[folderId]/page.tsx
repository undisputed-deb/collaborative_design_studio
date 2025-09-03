import FolderPager from '@/app/components/FolderPager';

export default async function FolderPage({ params }: { params: Promise<{ folderId: string }> }) {
  const { folderId: rawFolderId } = await params;
  const folderId = decodeURIComponent(rawFolderId);

  return (
    <div className="relative">
      <section className="mx-auto max-w-7xl px-4 pt-4 pb-2">
        <h1 className="text-base text-white/90">Folder: {folderId}</h1>
        <p className="mt-1 text-sm text-white/60">
          150 pages. Use Next/Prev or the number buttons to navigate.
        </p>
      </section>
      <FolderPager folderId={folderId} />
    </div>
  );
}