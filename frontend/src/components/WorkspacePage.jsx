import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Greet } from '../../wailsjs/go/main/App';
import HeaderBar from './HeaderBar';
import TranscriptScreen from './TranscriptScreen';
import PromptSection from './PromptSection';
import NotesSection from './NotesSection';
import NoVNC from './NoVNC';

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
        left: 25,
        center: 37.5,
        right: 37.5
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
                    flex: '0 0 25%',
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
                    flex: '0 0 37.5%',
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
                    flex: '0 0 37.5%',
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
                    right: isBrowserVisible ? 0 : '-37.5%',
                    top: 0,
                    width: '37.5%',
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
                        right: isBrowserVisible ? '37.5%' : '-2px',
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

export default WorkspacePage;
