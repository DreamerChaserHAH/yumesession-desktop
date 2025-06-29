import React from 'react';
import { Button, Card, CardContent, IconButton, Menu, MenuItem } from '@mui/material';
import { Add as AddIcon, MoreVert as MoreVertIcon, Delete as DeleteIcon } from '@mui/icons-material';

function WorkspacesSection({ 
    workspaces, 
    loading, 
    onWorkspaceClick, 
    onCreateWorkspace,
    formatLastOpenTime,
    getWorkspaceStatus,
    menuAnchor,
    onMenuOpen,
    onMenuClose,
    onDeleteClick
}) {
    return (
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
                {loading ? (
                    // Loading placeholder
                    Array.from({ length: 4 }, (_, idx) => (
                        <Card 
                            key={`loading-${idx}`}
                            sx={{ 
                                background: '#23232f',
                                border: '1px solid #333',
                                borderRadius: 2,
                                opacity: 0.6
                            }}
                        >
                            <CardContent sx={{ p: 3 }}>
                                <div style={{ 
                                    height: 20, 
                                    background: '#333', 
                                    borderRadius: 4, 
                                    marginBottom: 8 
                                }} />
                                <div style={{ 
                                    height: 14, 
                                    background: '#333', 
                                    borderRadius: 4, 
                                    marginBottom: 16,
                                    width: '60%'
                                }} />
                                <div style={{ 
                                    height: 40, 
                                    background: '#333', 
                                    borderRadius: 4, 
                                    marginBottom: 16 
                                }} />
                                <div style={{ 
                                    height: 12, 
                                    background: '#333', 
                                    borderRadius: 4, 
                                    width: '40%'
                                }} />
                            </CardContent>
                        </Card>
                    ))
                ) : workspaces.length === 0 ? (
                    // Empty state
                    <div style={{
                        gridColumn: '1 / -1',
                        textAlign: 'center',
                        padding: '40px',
                        color: '#999'
                    }}>
                        <div style={{ fontSize: '3rem', marginBottom: 16 }}>📋</div>
                        <h3 style={{ color: '#ccc', marginBottom: 8 }}>No workspaces yet</h3>
                        <p style={{ marginBottom: 24 }}>Create your first workspace to get started</p>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={onCreateWorkspace}
                            sx={{
                                background: 'linear-gradient(135deg, #ffd700 0%, #fff8dc 100%)',
                                color: '#23232f',
                                fontWeight: 600,
                            }}
                        >
                            Create Workspace
                        </Button>
                    </div>
                ) : (
                    workspaces.map((workspace) => {
                        const status = getWorkspaceStatus(workspace.lastOpenTime);
                        return (
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
                                onClick={() => onWorkspaceClick(workspace.id)}
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
                                                {workspace.title}
                                            </h3>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <div style={{
                                                    width: 8,
                                                    height: 8,
                                                    borderRadius: '50%',
                                                    background: status === 'active' ? '#4caf50' : '#666',
                                                    boxShadow: status === 'active' ? '0 0 8px rgba(76, 175, 80, 0.5)' : 'none'
                                                }} />
                                                <span style={{ 
                                                    color: status === 'active' ? '#4caf50' : '#999',
                                                    fontSize: '0.8rem',
                                                    fontWeight: 500,
                                                    textTransform: 'capitalize'
                                                }}>
                                                    {status}
                                                </span>
                                            </div>
                                        </div>
                                        <IconButton
                                            size="small"
                                            onClick={(e) => onMenuOpen(e, workspace)}
                                            sx={{ 
                                                color: '#999',
                                                '&:hover': { 
                                                    color: '#fff',
                                                    backgroundColor: 'rgba(255,255,255,0.1)' 
                                                }
                                            }}
                                        >
                                            <MoreVertIcon fontSize="small" />
                                        </IconButton>
                                    </div>
                                    <p style={{ 
                                        margin: '0 0 16px 0', 
                                        color: '#ccc', 
                                        fontSize: '0.9rem',
                                        lineHeight: 1.4,
                                        minHeight: '40px'
                                    }}>
                                        {workspace.description || 'No description'}
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
                                            {formatLastOpenTime(workspace.lastOpenTime)}
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
                        );
                    })
                )}
            </div>

            {/* Context Menu */}
            <Menu
                anchorEl={menuAnchor}
                open={Boolean(menuAnchor)}
                onClose={onMenuClose}
                PaperProps={{
                    sx: {
                        background: '#23232f',
                        border: '1px solid #444',
                        '& .MuiMenuItem-root': {
                            color: '#fff',
                            '&:hover': {
                                backgroundColor: 'rgba(255,255,255,0.1)'
                            }
                        }
                    }
                }}
            >
                <MenuItem onClick={onDeleteClick}>
                    <DeleteIcon fontSize="small" sx={{ mr: 1, color: '#ff5252' }} />
                    Delete Workspace
                </MenuItem>
            </Menu>
        </div>
    );
}

export default WorkspacesSection;
