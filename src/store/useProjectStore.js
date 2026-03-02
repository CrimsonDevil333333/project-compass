import { useState, useCallback, useMemo } from 'react';

export function useProjectStore(initialProjects = []) {
  const [projects, setProjects] = useState(initialProjects);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('navigator');
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [config, setConfig] = useState({ maxVisibleProjects: 8 });

  const selectedProject = useMemo(() => {
    return projects.find(p => p.id === selectedProjectId) || projects[selectedIndex] || null;
  }, [projects, selectedIndex, selectedProjectId]);

  const selectProject = useCallback((index) => {
    setSelectedIndex(index);
    if (projects[index]) {
      setSelectedProjectId(projects[index].id);
    }
  }, [projects]);

  return {
    projects,
    setProjects,
    selectedIndex,
    setSelectedIndex: selectProject,
    activeTab,
    setActiveTab,
    selectedProject,
    config,
    setConfig
  };
}
