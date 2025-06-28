import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Button, 
    Card, 
    CardContent, 
    IconButton, 
    Menu, 
    MenuItem, 
    Dialog, 
    DialogTitle, 
    DialogContent, 
    DialogActions, 
    TextField,
    Typography
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import DeleteIcon from '@mui/icons-material/Delete';
import logo from '../assets/images/logo-universal.png';
import SystemCheckModal from './SystemCheckModal';

import { CreateWorkspace, GetAllWorkspaces, GetWorkspaceByID, UpdateWorkspace, UpdateWorkspaceLastOpen, DeleteWorkspace} from '../../wailsjs/go/main/App';

function HomePage() {
    const navigate = useNavigate();
    const [showSystemCheck, setShowSystemCheck] = useState(true); // Show modal on mount
    const [workspaces, setWorkspaces] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Modal states
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [workspaceToDelete, setWorkspaceToDelete] = useState(null);
    const [menuAnchor, setMenuAnchor] = useState(null);
    const [selectedWorkspace, setSelectedWorkspace] = useState(null);
    
    // Form states
    const [newWorkspaceTitle, setNewWorkspaceTitle] = useState('');
    const [newWorkspaceDescription, setNewWorkspaceDescription] = useState('');

    // Load workspaces from backend
    const loadWorkspaces = async () => {
        try {
            setLoading(true);
            const workspacesData = await GetAllWorkspaces();
            setWorkspaces(workspacesData || []);
        } catch (error) {
            console.error('Error loading workspaces:', error);
            setWorkspaces([]);
        } finally {
            setLoading(false);
        }
    };

    // Format last open time for display
    const formatLastOpenTime = (timestamp) => {
        if (!timestamp) return 'Never opened';
        
        const now = new Date();
        const lastOpen = new Date(timestamp);
        const diffMs = now - lastOpen;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
        if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) !== 1 ? 's' : ''} ago`;
        return lastOpen.toLocaleDateString();
    };

    // Get workspace status based on last open time
    const getWorkspaceStatus = (lastOpenTime) => {
        if (!lastOpenTime) return 'idle';
        
        const now = new Date();
        const lastOpen = new Date(lastOpenTime);
        const diffHours = (now - lastOpen) / 3600000;
        
        return diffHours < 2 ? 'active' : 'idle';
    };

    // Load workspaces on component mount
    useEffect(() => {
        loadWorkspaces();
    }, []);

    const handleWorkspaceClick = async (workspaceId) => {
        try {
            // Update last open time
            await UpdateWorkspaceLastOpen(workspaceId);
            // Navigate to workspace
            navigate(`/workspace/${workspaceId}`);
        } catch (error) {
            console.error('Error updating workspace last open time:', error);
            // Still navigate even if update fails
            navigate(`/workspace/${workspaceId}`);
        }
    };

    const handleCreateWorkspace = async () => {
        setShowCreateModal(true);
    };

    const handleCreateWorkspaceSubmit = async () => {
        if (!newWorkspaceTitle.trim()) return;
        
        try {
            const newWorkspace = await CreateWorkspace(
                newWorkspaceTitle.trim(),
                newWorkspaceDescription.trim() || 'No description'
            );
            
            if (newWorkspace && newWorkspace.id) {
                // Reset form
                setNewWorkspaceTitle('');
                setNewWorkspaceDescription('');
                setShowCreateModal(false);
                
                // Reload workspaces to show the new one
                await loadWorkspaces();
                // Navigate to the new workspace
                navigate(`/workspace/${newWorkspace.id}`);
            }
        } catch (error) {
            console.error('Error creating workspace:', error);
            // Still close modal and reset form on error
            setNewWorkspaceTitle('');
            setNewWorkspaceDescription('');
            setShowCreateModal(false);
        }
    };

    const handleMenuOpen = (event, workspace) => {
        event.stopPropagation(); // Prevent card click
        setMenuAnchor(event.currentTarget);
        setSelectedWorkspace(workspace);
    };

    const handleMenuClose = () => {
        setMenuAnchor(null);
        setSelectedWorkspace(null);
    };

    const handleDeleteClick = () => {
        setWorkspaceToDelete(selectedWorkspace);
        setShowDeleteDialog(true);
        handleMenuClose();
    };

    const handleDeleteConfirm = async () => {
        if (!workspaceToDelete) return;
        
        try {
            await DeleteWorkspace(workspaceToDelete.id);
            // Reload workspaces to reflect the deletion
            await loadWorkspaces();
        } catch (error) {
            console.error('Error deleting workspace:', error);
        } finally {
            setShowDeleteDialog(false);
            setWorkspaceToDelete(null);
        }
    };

    const handleDeleteCancel = () => {
        setShowDeleteDialog(false);
        setWorkspaceToDelete(null);
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
                        { 
                            label: 'Active Sessions', 
                            value: workspaces.filter(w => getWorkspaceStatus(w.lastOpenTime) === 'active').length, 
                            color: '#ffd700' 
                        },
                        { 
                            label: 'Recent Activity', 
                            value: workspaces.length > 0 ? formatLastOpenTime(
                                Math.max(...workspaces.map(w => new Date(w.lastOpenTime || 0).getTime()))
                            ) : 'No activity', 
                            color: '#2196f3' 
                        },
                        { label: 'Status', value: loading ? 'Loading...' : 'Ready', color: '#4caf50' }
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
                                    onClick={handleCreateWorkspace}
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
                                                    onClick={(e) => handleMenuOpen(e, workspace)}
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
                </div>
            </div>

            {/* System Check Modal */}
            <SystemCheckModal 
                open={showSystemCheck} 
                onClose={() => setShowSystemCheck(false)} 
            />

            {/* Create Workspace Modal */}
            <Dialog 
                open={showCreateModal} 
                onClose={() => setShowCreateModal(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: {
                        background: 'linear-gradient(135deg, #23232f 0%, #2a2a3a 100%)',
                        color: '#fff',
                        border: '1px solid #444'
                    }
                }}
            >
                <DialogTitle sx={{ color: '#ffd700', fontWeight: 600 }}>
                    Create New Workspace
                </DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Workspace Title"
                        fullWidth
                        variant="outlined"
                        value={newWorkspaceTitle}
                        onChange={(e) => setNewWorkspaceTitle(e.target.value)}
                        sx={{
                            mb: 2,
                            '& .MuiOutlinedInput-root': {
                                color: '#fff',
                                '& fieldset': { borderColor: '#666' },
                                '&:hover fieldset': { borderColor: '#999' },
                                '&.Mui-focused fieldset': { borderColor: '#ffd700' }
                            },
                            '& .MuiInputLabel-root': {
                                color: '#ccc',
                                '&.Mui-focused': { color: '#ffd700' }
                            }
                        }}
                    />
                    <TextField
                        margin="dense"
                        label="Description (Optional)"
                        fullWidth
                        multiline
                        rows={3}
                        variant="outlined"
                        value={newWorkspaceDescription}
                        onChange={(e) => setNewWorkspaceDescription(e.target.value)}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                color: '#fff',
                                '& fieldset': { borderColor: '#666' },
                                '&:hover fieldset': { borderColor: '#999' },
                                '&.Mui-focused fieldset': { borderColor: '#ffd700' }
                            },
                            '& .MuiInputLabel-root': {
                                color: '#ccc',
                                '&.Mui-focused': { color: '#ffd700' }
                            }
                        }}
                    />
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button 
                        onClick={() => setShowCreateModal(false)}
                        sx={{ 
                            color: '#ccc',
                            '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' }
                        }}
                    >
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleCreateWorkspaceSubmit}
                        variant="contained"
                        disabled={!newWorkspaceTitle.trim()}
                        sx={{
                            background: 'linear-gradient(135deg, #ffd700 0%, #fff8dc 100%)',
                            color: '#23232f',
                            fontWeight: 600,
                            '&:disabled': {
                                background: '#666',
                                color: '#999'
                            }
                        }}
                    >
                        Create Workspace
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={showDeleteDialog}
                onClose={handleDeleteCancel}
                PaperProps={{
                    sx: {
                        background: 'linear-gradient(135deg, #23232f 0%, #2a2a3a 100%)',
                        color: '#fff',
                        border: '1px solid #444'
                    }
                }}
            >
                <DialogTitle sx={{ color: '#ff5252', fontWeight: 600 }}>
                    Delete Workspace
                </DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to delete "{workspaceToDelete?.title}"? 
                        This action cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button 
                        onClick={handleDeleteCancel}
                        sx={{ 
                            color: '#ccc',
                            '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' }
                        }}
                    >
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleDeleteConfirm}
                        variant="contained"
                        sx={{
                            background: 'linear-gradient(135deg, #ff5252 0%, #ff8a80 100%)',
                            color: '#fff',
                            fontWeight: 600,
                            '&:hover': {
                                background: 'linear-gradient(135deg, #d32f2f 0%, #ff5252 100%)',
                            }
                        }}
                    >
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Workspace Menu */}
            <Menu
                anchorEl={menuAnchor}
                open={Boolean(menuAnchor)}
                onClose={handleMenuClose}
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
                <MenuItem onClick={handleDeleteClick}>
                    <DeleteIcon fontSize="small" sx={{ mr: 1, color: '#ff5252' }} />
                    Delete Workspace
                </MenuItem>
            </Menu>
        </div>
    );
}

export default HomePage;
