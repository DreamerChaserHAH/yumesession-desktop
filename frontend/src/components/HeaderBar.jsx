import React from 'react';
import { Select, MenuItem, IconButton } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import MonitorIcon from '@mui/icons-material/Monitor';

function HeaderBar({ meetings, selectedMeeting, onMeetingChange, onRecordToggle, isRecording, onBackToHome, workspaceId, isBrowserVisible, onToggleBrowser }) {
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
                    <span style={{ color: '#ffd700', fontWeight: 700, fontSize: 14 }}>Meeting:</span>
                    <Select
                        value={selectedMeeting}
                        onChange={onMeetingChange}
                        variant="outlined"
                        size="small"
                        sx={{
                            minWidth: 200,
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
                        {meetings.map((meeting, idx) => (
                            <MenuItem key={idx} value={meeting} sx={{ 
                                background: '#23232f',
                                color: '#fff',
                                '&:hover': { background: '#292940' },
                                '&.Mui-selected': { background: '#ffd700', color: '#23232f' }
                            }}>
                                {meeting}
                            </MenuItem>
                        ))}
                    </Select>
                </div>
                {workspaceId && (
                    <div style={{
                        background: 'rgba(204, 204, 204, 0.1)',
                        padding: '4px 8px',
                        borderRadius: 6,
                        border: '1px solid rgba(204, 204, 204, 0.2)'
                    }}>
                        <span style={{ color: '#ccc', fontSize: 12, fontWeight: 500 }}>
                            <span style={{ color: '#fff', fontWeight: 600 }}>{workspaceId}</span>
                        </span>
                    </div>
                )}
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
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    background: isRecording 
                        ? 'rgba(244, 67, 54, 0.1)' 
                        : 'rgba(153, 153, 153, 0.1)',
                    padding: '6px 12px',
                    borderRadius: 8,
                    border: isRecording 
                        ? '1px solid rgba(244, 67, 54, 0.3)' 
                        : '1px solid rgba(153, 153, 153, 0.2)'
                }}>
                    <div style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: isRecording ? '#f44336' : '#999',
                        boxShadow: isRecording ? '0 0 6px 1px rgba(244, 67, 54, 0.3)' : 'none',
                        animation: isRecording ? 'flash 1s infinite' : 'none',
                    }} />
                    <span style={{
                        fontWeight: 600,
                        fontSize: 12,
                        color: isRecording ? '#f44336' : '#999',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                    }}>
                        {isRecording ? 'Recording' : 'Idle'}
                    </span>
                </div>
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
