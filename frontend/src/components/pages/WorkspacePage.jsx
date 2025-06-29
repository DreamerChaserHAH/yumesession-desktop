import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Greet, GetWorkspaceByID, UpdateWorkspaceLastOpen, GetAllWorkspaces, InitializeTranscriptionServer, GetTranscriptionServerStatus, SendTestTranscription, StopTranscriptionServer, GetAllKnowledgeBaseItems, OpenAndGetPDFData } from '../../../wailsjs/go/main/App';
import { Button, Card, CardContent, List, ListItem, ListItemText, ListItemIcon, Tabs, Tab, Box } from '@mui/material';
import { Description as DocumentIcon, PictureAsPdf as PdfIcon, Language as BrowserIcon } from '@mui/icons-material';
import HeaderBar from '../shared/HeaderBar';
import TranscriptScreen from '../shared/TranscriptScreen';
import PromptSection from '../sections/PromptSection';
import NotesSection from '../sections/NotesSection';
import NoVNC from '../shared/NoVNC';
import PDFViewer from '../shared/PDFViewer';

function WorkspacePage() {
    const { workspaceId } = useParams();
    const navigate = useNavigate();
    const [resultText, setResultText] = useState("Please enter your name below 👇");
    const [name, setName] = useState('');
    const [workspace, setWorkspace] = useState(null);
    const [allWorkspaces, setAllWorkspaces] = useState([]);
    const [loading, setLoading] = useState(true);
    const [switchingWorkspace, setSwitchingWorkspace] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [isBrowserVisible, setIsBrowserVisible] = useState(false);
    const [activeTab, setActiveTab] = useState(0); // 0 = Browser, 1 = PDF
    const [knowledgeBaseItems, setKnowledgeBaseItems] = useState([]);
    const [selectedPdf, setSelectedPdf] = useState(null);
    const [pdfData, setPdfData] = useState(null);
    const [showPdfViewer, setShowPdfViewer] = useState(false); // New state for toggle
    const [panelSizes, setPanelSizes] = useState({
        left: 25,
        center: 37.5,
        right: 37.5
    });

    // Load workspace data from backend
    const loadWorkspace = async () => {
        if (!workspaceId) {
            console.error('No workspace ID provided');
            navigate('/');
            return;
        }

        try {
            setLoading(true);
            // Load both the specific workspace and all workspaces
            const [workspaceData, allWorkspacesData] = await Promise.all([
                GetWorkspaceByID(parseInt(workspaceId)),
                GetAllWorkspaces()
            ]);
            
            if (workspaceData) {
                setWorkspace(workspaceData);
                setAllWorkspaces(allWorkspacesData || []);
                // Update last open time when workspace is accessed
                await UpdateWorkspaceLastOpen(parseInt(workspaceId));
            } else {
                console.error('Workspace not found');
                navigate('/');
            }
        } catch (error) {
            console.error('Error loading workspace:', error);
            navigate('/');
        } finally {
            setLoading(false);
        }
    };

    // Load knowledge base items from backend
    const loadKnowledgeBase = async () => {
        try {
            const knowledgeBaseData = await GetAllKnowledgeBaseItems();
            console.log('📚 Loaded knowledge base items:', knowledgeBaseData);
            // Filter for PDF documents only
            const pdfItems = (knowledgeBaseData || []).filter(item => 
                item.uniqueFileName && item.uniqueFileName.toLowerCase().endsWith('.pdf')
            );
            setKnowledgeBaseItems(pdfItems);
        } catch (error) {
            console.error('Error loading knowledge base items:', error);
            setKnowledgeBaseItems([]);
        }
    };

    // Handle PDF selection and loading
    const handlePdfSelect = async (pdfItem) => {
        try {
            console.log('📄 Loading PDF:', pdfItem.uniqueFileName);
            setSelectedPdf(pdfItem);
            setPdfData(null); // Clear previous data
            
            // Load PDF data using the backend function
            // File path should be "yumesession/knowledge_base/" + unique_file_name
            const filePath = "yumesession/knowledge_base/" + pdfItem.uniqueFileName;
            console.log('📄 Opening PDF with path:', filePath);
            const pdfDataResult = await OpenAndGetPDFData(filePath);
            console.log('📄 PDF data loaded:', typeof pdfDataResult, pdfDataResult?.length || 'unknown length');
            setPdfData(pdfDataResult);
            
            // Show PDF viewer (hide list)
            setShowPdfViewer(true);
            
            // Switch to PDF tab if not already active
            if (activeTab !== 1) {
                setActiveTab(1);
            }
        } catch (error) {
            console.error('Error loading PDF:', error);
            setSelectedPdf(null);
            setPdfData(null);
            setShowPdfViewer(false);
            // Handle error - maybe show a notification
        }
    };

    // Handle close PDF viewer (go back to list)
    const handleClosePdfViewer = () => {
        setShowPdfViewer(false);
        setSelectedPdf(null);
        setPdfData(null);
    };

    // Handle tab change
    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    // Load workspace on component mount or when workspaceId changes
    useEffect(() => {
        setSwitchingWorkspace(false); // Reset switching state
        loadWorkspace();
        loadKnowledgeBase();
        
        // Add test function to window for debugging
        window.sendTestTranscription = async (speaker, text) => {
            try {
                await SendTestTranscription(speaker || "Test Speaker", text || "This is a test transcription message");
                console.log("✅ Test transcription sent");
            } catch (error) {
                console.error("❌ Failed to send test transcription:", error);
            }
        };
        
        window.getTranscriptionStatus = async () => {
            try {
                const status = await GetTranscriptionServerStatus();
                console.log("📊 Transcription status:", status);
                return status;
            } catch (error) {
                console.error("❌ Failed to get transcription status:", error);
            }
        };

        // Cleanup function to stop transcription server when component unmounts
        return () => {
            if (isRecording) {
                console.log("🧹 Component unmounting, stopping transcription server...");
                StopTranscriptionServer().catch(error => {
                    console.error("❌ Failed to stop transcription server on unmount:", error);
                });
            }
        };
    }, [workspaceId]);
    
    const updateName = (e) => setName(e.target.value);
    const updateResultText = (result) => setResultText(result);

    function greet() {
        Greet(name).then(updateResultText);
    }

    const handleRecordToggle = async () => {
        if (!isRecording) {
            // Starting recording - initialize transcription server
            try {
                console.log("🎤 Starting transcription server...");
                await InitializeTranscriptionServer();
                console.log("✅ Transcription server initialized and ready");
                
                // Get initial status
                const status = await GetTranscriptionServerStatus();
                console.log("📊 Transcription server status:", status);
                
                setIsRecording(true);
            } catch (error) {
                console.error("❌ Failed to initialize transcription server:", error);
                // Still allow recording toggle even if transcription fails
                setIsRecording(true);
            }
        } else {
            // Stopping recording - stop transcription server
            try {
                console.log("⏹️ Stopping transcription server...");
                await StopTranscriptionServer();
                console.log("✅ Transcription server stopped");
                
                setIsRecording(false);
            } catch (error) {
                console.error("❌ Failed to stop transcription server:", error);
                // Still update UI even if stop fails
                setIsRecording(false);
            }
        }
    };
    const handleBackToHome = async () => {
        // Stop transcription server if it's running
        if (isRecording) {
            try {
                console.log("🛑 Stopping transcription server before navigating to home...");
                await StopTranscriptionServer();
                console.log("✅ Transcription server stopped");
            } catch (error) {
                console.error("❌ Failed to stop transcription server:", error);
            }
        }
        navigate('/');
    };
    const handleWorkspaceSwitch = async (newWorkspaceId) => {
        if (newWorkspaceId !== parseInt(workspaceId)) {
            // Stop transcription server if it's running before switching workspaces
            if (isRecording) {
                try {
                    console.log("🛑 Stopping transcription server before switching workspaces...");
                    await StopTranscriptionServer();
                    console.log("✅ Transcription server stopped");
                    setIsRecording(false);
                } catch (error) {
                    console.error("❌ Failed to stop transcription server:", error);
                }
            }
            setSwitchingWorkspace(true);
            // Add a small delay to show loading state
            setTimeout(() => {
                navigate(`/workspace/${newWorkspaceId}`);
            }, 100);
        }
    };
    const toggleBrowser = () => setIsBrowserVisible(prev => !prev);
    
    const handleResizeStart = (e, direction) => {
        setIsResizing(true);
        // In a real implementation, you'd add mouse move and mouse up event listeners
        // For now, this is a placeholder for the resize functionality
        console.log('Resize started for:', direction);
    };

    return (
        <>
            <style>
                {`
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `}
            </style>
            <div style={{ height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {loading || switchingWorkspace ? (
                // Loading state
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100vh',
                    background: '#1a1a1a',
                    color: '#fff',
                    fontSize: '1.2rem'
                }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ 
                            width: 40, 
                            height: 40, 
                            border: '4px solid #333', 
                            borderTop: '4px solid #ffd700',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite',
                            margin: '0 auto 16px'
                        }} />
                        {switchingWorkspace ? 'Switching workspace...' : 'Loading workspace...'}
                    </div>
                </div>
            ) : (
                <>
                    <HeaderBar
                        selectedWorkspace={workspace}
                        allWorkspaces={allWorkspaces}
                        onWorkspaceSwitch={handleWorkspaceSwitch}
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
                            <NotesSection isRecording={isRecording} />
                        </div>

                        {/* Multi-Tab Panel - Sliding from right */}
                        <div style={{ 
                            position: 'absolute',
                            right: isBrowserVisible ? 0 : '-37.5%',
                            top: 0,
                            width: '37.5%',
                            height: '100%', 
                            boxSizing: 'border-box', 
                            background: 'linear-gradient(135deg, #23232f 0%, #2a2a3a 100%)', 
                            display: 'flex', 
                            flexDirection: 'column',
                            boxShadow: '-8px 0 24px rgba(0,0,0,0.5)',
                            overflow: 'hidden',
                            borderLeft: '2px solid #333',
                            transition: 'right 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)',
                            zIndex: 10
                        }}>
                            {/* Tab Header */}
                            <div style={{ 
                                background: '#1a1a24',
                                borderBottom: '1px solid #333',
                                padding: '8px 0'
                            }}>
                                <Tabs 
                                    value={activeTab} 
                                    onChange={handleTabChange}
                                    sx={{
                                        '& .MuiTabs-indicator': {
                                            backgroundColor: '#ffd700'
                                        },
                                        '& .MuiTab-root': {
                                            color: '#ccc',
                                            fontSize: '0.85rem',
                                            minHeight: 40,
                                            textTransform: 'none',
                                            fontWeight: 500,
                                            '&.Mui-selected': {
                                                color: '#ffd700',
                                                fontWeight: 600
                                            }
                                        }
                                    }}
                                >
                                    <Tab 
                                        icon={<BrowserIcon fontSize="small" />} 
                                        label="Browser" 
                                        iconPosition="start"
                                    />
                                    <Tab 
                                        icon={<PdfIcon fontSize="small" />} 
                                        label="Documents" 
                                        iconPosition="start"
                                    />
                                </Tabs>
                            </div>

                            {/* Tab Content */}
                            <div style={{ flex: 1, overflow: 'hidden' }}>
                                {activeTab === 0 && (
                                    // Browser Tab Content
                                    <div style={{ height: '100%', background: '#000' }}>
                                        <NoVNC />
                                    </div>
                                )}
                                
                                {activeTab === 1 && (
                                    // PDF Documents Tab Content
                                    <div style={{ 
                                        height: '100%', 
                                        display: 'flex',
                                        flexDirection: 'column'
                                    }}>
                                        {showPdfViewer ? (
                                            // PDF Viewer Mode - Full Width
                                            <div style={{ 
                                                flex: 1,
                                                height: '100%',
                                                display: 'flex',
                                                flexDirection: 'column'
                                            }}>
                                                {pdfData ? (
                                                    <PDFViewer 
                                                        pdfData={pdfData}
                                                        fileName={selectedPdf.uniqueFileName}
                                                        onClose={handleClosePdfViewer}
                                                    />
                                                ) : (
                                                    <div style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        height: '100%',
                                                        color: '#999',
                                                        flexDirection: 'column',
                                                        gap: 16
                                                    }}>
                                                        <div style={{
                                                            width: 40,
                                                            height: 40,
                                                            border: '3px solid #333',
                                                            borderTop: '3px solid #ffd700',
                                                            borderRadius: '50%',
                                                            animation: 'spin 1s linear infinite'
                                                        }} />
                                                        <p>Loading PDF...</p>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            // PDF List Mode - Full Width
                                            <div style={{ 
                                                flex: 1,
                                                height: '100%',
                                                background: '#1a1a24',
                                                overflow: 'auto',
                                                padding: 16
                                            }}>
                                                <h3 style={{ 
                                                    color: '#ffd700',
                                                    fontSize: '1rem',
                                                    fontWeight: 600,
                                                    margin: '0 0 16px 0',
                                                    fontFamily: 'Nunito, sans-serif'
                                                }}>
                                                    PDF Documents
                                                </h3>
                                                
                                                {knowledgeBaseItems.length === 0 ? (
                                                    <div style={{
                                                        textAlign: 'center',
                                                        color: '#999',
                                                        padding: '40px 20px'
                                                    }}>
                                                        <PdfIcon sx={{ fontSize: 48, mb: 2, color: '#666' }} />
                                                        <p>No PDF documents in Knowledge Base</p>
                                                        <p style={{ fontSize: '0.85rem', lineHeight: 1.4 }}>
                                                            Add PDF files to your Knowledge Base from the home page to view them here.
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <List sx={{ padding: 0 }}>
                                                        {knowledgeBaseItems.map((item) => (
                                                            <ListItem
                                                                key={item.id}
                                                                onClick={() => handlePdfSelect(item)}
                                                                sx={{
                                                                    cursor: 'pointer',
                                                                    borderRadius: 1,
                                                                    mb: 1,
                                                                    padding: '8px 12px',
                                                                    backgroundColor: 'transparent',
                                                                    border: '1px solid transparent',
                                                                    '&:hover': {
                                                                        backgroundColor: 'rgba(255, 215, 0, 0.1)',
                                                                        borderColor: '#ffd700'
                                                                    }
                                                                }}
                                                            >
                                                                <ListItemIcon sx={{ minWidth: 36 }}>
                                                                    <PdfIcon sx={{ color: '#ff5252', fontSize: 20 }} />
                                                                </ListItemIcon>
                                                                <ListItemText
                                                                    primary={item.uniqueFileName}
                                                                    secondary={item.oneLineSummary}
                                                                    primaryTypographyProps={{
                                                                        color: '#fff',
                                                                        fontSize: '0.9rem',
                                                                        fontWeight: 400,
                                                                        noWrap: true
                                                                    }}
                                                                    secondaryTypographyProps={{
                                                                        color: '#999',
                                                                        fontSize: '0.75rem',
                                                                        noWrap: true
                                                                    }}
                                                                />
                                                            </ListItem>
                                                        ))}
                                                    </List>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
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
                            title={isBrowserVisible ? 'Hide Panel' : 'Show Browser & Documents'}
                        >
                            {isBrowserVisible ? '▶' : '◀'}
                        </button>
                    </div>
                </>
            )}
            </div>
        </>
    );
}

export default WorkspacePage;
