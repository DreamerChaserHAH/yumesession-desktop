import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, CardContent } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import logo from '../assets/images/logo-universal.png';

function HomePage() {
    const navigate = useNavigate();
    const [workspaces] = useState([
        {
            id: 'workspace-1',
            name: 'Sprint Planning Session',
            description: 'Weekly sprint planning meeting with the development team',
            lastUsed: '2 hours ago',
            status: 'active'
        },
        {
            id: 'workspace-2',
            name: 'Design Review',
            description: 'UI/UX design review for the new dashboard',
            lastUsed: '1 day ago',
            status: 'idle'
        },
        {
            id: 'workspace-3',
            name: 'Client Sync',
            description: 'Monthly sync with client stakeholders',
            lastUsed: '3 days ago',
            status: 'idle'
        },
        {
            id: 'workspace-4',
            name: 'Retrospective',
            description: 'Team retrospective and improvement planning',
            lastUsed: '1 week ago',
            status: 'idle'
        }
    ]);

    const handleWorkspaceClick = (workspaceId) => {
        navigate(`/workspace/${workspaceId}`);
    };

    const handleCreateWorkspace = () => {
        // In a real app, this would open a modal or navigate to a creation page
        const newId = `workspace-${Date.now()}`;
        navigate(`/workspace/${newId}`);
    };

    return (
        <div style={{ 
            minHeight: '100vh', 
            background: '#1a1a1a',
            display: 'flex',
            flexDirection: 'column'
        }}>
            {/* Desktop App Header */}
            <div style={{
                background: 'linear-gradient(135deg, #23232f 0%, #292940 100%)',
                borderBottom: '1px solid #333',
                padding: '16px 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <img src={logo} alt="YumeSession" style={{ height: 32 }} />
                    <div>
                        <h1 style={{ 
                            margin: 0, 
                            color: '#fff', 
                            fontSize: '1.5rem', 
                            fontWeight: 700,
                            fontFamily: 'Nunito, sans-serif'
                        }}>
                            YumeSession
                        </h1>
                        <p style={{ 
                            margin: 0, 
                            color: '#ffd700', 
                            fontSize: '0.85rem',
                            fontWeight: 500
                        }}>
                            Meeting Management & Collaboration
                        </p>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={handleCreateWorkspace}
                        sx={{
                            background: 'linear-gradient(135deg, #ffd700 0%, #fff8dc 100%)',
                            color: '#23232f',
                            fontWeight: 600,
                            fontSize: 14,
                            padding: '8px 20px',
                            borderRadius: 2,
                            textTransform: 'none',
                            boxShadow: '0 2px 8px rgba(255, 215, 0, 0.3)',
                            '&:hover': {
                                boxShadow: '0 4px 12px rgba(255, 215, 0, 0.4)',
                            }
                        }}
                    >
                        New Workspace
                    </Button>
                </div>
            </div>

            {/* Main Content Area */}
            <div style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column', gap: 24 }}>
                {/* Quick Stats */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: 16,
                    maxWidth: 1200,
                    margin: '0 auto',
                    width: '100%'
                }}>
                    {[
                        { label: 'Total Workspaces', value: workspaces.length, color: '#4caf50' },
                        { label: 'Active Sessions', value: workspaces.filter(w => w.status === 'active').length, color: '#ffd700' },
                        { label: 'Recent Activity', value: '2 hours ago', color: '#2196f3' },
                        { label: 'Status', value: 'Ready', color: '#4caf50' }
                    ].map((stat, idx) => (
                        <div key={idx} style={{
                            background: '#23232f',
                            border: '1px solid #333',
                            borderRadius: 8,
                            padding: '16px',
                            textAlign: 'center'
                        }}>
                            <div style={{ 
                                color: stat.color, 
                                fontSize: '1.5rem', 
                                fontWeight: 700,
                                marginBottom: 4
                            }}>
                                {stat.value}
                            </div>
                            <div style={{ 
                                color: '#ccc', 
                                fontSize: '0.85rem',
                                fontWeight: 500
                            }}>
                                {stat.label}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Workspaces Section */}
                <div style={{ maxWidth: 1200, margin: '0 auto', width: '100%' }}>
                    <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        marginBottom: 16
                    }}>
                        <h2 style={{ 
                            margin: 0, 
                            color: '#fff', 
                            fontSize: '1.25rem',
                            fontWeight: 600,
                            fontFamily: 'Nunito, sans-serif'
                        }}>
                            Recent Workspaces
                        </h2>
                        <div style={{ 
                            color: '#999', 
                            fontSize: '0.9rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8
                        }}>
                            <span>{workspaces.length} workspace{workspaces.length !== 1 ? 's' : ''}</span>
                        </div>
                    </div>
                    
                    {/* Workspaces List */}
                    <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
                        gap: 16
                    }}>
                        {workspaces.map((workspace) => (
                            <Card 
                                key={workspace.id}
                                sx={{ 
                                    background: '#23232f',
                                    border: '1px solid #333',
                                    borderRadius: 2,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    '&:hover': {
                                        borderColor: '#ffd700',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                                        transform: 'translateY(-2px)'
                                    }
                                }}
                                onClick={() => handleWorkspaceClick(workspace.id)}
                            >
                                <CardContent sx={{ p: 3 }}>
                                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                                        <div style={{ flex: 1 }}>
                                            <h3 style={{ 
                                                margin: '0 0 4px 0', 
                                                color: '#fff', 
                                                fontSize: '1.1rem',
                                                fontWeight: 600,
                                                lineHeight: 1.3
                                            }}>
                                                {workspace.name}
                                            </h3>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <div style={{
                                                    width: 8,
                                                    height: 8,
                                                    borderRadius: '50%',
                                                    background: workspace.status === 'active' ? '#4caf50' : '#666',
                                                    boxShadow: workspace.status === 'active' ? '0 0 8px rgba(76, 175, 80, 0.5)' : 'none'
                                                }} />
                                                <span style={{ 
                                                    color: workspace.status === 'active' ? '#4caf50' : '#999',
                                                    fontSize: '0.8rem',
                                                    fontWeight: 500,
                                                    textTransform: 'capitalize'
                                                }}>
                                                    {workspace.status}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <p style={{ 
                                        margin: '0 0 16px 0', 
                                        color: '#ccc', 
                                        fontSize: '0.9rem',
                                        lineHeight: 1.4,
                                        minHeight: '40px'
                                    }}>
                                        {workspace.description}
                                    </p>
                                    <div style={{ 
                                        display: 'flex', 
                                        justifyContent: 'space-between', 
                                        alignItems: 'center',
                                        paddingTop: 12,
                                        borderTop: '1px solid #333'
                                    }}>
                                        <span style={{ 
                                            color: '#ffd700',
                                            fontSize: '0.8rem',
                                            fontWeight: 500
                                        }}>
                                            {workspace.lastUsed}
                                        </span>
                                        <span style={{ 
                                            color: '#999',
                                            fontSize: '0.8rem'
                                        }}>
                                            Click to open →
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default HomePage;
