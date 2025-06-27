import React, { useState } from 'react';

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

    return (
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
                    background: 'rgba(255, 215, 0, 0.1)',
                    border: '1px solid rgba(255, 215, 0, 0.3)',
                    borderRadius: 6,
                    padding: '3px 6px',
                    fontSize: 10,
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
                            padding: '10px 12px',
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
                                {line.split(':')[0].charAt(0)}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ 
                                    color: '#ffd700', 
                                    fontWeight: 700,
                                    fontSize: 12,
                                    marginBottom: 3,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px'
                                }}>
                                    {line.split(':')[0]}
                                </div>
                                <div style={{ 
                                    color: '#fff', 
                                    fontSize: 13,
                                    lineHeight: 1.4,
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

export default TranscriptScreen;
