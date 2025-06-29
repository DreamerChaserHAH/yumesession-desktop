import React, { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { IconButton, Typography } from '@mui/material';
import { NavigateBefore as PrevIcon, NavigateNext as NextIcon, Close as CloseIcon, ZoomIn as ZoomInIcon, ZoomOut as ZoomOutIcon } from '@mui/icons-material';
import { toBytes } from 'fast-base64';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

function PDFViewer({ pdfData, fileName, onClose }) {
    const [numPages, setNumPages] = useState(null);
    const [pageNumber, setPageNumber] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [documentData, setDocumentData] = useState(null);
    const [containerWidth, setContainerWidth] = useState(600);
    const [scale, setScale] = useState(1.0); // Zoom scale

    const onDocumentLoadSuccess = ({ numPages }) => {
        console.log('📄 PDF loaded successfully with', numPages, 'pages');
        setNumPages(numPages);
        setPageNumber(1);
        setLoading(false);
        setError(null);
    };

    const onDocumentLoadError = (error) => {
        console.error('📄 PDF load error:', error);
        setError(`Failed to load PDF: ${error.message || error}`);
        setLoading(false);
    };

    // Zoom functions
    const zoomIn = () => {
        setScale(prev => Math.min(prev + 0.25, 3.0)); // Max 3x zoom
    };

    const zoomOut = () => {
        setScale(prev => Math.max(prev - 0.25, 0.5)); // Min 0.5x zoom
    };

    const resetZoom = () => {
        setScale(1.0);
    };

    useEffect(() => {
        if (pdfData) {
            const loadPdfData = async () => {
                try {
                    console.log("📄 Processing PDF data, length:", pdfData.length);
                    
                    // Convert base64 to bytes using fast-base64 (matching working example)
                    const pdfBytes = await toBytes(pdfData);
                    console.log("📄 PDF bytes converted, length:", pdfBytes.length);
                    
                    // Set document data in the format expected by react-pdf
                    setDocumentData({ data: pdfBytes });
                    setLoading(false);
                } catch (error) {
                    console.error("📄 Error converting PDF data:", error);
                    setError(`Failed to process PDF data: ${error.message}`);
                    setLoading(false);
                }
            };
            
            loadPdfData();
        } else {
            setDocumentData(null);
            setLoading(false);
        }
    }, [pdfData]);

    // Update container width for responsive sizing
    useEffect(() => {
        const updateContainerWidth = () => {
            const viewerContainer = document.querySelector('.pdf-viewer-container');
            if (viewerContainer) {
                const width = viewerContainer.offsetWidth;
                // Use more of the available width for better viewing
                setContainerWidth(Math.max(400, width - 60)); // Reduced padding, increased min width
            }
        };

        updateContainerWidth();
        window.addEventListener('resize', updateContainerWidth);
        
        return () => window.removeEventListener('resize', updateContainerWidth);
    }, [documentData]);

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
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
                <Typography>Loading PDF...</Typography>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: '#ff5252',
                flexDirection: 'column',
                gap: 16,
                padding: 20,
                textAlign: 'center'
            }}>
                <Typography variant="h6">Error Loading PDF</Typography>
                <Typography>{error}</Typography>
            </div>
        );
    }

    if (!documentData) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%'
            }}>
                <Typography>No PDF to display</Typography>
            </div>
        );
    }

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* File Info Header */}
            <div style={{
                background: '#1a1a1a',
                color: '#fff',
                padding: '8px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid #333'
            }}>
                <Typography 
                    variant="body2" 
                    sx={{ 
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        flex: 1,
                        minWidth: 0,
                        fontSize: '0.9rem',
                        fontWeight: 500
                    }}
                    title={fileName} // Show full name on hover
                >
                    {fileName}
                </Typography>
                {onClose && (
                    <IconButton 
                        size="small" 
                        onClick={onClose}
                        sx={{ 
                            color: '#ff5252', 
                            '&:hover': { color: '#ff1744' },
                            ml: 2
                        }}
                        title="Close PDF Viewer"
                    >
                        <CloseIcon fontSize="small" />
                    </IconButton>
                )}
            </div>

            {/* Controls Toolbar */}
            <div style={{
                background: '#23232f',
                color: '#fff',
                padding: '8px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid #333'
            }}>
                {/* Zoom Controls */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <IconButton 
                        size="small" 
                        onClick={zoomOut} 
                        disabled={scale <= 0.5}
                        sx={{ color: '#ccc', '&:hover': { color: '#ffd700' } }}
                        title="Zoom Out"
                    >
                        <ZoomOutIcon fontSize="small" />
                    </IconButton>
                    <Typography 
                        variant="body2" 
                        sx={{ 
                            minWidth: '50px', 
                            textAlign: 'center',
                            cursor: 'pointer',
                            '&:hover': { color: '#ffd700' },
                            fontSize: '0.85rem'
                        }}
                        onClick={resetZoom}
                        title="Click to reset zoom"
                    >
                        {Math.round(scale * 100)}%
                    </Typography>
                    <IconButton 
                        size="small" 
                        onClick={zoomIn} 
                        disabled={scale >= 3.0}
                        sx={{ color: '#ccc', '&:hover': { color: '#ffd700' } }}
                        title="Zoom In"
                    >
                        <ZoomInIcon fontSize="small" />
                    </IconButton>
                </div>
                
                {/* Page Navigation - Always show if more than 1 page */}
                {numPages > 1 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <IconButton 
                            size="small" 
                            onClick={() => setPageNumber(p => Math.max(1, p - 1))}
                            disabled={pageNumber <= 1}
                            sx={{ color: '#ccc', '&:hover': { color: '#ffd700' } }}
                            title="Previous Page"
                        >
                            <PrevIcon fontSize="small" />
                        </IconButton>
                        <Typography variant="body2" sx={{ minWidth: '60px', textAlign: 'center', fontSize: '0.85rem' }}>
                            {pageNumber} / {numPages}
                        </Typography>
                        <IconButton 
                            size="small" 
                            onClick={() => setPageNumber(p => Math.min(numPages, p + 1))}
                            disabled={pageNumber >= numPages}
                            sx={{ color: '#ccc', '&:hover': { color: '#ffd700' } }}
                            title="Next Page"
                        >
                            <NextIcon fontSize="small" />
                        </IconButton>
                    </div>
                )}
                
                {/* Page info for single page documents */}
                {numPages === 1 && (
                    <Typography variant="body2" sx={{ color: '#999', fontSize: '0.85rem' }}>
                        1 page
                    </Typography>
                )}
            </div>

            {/* PDF Viewer */}
            <div 
                className="pdf-viewer-container"
                style={{ 
                    flex: 1, 
                    overflow: 'auto',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'flex-start',

                    background: '#e0e0e0'
                }}
            >
                <Document
                    file={documentData}
                    onLoadSuccess={onDocumentLoadSuccess}
                    onLoadError={onDocumentLoadError}
                >
                    <Page 
                        pageNumber={pageNumber}
                        width={Math.min(containerWidth * 0.95, 1000) * scale} // Apply zoom scale
                        renderTextLayer={false}
                        renderAnnotationLayer={false}
                    />
                </Document>
            </div>
        </div>
    );
}

export default PDFViewer;
