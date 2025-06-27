import {useState, useRef, useEffect} from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useParams } from 'react-router-dom';
import logo from './assets/images/logo-universal.png';
import './App.css';
import {Greet} from "../wailsjs/go/main/App";
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import SendIcon from '@mui/icons-material/Send';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import LockIcon from '@mui/icons-material/Lock';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import MonitorIcon from '@mui/icons-material/Monitor';

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/workspace/:workspaceId" element={<WorkspacePage />} />
            </Routes>
        </Router>
    );
}

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

function WorkspacePage() {
    const { workspaceId } = useParams();
    const navigate = useNavigate();
    const [resultText, setResultText] = useState("Please enter your name below 👇");
    const [name, setName] = useState('');
    const [meetings] = useState([
        'Sprint Planning',
        'Design Review',
        'Client Sync',
        'Retrospective',
    ]);
    const [selectedMeeting, setSelectedMeeting] = useState(meetings[0]);
    const [isRecording, setIsRecording] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [isBrowserVisible, setIsBrowserVisible] = useState(false);
    const [panelSizes, setPanelSizes] = useState({
        left: 33.33,
        center: 33.33,
        right: 33.33
    });
    
    const updateName = (e) => setName(e.target.value);
    const updateResultText = (result) => setResultText(result);

    function greet() {
        Greet(name).then(updateResultText);
    }

    const handleMeetingChange = (e) => setSelectedMeeting(e.target.value);
    const handleRecordToggle = () => setIsRecording(r => !r);
    const handleBackToHome = () => navigate('/');
    const toggleBrowser = () => setIsBrowserVisible(prev => !prev);
    
    const handleResizeStart = (e, direction) => {
        setIsResizing(true);
        // In a real implementation, you'd add mouse move and mouse up event listeners
        // For now, this is a placeholder for the resize functionality
        console.log('Resize started for:', direction);
    };

    return (
        <div style={{ height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <HeaderBar
                meetings={meetings}
                selectedMeeting={selectedMeeting}
                onMeetingChange={handleMeetingChange}
                onRecordToggle={handleRecordToggle}
                isRecording={isRecording}
                onBackToHome={handleBackToHome}
                workspaceId={workspaceId}
                isBrowserVisible={isBrowserVisible}
                onToggleBrowser={toggleBrowser}
            />
            <div style={{ 
                display: 'flex', 
                flexDirection: 'row', 
                flex: 1, 
                background: '#1a1a1a', 
                minHeight: 0, 
                overflow: 'hidden',
                height: 'calc(100vh - 56px)',
                position: 'relative'
            }}>
                {/* Left Panel: Live Transcript */}
                <div style={{ 
                    flex: '0 0 33.33%',
                    height: '100%', 
                    borderRight: '2px solid #333', 
                    boxSizing: 'border-box', 
                    background: 'linear-gradient(135deg, #1a1a24 0%, #20202a 100%)', 
                    display: 'flex', 
                    flexDirection: 'column',
                    boxShadow: 'inset -2px 0 8px rgba(0,0,0,0.2)',
                    overflow: 'hidden'
                }}>
                    <TranscriptScreen />
                </div>
                
                {/* Center Panel: AI Assistant */}
                <div style={{ 
                    flex: '0 0 33.33%',
                    height: '100%',
                    display: 'flex', 
                    flexDirection: 'column', 
                    background: 'linear-gradient(135deg, #23232f 0%, #2a2a3a 100%)', 
                    overflow: 'hidden',
                    boxShadow: 'inset 0 0 20px rgba(0,0,0,0.1)'
                }}>
                    <PromptSection />
                </div>
                
                {/* Right Panel: Meeting Notes */}
                <div style={{ 
                    flex: '0 0 33.33%',
                    height: '100%', 
                    boxSizing: 'border-box', 
                    background: 'linear-gradient(135deg, #1a1a24 0%, #20202a 100%)', 
                    display: 'flex', 
                    flexDirection: 'column',
                    boxShadow: 'inset 2px 0 8px rgba(0,0,0,0.2)',
                    overflow: 'hidden',
                    borderLeft: '2px solid #333'
                }}>
                    <NotesSection />
                </div>

                {/* Browser Panel - Sliding from right */}
                <div style={{ 
                    position: 'absolute',
                    right: isBrowserVisible ? 0 : '-33.33%',
                    top: 0,
                    width: '33.33%',
                    height: '100%', 
                    boxSizing: 'border-box', 
                    background: '#000', 
                    display: 'flex', 
                    flexDirection: 'column',
                    boxShadow: '-8px 0 24px rgba(0,0,0,0.5)',
                    overflow: 'hidden',
                    borderLeft: '2px solid #333',
                    transition: 'right 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)',
                    zIndex: 10
                }}>
                    <NoVNC />
                </div>

                {/* Browser Toggle Button */}
                <button
                    onClick={toggleBrowser}
                    style={{
                        position: 'absolute',
                        right: isBrowserVisible ? '33.33%' : '-2px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'linear-gradient(135deg, #ffd700 0%, #fff8dc 100%)',
                        color: '#23232f',
                        border: '2px solid #333',
                        borderRadius: '8px 0 0 8px',
                        padding: '16px 8px',
                        cursor: 'pointer',
                        fontSize: 20,
                        fontWeight: 700,
                        boxShadow: '-4px 0 12px rgba(0,0,0,0.4)',
                        transition: 'all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)',
                        zIndex: 11,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minHeight: 80,
                        minWidth: 32,
                        '&:hover': {
                            background: 'linear-gradient(135deg, #ffed4e 0%, #ffd700 100%)',
                            boxShadow: '-6px 0 16px rgba(0,0,0,0.5)'
                        }
                    }}
                    title={isBrowserVisible ? 'Hide Browser' : 'Show Browser'}
                >
                    {isBrowserVisible ? '▶' : '◀'}
                </button>
            </div>
        </div>
    );
}

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

function TranscriptScreen() {
    const [selectedText, setSelectedText] = useState("");
    const [showReference, setShowReference] = useState(false);
    const transcript = [
        "Alex: We have this Sweden startup here that lost 100 billion dollars",
        "Jamie: That's a huge loss!",
        "Taylor: How did that happen?",
        "Alex: It was a series of bad investments.",
    ];

    const handleMouseUp = (e) => {
        const selection = window.getSelection();
        const text = selection ? selection.toString() : "";
        if (text) {
            setSelectedText(text);
            setShowReference(true);
        } else {
            setShowReference(false);
            setSelectedText("");
        }
    };

    const handleReference = () => {
        // Implement your reference logic here
        alert(`Reference action triggered for: "${selectedText}"`);
        setShowReference(false);
        setSelectedText("");
    };

    const handleClose = () => {
        setShowReference(false);
        setSelectedText("");
    };

    return (        <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                height: '100%', 
                position: 'relative',
                padding: '16px',
                fontFamily: 'Nunito, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif',
                minHeight: 0,
                maxHeight: '100%',
                boxSizing: 'border-box',
                overflow: 'hidden'
            }}
            onMouseUp={handleMouseUp}
        >
            {/* Header */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 12,
                paddingBottom: 12,
                borderBottom: '2px solid #292940'
            }}>
                <h3 style={{
                    margin: 0,
                    color: '#ffd700',
                    fontSize: 18,
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8
                }}>
                    <div style={{
                        width: 4,
                        height: 18,
                        background: 'linear-gradient(180deg, #ffd700 0%, #ffed4e 100%)',
                        borderRadius: 2
                    }} />
                    Live Transcript
                </h3>
                <div style={{
                    background: 'rgba(255, 215, 0, 0.1)',
                    border: '1px solid rgba(255, 215, 0, 0.3)',
                    borderRadius: 6,
                    padding: '4px 8px',
                    fontSize: 11,
                    color: '#ffd700',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                }}>
                    Active
                </div>
            </div>

            {/* Transcript Content */}
            <div id="transcript-content" style={{ 
                flex: 1, 
                overflowY: 'auto', 
                minHeight: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: 8
            }}>
                {transcript.map((line, idx) => (
                    <div
                        key={idx}
                        style={{
                            padding: '12px 16px',
                            borderRadius: 12,
                            userSelect: 'text',
                            background: selectedText && line.includes(selectedText) 
                                ? 'linear-gradient(135deg, #2a2a3a 0%, #323248 100%)' 
                                : 'linear-gradient(135deg, #20202a 0%, #262632 100%)',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                            border: '1px solid #333',
                            transition: 'all 0.3s ease',
                            cursor: 'text',
                            position: 'relative',
                            '&:hover': {
                                boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                                borderColor: '#444'
                            }
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                            <div style={{
                                width: 32,
                                height: 32,
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, #ffd700 0%, #fff8dc 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#23232f',
                                fontWeight: 700,
                                fontSize: 14,
                                flexShrink: 0
                            }}>
                                {line.split(':')[0].charAt(0)}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ 
                                    color: '#ffd700', 
                                    fontWeight: 700,
                                    fontSize: 14,
                                    marginBottom: 4,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px'
                                }}>
                                    {line.split(':')[0]}
                                </div>
                                <div style={{ 
                                    color: '#fff', 
                                    fontSize: 15,
                                    lineHeight: 1.5,
                                    fontWeight: 400
                                }}>
                                    {line.split(':').slice(1).join(':').trim()}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Reference Modal */}
            {showReference && selectedText && (
                <div style={{ 
                    position: 'absolute', 
                    right: 24, 
                    bottom: 24, 
                    zIndex: 10, 
                    background: 'linear-gradient(135deg, #23232f 0%, #2a2a3a 100%)', 
                    padding: 24, 
                    borderRadius: 16, 
                    boxShadow: '0 8px 32px rgba(0,0,0,0.5)', 
                    border: '1px solid #444', 
                    minWidth: 320,
                    backdropFilter: 'blur(10px)'
                }}>
                    <div style={{ marginBottom: 16, color: '#fff', fontSize: 15, lineHeight: 1.5 }}>
                        <div style={{ 
                            fontWeight: 700, 
                            color: '#ffd700',
                            fontSize: 16,
                            marginBottom: 12,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8
                        }}>
                            <div style={{
                                width: 4,
                                height: 16,
                                background: '#ffd700',
                                borderRadius: 2
                            }} />
                            Reference Selected Text
                        </div>
                        <div style={{ 
                            marginTop: 12, 
                            padding: '12px 16px', 
                            background: 'linear-gradient(135deg, #181820 0%, #1f1f28 100%)', 
                            borderRadius: 8, 
                            color: '#ffd700', 
                            fontFamily: 'inherit', 
                            fontSize: 14, 
                            wordBreak: 'break-word', 
                            border: '1px solid #333',
                            fontStyle: 'italic'
                        }}>
                            "{selectedText}"
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                        <button 
                            onClick={handleReference} 
                            style={{ 
                                background: 'linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)', 
                                color: '#23232f', 
                                border: 'none', 
                                borderRadius: 8, 
                                padding: '10px 20px', 
                                fontWeight: 700, 
                                cursor: 'pointer', 
                                boxShadow: '0 2px 8px rgba(255, 215, 0, 0.3)',
                                fontSize: 14,
                                transition: 'all 0.2s ease'
                            }}
                        >
                            Reference
                        </button>
                        <button 
                            onClick={handleClose} 
                            style={{ 
                                background: 'rgba(255, 255, 255, 0.1)', 
                                color: '#fff', 
                                border: '1px solid #444', 
                                borderRadius: 8, 
                                padding: '10px 20px', 
                                fontWeight: 600, 
                                cursor: 'pointer',
                                fontSize: 14,
                                transition: 'all 0.2s ease'
                            }}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

function PromptSection() {
    const [prompt, setPrompt] = useState("");
    const [messages, setMessages] = useState([
        { role: 'system', content: 'How can I help you today?' }
    ]);
    const inputRef = useRef(null);

    const handlePromptChange = (e) => setPrompt(e.target.value);
    const handlePromptSubmit = (e) => {
        e.preventDefault();
        if (!prompt.trim()) return;
        setMessages([...messages, { role: 'user', content: prompt }]);
        setPrompt("");
        setTimeout(() => {
            setMessages(msgs => [...msgs, { role: 'assistant', content: 'This is a sample response.' }]);
        }, 500);
    };

    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, []);

    return (
        <div style={{ 
            width: '100%', 
            height: '100%', 
            display: 'flex', 
            flexDirection: 'column', 
            background: 'linear-gradient(135deg, #23232f 0%, #2a2a3a 100%)', 
            padding: '16px',
            minHeight: 0,
            maxHeight: '100%',
            fontFamily: 'Nunito, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif',
            boxSizing: 'border-box',
            overflow: 'hidden'
        }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 12,
                paddingBottom: 12,
                borderBottom: '2px solid #333'
            }}>
                <h3 style={{
                    margin: 0,
                    color: '#ffd700',
                    fontSize: 18,
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8
                }}>
                    <div style={{
                        width: 4,
                        height: 18,
                        background: 'linear-gradient(180deg, #ffd700 0%, #ffed4e 100%)',
                        borderRadius: 2
                    }} />
                    AI Assistant
                </h3>
                <div style={{
                    background: 'rgba(76, 175, 80, 0.1)',
                    border: '1px solid rgba(76, 175, 80, 0.3)',
                    borderRadius: 6,
                    padding: '4px 8px',
                    fontSize: 11,
                    color: '#4caf50',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                }}>
                    Online
                </div>
            </div>

            {/* Messages */}
            <div style={{ 
                flex: 1, 
                overflowY: 'auto', 
                display: 'flex', 
                flexDirection: 'column', 
                gap: 10, 
                minHeight: 0,
                marginBottom: 12
            }}>
                {messages.map((msg, idx) => (
                    <div key={idx} style={{
                        alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                        maxWidth: '85%',
                        display: 'flex',
                        flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                        gap: 8,
                        alignItems: 'flex-start'
                    }}>
                        {/* Avatar */}
                        <div style={{
                            width: 24,
                            height: 24,
                            borderRadius: '50%',
                            background: msg.role === 'user' 
                                ? 'linear-gradient(135deg, #ffd700 0%, #fff8dc 100%)' 
                                : 'linear-gradient(135deg, #4caf50 0%, #81c784 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: msg.role === 'user' ? '#23232f' : '#fff',
                            fontWeight: 700,
                            fontSize: 11,
                            flexShrink: 0
                        }}>
                            {msg.role === 'user' ? 'U' : 'AI'}
                        </div>
                        
                        {/* Message bubble */}
                        <div style={{
                            background: msg.role === 'user' 
                                ? 'linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)' 
                                : 'linear-gradient(135deg, #20202a 0%, #262632 100%)',
                            color: msg.role === 'user' ? '#23232f' : '#fff',
                            padding: '8px 12px',
                            borderRadius: msg.role === 'user' ? '12px 12px 3px 12px' : '12px 12px 12px 3px',
                            fontSize: 14,
                            lineHeight: 1.4,
                            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                            border: msg.role === 'user' ? 'none' : '1px solid #333',
                            wordBreak: 'break-word'
                        }}>
                            {msg.content}
                        </div>
                    </div>
                ))}
            </div>

            {/* Input Form */}
            <form onSubmit={handlePromptSubmit} style={{ 
                display: 'flex', 
                alignItems: 'flex-end', 
                gap: 8,
                background: 'linear-gradient(135deg, #20202a 0%, #262632 100%)',
                padding: '12px',
                borderRadius: 8,
                border: '1px solid #333',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
            }}>
                <TextField
                    inputRef={inputRef}
                    value={prompt}
                    onChange={handlePromptChange}
                    placeholder="Ask me anything about your meeting..."
                    variant="outlined"
                    multiline
                    minRows={1}
                    maxRows={4}
                    fullWidth
                    sx={{
                        '& .MuiOutlinedInput-root': {
                            background: '#1a1a1a',
                            color: '#fff',
                            borderRadius: 2,
                            '& fieldset': {
                                borderColor: '#444'
                            },
                            '&:hover fieldset': {
                                borderColor: '#555'
                            },
                            '&.Mui-focused fieldset': {
                                borderColor: '#ffd700',
                                borderWidth: 2
                            }
                        },
                        '& .MuiOutlinedInput-input': {
                            color: '#fff',
                            '&::placeholder': {
                                color: '#999',
                                opacity: 1
                            }
                        }
                    }}
                />
                <button
                    type="submit"
                    disabled={!prompt.trim()}
                    style={{
                        background: prompt.trim() 
                            ? 'linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)' 
                            : 'rgba(255, 255, 255, 0.1)',
                        color: prompt.trim() ? '#23232f' : '#666',
                        border: 'none',
                        borderRadius: 8,
                        padding: '12px',
                        minWidth: 48,
                        minHeight: 48,
                        cursor: prompt.trim() ? 'pointer' : 'not-allowed',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s ease',
                        boxShadow: prompt.trim() ? '0 2px 8px rgba(255, 215, 0, 0.3)' : 'none'
                    }}
                >
                    <SendIcon style={{ fontSize: 20 }} />
                </button>
            </form>
        </div>
    );
}

function NotesSection() {
    const [note, setNote] = useState("# Example Notes\n- You can use **Markdown** here!\n- Add your meeting notes, todos, or references.");
    
    return (
        <div style={{ 
            flex: 1, 
            overflowY: 'auto', 
            background: 'linear-gradient(135deg, #23232f 0%, #2a2a3a 100%)', 
            color: '#fff', 
            padding: '16px', 
            fontFamily: 'Nunito, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif', 
            display: 'flex', 
            flexDirection: 'column',
            minHeight: 0,
            maxHeight: '100%',
            boxSizing: 'border-box'
        }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 12,
                paddingBottom: 12,
                borderBottom: '2px solid #333'
            }}>
                <h3 style={{
                    margin: 0,
                    color: '#ffd700',
                    fontSize: 18,
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8
                }}>
                    <div style={{
                        width: 4,
                        height: 18,
                        background: 'linear-gradient(180deg, #ffd700 0%, #ffed4e 100%)',
                        borderRadius: 2
                    }} />
                    Meeting Notes
                </h3>
                <div style={{
                    display: 'flex',
                    gap: 6
                }}>
                    <button style={{
                        background: 'rgba(255, 215, 0, 0.1)',
                        border: '1px solid rgba(255, 215, 0, 0.3)',
                        borderRadius: 4,
                        padding: '4px 8px',
                        color: '#ffd700',
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                    }}>
                        Save
                    </button>
                    <button style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid #444',
                        borderRadius: 4,
                        padding: '4px 8px',
                        color: '#ccc',
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                    }}>
                        Export
                    </button>
                </div>
            </div>

            {/* Notes Editor */}
            <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                <TextField
                    multiline
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    placeholder="Type your notes here... Markdown is supported!"
                    variant="outlined"
                    fullWidth
                    sx={{
                        flex: 1,
                        '& .MuiOutlinedInput-root': {
                            height: '100%',
                            background: 'linear-gradient(135deg, #20202a 0%, #262632 100%)',
                            color: '#fff',
                            fontFamily: 'JetBrains Mono, Consolas, Monaco, monospace',
                            fontSize: 14,
                            borderRadius: 2,
                            border: '1px solid #333',
                            '& fieldset': {
                                borderColor: '#333'
                            },
                            '&:hover fieldset': {
                                borderColor: '#444'
                            },
                            '&.Mui-focused fieldset': {
                                borderColor: '#ffd700',
                                borderWidth: 2
                            },
                            '& textarea': {
                                height: '100% !important',
                                overflow: 'auto !important',
                                resize: 'none',
                                lineHeight: 1.6,
                                padding: '16px !important',
                                boxSizing: 'border-box'
                            }
                        },
                        '& .MuiOutlinedInput-input': {
                            color: '#fff',
                            '&::placeholder': {
                                color: '#999',
                                opacity: 1
                            }
                        }
                    }}
                />
            </div>

            {/* Footer with stats */}
            <div style={{
                marginTop: 16,
                padding: '12px 0',
                borderTop: '1px solid #333',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: 12,
                color: '#999'
            }}>
                <div>
                    {note.split('\n').length} lines • {note.length} characters
                </div>
                <div style={{
                    background: 'rgba(76, 175, 80, 0.1)',
                    border: '1px solid rgba(76, 175, 80, 0.3)',
                    borderRadius: 4,
                    padding: '4px 8px',
                    color: '#4caf50',
                    fontSize: 11,
                    fontWeight: 600
                }}>
                    Auto-saved
                </div>
            </div>
        </div>
    );
}

export default App
