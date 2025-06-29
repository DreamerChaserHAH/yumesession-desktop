import React, { useState, useEffect, useRef } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    Box,
    Typography,
    Button,
    IconButton,
    Grid,
    CircularProgress,
    Divider
} from '@mui/material';
import {
    Close as CloseIcon,
    NavigateBefore as NavigateBeforeIcon,
    NavigateNext as NavigateNextIcon,
    Add as AddIcon,
    AutoAwesome as AutoAwesomeIcon,
    Save as SaveIcon,
    Edit as EditIcon,
    Visibility as VisibilityIcon
} from '@mui/icons-material';
import { Document, Page, pdfjs } from 'react-pdf';
import { toBytes } from 'fast-base64';
import { marked } from 'marked';
import { OpenAndGetPDFData, OpenMultipleFilesDialog, MoveFilesToYumesession, CreateKnowledgeBaseItem } from '../../../wailsjs/go/main/App';

// Configure PDF.js worker (matching the working example structure)
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

function DocumentPreviewModal({ 
    open, 
    onClose, 
    onDocumentSaved 
}) {
    // Modal states
    const [selectedFilePaths, setSelectedFilePaths] = useState([]);
    const [currentPreviewIndex, setCurrentPreviewIndex] = useState(0);
    const [documentSummary, setDocumentSummary] = useState('');
    const [generatingSummary, setGeneratingSummary] = useState(false);
    const [summaryGenerated, setSummaryGenerated] = useState(false);
    const [savingDocument, setSavingDocument] = useState(false);
    const [uploadingFiles, setUploadingFiles] = useState(false);
    const [fileDialogOpen, setFileDialogOpen] = useState(false);
    
    // Markdown editor/preview states
    const [activeTab, setActiveTab] = useState('preview'); // 'editor' or 'preview'
    const [isEditorFocused, setIsEditorFocused] = useState(false);
    
    // PDF specific states
    const [pdfData, setPdfData] = useState(null);
    const [numPages, setNumPages] = useState(null);
    const [pageNumber, setPageNumber] = useState(1);
    const [loadingPdf, setLoadingPdf] = useState(false);
    const [pdfError, setPdfError] = useState(null);
    const [containerWidth, setContainerWidth] = useState(500);
    
    // Ref for PDF container
    const pdfContainerRef = useRef(null);

    // Load PDF data when preview modal opens and current file is a PDF
    useEffect(() => {
        const loadPdfData = async () => {
            if (!open || selectedFilePaths.length === 0) {
                return;
            }

            const currentFile = selectedFilePaths[currentPreviewIndex];
            const fileExtension = currentFile.toLowerCase().split('.').pop();
            
            if (fileExtension === 'pdf') {
                try {
                    setLoadingPdf(true);
                    setPdfError(null);
                    console.log("📄 Loading PDF data for:", currentFile);
                    
                    // Get PDF data from Go backend (returns base64 string)
                    const pdfBase64Data = await OpenAndGetPDFData(currentFile);
                    
                    if (pdfBase64Data) {
                        console.log("✅ PDF data received, length:", pdfBase64Data.length);
                        
                        // Convert base64 to bytes using fast-base64 (same as working example)
                        const pdfBytes = await toBytes(pdfBase64Data);
                        console.log("✅ PDF bytes converted, length:", pdfBytes.length);
                        setPdfData({ data: pdfBytes });
                    } else {
                        throw new Error("No PDF data received from backend");
                    }
                } catch (error) {
                    console.error("❌ Error loading PDF:", error);
                    setPdfError(`Failed to load PDF: ${error.message}`);
                } finally {
                    setLoadingPdf(false);
                }
            } else {
                // For non-PDF files, just set loading to false
                setLoadingPdf(false);
                setPdfData(null);
                setPdfError(null);
            }
        };

        loadPdfData();
    }, [open, selectedFilePaths, currentPreviewIndex]);

    // Measure container width for responsive PDF sizing
    useEffect(() => {
        const updateContainerWidth = () => {
            if (pdfContainerRef.current) {
                const width = pdfContainerRef.current.offsetWidth;
                setContainerWidth(Math.max(300, width - 40)); // Account for padding
            }
        };

        updateContainerWidth();
        window.addEventListener('resize', updateContainerWidth);
        
        return () => window.removeEventListener('resize', updateContainerWidth);
    }, [open, selectedFilePaths]);

    // PDF event handlers
    const onDocumentLoadSuccess = ({ numPages }) => {
        console.log("📄 PDF loaded successfully, pages:", numPages);
        setNumPages(numPages);
        setPageNumber(1);
    };

    const onDocumentLoadError = (error) => {
        console.error("❌ PDF load error:", error);
        setPdfError(`Failed to load PDF: ${error.message}`);
    };

    const goToPrevPage = () => {
        setPageNumber(prev => Math.max(prev - 1, 1));
    };

    const goToNextPage = () => {
        setPageNumber(prev => Math.min(prev + 1, numPages));
    };

    const handleSelectFilesInModal = async () => {
        // Prevent opening file dialog if one is already open
        if (fileDialogOpen) {
            console.log("📁 File dialog already open, ignoring request");
            return;
        }

        try {
            setFileDialogOpen(true);
            setUploadingFiles(true);
            console.log("📁 Opening file dialog for documents...");
            
            // Open file dialog for PDF, DOCX, and TXT files
            const selectedFiles = await OpenMultipleFilesDialog();
            
            if (selectedFiles && selectedFiles.length > 0) {
                console.log("📄 Selected files:", selectedFiles);
                
                // Filter for supported file types
                const supportedFiles = selectedFiles.filter(file => {
                    const extension = file.toLowerCase().split('.').pop();
                    return ['pdf', 'docx', 'doc', 'txt'].includes(extension);
                });
                
                if (supportedFiles.length === 0) {
                    alert("Please select only PDF, DOC, DOCX, or TXT files.");
                    setUploadingFiles(false);
                    setFileDialogOpen(false);
                    return;
                }
                
                if (supportedFiles.length !== selectedFiles.length) {
                    const skipped = selectedFiles.length - supportedFiles.length;
                    alert(`${skipped} file(s) were skipped. Only PDF, DOC, DOCX, and TXT files are supported.`);
                }
                
                // Set selected files for preview
                setSelectedFilePaths(supportedFiles);
                setCurrentPreviewIndex(0);
                setDocumentSummary('');
                setSummaryGenerated(false);
                setUploadingFiles(false);
                setFileDialogOpen(false);
                console.log("📋 Files selected, showing preview in modal:", {
                    supportedFiles,
                    selectedFilePaths: supportedFiles
                });
            } else {
                // No files selected, reset states
                setUploadingFiles(false);
                setFileDialogOpen(false);
                console.log("📁 No files selected, resetting states");
            }
        } catch (error) {
            console.error("❌ Error selecting documents:", error);
            alert("Failed to select documents. Please try again.");
            setUploadingFiles(false);
            setFileDialogOpen(false);
        }
    };

    const handleCloseModal = () => {
        setSelectedFilePaths([]);
        setCurrentPreviewIndex(0);
        setDocumentSummary('');
        setSummaryGenerated(false);
        setGeneratingSummary(false);
        setSavingDocument(false);
        setFileDialogOpen(false);
        setUploadingFiles(false);
        // Reset PDF states
        setPdfData(null);
        setNumPages(null);
        setPageNumber(1);
        setLoadingPdf(false);
        setPdfError(null);
        onClose();
    };

    const handleNextDocument = () => {
        if (currentPreviewIndex < selectedFilePaths.length - 1) {
            setCurrentPreviewIndex(prev => prev + 1);
            setDocumentSummary('');
            setSummaryGenerated(false);
            // Reset PDF states for new document
            setPdfData(null);
            setNumPages(null);
            setPageNumber(1);
            setPdfError(null);
        }
    };

    const handlePreviousDocument = () => {
        if (currentPreviewIndex > 0) {
            setCurrentPreviewIndex(prev => prev - 1);
            setDocumentSummary('');
            setSummaryGenerated(false);
            // Reset PDF states for new document
            setPdfData(null);
            setNumPages(null);
            setPageNumber(1);
            setPdfError(null);
        }
    };

    const handleGenerateSummary = async () => {
        try {
            setGeneratingSummary(true);
            const currentFile = selectedFilePaths[currentPreviewIndex];
            const fileName = currentFile.split('/').pop() || currentFile.split('\\').pop();
            
            // Simulate AI summary generation (you would replace this with actual AI call)
            console.log("🤖 Generating AI summary for:", fileName);
            
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Mock summary (replace with actual AI-generated content)
            const mockSummary = `# Document Summary: ${fileName}

## Overview
This document contains important information that has been analyzed by our AI system.

## Key Points
- **Main Topic**: The document discusses various aspects of the subject matter
- **Important Sections**: Several critical sections have been identified
- **Recommendations**: Based on the analysis, the following recommendations are suggested

## Content Analysis
The document appears to be well-structured and contains valuable information that could be useful for reference during meetings and discussions.

## Summary
This is an automatically generated summary of the document content. The AI has identified the main themes and important points for quick reference.`;

            setDocumentSummary(mockSummary);
            setSummaryGenerated(true);
            setActiveTab('preview'); // Switch to preview tab after generation
        } catch (error) {
            console.error("❌ Error generating summary:", error);
            alert("Failed to generate summary. Please try again.");
        } finally {
            setGeneratingSummary(false);
        }
    };

    const handleSummaryChange = (e) => {
        setDocumentSummary(e.target.value);
    };

    const handleSaveDocument = async () => {
        try {
            setSavingDocument(true);
            const currentFile = selectedFilePaths[currentPreviewIndex];
            
            console.log("💾 Saving document:", currentFile);
            
            // Move the current file to YumeSession directory
            const movedFiles = await MoveFilesToYumesession([currentFile]);
            
            if (movedFiles && movedFiles.length > 0) {
                console.log("✅ File moved successfully:", movedFiles[0]);
                
                // Extract file information
                const fileName = currentFile.split('/').pop() || currentFile.split('\\').pop();
                const fileExtension = fileName.toLowerCase().split('.').pop();
                
                // Determine the type based on file extension
                let itemType = 'Local File';
                if (['pdf', 'doc', 'docx', 'txt'].includes(fileExtension)) {
                    itemType = 'Local File';
                }
                
                // Create one-line summary from the full summary
                const oneLineSummary = documentSummary 
                    ? documentSummary.split('\n').find(line => line.trim() && !line.startsWith('#'))?.trim() || 'Document added to knowledge base'
                    : 'Document added to knowledge base';
                
                // Create knowledge base item using the new API
                const savedKnowledgeBaseItem = await CreateKnowledgeBaseItem(
                    fileName, // uniqueFileName
                    itemType,
                    oneLineSummary,
                    documentSummary || ''
                );
                
                console.log('📚 Knowledge base item created:', savedKnowledgeBaseItem);
                
                // Create document entry for backward compatibility with parent component
                const newDocument = {
                    id: savedKnowledgeBaseItem.id || Date.now() + Math.random(),
                    name: fileName,
                    path: movedFiles[0],
                    type: fileExtension,
                    size: 'Unknown',
                    addedAt: new Date().toISOString(),
                    summary: documentSummary,
                    // Include new knowledge base fields
                    uniqueFileName: fileName,
                    oneLineSummary: oneLineSummary,
                    fullSummary: documentSummary || '',
                    createdAt: savedKnowledgeBaseItem.createdAt || new Date().toISOString()
                };
                
                // Notify parent component
                onDocumentSaved(newDocument);
                
                // Remove the saved file from the preview list
                const updatedFiles = selectedFilePaths.filter((_, index) => index !== currentPreviewIndex);
                setSelectedFilePaths(updatedFiles);
                
                // Adjust current index if necessary
                if (currentPreviewIndex >= updatedFiles.length && updatedFiles.length > 0) {
                    setCurrentPreviewIndex(updatedFiles.length - 1);
                } else if (updatedFiles.length === 0) {
                    handleCloseModal();
                    alert("All documents have been processed and added to your knowledge base!");
                    return;
                }
                
                // Reset summary for next document
                setDocumentSummary('');
                setSummaryGenerated(false);
                
                alert("Document saved successfully to knowledge base!");
            } else {
                throw new Error("Failed to move file");
            }
        } catch (error) {
            console.error("❌ Error saving document:", error);
            alert("Failed to save document. Please try again.");
        } finally {
            setSavingDocument(false);
        }
    };

    const renderDocumentContent = () => {
        const currentFile = selectedFilePaths[currentPreviewIndex];
        const fileExtension = currentFile?.toLowerCase().split('.').pop();
        
        // Safety check - if no current file, return fallback
        if (!currentFile) {
            return (
                <Box sx={{ 
                    background: '#fff',
                    minHeight: '100%',
                    p: 4,
                    borderRadius: 1,
                    border: '1px solid #ddd',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <Typography variant="h6" sx={{ color: '#666' }}>
                        No file selected for preview
                    </Typography>
                </Box>
            );
        }
        
        if (fileExtension === 'pdf') {
            return (
                <Box sx={{ 
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    background: '#fff',
                    width: '100%',
                    maxWidth: '100%',
                    overflow: 'hidden',
                    minWidth: 0
                }}>
                    {loadingPdf && (
                        <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            height: '200px'
                        }}>
                            <CircularProgress sx={{ color: '#1976d2' }} />
                            <Typography sx={{ ml: 2, color: '#666' }}>
                                Loading PDF...
                            </Typography>
                        </Box>
                    )}
                    
                    {pdfError && (
                        <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            height: '200px',
                            p: 2
                        }}>
                            <Typography sx={{ color: '#d32f2f', textAlign: 'center' }}>
                                {pdfError}
                            </Typography>
                        </Box>
                    )}
                    
                    {pdfData && !loadingPdf && !pdfError && (
                        <>
                            {/* PDF Controls */}
                            <Box sx={{ 
                                p: 2, 
                                background: '#f0f0f0',
                                borderBottom: '1px solid #ddd',
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 2,
                                flexShrink: 0
                            }}>
                                <IconButton
                                    onClick={goToPrevPage}
                                    disabled={pageNumber <= 1}
                                    sx={{ color: '#1976d2' }}
                                >
                                    <NavigateBeforeIcon />
                                </IconButton>
                                <Typography sx={{ color: '#666', minWidth: '100px', textAlign: 'center' }}>
                                    Page {pageNumber} of {numPages || '?'}
                                </Typography>
                                <IconButton
                                    onClick={goToNextPage}
                                    disabled={pageNumber >= numPages}
                                    sx={{ color: '#1976d2' }}
                                >
                                    <NavigateNextIcon />
                                </IconButton>
                            </Box>
                            
                            {/* PDF Document */}
                            <Box 
                                ref={pdfContainerRef}
                                sx={{ 
                                    flex: 1,
                                    overflow: 'auto',
                                    p: 2,
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'flex-start',
                                    width: '100%',
                                    maxWidth: '100%'
                                }}
                            >
                                <Document
                                    file={pdfData}
                                    onLoadSuccess={onDocumentLoadSuccess}
                                    onLoadError={onDocumentLoadError}
                                    onSourceError={(error) => {
                                        console.error("❌ PDF source error:", error);
                                        setPdfError(`Error while retrieving document source: ${error.message}`);
                                    }}
                                    loading={
                                        <Box sx={{ 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            justifyContent: 'center',
                                            height: '200px'
                                        }}>
                                            <CircularProgress sx={{ color: '#1976d2' }} />
                                            <Typography sx={{ ml: 2, color: '#666' }}>
                                                Rendering PDF...
                                            </Typography>
                                        </Box>
                                    }
                                    style={{
                                        maxWidth: '100%',
                                        overflow: 'hidden',
                                        width: 'fit-content'
                                    }}
                                >
                                    <Page
                                        pageNumber={pageNumber}
                                        width={Math.min(containerWidth * 0.85, 400)}
                                        renderTextLayer={false}
                                        renderAnnotationLayer={false}
                                    />
                                </Document>
                            </Box>
                        </>
                    )}
                </Box>
            );
        } else if (fileExtension === 'txt') {
            return (
                <Box sx={{ 
                    background: '#fff',
                    minHeight: '100%',
                    p: 4,
                    borderRadius: 1,
                    border: '1px solid #ddd'
                }}>
                    <Typography variant="h6" gutterBottom sx={{ color: '#666' }}>
                        Text File Preview
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#999' }}>
                        TXT file preview will be implemented here. The content would be loaded from the backend.
                    </Typography>
                </Box>
            );
        } else if (['doc', 'docx'].includes(fileExtension)) {
            return (
                <Box sx={{ 
                    background: '#fff',
                    minHeight: '100%',
                    p: 4,
                    borderRadius: 1,
                    border: '1px solid #ddd'
                }}>
                    <Typography variant="h6" gutterBottom sx={{ color: '#666' }}>
                        Word Document Preview
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#999' }}>
                        Word document preview will be implemented here. Consider using mammoth.js or similar library.
                    </Typography>
                </Box>
            );
        } else {
            return (
                <Box sx={{ 
                    background: '#fff',
                    minHeight: '100%',
                    p: 4,
                    borderRadius: 1,
                    border: '1px solid #ddd'
                }}>
                    <Typography variant="h4" gutterBottom>
                        Document Preview
                    </Typography>
                    <Typography variant="body1" paragraph>
                        This is a preview of your document: <strong>
                        {currentFile?.split('/').pop() || 
                         currentFile?.split('\\').pop()}
                        </strong>
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#666' }}>
                        Unsupported file type for preview.
                    </Typography>
                </Box>
            );
        }
    };

    return (
        <Dialog
            open={open}
            onClose={handleCloseModal}
            maxWidth="xl"
            fullWidth
            PaperProps={{
                sx: {
                    background: 'linear-gradient(135deg, #23232f 0%, #2a2a3a 100%)',
                    color: '#fff',
                    border: '1px solid #444',
                    height: '90vh',
                    maxHeight: '90vh'
                }
            }}
        >
            <DialogTitle sx={{ 
                color: '#ffd700', 
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                pb: 1
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <span>Document Preview</span>
                    {selectedFilePaths.length > 1 && (
                        <Typography variant="body2" sx={{ color: '#ccc' }}>
                            {currentPreviewIndex + 1} of {selectedFilePaths.length}
                        </Typography>
                    )}
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {selectedFilePaths.length > 1 && (
                        <>
                            <IconButton
                                onClick={handlePreviousDocument}
                                disabled={currentPreviewIndex === 0}
                                sx={{ color: '#ffd700' }}
                            >
                                <NavigateBeforeIcon />
                            </IconButton>
                            <IconButton
                                onClick={handleNextDocument}
                                disabled={currentPreviewIndex === selectedFilePaths.length - 1}
                                sx={{ color: '#ffd700' }}
                            >
                                <NavigateNextIcon />
                            </IconButton>
                            <Divider orientation="vertical" flexItem sx={{ bgcolor: '#666', mx: 1 }} />
                        </>
                    )}
                    <IconButton
                        onClick={handleCloseModal}
                        sx={{ color: '#ff5252' }}
                    >
                        <CloseIcon />
                    </IconButton>
                </Box>
            </DialogTitle>
            <DialogContent sx={{ p: 0, height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Grid container sx={{ height: '100%', flexWrap: 'nowrap' }}>
                    {/* Left Side - Document Viewer Area */}
                    <Grid item sx={{ 
                        borderRight: '1px solid #444',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        minWidth: '50%',
                        maxWidth: '50%',
                        width: '50%',
                        flexShrink: 0,
                        flexGrow: 0
                    }}>
                        {/* Header - Always shows current state */}
                        <Box sx={{ 
                            p: 2, 
                            borderBottom: '1px solid #444',
                            background: '#1a1a1a'
                        }}>
                            {selectedFilePaths.length > 0 ? (
                                <>
                                    <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600 }}>
                                        {selectedFilePaths[currentPreviewIndex]?.split('/').pop() || 
                                         selectedFilePaths[currentPreviewIndex]?.split('\\').pop()}
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: '#ccc', mt: 0.5 }}>
                                        {selectedFilePaths[currentPreviewIndex]?.toLowerCase().split('.').pop()?.toUpperCase()} Document
                                    </Typography>
                                </>
                            ) : (
                                <>
                                    <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600 }}>
                                        Add Documents
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: '#ccc', mt: 0.5 }}>
                                        Choose PDF, DOC, DOCX, or TXT files to add to your knowledge base
                                    </Typography>
                                </>
                            )}
                        </Box>
                        
                        {/* Main Content Area - Either Add Document Interface or PDF Viewer */}
                        <Box sx={{ 
                            flex: 1,
                            overflow: 'auto',
                            background: '#f5f5f5',
                            color: '#000',
                            display: 'flex',
                            flexDirection: 'column'
                        }}>
                            {selectedFilePaths.length === 0 ? (
                                // Add Document Interface
                                <Box sx={{ 
                                    flex: 1,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    p: 4,
                                    textAlign: 'center',
                                    background: '#f9f9f9'
                                }}>
                                    <div style={{ fontSize: '6rem', marginBottom: 32, color: '#ddd' }}>📁</div>
                                    <Typography variant="h4" sx={{ color: '#666', mb: 3, fontWeight: 600 }}>
                                        Add Documents
                                    </Typography>
                                    <Typography variant="body1" sx={{ color: '#888', mb: 4, maxWidth: 500, fontSize: '1.1rem' }}>
                                        Select PDF, DOC, DOCX, or TXT files to preview and add them to your knowledge base with AI-generated summaries.
                                    </Typography>
                                    <Button
                                        variant="contained"
                                        size="large"
                                        startIcon={uploadingFiles ? <CircularProgress size={24} /> : <AddIcon />}
                                        onClick={handleSelectFilesInModal}
                                        disabled={uploadingFiles || fileDialogOpen}
                                        sx={{
                                            background: 'linear-gradient(135deg, #4caf50 0%, #81c784 100%)',
                                            color: '#fff',
                                            fontWeight: 600,
                                            fontSize: 18,
                                            padding: '16px 48px',
                                            borderRadius: 3,
                                            textTransform: 'none',
                                            boxShadow: '0 4px 12px rgba(76, 175, 80, 0.4)',
                                            '&:hover': {
                                                boxShadow: '0 6px 16px rgba(76, 175, 80, 0.5)',
                                            },
                                            '&:disabled': {
                                                background: '#ccc',
                                                color: '#999',
                                                boxShadow: 'none'
                                            }
                                        }}
                                    >
                                        {uploadingFiles ? 'Selecting...' : fileDialogOpen ? 'Opening...' : 'Select Documents'}
                                    </Button>
                                </Box>
                            ) : (
                                // PDF Viewer/Document Content
                                renderDocumentContent()
                            )}
                        </Box>
                    </Grid>

                    {/* Right Side - AI Summary (Always present) */}
                    <Grid item sx={{ 
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        minWidth: '50%',
                        maxWidth: '50%',
                        width: '50%',
                        flexShrink: 0,
                        flexGrow: 0
                    }}>
                        <Box sx={{ 
                            p: 2, 
                            borderBottom: '1px solid #444',
                            background: '#1a1a1a'
                        }}>
                            <Typography variant="h6" sx={{ color: '#4caf50', fontWeight: 600 }}>
                                AI Summary
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#ccc', mt: 0.5 }}>
                                {selectedFilePaths.length > 0 
                                    ? 'Generate and edit AI-powered document summary'
                                    : 'Select documents to generate AI-powered summaries'
                                }
                            </Typography>
                        </Box>

                        {/* Tab Navigation */}
                        <Box sx={{
                            display: 'flex',
                            px: 2,
                            pt: 1,
                            background: '#23232f',
                            borderBottom: '1px solid #333'
                        }}>
                            <Button
                                onClick={() => setActiveTab('editor')}
                                startIcon={<EditIcon />}
                                sx={{
                                    flex: 1,
                                    py: 1,
                                    mx: 0.5,
                                    background: activeTab === 'editor' 
                                        ? 'linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)' 
                                        : 'transparent',
                                    color: activeTab === 'editor' ? '#23232f' : '#fff',
                                    border: activeTab === 'editor' ? 'none' : '1px solid #555',
                                    borderRadius: 1,
                                    fontWeight: 600,
                                    fontSize: '0.75rem',
                                    textTransform: 'none',
                                    '&:hover': {
                                        background: activeTab === 'editor' 
                                            ? 'linear-gradient(135deg, #ffed4e 0%, #ffd700 100%)' 
                                            : 'rgba(255, 255, 255, 0.1)'
                                    }
                                }}
                                disabled={!summaryGenerated}
                            >
                                Editor
                                {activeTab === 'editor' && isEditorFocused && (
                                    <Box sx={{
                                        width: 6,
                                        height: 6,
                                        borderRadius: '50%',
                                        background: '#4caf50',
                                        ml: 1,
                                        animation: 'pulse 2s infinite'
                                    }} />
                                )}
                            </Button>
                            <Button
                                onClick={() => setActiveTab('preview')}
                                startIcon={<VisibilityIcon />}
                                sx={{
                                    flex: 1,
                                    py: 1,
                                    mx: 0.5,
                                    background: activeTab === 'preview' 
                                        ? 'linear-gradient(135deg, #4caf50 0%, #81c784 100%)' 
                                        : 'transparent',
                                    color: activeTab === 'preview' ? '#fff' : '#ccc',
                                    border: activeTab === 'preview' ? 'none' : '1px solid #555',
                                    borderRadius: 1,
                                    fontWeight: 600,
                                    fontSize: '0.75rem',
                                    textTransform: 'none',
                                    '&:hover': {
                                        background: activeTab === 'preview' 
                                            ? 'linear-gradient(135deg, #81c784 0%, #4caf50 100%)' 
                                            : 'rgba(255, 255, 255, 0.1)'
                                    }
                                }}
                            >
                                Preview
                            </Button>
                        </Box>
                        <Box sx={{ 
                            flex: 1,
                            p: 2,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 2
                        }}>
                            {/* Summary Content - Tabbed Editor/Preview */}
                            <Box sx={{ 
                                flex: 1,
                                border: '1px solid #444',
                                borderRadius: 1,
                                overflow: 'hidden',
                                display: 'flex',
                                flexDirection: 'column'
                            }}>
                                {selectedFilePaths.length === 0 ? (
                                    // No files selected state
                                    <Box sx={{ 
                                        p: 3,
                                        height: '100%',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        textAlign: 'center'
                                    }}>
                                        <AutoAwesomeIcon sx={{ 
                                            fontSize: 48, 
                                            color: '#666',
                                            mb: 2
                                        }} />
                                        <Typography variant="body1" sx={{ color: '#ccc', mb: 1 }}>
                                            No documents selected
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: '#999' }}>
                                            Select documents to generate summaries
                                        </Typography>
                                    </Box>
                                ) : !summaryGenerated ? (
                                    // Files selected but no summary yet
                                    <Box sx={{ 
                                        p: 3,
                                        height: '100%',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        textAlign: 'center'
                                    }}>
                                        <AutoAwesomeIcon sx={{ 
                                            fontSize: 48, 
                                            color: '#666',
                                            mb: 2
                                        }} />
                                        <Typography variant="body1" sx={{ color: '#ccc', mb: 1 }}>
                                            No summary generated yet
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: '#999' }}>
                                            Click "Generate Summary" to create an AI-powered summary
                                        </Typography>
                                    </Box>
                                ) : activeTab === 'editor' ? (
                                    /* Editor View */
                                    <Box sx={{ 
                                        flex: 1, 
                                        display: 'flex', 
                                        flexDirection: 'column',
                                        background: 'linear-gradient(135deg, #1a1a1a 0%, #1f1f1f 100%)',
                                        minHeight: 0
                                    }}>
                                        {/* Editor Header */}
                                        <Box sx={{
                                            p: 1.5,
                                            background: 'linear-gradient(135deg, #23232f 0%, #2a2a3a 100%)',
                                            borderBottom: '1px solid #333',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            flexShrink: 0
                                        }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <EditIcon sx={{ color: '#ffd700', fontSize: 16 }} />
                                                <Typography variant="body2" sx={{ 
                                                    color: '#ffd700', 
                                                    fontWeight: 600
                                                }}>
                                                    Markdown Editor
                                                </Typography>
                                                {isEditorFocused && (
                                                    <Box sx={{
                                                        width: 6,
                                                        height: 6,
                                                        borderRadius: '50%',
                                                        background: '#4caf50',
                                                        animation: 'pulse 2s infinite'
                                                    }} />
                                                )}
                                            </Box>
                                            <Box sx={{
                                                fontSize: '0.75rem',
                                                color: '#999',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 1.5
                                            }}>
                                                <span>{documentSummary.split('\n').length} lines</span>
                                                <span>{documentSummary.length} chars</span>
                                            </Box>
                                        </Box>
                                        
                                        {/* Text Editor */}
                                        <Box
                                            component="textarea"
                                            value={documentSummary}
                                            onChange={handleSummaryChange}
                                            onFocus={() => setIsEditorFocused(true)}
                                            onBlur={() => setIsEditorFocused(false)}
                                            placeholder="Generated summary will appear here. You can edit it after generation..."
                                            sx={{
                                                flex: 1,
                                                width: '100%',
                                                p: 2,
                                                background: 'transparent',
                                                color: '#fff',
                                                border: 'none',
                                                outline: 'none',
                                                resize: 'none',
                                                fontFamily: 'Monaco, Consolas, "Courier New", monospace',
                                                fontSize: '0.8rem',
                                                lineHeight: 1.5,
                                                minHeight: 0,
                                                boxSizing: 'border-box'
                                            }}
                                        />
                                    </Box>
                                ) : (
                                    /* Preview View */
                                    <Box sx={{ 
                                        flex: 1, 
                                        display: 'flex', 
                                        flexDirection: 'column',
                                        background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
                                        minHeight: 0
                                    }}>
                                        {/* Preview Header */}
                                        <Box sx={{
                                            p: 1.5,
                                            background: 'linear-gradient(135deg, #e9ecef 0%, #f8f9fa 100%)',
                                            borderBottom: '1px solid #dee2e6',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            flexShrink: 0
                                        }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <VisibilityIcon sx={{ color: '#4caf50', fontSize: 16 }} />
                                                <Typography variant="body2" sx={{ 
                                                    color: '#4caf50', 
                                                    fontWeight: 600
                                                }}>
                                                    Live Preview
                                                </Typography>
                                            </Box>
                                            <Typography variant="body2" sx={{
                                                fontSize: '0.75rem',
                                                color: '#6c757d'
                                            }}>
                                                Rendered Markdown
                                            </Typography>
                                        </Box>
                                        
                                        {/* Markdown Preview */}
                                        <Box 
                                            className="markdown-preview"
                                            sx={{
                                                flex: 1,
                                                p: 2,
                                                overflowY: 'auto',
                                                minHeight: 0,
                                                color: '#212529',
                                                lineHeight: 1.5,
                                                fontSize: '0.8rem'
                                            }}
                                            dangerouslySetInnerHTML={{
                                                __html: marked(documentSummary || '', {
                                                    breaks: true,
                                                    gfm: true
                                                })
                                            }}
                                        />
                                    </Box>
                                )}
                            </Box>

                            {/* Action Buttons - Fixed structure, only enable/disable changes */}
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <Button
                                    variant="contained"
                                    startIcon={generatingSummary ? <CircularProgress size={16} /> : <AutoAwesomeIcon />}
                                    onClick={handleGenerateSummary}
                                    disabled={generatingSummary || summaryGenerated || selectedFilePaths.length === 0}
                                    sx={{
                                        flex: 1,
                                        background: (summaryGenerated || selectedFilePaths.length === 0)
                                            ? '#666' 
                                            : 'linear-gradient(135deg, #4caf50 0%, #81c784 100%)',
                                        color: '#fff',
                                        fontWeight: 600,
                                        '&:disabled': {
                                            background: '#666',
                                            color: '#999'
                                        }
                                    }}
                                >
                                    {generatingSummary ? 'Generating...' : 'Generate Summary'}
                                </Button>
                                <Button
                                    variant="contained"
                                    startIcon={savingDocument ? <CircularProgress size={16} /> : <SaveIcon />}
                                    onClick={handleSaveDocument}
                                    disabled={!summaryGenerated || savingDocument || selectedFilePaths.length === 0}
                                    sx={{
                                        flex: 1,
                                        background: (summaryGenerated && !savingDocument && selectedFilePaths.length > 0)
                                            ? 'linear-gradient(135deg, #ffd700 0%, #fff8dc 100%)'
                                            : '#666',
                                        color: (summaryGenerated && !savingDocument && selectedFilePaths.length > 0) ? '#23232f' : '#999',
                                        fontWeight: 600,
                                        '&:disabled': {
                                            background: '#666',
                                            color: '#999'
                                        }
                                    }}
                                >
                                    {savingDocument ? 'Saving...' : 'Save Document'}
                                </Button>
                            </Box>
                        </Box>
                    </Grid>
                </Grid>
            </DialogContent>
            
            {/* Markdown Preview Styles */}
            <style>
                {`
                    @keyframes pulse {
                        0%, 100% { opacity: 1; }
                        50% { opacity: 0.5; }
                    }
                    
                    /* Markdown Preview Styles */
                    .markdown-preview h1 {
                        color: #212529;
                        margin-top: 0;
                        margin-bottom: 1rem;
                        font-size: 1.25rem;
                        font-weight: 700;
                        border-bottom: 2px solid #dee2e6;
                        padding-bottom: 0.5rem;
                    }
                    
                    .markdown-preview h2 {
                        color: #495057;
                        margin-top: 1.5rem;
                        margin-bottom: 1rem;
                        font-size: 1.1rem;
                        font-weight: 600;
                    }
                    
                    .markdown-preview h3 {
                        color: #495057;
                        margin-top: 1.25rem;
                        margin-bottom: 0.75rem;
                        font-size: 1rem;
                        font-weight: 600;
                    }
                    
                    .markdown-preview p {
                        margin-bottom: 1rem;
                        color: #212529;
                        font-size: 0.8rem;
                    }
                    
                    .markdown-preview ul, .markdown-preview ol {
                        margin-bottom: 1rem;
                        padding-left: 1.5rem;
                    }
                    
                    .markdown-preview li {
                        margin-bottom: 0.25rem;
                        color: #212529;
                        font-size: 0.8rem;
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
                        font-size: 0.75rem;
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
                        font-size: 0.8rem;
                    }
                    
                    .markdown-preview a:hover {
                        text-decoration: underline;
                    }
                    
                    .markdown-preview input[type="checkbox"] {
                        margin-right: 0.5rem;
                        accent-color: #ffd700;
                    }
                `}
            </style>
        </Dialog>
    );
}

export default DocumentPreviewModal;
