import React from 'react';
import { Select, MenuItem, IconButton } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import MonitorIcon from '@mui/icons-material/Monitor';

function HeaderBar({ selectedWorkspace, allWorkspaces, onWorkspaceSwitch, onRecordToggle, isRecording, onBackToHome, workspaceId, isBrowserVisible, onToggleBrowser }) {
    return (
        <div style={{
            width: '100%',
            height: 56,
            background: 'linear-gradient(135deg, #1a1a1a 0%, #23232f 50%, #292940 100%)',
            borderBottom: '1px solid #333',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 24px',
            boxSizing: 'border-box',
            fontFamily: 'Nunito, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif',
            zIndex: 100,
            backdropFilter: 'blur(10px)',
        }}>
            {/* Left side - Back button and workspace info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <IconButton 
                    onClick={onBackToHome}
                    sx={{ 
                        color: '#ffd700',
                        background: 'rgba(255, 215, 0, 0.1)',
                        border: '1px solid rgba(255, 215, 0, 0.3)',
                        padding: '6px',
                        '&:hover': { 
                            backgroundColor: 'rgba(255, 215, 0, 0.2)',
                            borderColor: '#ffd700'
                        }
                    }}
                >
                    <ArrowBackIcon fontSize="small" />
                </IconButton>
                <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 12,
                    background: 'rgba(255, 215, 0, 0.1)',
                    padding: '6px 12px',
                    borderRadius: 8,
                    border: '1px solid rgba(255, 215, 0, 0.2)'
                }}>
                    <span style={{ color: '#ffd700', fontWeight: 700, fontSize: 14 }}>
                        {allWorkspaces && allWorkspaces.length > 1 ? 'Switch Workspace:' : 'Current Workspace:'}
                    </span>
                    {allWorkspaces && allWorkspaces.length > 1 ? (
                        <Select
                            value={parseInt(workspaceId)}
                            onChange={(e) => onWorkspaceSwitch && onWorkspaceSwitch(e.target.value)}
                            variant="outlined"
                            size="small"
                            MenuProps={{
                                PaperProps: {
                                    sx: {
                                        background: '#23232f',
                                        border: '1px solid #333',
                                        '& .MuiMenu-list': {
                                            padding: 0
                                        }
                                    }
                                }
                            }}
                            sx={{
                                minWidth: 220,
                                background: 'rgba(35, 35, 47, 0.8)',
                                color: '#fff',
                                '.MuiOutlinedInput-notchedOutline': { 
                                    borderColor: 'rgba(255, 215, 0, 0.3)',
                                    borderWidth: 1
                                },
                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                    borderColor: '#ffd700'
                                },
                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                    borderColor: '#ffd700',
                                    borderWidth: 2
                                },
                                '.MuiSvgIcon-root': { color: '#ffd700' },
                                fontWeight: 600,
                                fontFamily: 'inherit',
                                fontSize: 14
                            }}
                        >
                            {allWorkspaces.map((workspace) => (
                                <MenuItem key={workspace.id} value={workspace.id} sx={{ 
                                    background: '#23232f',
                                    color: '#fff',
                                    padding: '8px 16px',
                                    margin: 0,
                                    minHeight: 'unset',
                                    '&:hover': { background: '#292940' },
                                    '&.Mui-selected': { background: '#ffd700', color: '#23232f' },
                                    '&:first-of-type': { marginTop: 0 },
                                    '&:last-of-type': { marginBottom: 0 }
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
                                        <span style={{ fontSize: 14 }}>
                                            {workspace.id === parseInt(workspaceId) ? '🔗' : '💼'}
                                        </span>
                                        <span style={{ 
                                            fontWeight: 600, 
                                            fontSize: 14,
                                            flex: 1
                                        }}>
                                            {workspace.title}
                                            {workspace.id === parseInt(workspaceId) && (
                                                <span style={{ color: '#ffd700', marginLeft: 6, fontSize: 12 }}>
                                                    • Current
                                                </span>
                                            )}
                                        </span>
                                    </div>
                                </MenuItem>
                            ))}
                        </Select>
                    ) : (
                        <span style={{ color: '#fff', fontWeight: 600, fontSize: 14 }}>
                            {selectedWorkspace?.title || 'Loading...'}
                        </span>
                    )}
                </div>
            </div>
            {/* Record/Stop Button and Status */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button
                    onClick={onToggleBrowser}
                    style={{
                        background: isBrowserVisible 
                            ? 'linear-gradient(135deg, #4caf50 0%, #81c784 100%)' 
                            : 'rgba(255, 255, 255, 0.1)',
                        color: '#fff',
                        border: isBrowserVisible ? 'none' : '1px solid #555',
                        borderRadius: 8,
                        padding: '6px 12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        boxShadow: isBrowserVisible 
                            ? '0 2px 6px rgba(76, 175, 80, 0.3)' 
                            : 'none',
                        fontSize: 13,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        transition: 'all 0.3s ease',
                        outline: 'none'
                    }}
                >
                    <MonitorIcon style={{ fontSize: 16 }} />
                    Browser
                </button>
                <button
                    onClick={onRecordToggle}
                    style={{
                        background: isRecording 
                            ? 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)' 
                            : 'linear-gradient(135deg, #ffd700 0%, #fff8dc 100%)',
                        color: isRecording ? '#fff' : '#23232f',
                        border: 'none',
                        borderRadius: 8,
                        padding: '8px 16px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        boxShadow: isRecording 
                            ? '0 3px 8px rgba(244, 67, 54, 0.4)' 
                            : '0 3px 8px rgba(255, 215, 0, 0.4)',
                        fontSize: 14,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        transition: 'all 0.3s ease',
                        outline: 'none',
                        transform: 'scale(1)',
                        '&:hover': {
                            transform: 'scale(1.05)'
                        },
                        '&:active': {
                            transform: 'scale(0.95)'
                        }
                    }}
                >
                    <FiberManualRecordIcon style={{ 
                        color: isRecording ? '#fff' : '#23232f', 
                        animation: isRecording ? 'flash 1s infinite' : 'none',
                        fontSize: 20
                    }} />
                    {isRecording ? 'Stop Recording' : 'Start Recording'}
                </button>
                <style>{`
                    @keyframes flash {
                        0%, 100% { opacity: 1; }
                        50% { opacity: 0.3; }
                    }
                `}</style>
            </div>
        </div>
    );
}

export default HeaderBar;
