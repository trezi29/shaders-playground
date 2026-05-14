'use client';

import { useState } from 'react';
import { Shader } from 'shaders/react';
import { COMPONENT_MAP, defaultProps } from './registry';
import { EditorPanel, type Layer } from './panel';
import { getProjects, saveProject, deleteProject, type SavedProject } from './storage';

export default function EditorPage() {
  const [layers, setLayers] = useState<Layer[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [bgColor, setBgColor] = useState('#ffffff');
  const [projectName, setProjectName] = useState('');
  const [savedProjects, setSavedProjects] = useState<SavedProject[]>(() => getProjects());

  function addLayer(type: string) {
    const id = Math.random().toString(36).slice(2, 8);
    const layer: Layer = { id, type, visible: true, props: defaultProps(type) };
    setLayers((prev) => [...prev, layer]);
    setSelectedId(id);
  }

  function updateProp(id: string, key: string, value: Layer['props'][string]) {
    setLayers((prev) =>
      prev.map((l) =>
        l.id === id ? { ...l, props: { ...l.props, [key]: value } } : l,
      ),
    );
  }

  function toggleVisible(id: string) {
    setLayers((prev) =>
      prev.map((l) => (l.id === id ? { ...l, visible: !l.visible } : l)),
    );
  }

  function removeLayer(id: string) {
    setLayers((prev) => prev.filter((l) => l.id !== id));
    setSelectedId((prev) => (prev === id ? null : prev));
  }

  function updateMask(id: string, maskSource: string | undefined, maskType: Layer['maskType']) {
    setLayers((prev) =>
      prev.map((l) => l.id === id ? { ...l, maskSource, maskType } : l),
    );
  }

  function reorderLayer(id: string, dir: -1 | 1) {
    setLayers((prev) => {
      const idx = prev.findIndex((l) => l.id === id);
      if (idx < 0) return prev;
      const next = idx + dir;
      if (next < 0 || next >= prev.length) return prev;
      const arr = [...prev];
      [arr[idx], arr[next]] = [arr[next], arr[idx]];
      return arr;
    });
  }

  function handleSaveProject(name: string) {
    const existing = savedProjects.find(p => p.name === name);
    const project: SavedProject = {
      id: existing?.id ?? Math.random().toString(36).slice(2, 10),
      name,
      savedAt: Date.now(),
      layers,
      bgColor,
    };
    saveProject(project);
    setSavedProjects(getProjects());
  }

  function handleLoadProject(project: SavedProject) {
    setLayers(project.layers);
    setBgColor(project.bgColor);
    setProjectName(project.name);
    setSelectedId(null);
  }

  function handleDeleteProject(id: string) {
    deleteProject(id);
    setSavedProjects(getProjects());
  }

  return (
    <>
      <Shader className="w-full h-screen" style={{ background: bgColor }}>
        {layers.map((layer) => {
          const Comp = COMPONENT_MAP[layer.type];
          if (!Comp) return null;
          return (
            <Comp key={layer.id} id={layer.id} visible={layer.visible} {...layer.props} maskSource={layer.maskSource} maskType={layer.maskType} />
          );
        })}
      </Shader>
      <EditorPanel
        layers={layers}
        selectedId={selectedId}
        bgColor={bgColor}
        projectName={projectName}
        savedProjects={savedProjects}
        onAddLayer={addLayer}
        onUpdateProp={updateProp}
        onToggleVisible={toggleVisible}
        onRemoveLayer={removeLayer}
        onReorderLayer={reorderLayer}
        onSelectLayer={setSelectedId}
        onBgColorChange={setBgColor}
        onProjectNameChange={setProjectName}
        onSaveProject={handleSaveProject}
        onLoadProject={handleLoadProject}
        onDeleteProject={handleDeleteProject}
        onUpdateMask={updateMask}
      />
    </>
  );
}
