import React, { useState, useEffect, useRef } from 'react';
import { marked } from 'marked';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import { InitializeMarkdownAgentWebSocket, SendMeetingNotesRequest, CloseMarkdownAgentWebSocket, IsMarkdownAgentWebSocketConnected, GetTranscriptionMessagesByDateRange, CreateMeetingNotes, GetMeetingNotesByID, GetMeetingNotesByWorkspace, UpdateMeetingNotes, DeleteMeetingNotes, DeleteMeetingNotesByWorkspace, SearchMeetingNotes } from '../../../wailsjs/go/main/App';
import { EventsOn } from '../../../wailsjs/runtime/runtime';
import { useParams } from 'react-router-dom';

function NotesSection({ isRecording }) {
    const { workspaceId } = useParams();
    const [note, setNote] = useState("");
    const [meetingNoteId, setMeetingNoteId] = useState(null);
    const [activeTab, setActiveTab] = useState('editor'); // 'editor' or 'preview'
    const [isEditorFocused, setIsEditorFocused] = useState(false);
    const [isUpdatingNotes, setIsUpdatingNotes] = useState(false);
    const [lastUpdateTime, setLastUpdateTime] = useState(null);
    const [nextUpdateCountdown, setNextUpdateCountdown] = useState(null);
    const intervalRef = useRef(null);
    const countdownRef = useRef(null);
    const streamContentRef = useRef("");
    const sentTranscriptIdsRef = useRef(new Set());
    const sentTranscriptMapRef = useRef(new Map()); // id -> last_modified
    const [streamingRef, setStreamingRef] = useState(false);

    // Load or create meeting note on mount/workspace change
    useEffect(() => {
        if (!workspaceId) return;
        let isMounted = true;
        (async () => {
            try {
                console.log("🔄 Attempting to laod", workspaceId);
                const existing = await GetMeetingNotesByWorkspace(parseInt(workspaceId));
                console.log("📄 Loaded existing meeting notes:", existing);
                if (existing != null && existing.length > 0) {
                    if (isMounted) {
                        setNote(existing[0].text || "");
                        setMeetingNoteId(existing[0].id);
                    }
                } else {
                    // Create new meeting note (pass only workspaceId as required by Go backend)
                    const created = await CreateMeetingNotes(parseInt(workspaceId), "");
                    if (created && created.id && isMounted) {
                        setNote("");
                        setMeetingNoteId(created.id);
                        // Optionally update content/title if needed
                        // await UpdateMeetingNotes({ id: created.id, content: "", title: `Meeting Notes - ${new Date().toLocaleString()}` });
                    }
                }
            } catch (err) {
                console.error("Failed to load or create meeting note:", err);
            }
        })();
        return () => { isMounted = false; };
    }, [workspaceId]);

    // Update meeting note in DB after AI generation
    useEffect(() => {
        if (!meetingNoteId) return;
        if (!note) return;
        // Only update if not currently updating (avoid race with streaming)
        if (isUpdatingNotes) return;
        (async () => {
            try {
                await UpdateMeetingNotes(parseInt(workspaceId), note );
            } catch (err) {
                console.error("Failed to update meeting note:", err);
            }
        })();
    }, [note, meetingNoteId, isUpdatingNotes]);

    // Live notes update logic
    const updateLiveNotes = async () => {
        if (!isRecording || !workspaceId || streamingRef) {
            return;
        }

        try {
            setIsUpdatingNotes(true);
            setStreamingRef(true);

            // Fetch all recent transcript messages (e.g., last 1 hour for safety)
            const now = new Date();
            const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
            const allTranscripts = await GetTranscriptionMessagesByDateRange(
                parseInt(workspaceId),
                oneHourAgo,
                now
            );

            // Filter only unsent or updated messages by last_modified
            const unsentOrUpdatedTranscripts = allTranscripts.filter(t => {
                const prev = sentTranscriptMapRef.current.get(t.id);
                // If never sent, or last_modified is newer, include it
                return !prev || new Date(t.last_modified) > new Date(prev);
            });

            if (!unsentOrUpdatedTranscripts || unsentOrUpdatedTranscripts.length === 0) {
                console.log("📭 No new or updated transcripts found, skipping notes update");
                setIsUpdatingNotes(false);
                setStreamingRef(false);
                return;
            }

            // Mark these messages as sent/updated
            unsentOrUpdatedTranscripts.forEach(t => sentTranscriptMapRef.current.set(t.id, t.last_modified));

            // Format for context
            const transcriptionList = unsentOrUpdatedTranscripts.map(t => `${t.speaker}: ${t.text}`);
            console.log("🎯 Updating notes with", unsentOrUpdatedTranscripts.length, "new/updated transcripts:", transcriptionList);

            // Only use markdown agent WebSocket
            try {
                const isConnected = await IsMarkdownAgentWebSocketConnected();
                if (!isConnected) {
                    console.log("🔌 Initializing markdown agent WebSocket...");
                    await InitializeMarkdownAgentWebSocket();
                    console.log("✅ Markdown agent WebSocket initialized successfully");
                }
                await SendMeetingNotesRequest(transcriptionList, note);
                console.log("✅ Meeting notes request sent successfully");
            } catch (markdownAgentError) {
                console.error("❌ Markdown agent WebSocket failed:", markdownAgentError);
                setIsUpdatingNotes(false);
                setStreamingRef(false);
            }
        } catch (error) {
            console.error("Failed to update live notes:", error);
            setIsUpdatingNotes(false);
            setStreamingRef(false);
            if (error.message && error.message.includes('WebSocket')) {
                console.warn("🔌 All WebSocket systems unavailable. Live notes updates disabled.");
            }
        }
    };

    // Set up live notes streaming event listeners
    useEffect(() => {
        if (!isRecording) return;

        // Listen for markdown agent streaming events
        const unsubscribeMarkdownStart = EventsOn("markdownAgentStreamStart", (data) => {
            console.log("🔄 Markdown agent stream starting:", data.message);
            streamContentRef.current = "";
            
            // Pause countdown during generation
            if (countdownRef.current) {
                clearInterval(countdownRef.current);
                countdownRef.current = null;
                setNextUpdateCountdown(null);
            }
        });

        const unsubscribeMarkdownChunk = EventsOn("markdownAgentStreamChunk", (data) => {
            const responseText = data.token || "";
            streamContentRef.current += responseText;
            
            console.log("📝 Streaming chunk received:", responseText);
            console.log("📝 Current content length:", streamContentRef.current.length);
            
            // Update notes with streaming content
            setNote(streamContentRef.current);
            
            // Check if this is the final chunk
            if (data.done) {
                console.log("✅ Markdown agent streaming completed (done flag)");
                setIsUpdatingNotes(false);
                setStreamingRef(false);
                setLastUpdateTime(new Date());
                // Save to DB
                if (meetingNoteId) {
                    UpdateMeetingNotes(parseInt(workspaceId), streamContentRef.current ).catch(err => {
                        console.error("Failed to update meeting note after streaming:", err);
                    });
                }
                // Restart countdown after generation is complete
                startCountdownAfterGeneration();
            }
        });

        const unsubscribeMarkdownDone = EventsOn("markdownAgentStreamDone", (data) => {
            console.log("✅ Markdown agent stream completed:", data.message);
            setIsUpdatingNotes(false);
            setStreamingRef(false);
            setLastUpdateTime(new Date());
            // Ensure final content is set
            if (streamContentRef.current.trim()) {
                setNote(streamContentRef.current);
            }
            // Save to DB
            if (meetingNoteId) {
                UpdateMeetingNotes(parseInt(workspaceId), streamContentRef.current).catch(err => {
                    console.error("Failed to update meeting note after streaming:", err);
                });
            }
            // Restart countdown after generation is complete
            startCountdownAfterGeneration();
        });

        const unsubscribeMarkdownInfo = EventsOn("markdownAgentStreamInfo", (data) => {
            console.log("Markdown agent info:", data.message);
            // Optional: You could show info messages to the user
        });

        const unsubscribeMarkdownError = EventsOn("markdownAgentError", (data) => {
            console.error("Markdown agent error:", data.error);
            setIsUpdatingNotes(false);
            setStreamingRef(false);
        });

        const unsubscribeMarkdownDisconnected = EventsOn("markdownAgentWebSocketDisconnected", (data) => {
            console.warn("Markdown agent WebSocket disconnected:", data.message);
            // The system will automatically try to reconnect
        });

        // Cleanup event listeners
        return () => {
            unsubscribeMarkdownStart();
            unsubscribeMarkdownChunk();
            unsubscribeMarkdownDone();
            unsubscribeMarkdownInfo();
            unsubscribeMarkdownError();
            unsubscribeMarkdownDisconnected();
        };
    }, [isRecording]);

    // Helper function to start countdown after generation is complete
    const startCountdownAfterGeneration = () => {
        if (!isRecording) return;
        
        console.log("⏰ Restarting countdown after generation completed");
        let secondsLeft = 20;
        setNextUpdateCountdown(secondsLeft);
        
        countdownRef.current = setInterval(() => {
            secondsLeft -= 1;
            setNextUpdateCountdown(secondsLeft);
            
            if (secondsLeft <= 0) {
                // Reset countdown and trigger update
                secondsLeft = 20;
                setNextUpdateCountdown(secondsLeft);
                updateLiveNotes();
            }
        }, 1000);
    };

    // Set up 20-second interval for live updates
    useEffect(() => {
        if (isRecording) {
            console.log("🎯 Starting live notes updates with message tracking");
            
            // Start countdown immediately
            startCountdownAfterGeneration();
            
            // Perform initial update after 5 seconds
            setTimeout(() => {
                updateLiveNotes();
            }, 5000);
            
        } else {
            console.log("⏹️ Stopping live notes updates");
            if (countdownRef.current) {
                clearInterval(countdownRef.current);
                countdownRef.current = null;
            }
            setIsUpdatingNotes(false);
            setNextUpdateCountdown(null);
            setStreamingRef(false);
            
            // Close markdown agent WebSocket when recording stops
            try {
                CloseMarkdownAgentWebSocket();
                console.log("🔌 Closed markdown agent WebSocket");
            } catch (error) {
                console.error("Failed to close markdown agent WebSocket:", error);
            }
        }

        return () => {
            if (countdownRef.current) {
                clearInterval(countdownRef.current);
                countdownRef.current = null;
            }
        };
    }, [isRecording, workspaceId]); // Removed 'note' from dependencies

    // Cleanup effect for component unmount
    useEffect(() => {
        return () => {
            // Close markdown agent WebSocket when component unmounts
            try {
                CloseMarkdownAgentWebSocket();
                console.log("🧹 Cleanup: Closed markdown agent WebSocket");
            } catch (error) {
                console.error("Cleanup: Failed to close markdown agent WebSocket:", error);
            }
        };
    }, []);

    const handleNoteChange = (e) => {
        // Only allow manual editing when not recording or not currently updating
        if (!isRecording || !isUpdatingNotes) {
            setNote(e.target.value);
        }
    };

    return (
        <div style={{ 
            width: '100%', 
            height: '100%', 
            display: 'flex', 
            flexDirection: 'column', 
            background: 'linear-gradient(135deg, #1a1a24 0%, #20202a 100%)', 
            padding: '12px',
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
                borderBottom: '2px solid #292940',
                flexShrink: 0
            }}>
                <h3 style={{
                    margin: 0,
                    color: '#ffd700',
                    fontSize: 16,
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8
                }}>
                    <div style={{
                        width: 4,
                        height: 16,
                        background: 'linear-gradient(180deg, #ffd700 0%, #ffed4e 100%)',
                        borderRadius: 2
                    }} />
                    Meeting Notes
                    {isUpdatingNotes && (
                        <AutorenewIcon 
                            style={{ 
                                fontSize: 16, 
                                color: '#4caf50',
                                animation: 'spin 1s linear infinite',
                                marginLeft: 4
                            }} 
                        />
                    )}
                </h3>
                <div style={{
                    background: isRecording 
                        ? (isUpdatingNotes 
                            ? 'rgba(76, 175, 80, 0.2)' 
                            : 'rgba(255, 215, 0, 0.1)')
                        : 'rgba(255, 215, 0, 0.1)',
                    border: isRecording 
                        ? (isUpdatingNotes 
                            ? '1px solid rgba(76, 175, 80, 0.5)' 
                            : '1px solid rgba(255, 215, 0, 0.3)')
                        : '1px solid rgba(255, 215, 0, 0.3)',
                    borderRadius: 6,
                    padding: '3px 6px',
                    fontSize: 10,
                    color: isRecording 
                        ? (isUpdatingNotes ? '#4caf50' : '#ffd700')
                        : '#ffd700',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    flexDirection: 'column'
                }}>
                    <div>
                        {isRecording 
                            ? (isUpdatingNotes ? 'Updating...' : 'Live Notes')
                            : 'Manual Edit'
                        }
                    </div>
                    {isRecording && nextUpdateCountdown !== null && !isUpdatingNotes && (
                        <div style={{
                            fontSize: 8,
                            color: '#999',
                            fontWeight: 400,
                            textTransform: 'none',
                            letterSpacing: 'normal'
                        }}>
                            Next update: {nextUpdateCountdown}s
                        </div>
                    )}
                    {isRecording && isUpdatingNotes && (
                        <div style={{
                            fontSize: 8,
                            color: '#4caf50',
                            fontWeight: 400,
                            textTransform: 'none',
                            letterSpacing: 'normal'
                        }}>
                            Generating...
                        </div>
                    )}
                </div>
            </div>

            {/* Tab Navigation */}
            <div style={{
                display: 'flex',
                marginBottom: 12,
                background: '#23232f',
                borderRadius: 8,
                border: '1px solid #333',
                padding: 4,
                flexShrink: 0
            }}>
                <button
                    onClick={() => setActiveTab('editor')}
                    style={{
                        flex: 1,
                        padding: '6px 12px',
                        background: activeTab === 'editor' 
                            ? 'linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)' 
                            : 'transparent',
                        color: activeTab === 'editor' ? '#23232f' : '#fff',
                        border: 'none',
                        borderRadius: 6,
                        fontWeight: 600,
                        fontSize: 12,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6
                    }}
                >
                    <EditIcon style={{ fontSize: 14 }} />
                    Editor
                    {activeTab === 'editor' && isEditorFocused && (
                        <div style={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            background: '#4caf50',
                            animation: 'pulse 2s infinite'
                        }} />
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('preview')}
                    style={{
                        flex: 1,
                        padding: '6px 12px',
                        background: activeTab === 'preview' 
                            ? 'linear-gradient(135deg, #4caf50 0%, #81c784 100%)' 
                            : 'transparent',
                        color: activeTab === 'preview' ? '#fff' : '#ccc',
                        border: 'none',
                        borderRadius: 6,
                        fontWeight: 600,
                        fontSize: 12,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6
                    }}
                >
                    <VisibilityIcon style={{ fontSize: 14 }} />
                    Preview
                </button>
            </div>

            {/* Content Area */}
            <div style={{ 
                flex: 1, 
                minHeight: 0,
                background: '#23232f',
                borderRadius: 8,
                border: '1px solid #333',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column'
            }}>
                {activeTab === 'editor' ? (
                    /* Editor View */
                    <div style={{ 
                        flex: 1, 
                        display: 'flex', 
                        flexDirection: 'column',
                        background: 'linear-gradient(135deg, #1a1a1a 0%, #1f1f1f 100%)',
                        minHeight: 0
                    }}>
                        {/* Editor Header */}
                        <div style={{
                            padding: '10px 14px',
                            background: 'linear-gradient(135deg, #23232f 0%, #2a2a3a 100%)',
                            borderBottom: '1px solid #333',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexShrink: 0
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <EditIcon style={{ color: '#ffd700', fontSize: 16 }} />
                                <span style={{ 
                                    color: '#ffd700', 
                                    fontSize: 13, 
                                    fontWeight: 600
                                }}>
                                    Markdown Editor
                                </span>
                                {isEditorFocused && (
                                    <div style={{
                                        width: 6,
                                        height: 6,
                                        borderRadius: '50%',
                                        background: '#4caf50',
                                        animation: 'pulse 2s infinite'
                                    }} />
                                )}
                            </div>
                            <div style={{
                                fontSize: 11,
                                color: '#999',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 12
                            }}>
                                <span>{note.split('\n').length} lines</span>
                                <span>{note.length} chars</span>
                                {isRecording && !isUpdatingNotes && nextUpdateCountdown !== null && (
                                    <span style={{ 
                                        color: '#ffd700', 
                                        fontStyle: 'italic',
                                        fontSize: 10,
                                        background: 'rgba(255, 215, 0, 0.1)',
                                        padding: '2px 6px',
                                        borderRadius: 4,
                                        border: '1px solid rgba(255, 215, 0, 0.3)'
                                    }}>
                                        Next: {nextUpdateCountdown}s
                                    </span>
                                )}
                                {isRecording && isUpdatingNotes && (
                                    <span style={{ color: '#4caf50', fontStyle: 'italic' }}>
                                        Auto-updating...
                                    </span>
                                )}
                            </div>
                        </div>
                        
                        {/* Text Editor */}
                        <textarea
                            value={note}
                            onChange={handleNoteChange}
                            onFocus={() => setIsEditorFocused(true)}
                            onBlur={() => setIsEditorFocused(false)}
                            placeholder="AI Assistant will write notes here as the events get unfolded"
                            readOnly={isRecording && isUpdatingNotes}
                            style={{
                                flex: 1,
                                width: '100%',
                                padding: '16px',
                                background: 'transparent',
                                color: '#fff',
                                border: 'none',
                                outline: 'none',
                                resize: 'none',
                                fontFamily: 'Monaco, Consolas, "Courier New", monospace',
                                fontSize: 13,
                                lineHeight: 1.5,
                                minHeight: 0,
                                boxSizing: 'border-box',
                                opacity: (isRecording && isUpdatingNotes) ? 0.7 : 1,
                                cursor: (isRecording && isUpdatingNotes) ? 'not-allowed' : 'text'
                            }}
                        />
                    </div>
                ) : (
                    /* Preview View */
                    <div style={{ 
                        flex: 1, 
                        display: 'flex', 
                        flexDirection: 'column',
                        background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
                        minHeight: 0
                    }}>
                        {/* Preview Header */}
                        <div style={{
                            padding: '10px 14px',
                            background: 'linear-gradient(135deg, #e9ecef 0%, #f8f9fa 100%)',
                            borderBottom: '1px solid #dee2e6',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexShrink: 0
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <VisibilityIcon style={{ color: '#4caf50', fontSize: 16 }} />
                                <span style={{ 
                                    color: '#4caf50', 
                                    fontSize: 13, 
                                    fontWeight: 600
                                }}>
                                    Live Preview
                                </span>
                            </div>
                            <div style={{
                                fontSize: 11,
                                color: '#6c757d',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8
                            }}>
                                {isRecording && lastUpdateTime ? 
                                    `Last updated: ${lastUpdateTime.toLocaleTimeString()}` :
                                    'Rendered Markdown'
                                }
                                {isRecording && !isUpdatingNotes && nextUpdateCountdown !== null && (
                                    <span style={{ 
                                        color: '#ffd700', 
                                        fontStyle: 'italic',
                                        fontSize: 10,
                                        background: 'rgba(255, 215, 0, 0.1)',
                                        padding: '2px 6px',
                                        borderRadius: 4,
                                        border: '1px solid rgba(255, 215, 0, 0.3)'
                                    }}>
                                        Next: {nextUpdateCountdown}s
                                    </span>
                                )}
                            </div>
                        </div>
                        
                        {/* Markdown Preview */}
                        <div 
                            className="markdown-preview"
                            style={{
                                flex: 1,
                                padding: '16px',
                                overflowY: 'auto',
                                minHeight: 0,
                                color: '#212529',
                                lineHeight: 1.5,
                                fontSize: 13
                            }}
                            dangerouslySetInnerHTML={{
                                __html: marked(note, {
                                    breaks: true,
                                    gfm: true
                                })
                            }}
                        />
                    </div>
                )}
            </div>
            
            <style>{`
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
                
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                
                /* Markdown Preview Styles */
                .markdown-preview h1 {
                    color: #212529;
                    margin-top: 0;
                    margin-bottom: 1rem;
                    font-size: 1.5rem;
                    font-weight: 700;
                    border-bottom: 2px solid #dee2e6;
                    padding-bottom: 0.5rem;
                }
                
                .markdown-preview h2 {
                    color: #495057;
                    margin-top: 1.5rem;
                    margin-bottom: 1rem;
                    font-size: 1.3rem;
                    font-weight: 600;
                }
                
                .markdown-preview h3 {
                    color: #495057;
                    margin-top: 1.25rem;
                    margin-bottom: 0.75rem;
                    font-size: 1.1rem;
                    font-weight: 600;
                }
                
                .markdown-preview p {
                    margin-bottom: 1rem;
                    color: #212529;
                    font-size: 13px;
                }
                
                .markdown-preview ul, .markdown-preview ol {
                    margin-bottom: 1rem;
                    padding-left: 1.5rem;
                }
                
                .markdown-preview li {
                    margin-bottom: 0.25rem;
                    color: #212529;
                    font-size: 13px;
                }
                
                .markdown-preview blockquote {
                    border-left: 4px solid #ffd700;
                    padding-left: 1rem;
                    margin: 1rem 0;
                    font-style: italic;
                    color: #6c757d;
                }
                
                .markdown-preview code {
                    background: #f8f9fa;
                    color: #e83e8c;
                    padding: 0.125rem 0.25rem;
                    border-radius: 0.25rem;
                    font-size: 12px;
                    border: 1px solid #dee2e6;
                }
                
                .markdown-preview pre {
                    background: #f8f9fa;
                    color: #212529;
                    padding: 1rem;
                    border-radius: 0.5rem;
                    border: 1px solid #dee2e6;
                    overflow-x: auto;
                }
                
                .markdown-preview pre code {
                    background: none;
                    border: none;
                    padding: 0;
                }
                
                .markdown-preview strong {
                    color: #212529;
                    font-weight: 700;
                }
                
                .markdown-preview em {
                    color: #495057;
                    font-style: italic;
                }
                
                .markdown-preview hr {
                    border: none;
                    border-top: 1px solid #dee2e6;
                    margin: 2rem 0;
                }
                
                .markdown-preview a {
                    color: #0d6efd;
                    text-decoration: none;
                    font-size: 13px;
                }
                
                .markdown-preview a:hover {
                    text-decoration: underline;
                }
                
                .markdown-preview input[type="checkbox"] {
                    margin-right: 0.5rem;
                    accent-color: #ffd700;
                }
            `}</style>
        </div>
    );
}

export default NotesSection;
