'use client';

import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import ShareModal from '@/app/components/ShareModal';
import { Icon } from '@iconify/react';

interface Project {
  id: string;
  name: string;
  ownerId: string;
  folder?: string;
  tags?: string[];
}

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);
  const [shareProjectId, setShareProjectId] = useState<string | null>(null);
  const [filterFolder, setFilterFolder] = useState<string>('All');
  const [filterTag, setFilterTag] = useState<string>('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFolder, setEditFolder] = useState<string>('');
  const [editTags, setEditTags] = useState<string>('');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState<string>('');

  const fetchProjects = async () => {
    setLoading(true);
    const res = await fetch('/api/projects');
    const json = await res.json();
    setProjects((json.projects || []) as Project[]);
    setLoading(false);
  };

  useEffect(() => {
    void fetchProjects();
  }, []);

  const createProject = async () => {
    setCreateError(null);
    if (!name.trim()) { setCreateError('Project name is required'); return; }
    setCreating(true);
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to create');
      window.location.href = `/studio?projectId=${json.id}`;
    } finally {
      setCreating(false);
    }
  };

  const deleteProject = async (id: string) => {
    if (!confirm('Delete this project?')) return;
    const res = await fetch(`/api/projects?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    if (res.ok) void fetchProjects();
  };

  const saveEdits = async (id: string) => {
    const tags = editTags.split(',').map(t => t.trim()).filter(Boolean).slice(0, 6);
    const res = await fetch('/api/projects', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, folder: editFolder || 'General', tags }) });
    if (res.ok) { setEditingId(null); void fetchProjects(); }
  };

  const saveRename = async (id: string) => {
    if (!renameValue.trim()) return;
    const res = await fetch('/api/projects', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, name: renameValue.trim() }) });
    if (res.ok) { setRenamingId(null); setRenameValue(''); void fetchProjects(); }
  };

  const allFolders = useMemo(() => Array.from(new Set(projects.map(p => p.folder || 'General'))), [projects]);
  const allTags = useMemo(() => Array.from(new Set(projects.flatMap(p => p.tags || []))), [projects]);
  const filtered = useMemo(() => {
    return projects.filter(p => (filterFolder==='All' || (p.folder||'General')===filterFolder) && (!filterTag || (p.tags||[]).includes(filterTag)));
  }, [projects, filterFolder, filterTag]);

  return (
    <div
      className="min-h-screen text-white"
      style={{
        backgroundImage:
          'radial-gradient( circle farthest-corner at 10% 20%,  rgba(2,37,78,1) 0%, rgba(4,56,126,1) 19.7%, rgba(85,245,221,1) 100.2% )',
      }}
    >
      <div className="max-w-5xl mx-auto px-6 py-8" id="projects">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-medium">Your Projects</h2>
          <Link href="/" className="text-sm text-white/80 hover:text-white">Home</Link>
        </div>

        <div className="mb-6 flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-white/70">Folder</span>
            <select value={filterFolder} onChange={(e)=>setFilterFolder(e.target.value)} className="bg-white/10 border border-white/20 rounded-md px-2 py-1 outline-none">
              {['All', ...allFolders].map(f => (<option key={f} value={f}>{f}</option>))}
            </select>
            {filterFolder !== 'All' && (
              <Link
                href={`/dashboard/folder/${encodeURIComponent(filterFolder)}`}
                className="px-2 py-1 rounded-md border border-white/20 bg-white/0 text-white hover:bg-white/10"
              >
                Open folder
              </Link>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-white/70">Tag</span>
            <div className="flex flex-wrap gap-2">
              <button onClick={()=>setFilterTag('')} className={`px-2 py-1 rounded-full border ${filterTag===''?'bg-white text-black border-white':'bg-white/0 text-white border-white/20'}`}>All</button>
              {allTags.map(t => (
                <button key={t} onClick={()=>setFilterTag(t)} className={`px-2 py-1 rounded-full border ${filterTag===t?'bg-white text-black border-white':'bg-white/0 text-white border-white/20'}`}>{t}</button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-1">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="New project name"
            className="flex-1 px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-sm outline-none placeholder:text-white/60"
          />
          <button
            onClick={createProject}
            disabled={creating || !name.trim()}
            className="px-4 py-2 rounded-lg bg-white text-black text-sm disabled:opacity-50"
          >
            {creating ? 'Creating...' : 'Create'}
          </button>
        </div>
        {createError && <div className="mb-6 text-xs text-rose-300">{createError}</div>}
        {!createError && <div className="mb-6" />}

        {loading ? (
          <p className="text-white/80 text-sm">Loading...</p>
        ) : filtered.length === 0 ? (
          <p className="text-white/80 text-sm">No projects yet. Create one above.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((p) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl bg-white/10 backdrop-blur border border-white/20 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm text-white/70">Project</div>
                    <div className="text-lg flex items-center gap-2">
                      {renamingId === p.id ? (
                        <>
                          <input
                            autoFocus
                            value={renameValue}
                            onChange={(e)=>setRenameValue(e.target.value)}
                            className="px-2 py-1 rounded-md bg-white/10 border border-white/20 text-sm outline-none"
                          />
                          <button onClick={() => saveRename(p.id)} className="px-2 py-1 rounded-md bg-white text-black text-xs">Save</button>
                          <button onClick={() => { setRenamingId(null); setRenameValue(''); }} className="px-2 py-1 rounded-md bg-white/0 text-white border border-white/20 text-xs">Cancel</button>
                        </>
                      ) : (
                        <>
                          <span>{p.name}</span>
                          <button
                            onClick={() => { setRenamingId(p.id); setRenameValue(p.name); }}
                            title="Rename"
                            className="px-2 py-1 rounded-md bg-white/0 text-white border border-white/20 text-xs"
                          >Rename</button>
                        </>
                      )}
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-xs text-white/70">
                      <Icon icon="material-symbols:folder" /> {(p.folder||'General')}
                      <Link href={`/dashboard/folder/${encodeURIComponent(p.folder || 'General')}`} className="px-2 py-0.5 rounded-md border border-white/20 bg-white/0 text-white hover:bg-white/10">Open</Link>
                    </div>
                    {(p.tags||[]).length>0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {(p.tags||[]).map((t) => (
                          <span key={t} className="px-2 py-0.5 rounded-full bg-white/10 border border-white/20 text-[11px]">{t}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/studio?projectId=${encodeURIComponent(p.id)}`}
                      className="px-3 py-2 rounded-lg bg-white/0 hover:bg-white/10 border border-white/20 text-sm"
                    >
                      Open
                    </Link>
                    <button
                      onClick={() => setShareProjectId(p.id)}
                      className="px-3 py-2 rounded-lg bg-white/0 hover:bg-white/10 border border-white/20 text-sm flex items-center gap-1"
                      title="Share"
                    >
                      <Icon icon="material-symbols:share" /> Share
                    </button>
                    <button
                      onClick={() => deleteProject(p.id)}
                      className="px-3 py-2 rounded-lg bg-white/0 hover:bg-white/10 border border-white/20 text-sm flex items-center gap-1"
                      title="Delete"
                    >
                      <Icon icon="mdi:trash" /> Delete
                    </button>
                  </div>
                </div>

                <div className="mt-3">
                  {editingId === p.id ? (
                    <div className="flex flex-col gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-white/70">Folder</span>
                        <input value={editFolder} onChange={(e)=>setEditFolder(e.target.value)} className="px-2 py-1 rounded-md bg-white/10 border border-white/20 outline-none" />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-white/70">Tags</span>
                        <input value={editTags} onChange={(e)=>setEditTags(e.target.value)} placeholder="comma,separated" className="px-2 py-1 rounded-md bg-white/10 border border-white/20 outline-none" />
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => saveEdits(p.id)} className="px-3 py-1.5 rounded-md bg-white text-black">Save</button>
                        <button onClick={() => setEditingId(null)} className="px-3 py-1.5 rounded-md bg-white/0 text-white border border-white/20">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setEditingId(p.id); setEditFolder(p.folder || 'General'); setEditTags((p.tags||[]).join(', ')); }}
                      className="mt-2 text-xs px-3 py-1.5 rounded-md bg-white/0 text-white border border-white/20"
                    >
                      Edit folder & tags
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <ShareModal
        projectId={shareProjectId || ''}
        open={!!shareProjectId}
        onClose={() => setShareProjectId(null)}
      />
    </div>
  );
}