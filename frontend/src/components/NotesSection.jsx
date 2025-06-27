import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';

function NotesSection() {
    const [note, setNote] = useState("# Meeting Notes\n\n## Key Points\n- **Action Item 1**: Review the proposal by Friday\n- **Action Item 2**: Schedule follow-up meeting\n- **Decision**: Go with Option B for the design\n\n## Discussion Summary\nThe team discussed the new feature implementation and agreed on the following approach:\n\n1. Start with MVP version\n2. Gather user feedback\n3. Iterate based on feedback\n\n## Next Steps\n- [ ] Create wireframes\n- [ ] Set up development environment\n- [ ] Draft project timeline\n\n---\n\n*Notes updated: " + new Date().toLocaleString() + "*");
    const [activeTab, setActiveTab] = useState('editor'); // 'editor' or 'preview'
    const [isEditorFocused, setIsEditorFocused] = useState(false);

    const handleNoteChange = (e) => {
        setNote(e.target.value);
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
                    Live Edit
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
                            </div>
                        </div>
                        
                        {/* Text Editor */}
                        <textarea
                            value={note}
                            onChange={handleNoteChange}
                            onFocus={() => setIsEditorFocused(true)}
                            onBlur={() => setIsEditorFocused(false)}
                            placeholder="Start typing your markdown notes here..."
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
                                boxSizing: 'border-box'
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
                                color: '#6c757d'
                            }}>
                                Rendered Markdown
                            </div>
                        </div>
                        
                        {/* Markdown Preview */}
                        <div style={{
                            flex: 1,
                            padding: '16px',
                            overflowY: 'auto',
                            minHeight: 0,
                            color: '#212529',
                            lineHeight: 1.5,
                            fontSize: 13
                        }}>
                            <ReactMarkdown 
                                remarkPlugins={[remarkGfm]}
                                components={{
                                    h1: ({children}) => <h1 style={{color: '#212529', marginTop: 0, marginBottom: '1rem', fontSize: '1.5rem', fontWeight: 700, borderBottom: '2px solid #dee2e6', paddingBottom: '0.5rem'}}>{children}</h1>,
                                    h2: ({children}) => <h2 style={{color: '#495057', marginTop: '1.5rem', marginBottom: '1rem', fontSize: '1.3rem', fontWeight: 600}}>{children}</h2>,
                                    h3: ({children}) => <h3 style={{color: '#495057', marginTop: '1.25rem', marginBottom: '0.75rem', fontSize: '1.1rem', fontWeight: 600}}>{children}</h3>,
                                    p: ({children}) => <p style={{marginBottom: '1rem', color: '#212529', fontSize: '13px'}}>{children}</p>,
                                    ul: ({children}) => <ul style={{marginBottom: '1rem', paddingLeft: '1.5rem'}}>{children}</ul>,
                                    ol: ({children}) => <ol style={{marginBottom: '1rem', paddingLeft: '1.5rem'}}>{children}</ol>,
                                    li: ({children}) => <li style={{marginBottom: '0.25rem', color: '#212529', fontSize: '13px'}}>{children}</li>,
                                    blockquote: ({children}) => <blockquote style={{borderLeft: '4px solid #ffd700', paddingLeft: '1rem', margin: '1rem 0', fontStyle: 'italic', color: '#6c757d'}}>{children}</blockquote>,
                                    code: ({inline, children}) => inline ? 
                                        <code style={{background: '#f8f9fa', color: '#e83e8c', padding: '0.125rem 0.25rem', borderRadius: '0.25rem', fontSize: '12px', border: '1px solid #dee2e6'}}>{children}</code> :
                                        <code style={{display: 'block', background: '#f8f9fa', color: '#212529', padding: '1rem', borderRadius: '0.5rem', fontSize: '12px', border: '1px solid #dee2e6', overflowX: 'auto'}}>{children}</code>,
                                    strong: ({children}) => <strong style={{color: '#212529', fontWeight: 700}}>{children}</strong>,
                                    em: ({children}) => <em style={{color: '#495057', fontStyle: 'italic'}}>{children}</em>,
                                    hr: () => <hr style={{border: 'none', borderTop: '1px solid #dee2e6', margin: '2rem 0'}} />,
                                    a: ({href, children}) => <a href={href} style={{color: '#0d6efd', textDecoration: 'none', fontSize: '13px'}} onMouseOver={(e) => e.target.style.textDecoration = 'underline'} onMouseOut={(e) => e.target.style.textDecoration = 'none'}>{children}</a>,
                                    input: ({type, checked, ...props}) => {
                                        if (type === 'checkbox') {
                                            return <input type="checkbox" checked={checked} readOnly style={{marginRight: '0.5rem', accentColor: '#ffd700'}} {...props} />;
                                        }
                                        return <input type={type} {...props} />;
                                    }
                                }}
                            >
                                {note}
                            </ReactMarkdown>
                        </div>
                    </div>
                )}
            </div>
            
            <style>{`
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
            `}</style>
        </div>
    );
}

export default NotesSection;
