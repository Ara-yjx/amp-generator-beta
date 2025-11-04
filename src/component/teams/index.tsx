import { useCallback, useState } from 'react';
import { Team } from '../../data/apiTypes';
import TeamDetail from './teamDetail';
import TeamList from './teamList';
import Layout from '@arco-design/web-react/es/Layout';

const { Sider, Content } = Layout;

const Teams = () => {
  const [focusedTeam, setFocusedTeam] = useState<Team | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);

  const updateFocusedTeam = useCallback((updatedTeam: Team) => {
    setFocusedTeam(updatedTeam);
    setTeams(prevTeams =>
      prevTeams.map(t => t.id === updatedTeam.id ? updatedTeam : t)
    );
  }, []);

  return (
    <Layout>
      <Sider width={300} style={{ background: '#fff', borderRight: '1px solid #eee', padding: 16 }}>
        <TeamList focusedTeam={focusedTeam} setFocusedTeam={setFocusedTeam} teams={teams} setTeams={setTeams} />
      </Sider>
      <Content style={{ padding: 24, minHeight: '100vh', background: '#f9f9f9' }}>
        {focusedTeam ? (
          <TeamDetail team={focusedTeam} onUpdateTeam={updateFocusedTeam} />
        ) : (
          <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
            Select a team to view members
          </div>
        )}
      </Content>
    </Layout>
  );
};

export default Teams;
