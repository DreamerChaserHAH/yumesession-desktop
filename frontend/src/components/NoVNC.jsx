import React, { useState } from 'react';
import { IconButton } from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import RefreshIcon from '@mui/icons-material/Refresh';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import MoreVertIcon from '@mui/icons-material/MoreVert';

function NoVNC(props) {
    // For demonstration, we'll use a hardcoded URL. Replace with dynamic value if needed.
    const currentUrl = "http://localhost:8000";
    const [isLoading, setIsLoading] = useState(false);
    
    const handleRefresh = () => {
        setIsLoading(true);
        setTimeout(() => setIsLoading(false), 1000);
    };

    return (
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: '#000', overflow: 'hidden' }}>
            {/* Browser Header */}
            <div style={{
                background: 'linear-gradient(180deg, #2d2d2d 0%, #242424 100%)',
                borderBottom: '1px solid #1a1a1a',
                display: 'flex',
                flexDirection: 'column',
                minHeight: 'auto',
                boxSizing: 'border-box',
                flexShrink: 0
            }}>
                {/* Tab Bar */}
                <div style={{
                    display: 'flex',
                    alignItems: 'flex-end',
                    padding: '6px 6px 0 6px',
                    background: '#2d2d2d'
                }}>
                    <div style={{
                        background: '#23232f',
                        borderRadius: '6px 6px 0 0',
                        padding: '6px 12px',
                        minWidth: 180,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        border: '1px solid #292940',
                        borderBottom: 'none'
                    }}>
                        <LockIcon style={{ color: '#4caf50', fontSize: 14 }} />
                        <span style={{ 
                            color: '#fff', 
                            fontSize: 13, 
                            fontWeight: 500,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            flex: 1
                        }}>
                            Live Browser Stream
                        </span>
                        <button style={{
                            background: 'none',
                            border: 'none',
                            color: '#999',
                            cursor: 'pointer',
                            padding: '1px',
                            fontSize: 14,
                            display: 'flex',
                            alignItems: 'center'
                        }}>×</button>
                    </div>
                </div>

                {/* Navigation Bar */}
                <div style={{
                    background: '#23232f',
                    padding: '8px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    borderTop: '1px solid #292940'
                }}>
                    {/* Navigation Buttons */}
                    <div style={{ display: 'flex', gap: 4 }}>
                        <IconButton 
                            size="small"
                            onClick={handleRefresh}
                            sx={{ 
                                color: '#999',
                                padding: '4px',
                                '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)', color: '#fff' }
                            }}
                        >
                            <RefreshIcon 
                                fontSize="small" 
                                style={{ 
                                    animation: isLoading ? 'spin 1s linear infinite' : 'none' 
                                }} 
                            />
                        </IconButton>
                    </div>

                    {/* Address Bar */}
                    <div style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        background: '#1a1a1a',
                        border: '1px solid #333',
                        borderRadius: 16,
                        padding: '6px 12px',
                        margin: '0 8px',
                        minHeight: 28,
                        boxSizing: 'border-box'
                    }}>
                        <LockIcon style={{ color: '#4caf50', fontSize: 14, marginRight: 6 }} />
                        <input
                            type="text"
                            value={currentUrl}
                            readOnly
                            style={{
                                background: 'none',
                                border: 'none',
                                color: '#fff',
                                fontSize: 13,
                                fontFamily: 'monospace',
                                width: '100%',
                                outline: 'none',
                                cursor: 'text'
                            }}
                        />
                        <IconButton 
                            size="small"
                            sx={{ 
                                color: '#999',
                                padding: '2px',
                                '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)', color: '#ffd700' }
                            }}
                        >
                            <StarBorderIcon fontSize="small" />
                        </IconButton>
                    </div>

                    {/* Menu Button */}
                    <IconButton 
                        size="small"
                        sx={{ 
                            color: '#999',
                            padding: '4px',
                            '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)', color: '#fff' }
                        }}
                    >
                        <MoreVertIcon fontSize="small" />
                    </IconButton>
                </div>
            </div>

            {/* Browser Content */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000', position: 'relative', minHeight: 0, overflow: 'hidden' }}>
                {isLoading && (
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: 3,
                        background: 'linear-gradient(90deg, #ffd700 0%, #4caf50 50%, #ffd700 100%)',
                        animation: 'loading 2s ease-in-out infinite',
                        zIndex: 10
                    }} />
                )}
                <img
                    src="http://localhost:8000/stream"
                    alt="Live Browser Stream"
                    style={{
                        maxWidth: '100%',
                        maxHeight: '100%',
                        objectFit: 'contain',
                        display: 'block',
                        background: '#000'
                    }}
                />
            </div>
            
            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                @keyframes loading {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100vw); }
                }
            `}</style>
        </div>
    );
}

export default NoVNC;
