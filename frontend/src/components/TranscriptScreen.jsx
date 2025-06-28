import React, { useState, useEffect, useRef } from 'react';
import { EventsOn, EventsOff } from '../../wailsjs/runtime/runtime';

function TranscriptScreen() {
    const [selectedText, setSelectedText] = useState("");
    const [showReference, setShowReference] = useState(false);
    const [transcript, setTranscript] = useState([]);
    const [connectionStatus, setConnectionStatus] = useState({
        connected: false,
        message: "Waiting for Chrome extension connection..."
    });
    const transcriptEndRef = useRef(null);

    // Helper function to format changes for display
    const formatChanges = (changes) => {
        if (!changes) return '';
        
        if (typeof changes === 'string') {
            return changes;
        }
        
        if (typeof changes === 'object') {
            const parts = [];
            if (changes.added || changes.addedText) {
                parts.push(`+${changes.addedText || changes.added}`);
            }
            if (changes.removed || changes.removedText) {
                parts.push(`-${changes.removedText || changes.removed}`);
            }
            return parts.length > 0 ? `Changes: ${parts.join(' ')}` : 'Text updated';
        }
        
        return 'Text updated';
    };

    // Helper function to remove duplicates from transcript
    const removeDuplicates = (messages) => {
        const seen = new Map();
        return messages.filter((msg, index) => {
            const key = `${msg.speaker}:${msg.text}:${new Date(msg.timestamp).getTime()}`;
            const roundedTime = Math.floor(new Date(msg.timestamp).getTime() / 1000) * 1000; // Round to nearest second
            const timeKey = `${msg.speaker}:${msg.text}:${roundedTime}`;
            
            if (seen.has(timeKey)) {
                console.log(`🗑️ Removing duplicate message: "${msg.text}" from ${msg.speaker}`);
                return false;
            }
            
            seen.set(timeKey, true);
            return true;
        });
    };

    // Listen for transcription events from Go backend
    useEffect(() => {
        console.log("🎤 Setting up transcription event listeners");

        // Listen for new transcription messages
        const unsubscribeNewMessage = EventsOn('transcriptionNewMessage', (data) => {
            console.log("📝 New transcription message:", data);
            
            // Handle different message types
            if (data.type === "keepalive") {
                // Just update connection status, don't add to transcript
                return;
            }

            const newMessage = {
                id: data.id || `msg_${Date.now()}_${Math.random()}`, // Generate ID if not provided
                speaker: data.speaker || 'Unknown',
                text: data.text || '',
                timestamp: data.timestamp,
                fullLine: `${data.speaker || 'Unknown'}: ${data.text || ''}`,
                source: data.source,
                messageType: data.messageType,
                isSystemMessage: (data.speaker === "System")
            };

            // Skip messages with unknown speakers (unless it's a system message)
            if (!newMessage.isSystemMessage && (!data.speaker || data.speaker === 'Unknown' || data.speaker.trim() === '')) {
                console.log("🚫 Skipping message with unknown speaker:", newMessage.text);
                return;
            }

            // Handle system messages differently
            if (newMessage.isSystemMessage) {
                setTranscript(prev => [...prev, newMessage]);
                return;
            }

            setTranscript(prev => {
                // Check for potential duplicates in the last few messages
                const recentMessages = prev.slice(-5); // Check last 5 messages
                const isDuplicate = recentMessages.some(msg => 
                    msg.text === newMessage.text && 
                    msg.speaker === newMessage.speaker &&
                    Math.abs(new Date(msg.timestamp) - new Date(newMessage.timestamp)) < 1000 // Within 1 second
                );

                if (isDuplicate) {
                    console.log("🚫 Duplicate message detected, skipping:", newMessage.text);
                    return prev; // Don't add duplicate
                }

                // For regular messages, just add them
                const newTranscript = [...prev, newMessage];
                return removeDuplicates(newTranscript);
            });
        });

        // Listen for transcription message updates
        const unsubscribeMessageUpdate = EventsOn('transcriptionMessageUpdate', (data) => {
            console.log("🔄 Transcription message update:", data);
            
            // Handle keepalive messages
            if (data.type === "keepalive") {
                // Just acknowledge the keepalive, don't modify transcript
                return;
            }

            setTranscript(prev => {
                const updated = [...prev];
                
                // Find the last message that matches the oldText
                // Search from the end of the array (most recent messages first)
                let foundIndex = -1;
                for (let i = updated.length - 1; i >= 0; i--) {
                    const message = updated[i];
                    // Match by oldText and speaker to ensure we're updating the right message
                    // Also check if speakers match (but be flexible about undefined/null)
                    const speakerMatch = (message.speaker === data.speaker) || 
                                       ((!message.speaker || message.speaker === 'Unknown') && data.speaker) ||
                                       (message.speaker && (!data.speaker || data.speaker === 'Unknown'));
                    
                    console.log(`🔍 Checking message ${i}: "${message.text}" (speaker: ${message.speaker}) vs "${data.oldText}" (speaker: ${data.speaker}) - Match: ${message.text === data.oldText && speakerMatch}`);
                    
                    if (message.text === data.oldText && speakerMatch) {
                        foundIndex = i;
                        break;
                    }
                }
                
                if (foundIndex !== -1) {
                    // Update the found message, preserving the original speaker if it was valid
                    const originalSpeaker = updated[foundIndex].speaker;
                    const newSpeaker = data.speaker || originalSpeaker || 'Unknown';
                    
                    // Don't update if the new speaker would be "Unknown" and we have a valid original speaker
                    if ((!data.speaker || data.speaker === 'Unknown' || data.speaker.trim() === '') && 
                        originalSpeaker && originalSpeaker !== 'Unknown') {
                        console.log(`🚫 Skipping update that would change speaker from "${originalSpeaker}" to "Unknown"`);
                        return removeDuplicates(updated);
                    }
                    
                    updated[foundIndex] = {
                        ...updated[foundIndex],
                        text: data.text || '', // Use the new text
                        speaker: newSpeaker, // Use new speaker but preserve original if new one is missing
                        fullLine: `${newSpeaker}: ${data.text || ''}`,
                        timestamp: data.timestamp,
                        updateCount: (updated[foundIndex].updateCount || 0) + 1,
                        changes: data.changes, // Store the raw changes object
                        lastUpdated: new Date().toISOString()
                    };
                    console.log(`✅ Updated message at index ${foundIndex}: "${data.oldText}" → "${data.text}" (Speaker: ${originalSpeaker} → ${newSpeaker})`);
                } else {
                    // If no matching message found, treat it as a new message
                    console.log(`⚠️ No matching message found for oldText: "${data.oldText}" (speaker: ${data.speaker}), adding as new message`);
                    
                    // Skip creating new messages with unknown speakers
                    if (!data.speaker || data.speaker === 'Unknown' || data.speaker.trim() === '') {
                        console.log("🚫 Skipping creation of new message with unknown speaker:", data.text);
                        return removeDuplicates(updated);
                    }
                    
                    const newMessage = {
                        id: `msg_${Date.now()}_${Math.random()}`,
                        speaker: data.speaker,
                        text: data.text || '',
                        timestamp: data.timestamp,
                        fullLine: `${data.speaker}: ${data.text || ''}`,
                        source: data.source,
                        messageType: data.messageType,
                        updateCount: 1,
                        changes: data.changes, // Store the raw changes object
                        isSystemMessage: (data.speaker === "System")
                    };
                    updated.push(newMessage);
                }
                
                return removeDuplicates(updated);
            });
        });

        // Listen for extension connection status
        const unsubscribeConnected = EventsOn('transcriptionExtensionConnected', (data) => {
            console.log("🔗 Extension connected:", data);
            setConnectionStatus({
                connected: true,
                message: data.message || "Chrome extension connected - Ready for live transcription!"
            });
        });

        const unsubscribeDisconnected = EventsOn('transcriptionExtensionDisconnected', (data) => {
            console.log("🔌 Extension disconnected:", data);
            setConnectionStatus({
                connected: false,
                message: data.message || "Chrome extension disconnected"
            });
        });

        // Cleanup event listeners on unmount
        return () => {
            console.log("🧹 Cleaning up transcription event listeners");
            unsubscribeNewMessage();
            unsubscribeMessageUpdate();
            unsubscribeConnected();
            unsubscribeDisconnected();
        };
    }, []);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        if (transcriptEndRef.current) {
            transcriptEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [transcript]);

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

    return (
        <>
            <style>
                {`
                    @keyframes slideIn {
                        from {
                            opacity: 0;
                            transform: translateY(10px);
                        }
                        to {
                            opacity: 1;
                            transform: translateY(0);
                        }
                    }
                    
                    @keyframes messageUpdate {
                        0% {
                            background: linear-gradient(135deg, #3a3a2a 0%, #4a4a32 100%);
                            border-color: #ffd700;
                        }
                        100% {
                            background: linear-gradient(135deg, #20202a 0%, #262632 100%);
                            border-color: #333;
                        }
                    }
                `}
            </style>
            <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                height: '100%', 
                position: 'relative',
                padding: '12px',
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
                    Live Transcript
                </h3>
                <div style={{
                    background: connectionStatus.connected 
                        ? 'rgba(255, 215, 0, 0.1)' 
                        : 'rgba(255, 99, 71, 0.1)',
                    border: connectionStatus.connected 
                        ? '1px solid rgba(255, 215, 0, 0.3)' 
                        : '1px solid rgba(255, 99, 71, 0.3)',
                    borderRadius: 6,
                    padding: '3px 6px',
                    fontSize: 10,
                    color: connectionStatus.connected ? '#ffd700' : '#ff6347',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                }}>
                    {connectionStatus.connected ? 'Live' : 'Offline'}
                </div>
                {/* Test Button for debugging */}
                {process.env.NODE_ENV === 'development' && (
                    <div style={{ display: 'flex', gap: 4 }}>
                        <button
                            onClick={() => {
                                if (window.sendTestTranscription) {
                                    window.sendTestTranscription("Jane Doe", "This is a test message that will be updated");
                                }
                            }}
                            style={{
                                background: 'rgba(255, 215, 0, 0.1)',
                                border: '1px solid #ffd700',
                                borderRadius: 4,
                                padding: '2px 6px',
                                fontSize: 9,
                                color: '#ffd700',
                                cursor: 'pointer'
                            }}
                        >
                            Test New
                        </button>
                        <button
                            onClick={() => {
                                // Simulate an update to the last message
                                const testUpdate = {
                                    type: "message_update",
                                    speaker: "Jane Doe",
                                    text: "This is a test message that will be updated with more content",
                                    oldText: "This is a test message that will be updated",
                                    timestamp: new Date().toISOString(),
                                    source: "google-meet",
                                    changes: "Added: ' with more content'"
                                };
                                // Manually trigger the update event
                                if (window.runtime && window.runtime.EventsEmit) {
                                    window.runtime.EventsEmit('transcriptionMessageUpdate', testUpdate);
                                }
                            }}
                            style={{
                                background: 'rgba(255, 165, 0, 0.1)',
                                border: '1px solid #ffa500',
                                borderRadius: 4,
                                padding: '2px 6px',
                                fontSize: 9,
                                color: '#ffa500',
                                cursor: 'pointer'
                            }}
                        >
                            Test Update
                        </button>
                    </div>
                )}
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
                {/* Connection Status Message */}
                {!connectionStatus.connected && (
                    <div style={{
                        padding: '16px 12px',
                        borderRadius: 12,
                        background: 'linear-gradient(135deg, #2a2a3a 0%, #323248 100%)',
                        border: '1px solid #444',
                        textAlign: 'center',
                        color: '#ff6347',
                        fontSize: 13,
                        fontStyle: 'italic'
                    }}>
                        {connectionStatus.message}
                        <div style={{ 
                            fontSize: 11, 
                            marginTop: 8, 
                            opacity: 0.7 
                        }}>
                            Make sure your Chrome extension is connected to Google Meet
                        </div>
                    </div>
                )}

                {/* Transcript Messages */}
                {transcript.length === 0 && connectionStatus.connected ? (
                    <div style={{
                        padding: '16px 12px',
                        borderRadius: 12,
                        background: 'linear-gradient(135deg, #20202a 0%, #262632 100%)',
                        border: '1px solid #333',
                        textAlign: 'center',
                        color: '#ffd700',
                        fontSize: 13,
                        fontStyle: 'italic'
                    }}>
                        Waiting for live captions from Google Meet...
                        <div style={{ 
                            fontSize: 11, 
                            marginTop: 8, 
                            opacity: 0.7 
                        }}>
                            Enable captions in your Google Meet call to see live transcription
                        </div>
                    </div>
                ) : (
                    transcript.map((message, idx) => (
                        <div
                            key={message.id || idx}
                            style={{
                                padding: message.isSystemMessage ? '8px 12px' : '10px 12px',
                                borderRadius: 12,
                                userSelect: 'text',
                                background: message.isSystemMessage 
                                    ? 'linear-gradient(135deg, #2a1a2a 0%, #322248 100%)'
                                    : selectedText && message.fullLine?.includes(selectedText) 
                                        ? 'linear-gradient(135deg, #2a2a3a 0%, #323248 100%)' 
                                        : 'linear-gradient(135deg, #20202a 0%, #262632 100%)',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                                border: message.isSystemMessage 
                                    ? '1px solid #663366' 
                                    : '1px solid #333',
                                transition: 'all 0.3s ease',
                                cursor: 'text',
                                position: 'relative',
                                animation: idx === transcript.length - 1 ? 'slideIn 0.3s ease-out' : 'none',
                                opacity: message.isSystemMessage ? 0.8 : 1
                            }}
                        >
                            {message.isSystemMessage ? (
                                // System message layout
                                <div style={{ 
                                    textAlign: 'center',
                                    color: '#cc99cc',
                                    fontSize: 12,
                                    fontStyle: 'italic',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 8
                                }}>
                                    <div style={{
                                        width: 16,
                                        height: 1,
                                        background: '#cc99cc',
                                        opacity: 0.5
                                    }} />
                                    {message.text}
                                    <div style={{
                                        width: 16,
                                        height: 1,
                                        background: '#cc99cc',
                                        opacity: 0.5
                                    }} />
                                    {message.timestamp && (
                                        <div style={{
                                            color: '#888',
                                            fontSize: 10,
                                            opacity: 0.7,
                                            marginLeft: 8
                                        }}>
                                            {new Date(message.timestamp).toLocaleTimeString()}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                // Regular message layout
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                                    <div style={{
                                        width: 28,
                                        height: 28,
                                        borderRadius: '50%',
                                        background: 'linear-gradient(135deg, #ffd700 0%, #fff8dc 100%)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: '#23232f',
                                        fontWeight: 700,
                                        fontSize: 12,
                                        flexShrink: 0
                                    }}>
                                        {message.speaker ? message.speaker.charAt(0).toUpperCase() : '?'}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ 
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 8,
                                            marginBottom: 3
                                        }}>
                                            <div style={{ 
                                                color: '#ffd700', 
                                                fontWeight: 700,
                                                fontSize: 12,
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.5px'
                                            }}>
                                                {message.speaker || 'Unknown'}
                                            </div>
                                            {message.updateCount > 0 && (
                                                <div style={{
                                                    background: 'rgba(255, 215, 0, 0.2)',
                                                    color: '#ffd700',
                                                    fontSize: 9,
                                                    padding: '1px 4px',
                                                    borderRadius: 3,
                                                    fontWeight: 600,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 2
                                                }}>
                                                    <span>📝</span>
                                                    Updated {message.updateCount}x
                                                </div>
                                            )}
                                            {message.timestamp && (
                                                <div style={{
                                                    color: '#888',
                                                    fontSize: 9,
                                                    opacity: 0.7
                                                }}>
                                                    {new Date(message.timestamp).toLocaleTimeString()}
                                                </div>
                                            )}
                                        </div>
                                        <div style={{ 
                                            color: '#fff', 
                                            fontSize: 13,
                                            lineHeight: 1.4,
                                            fontWeight: 400
                                        }}>
                                            {message.text}
                                        </div>
                                        {message.changes && (
                                            <div style={{
                                                color: '#888',
                                                fontSize: 10,
                                                fontStyle: 'italic',
                                                marginTop: 4,
                                                opacity: 0.7
                                            }}>
                                                {formatChanges(message.changes)}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                )}
                
                {/* Auto-scroll anchor */}
                <div ref={transcriptEndRef} />
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
        </>
    );
}

export default TranscriptScreen;
