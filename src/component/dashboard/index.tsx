import { Layout } from '@arco-design/web-react';
import ProjectList from './projectList';
import { useState } from 'react';
import { Project } from '../../data/apiTypes';
import { ProjectDetail } from './projectDetail';

const { Sider, Content } = Layout;

export const Dashboard: React.FC = () => {
  const [focusedProject, setFocusedProject] = useState<Project | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);

  const handleUpdateProject = (updatedProject: Project) => {
    // Update the projects list
    setProjects(prevProjects => 
      prevProjects.map(p => p.id === updatedProject.id ? updatedProject : p)
    );
    // Update the focused project
    setFocusedProject(updatedProject);
  };

  return (
    <Layout>
      <Sider width={300} style={{ background: '#fff', borderRight: '1px solid #eee', padding: 24 }}>
        <ProjectList 
          focusedProject={focusedProject} 
          setFocusedProject={setFocusedProject}
          projects={projects}
          setProjects={setProjects}
        />
      </Sider>
      <Content style={{ padding: 24, minHeight: '100vh', background: '#f9f9f9' }}>
        {focusedProject ? (
          <ProjectDetail 
            project={focusedProject} 
            onUpdateProject={handleUpdateProject}
          />
        ) : null}
      </Content>
    </Layout>
  );
};

export default Dashboard;
