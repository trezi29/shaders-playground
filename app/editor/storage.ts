import type { Layer } from './panel';

export type SavedProject = {
  id: string;
  name: string;
  savedAt: number;
  layers: Layer[];
  bgColor: string;
};

const KEY = 'shaders_playground_projects';

export function getProjects(): SavedProject[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]');
  } catch {
    return [];
  }
}

export function saveProject(project: SavedProject): void {
  const all = getProjects();
  const idx = all.findIndex(p => p.id === project.id);
  if (idx >= 0) all[idx] = project;
  else all.push(project);
  localStorage.setItem(KEY, JSON.stringify(all));
}

export function deleteProject(id: string): void {
  const all = getProjects().filter(p => p.id !== id);
  localStorage.setItem(KEY, JSON.stringify(all));
}
