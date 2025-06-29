import React from 'react';
import { Button, Card, CardContent, IconButton } from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';

function KnowledgeBaseSection({ 
    documents, 
    onAddDocuments, 
    onRemoveDocument, 
    showPreviewModal,
    getFileIcon, 
    formatFileSize,
    getKnowledgeBaseFileType 
}) {
    // Helper function to get display name from Knowledge Base item
    const getDocumentName = (document) => {
        if (document.uniqueFileName) {
            return document.uniqueFileName;
        }
        return `${document.type} Item`;
    };

    // Helper function to get file type for display
    const getDocumentType = (document) => {
        if (getKnowledgeBaseFileType) {
            return getKnowledgeBaseFileType(document);
        }
        // Fallback for older structure
        return document.type || 'unknown';
    };
    return (
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
                    Knowledge Base Documents
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ 
                        color: '#999', 
                        fontSize: '0.9rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8
                    }}>
                        <span>{documents.length} document{documents.length !== 1 ? 's' : ''}</span>
                    </div>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={onAddDocuments}
                        disabled={showPreviewModal}
                        sx={{
                            background: showPreviewModal
                                ? '#666' 
                                : 'linear-gradient(135deg, #4caf50 0%, #81c784 100%)',
                            color: '#fff',
                            fontWeight: 600,
                            fontSize: 13,
                            padding: '6px 16px',
                            borderRadius: 2,
                            textTransform: 'none',
                            boxShadow: showPreviewModal
                                ? 'none' 
                                : '0 2px 8px rgba(76, 175, 80, 0.3)',
                            '&:hover': {
                                boxShadow: showPreviewModal
                                    ? 'none' 
                                    : '0 4px 12px rgba(76, 175, 80, 0.4)',
                            }
                        }}
                    >
                        {showPreviewModal ? 'Adding...' : 'Add Documents'}
                    </Button>
                </div>
            </div>
            
            {/* Documents List */}
            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', 
                gap: 16
            }}>
                {documents.length === 0 ? (
                    // Empty state
                    <div style={{
                        gridColumn: '1 / -1',
                        textAlign: 'center',
                        padding: '40px',
                        color: '#999',
                        background: '#23232f',
                        border: '1px solid #333',
                        borderRadius: 8,
                        borderStyle: 'dashed'
                    }}>
                        <div style={{ fontSize: '3rem', marginBottom: 16 }}>📚</div>
                        <h3 style={{ color: '#ccc', marginBottom: 8 }}>No documents yet</h3>
                        <p style={{ marginBottom: 24 }}>Add PDF, DOC, DOCX, or TXT files to build your knowledge base</p>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={onAddDocuments}
                            disabled={showPreviewModal}
                            sx={{
                                background: 'linear-gradient(135deg, #4caf50 0%, #81c784 100%)',
                                color: '#fff',
                                fontWeight: 600,
                            }}
                        >
                            {showPreviewModal ? 'Adding...' : 'Add Documents'}
                        </Button>
                    </div>
                ) : (
                    documents.map((document) => (
                        <Card 
                            key={document.id}
                            sx={{ 
                                background: '#23232f',
                                border: '1px solid #333',
                                borderRadius: 2,
                                transition: 'all 0.2s ease',
                                '&:hover': {
                                    borderColor: '#4caf50',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                                    transform: 'translateY(-1px)'
                                }
                            }}
                        >
                            <CardContent sx={{ p: 2.5 }}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: '1.4rem', flexShrink: 0, marginTop: 2 }}>
                                            {getFileIcon(getDocumentType(document))}
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <h4 style={{ 
                                                margin: 0, 
                                                color: '#fff', 
                                                fontSize: '1rem',
                                                fontWeight: 600,
                                                lineHeight: 1.4,
                                                marginBottom: 4,
                                                wordBreak: 'break-word',
                                                display: '-webkit-box',
                                                WebkitLineClamp: 2,
                                                WebkitBoxOrient: 'vertical',
                                                overflow: 'hidden'
                                            }}>
                                                {getDocumentName(document)}
                                            </h4>
                                            <div style={{ 
                                                color: '#999', 
                                                fontSize: '0.8rem',
                                                marginBottom: 6,
                                                textTransform: 'uppercase',
                                                fontWeight: 500,
                                                letterSpacing: '0.5px'
                                            }}>
                                                {document.type || 'Unknown Type'}
                                            </div>
                                            {/* One-line summary */}
                                            {document.oneLineSummary && (
                                                <div style={{ 
                                                    color: '#ccc', 
                                                    fontSize: '0.85rem',
                                                    lineHeight: 1.4,
                                                    fontStyle: 'italic',
                                                    display: '-webkit-box',
                                                    WebkitLineClamp: 2,
                                                    WebkitBoxOrient: 'vertical',
                                                    overflow: 'hidden',
                                                    wordBreak: 'break-word'
                                                }}>
                                                    {document.oneLineSummary}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <IconButton
                                        size="small"
                                        onClick={() => onRemoveDocument(document.id)}
                                        sx={{ 
                                            color: '#ff5252',
                                            padding: '6px',
                                            flexShrink: 0,
                                            marginLeft: 1,
                                            '&:hover': { 
                                                backgroundColor: 'rgba(255, 82, 82, 0.1)' 
                                            }
                                        }}
                                    >
                                        <DeleteIcon fontSize="small" />
                                    </IconButton>
                                </div>
                                <div style={{ 
                                    color: '#888', 
                                    fontSize: '0.75rem',
                                    paddingTop: 8,
                                    borderTop: '1px solid #333',
                                    textAlign: 'right'
                                }}>
                                    Added {new Date(document.createdAt || document.addedAt).toLocaleDateString()}
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}

export default KnowledgeBaseSection;
