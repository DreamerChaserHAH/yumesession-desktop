import React, { useState, useRef, useEffect } from 'react';
import { TextField } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { SendChatMessage } from '../../wailsjs/go/main/App';
import { EventsOn } from '../../wailsjs/runtime/runtime';

function PromptSection() {
    const [prompt, setPrompt] = useState("");
    const [messages, setMessages] = useState([
        { role: 'system', content: 'How can I help you today?' }
    ]);
    const [isStreaming, setIsStreaming] = useState(false);
    const [currentStreamMessage, setCurrentStreamMessage] = useState("");
    const inputRef = useRef(null);

    const handlePromptChange = (e) => setPrompt(e.target.value);
    
    const handlePromptSubmit = async (e) => {
        e.preventDefault();
        if (!prompt.trim() || isStreaming) return;
        
        // Add user message to chat
        const userMessage = { role: 'user', content: prompt };
        setMessages(prevMessages => [...prevMessages, userMessage]);
        
        // Clear input and set streaming state
        const currentPrompt = prompt;
        setPrompt("");
        setIsStreaming(true);
        setCurrentStreamMessage("");
        
        // Add empty assistant message that will be filled by streaming
        setMessages(prevMessages => [...prevMessages, { role: 'assistant', content: '' }]);
        
        try {
            // Send chat message to backend
            await SendChatMessage(currentPrompt, "You are a helpful AI assistant.");
        } catch (error) {
            console.error("Failed to send chat message:", error);
            setIsStreaming(false);
            // Update the last message with error
            setMessages(prevMessages => {
                const newMessages = [...prevMessages];
                newMessages[newMessages.length - 1].content = "Sorry, I encountered an error. Please try again.";
                return newMessages;
            });
        }
    };

    useEffect(() => {
        // Listen for streaming start
        const unsubscribeStart = EventsOn("chatStreamStart", (data) => {
            console.log("Chat stream starting:", data.message);
        });

        // Listen for streaming chat chunks
        const unsubscribeChunk = EventsOn("chatStreamChunk", (data) => {
            const responseText = data.token || "";
            setCurrentStreamMessage(prev => prev + responseText);
            
            // Update the last assistant message with accumulated response
            setMessages(prevMessages => {
                const newMessages = [...prevMessages];
                if (newMessages.length > 0 && newMessages[newMessages.length - 1].role === 'assistant') {
                    newMessages[newMessages.length - 1].content = currentStreamMessage + responseText;
                }
                return newMessages;
            });
        });

        // Listen for stream completion
        const unsubscribeDone = EventsOn("chatStreamDone", (data) => {
            setIsStreaming(false);
            setCurrentStreamMessage("");
            console.log("Chat stream completed:", data.message);
        });

        // Listen for stream errors
        const unsubscribeError = EventsOn("chatStreamError", (error) => {
            console.error("Chat stream error:", error.error);
            setIsStreaming(false);
            setCurrentStreamMessage("");
            
            // Update the last message with error
            setMessages(prevMessages => {
                const newMessages = [...prevMessages];
                if (newMessages.length > 0 && newMessages[newMessages.length - 1].role === 'assistant') {
                    newMessages[newMessages.length - 1].content = "Sorry, I encountered an error. Please try again.";
                }
                return newMessages;
            });
        });

        // Listen for info messages (e.g., fallback to BeeAI)
        const unsubscribeInfo = EventsOn("chatStreamInfo", (data) => {
            console.log("Chat info:", data.message);
            // You could show a small notification here if desired
        });

        // Focus input on mount
        if (inputRef.current) {
            inputRef.current.focus();
        }

        // Cleanup event listeners
        return () => {
            unsubscribeStart();
            unsubscribeChunk();
            unsubscribeDone();
            unsubscribeError();
            unsubscribeInfo();
        };
    }, [currentStreamMessage]);

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
                padding: '8px',
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
                    minRows={1}
                    maxRows={3}
                    fullWidth
                    size="small"
                    sx={{
                        '& .MuiOutlinedInput-root': {
                            background: '#1a1a1a',
                            color: '#fff',
                            borderRadius: 2,
                            fontSize: '14px',
                            '& fieldset': {
                                borderColor: '#444'
                            },
                            '&:hover fieldset': {
                                borderColor: '#555'
                            },
                            '&.Mui-focused fieldset': {
                                borderColor: '#ffd700',
                                borderWidth: 2
                            },
                            '& textarea': {
                                padding: '8px 12px !important'
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
                        borderRadius: 6,
                        padding: '8px',
                        minWidth: 36,
                        minHeight: 36,
                        cursor: prompt.trim() ? 'pointer' : 'not-allowed',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s ease',
                        boxShadow: prompt.trim() ? '0 2px 8px rgba(255, 215, 0, 0.3)' : 'none'
                    }}
                >
                    <SendIcon style={{ fontSize: 18 }} />
                </button>
            </form>
        </div>
    );
}

export default PromptSection;
