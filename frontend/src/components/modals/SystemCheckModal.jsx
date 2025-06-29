import React, { useState, useEffect } from 'react';
import { Modal, Box, Typography, Button, LinearProgress, Alert, Stepper, Step, StepLabel, StepContent } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import DownloadIcon from '@mui/icons-material/Download';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import './SystemCheckModal.css';
import { CheckLocalOllamaInstallation, IsOllamaRunning, StartOllamaServer, CheckGraniteInstallation, DownloadGraniteModel } from '../../../wailsjs/go/main/App';
import {BrowserOpenURL} from '../../../wailsjs/runtime/runtime.js'
import { EventsOn, EventsOff } from '../../../wailsjs/runtime/runtime.js';

const SystemCheckModal = ({ open, onClose }) => {
    const [checks, setChecks] = useState({
        ollama: { status: 'checking', installed: false },
        ollamaRunning: { status: 'pending', running: false },
        granite: { status: 'pending', installed: false }
    });
    const [activeStep, setActiveStep] = useState(0);
    const [allChecksComplete, setAllChecksComplete] = useState(false);
    const [downloadProgress, setDownloadProgress] = useState(0);
    const [downloadInfo, setDownloadInfo] = useState({ currentMB: '', totalGB: '', speed: '', timeLeft: '' });

    // Check if Ollama is installed
    const checkOllama = async () => {
        try {
            const installed = await CheckLocalOllamaInstallation();
            if (installed) {
                setChecks(prev => ({
                    ...prev,
                    ollama: { status: 'success', installed: true }
                }));
                // Automatically check if Ollama is running after confirming installation
                await checkOllamaRunning();
                return true;
            } else {
                setChecks(prev => ({
                    ...prev,
                    ollama: { status: 'error', installed: false, error: 'Ollama is not installed' }
                }));
                return false;
            }
        } catch (error) {
            console.error('Error checking Ollama installation:', error);
            setChecks(prev => ({
                ...prev,
                ollama: { status: 'error', installed: false, error: error.message }
            }));
            return false;
        }
    };

    // Check if Ollama service is running
    const checkOllamaRunning = async () => {
        setChecks(prev => ({
            ...prev,
            ollamaRunning: { ...prev.ollamaRunning, status: 'checking' }
        }));

        try {
            const isRunning = await IsOllamaRunning();
            
            if (isRunning) {
                setChecks(prev => ({
                    ...prev,
                    ollamaRunning: { status: 'success', running: true }
                }));
                // Automatically check for Granite model if Ollama is running
                await checkGraniteModel();
                return true;
            } else {
                setChecks(prev => ({
                    ...prev,
                    ollamaRunning: { status: 'error', running: false, error: 'Ollama service is not running' }
                }));
                return false;
            }
        } catch (error) {
            console.error('Error checking if Ollama is running:', error);
            setChecks(prev => ({
                ...prev,
                ollamaRunning: { status: 'error', running: false, error: error.message }
            }));
            return false;
        }
    };

    // Start Ollama service
    const startOllama = async () => {
        try {
            setChecks(prev => ({
                ...prev,
                ollamaRunning: { ...prev.ollamaRunning, status: 'starting' }
            }));

            // Try to start Ollama using system command
            // Note: This would need to be implemented in the Wails backend
            // For now, we'll just prompt the user to start it manually
            //alert('Please start Ollama manually by running "ollama serve" in your terminal, or by opening the Ollama application.');
            StartOllamaServer();

            // After user acknowledgment, recheck if it's running
            setTimeout(async () => {
                await checkOllamaRunning();
            }, 2000);
            
        } catch (error) {
            console.error('Failed to start Ollama:', error);
            setChecks(prev => ({
                ...prev,
                ollamaRunning: { status: 'error', running: false, error: 'Failed to start Ollama: ' + error.message }
            }));
        }
    };

    // Check if Granite 3.3 8b model is available
    const checkGraniteModel = async () => {
        setChecks(prev => ({
            ...prev,
            granite: { ...prev.granite, status: 'checking' }
        }));

        try {
            const hasGranite = await CheckGraniteInstallation();
            
            setChecks(prev => ({
                ...prev,
                granite: { status: hasGranite ? 'success' : 'error', installed: hasGranite }
            }));
            return hasGranite;
        } catch (error) {
            console.error('Error checking Granite model installation:', error);
            setChecks(prev => ({
                ...prev,
                granite: { status: 'error', installed: false, error: error.message }
            }));
            return false;
        }
    };

    // Download Granite model
    const downloadGraniteModel = async () => {
        try {
            setChecks(prev => ({
                ...prev,
                granite: { ...prev.granite, status: 'downloading' }
            }));
            setDownloadProgress(0);
            setDownloadInfo({ currentMB: '', totalGB: '', speed: '', timeLeft: '' });

            // Use the Go backend method to download the model
            await DownloadGraniteModel();
            
            // The download has started, now we wait for progress updates
            // The progress will be handled by the graniteDownloadProgress event
            
        } catch (error) {
            console.error('Download failed:', error);
            setChecks(prev => ({
                ...prev,
                granite: { status: 'error', installed: false, error: 'Download failed: ' + error.message }
            }));
            setDownloadProgress(0);
            setDownloadInfo({ currentMB: '', totalGB: '', speed: '', timeLeft: '' });
        }
    };

    // Run initial checks
    useEffect(() => {
        if (open) {
            const runChecks = async () => {
                // Check Ollama installation first
                const ollamaInstalled = await checkOllama();
                
                // The checkOllama function already calls checkOllamaRunning and checkGraniteModel
                // if Ollama is installed, so we don't need to do anything else here
            };
            
            runChecks();
        }
    }, [open]);

    // Listen for granite download progress events
    useEffect(() => {
        if (open) {
            // Listen for download progress
            EventsOn('graniteDownloadProgress', (progress) => {
                console.log('Download progress:', progress);
                
                // Update progress percentage
                const percentage = parseFloat(progress.percentage) || 0;
                setDownloadProgress(percentage);
                
                // Update download info
                setDownloadInfo({
                    currentMB: progress.currentMB || '',
                    totalGB: progress.totalGB || '',
                    speed: progress.speed || '',
                    timeLeft: progress.timeLeft || ''
                });

                //console.log('Download info:', downloadInfo);
                
                // Check if download is complete (100%)
                if (percentage >= 100) {
                    setChecks(prev => ({
                        ...prev,
                        granite: { status: 'success', installed: true }
                    }));
                    setDownloadProgress(100);
                }
            });

            // Cleanup event listener when modal closes
            return () => {
                EventsOff('graniteDownloadProgress');
            };
        }
    }, [open]);

    // Update completion status
    useEffect(() => {
        const allComplete = checks.ollama.installed && checks.ollamaRunning.running && checks.granite.installed;
        setAllChecksComplete(allComplete);
        
        if (allComplete) {
            // Auto-close after 2 seconds if everything is ready
            setTimeout(() => {
                onClose();
            }, 2000);
        }
    }, [checks, onClose]);

    const getStatusIcon = (status, installed) => {
        switch (status) {
            case 'checking':
                return <LinearProgress size={20} />;
            case 'downloading':
                return <LinearProgress size={20} color="warning" />;
            case 'success':
                return <CheckCircleIcon color="success" />;
            case 'error':
                return <ErrorIcon color="error" />;
            default:
                return null;
        }
    };

    const getStatusText = (status, installed) => {
        switch (status) {
            case 'checking':
                return 'Checking...';
            case 'downloading':
                return 'Downloading...';
            case 'success':
                return 'Ready';
            case 'error':
                return installed ? 'Ready' : 'Not Found';
            default:
                return 'Unknown';
        }
    };

    const steps = [
        {
            label: 'Ollama Installation',
            content: (
                <Box>
                    <Box display="flex" alignItems="center" gap={2} mb={2}>
                        {getStatusIcon(checks.ollama.status, checks.ollama.installed)}
                        <Typography variant="body1">
                            {getStatusText(checks.ollama.status, checks.ollama.installed)}
                        </Typography>
                    </Box>
                    
                    {!checks.ollama.installed && checks.ollama.status === 'error' && (
                        <Alert severity="warning" sx={{ mb: 2 }}>
                            Ollama is not installed. Please install Ollama to continue. Come back and check after you have installed (You will be redirected to the official download page after you clicked the download button)
                        </Alert>
                    )}
                    
                    {!checks.ollama.installed && (
                        <Box display="flex" gap={2}>
                            <Button
                                variant="contained"
                                startIcon={<DownloadIcon />}
                                onClick={() => 
                                    BrowserOpenURL("https://ollama.com/download")
                                }
                                sx={{
                                    background: 'linear-gradient(135deg, #ffd700 0%, #fff8dc 100%)',
                                    color: '#23232f',
                                    '&:hover': {
                                        background: 'linear-gradient(135deg, #ffed4e 0%, #ffd700 100%)',
                                    }
                                }}
                            >
                                Download Ollama
                            </Button>
                            <Button
                                variant="outlined"
                                startIcon={<OpenInNewIcon />}
                                onClick={() => window.open('https://ollama.com/library', '_blank')}
                            >
                                View Models
                            </Button>
                        </Box>
                    )}
                </Box>
            )
        },
        {
            label: 'Ollama Service Running',
            content: (
                <Box>
                    <Box display="flex" alignItems="center" gap={2} mb={2}>
                        {getStatusIcon(checks.ollamaRunning.status, checks.ollamaRunning.running)}
                        <Typography variant="body1">
                            {checks.ollamaRunning.status === 'checking' ? 'Checking if Ollama is running...' :
                             checks.ollamaRunning.status === 'starting' ? 'Starting Ollama...' :
                             checks.ollamaRunning.running ? 'Ollama is running' : 'Ollama is not running'}
                        </Typography>
                    </Box>
                    
                    {!checks.ollamaRunning.running && checks.ollamaRunning.status === 'error' && (
                        <Alert severity="warning" sx={{ mb: 2 }}>
                            Ollama service is not running. Please start Ollama to continue.
                        </Alert>
                    )}
                    
                    {!checks.ollamaRunning.running && checks.ollama.installed && checks.ollamaRunning.status !== 'starting' && (
                        <Box display="flex" gap={2}>
                            <Button
                                variant="contained"
                                onClick={startOllama}
                                sx={{
                                    background: 'linear-gradient(135deg, #2196f3 0%, #64b5f6 100%)',
                                    '&:hover': {
                                        background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
                                    }
                                }}
                            >
                                Start Ollama
                            </Button>
                            <Button
                                variant="outlined"
                                onClick={checkOllamaRunning}
                                sx={{
                                    borderColor: '#666',
                                    color: '#ccc',
                                    '&:hover': {
                                        borderColor: '#999',
                                        backgroundColor: 'rgba(255,255,255,0.1)'
                                    }
                                }}
                            >
                                Check Again
                            </Button>
                        </Box>
                    )}
                </Box>
            )
        },
        {
            label: 'Granite 3.3 8B Model',
            content: (
                <Box>
                    <Box display="flex" alignItems="center" gap={2} mb={2}>
                        {getStatusIcon(checks.granite.status, checks.granite.installed)}
                        <Typography variant="body1">
                            {getStatusText(checks.granite.status, checks.granite.installed)}
                        </Typography>
                    </Box>
                    
                    {!checks.granite.installed && checks.granite.status === 'error' && checks.ollamaRunning.running && (
                        <Alert severity="info" sx={{ mb: 2 }}>
                            Granite 3.3 8B model is not available. Click below to download it.
                        </Alert>
                    )}
                    
                    {!checks.granite.installed && checks.ollamaRunning.running && checks.granite.status !== 'downloading' && (
                        <Button
                            variant="contained"
                            startIcon={<DownloadIcon />}
                            onClick={downloadGraniteModel}
                            color="primary"
                        >
                            Download Granite 3.3 8B
                        </Button>
                    )}
                    
                    {checks.granite.status === 'downloading' && (
                        <Box>
                            <Typography variant="body2" color="#ccc" mb={1}>
                                Downloading Granite 3.3 8B model...
                            </Typography>
                            <Box display="flex" alignItems="center" gap={2} mb={2}>
                                <LinearProgress 
                                    variant="determinate" 
                                    value={downloadProgress} 
                                    sx={{ 
                                        flexGrow: 1,
                                        height: 8,
                                        borderRadius: 4,
                                        backgroundColor: 'rgba(255,255,255,0.1)',
                                        '& .MuiLinearProgress-bar': {
                                            borderRadius: 4,
                                            background: 'linear-gradient(90deg, #4caf50 0%, #81c784 100%)'
                                        }
                                    }} 
                                />
                                <Typography variant="body2" color="#ccc" minWidth={50}>
                                    {Math.round(downloadProgress)}%
                                </Typography>
                            </Box>
                            {(downloadInfo.currentMB || downloadInfo.totalGB || downloadInfo.speed || downloadInfo.timeLeft) && (
                                <Box display="flex" gap={3} flexWrap="wrap">
                                    {downloadInfo.currentMB && downloadInfo.totalGB && (
                                        <Typography variant="caption" color="#ccc">
                                            📦 {(parseFloat(downloadInfo.currentMB) / 1024).toFixed(2)} GB / {downloadInfo.totalGB} GB
                                        </Typography>
                                    )}
                                    {downloadInfo.speed && (
                                        <Typography variant="caption" color="#ccc">
                                            ⚡ {downloadInfo.speed}
                                        </Typography>
                                    )}
                                    {downloadInfo.timeLeft && (
                                        <Typography variant="caption" color="#ccc">
                                            ⏱️ {downloadInfo.timeLeft}
                                        </Typography>
                                    )}
                                </Box>
                            )}
                        </Box>
                    )}
                </Box>
            )
        }
    ];

    return (
        <Modal
            open={open}
            onClose={allChecksComplete ? onClose : undefined}
            disableEscapeKeyDown={!allChecksComplete}
            sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}
        >
            <Box
                sx={{
                    width: { xs: '90%', sm: 600 },
                    maxHeight: '90vh',
                    overflowY: 'auto',
                    background: 'linear-gradient(135deg, #23232f 0%, #2a2a3a 100%)',
                    color: '#fff',
                    borderRadius: 3,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                    border: '1px solid #444',
                    p: 4,
                    outline: 'none'
                }}
            >
                {/* Header */}
                <Box display="flex" alignItems="center" gap={2} mb={3}>
                    <div style={{
                        width: 4,
                        height: 32,
                        background: 'linear-gradient(180deg, #ffd700 0%, #ffed4e 100%)',
                        borderRadius: 2
                    }} />
                    <Typography variant="h5" component="h2" fontWeight={700} color="#ffd700">
                        System Requirements Check
                    </Typography>
                </Box>

                <Typography variant="body1" color="#ccc" mb={3}>
                    YumeSession requires Ollama and the Granite 3.3 8B model for AI features. 
                    Let's check if everything is properly installed.
                </Typography>

                {/* Progress Steps */}
                <Stepper 
                    activeStep={
                        !checks.ollama.installed ? 0 :
                        !checks.ollamaRunning.running ? 1 :
                        !checks.granite.installed ? 2 : 3
                    } 
                    orientation="vertical"
                    sx={{
                        '& .MuiStepLabel-root': {
                            color: '#fff'
                        },
                        '& .MuiStepIcon-root': {
                            color: '#333',
                            '&.Mui-active': {
                                color: '#ffd700'
                            },
                            '&.Mui-completed': {
                                color: '#4caf50'
                            }
                        },
                        '& .MuiStepContent-root': {
                            borderLeft: '1px solid #444'
                        }
                    }}
                >
                    {steps.map((step, index) => (
                        <Step key={step.label}>
                            <StepLabel>
                                <Typography color="#fff" fontWeight={600}>
                                    {step.label}
                                </Typography>
                            </StepLabel>
                            <StepContent>
                                {step.content}
                            </StepContent>
                        </Step>
                    ))}
                </Stepper>

                {/* Success Message */}
                {allChecksComplete && (
                    <Alert 
                        severity="success" 
                        sx={{ 
                            mt: 3,
                            backgroundColor: 'rgba(76, 175, 80, 0.1)',
                            color: '#4caf50',
                            border: '1px solid rgba(76, 175, 80, 0.3)'
                        }}
                    >
                        🎉 All systems ready! YumeSession will launch shortly.
                    </Alert>
                )}

                {/* Action Buttons */}
                <Box display="flex" justifyContent="flex-end" gap={2} mt={4}>
                    {!allChecksComplete && (
                        <Button
                            variant="outlined"
                            onClick={() => window.location.reload()}
                            sx={{
                                borderColor: '#666',
                                color: '#ccc',
                                '&:hover': {
                                    borderColor: '#999',
                                    backgroundColor: 'rgba(255,255,255,0.1)'
                                }
                            }}
                        >
                            Refresh Checks
                        </Button>
                    )}
                    
                    {allChecksComplete && (
                        <Button
                            variant="contained"
                            onClick={onClose}
                            sx={{
                                background: 'linear-gradient(135deg, #4caf50 0%, #81c784 100%)',
                                '&:hover': {
                                    background: 'linear-gradient(135deg, #45a049 0%, #66bb6a 100%)',
                                }
                            }}
                        >
                            Continue to YumeSession
                        </Button>
                    )}
                </Box>
            </Box>
        </Modal>
    );
};

export default SystemCheckModal;
