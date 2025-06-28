import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Button, 
    Dialog, 
    DialogTitle, 
    DialogContent, 
    DialogActions, 
    TextField,
    Typography,
    Menu,
    MenuItem
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import logo from '../assets/images/logo-universal.png';
import SystemCheckModal from './SystemCheckModal';
import DocumentPreviewModal from './DocumentPreviewModal';
import KnowledgeBaseSection from './KnowledgeBaseSection';
import WorkspacesSection from './WorkspacesSection';
import QuickStatsSection from './QuickStatsSection';

import { 
    CreateWorkspace, 
    GetAllWorkspaces, 
    UpdateWorkspaceLastOpen, 
    DeleteWorkspace,
    CreateKnowledgeBaseItem,
    GetAllKnowledgeBaseItems,
    GetKnowledgeBaseItemByID,
    DeleteKnowledgeBaseItem,
    UpdateKnowledgeBaseItem
} from '../../wailsjs/go/main/App';

function HomePage() {
    const navigate = useNavigate();
    const [showSystemCheck, setShowSystemCheck] = useState(true);
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

    // Knowledge base states
    const [documents, setDocuments] = useState([]);
    const [showPreviewModal, setShowPreviewModal] = useState(false);

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

    // Load knowledge base items from backend
    const loadKnowledgeBase = async () => {
        try {
            const knowledgeBaseData = await GetAllKnowledgeBaseItems();
            console.log('📚 Loaded knowledge base items:', knowledgeBaseData);
            setDocuments(knowledgeBaseData || []);
        } catch (error) {
            console.error('Error loading knowledge base items:', error);
            setDocuments([]);
        }
    };

    // Utility functions
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

    const getWorkspaceStatus = (lastOpenTime) => {
        if (!lastOpenTime) return 'idle';
        
        const now = new Date();
        const lastOpen = new Date(lastOpenTime);
        const diffHours = (now - lastOpen) / 3600000;
        
        return diffHours < 2 ? 'active' : 'idle';
    };

    const getFileIcon = (fileType) => {
        switch (fileType) {
            case 'pdf': return '📄';
            case 'docx':
            case 'doc': return '📝';
            case 'txt': return '📃';
            case 'link': return '🔗';
            default: return '📄';
        }
    };

    const formatFileSize = (size) => {
        if (typeof size === 'string') return size;
        if (size < 1024) return `${size} B`;
        if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
        return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    };

    // Helper function to extract file type from Knowledge Base item
    const getKnowledgeBaseFileType = (item) => {
        if (item.uniqueFileName) {
            return item.uniqueFileName.toLowerCase().split('.').pop();
        }
        // For website links or items without file names
        return item.type === 'Website Link' ? 'link' : 'unknown';
    };

    // Event handlers
    const handleWorkspaceClick = async (workspaceId) => {
        try {
            await UpdateWorkspaceLastOpen(workspaceId);
            navigate(`/workspace/${workspaceId}`);
        } catch (error) {
            console.error('Error updating workspace last open time:', error);
            navigate(`/workspace/${workspaceId}`);
        }
    };

    const handleCreateWorkspace = () => {
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
                setNewWorkspaceTitle('');
                setNewWorkspaceDescription('');
                setShowCreateModal(false);
                await loadWorkspaces();
                navigate(`/workspace/${newWorkspace.id}`);
            }
        } catch (error) {
            console.error('Error creating workspace:', error);
            setNewWorkspaceTitle('');
            setNewWorkspaceDescription('');
            setShowCreateModal(false);
        }
    };

    const handleMenuOpen = (event, workspace) => {
        event.stopPropagation();
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

    const handleAddDocuments = () => {
        setShowPreviewModal(true);
    };

    const handleDocumentSaved = async (newDocument) => {
        try {
            console.log('📚 Document saved from DocumentPreviewModal:', newDocument);
            
            // Reload the knowledge base to get the updated list since the DocumentPreviewModal
            // already created the knowledge base item directly
            await loadKnowledgeBase();
        } catch (error) {
            console.error('Error reloading knowledge base:', error);
            // Fallback to local state update
            setDocuments(prev => [...prev, newDocument]);
        }
    };

    const handleRemoveDocument = async (documentId) => {
        try {
            await DeleteKnowledgeBaseItem(documentId);
            console.log('📚 Knowledge base item deleted:', documentId);
            
            // Reload the knowledge base to get the updated list
            await loadKnowledgeBase();
        } catch (error) {
            console.error('Error deleting from knowledge base:', error);
            // Fallback to local state update
            setDocuments(prev => prev.filter(doc => doc.id !== documentId));
        }
    };

    // Load workspaces and knowledge base on component mount
    useEffect(() => {
        const loadData = async () => {
            await Promise.all([
                loadWorkspaces(),
                loadKnowledgeBase()
            ]);
        };
        
        loadData();
    }, []);

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
                <QuickStatsSection 
                    workspaces={workspaces}
                    loading={loading}
                    formatLastOpenTime={formatLastOpenTime}
                    getWorkspaceStatus={getWorkspaceStatus}
                />

                {/* Workspaces Section */}
                <WorkspacesSection 
                    workspaces={workspaces}
                    loading={loading}
                    onWorkspaceClick={handleWorkspaceClick}
                    onCreateWorkspace={handleCreateWorkspace}
                    formatLastOpenTime={formatLastOpenTime}
                    getWorkspaceStatus={getWorkspaceStatus}
                    menuAnchor={menuAnchor}
                    onMenuOpen={handleMenuOpen}
                    onMenuClose={handleMenuClose}
                    onDeleteClick={handleDeleteClick}
                />

                {/* Knowledge Base Section */}
                <KnowledgeBaseSection 
                    documents={documents}
                    onAddDocuments={handleAddDocuments}
                    onRemoveDocument={handleRemoveDocument}
                    showPreviewModal={showPreviewModal}
                    getFileIcon={getFileIcon}
                    formatFileSize={formatFileSize}
                    getKnowledgeBaseFileType={getKnowledgeBaseFileType}
                />
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

            {/* Document Preview Modal */}
            <DocumentPreviewModal 
                open={showPreviewModal}
                onClose={() => setShowPreviewModal(false)}
                onDocumentSaved={handleDocumentSaved}
            />

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
