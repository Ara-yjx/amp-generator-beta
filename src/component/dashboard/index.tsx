import { Layout } from '@arco-design/web-react';
import ProjectList from './projectList';
import { useState } from 'react';
import { Project } from '../../data/apiTypes';
import { ProjectDetail } from './projectDetail';

const { Sider, Content } = Layout;

export const Dashboard: React.FC = () => {
  const [focusedProject, setFocusedProject] = useState<Project | null>(null);

  return (
    <Layout>
      <Sider width={300} style={{ background: '#fff', borderRight: '1px solid #eee', padding: 16 }}>
        <ProjectList focusedProject={focusedProject} setFocusedProject={setFocusedProject} />
      </Sider>
      <Content style={{ padding: 24, minHeight: '100vh', background: '#f9f9f9' }}>
        {focusedProject ? (
          <ProjectDetail project={focusedProject} />
        ) : null}
      </Content>
    </Layout>
  );
};

export default Dashboard;
