import {useState, useRef, useEffect} from 'react';
import logo from './assets/images/logo-universal.png';
import './App.css';
import {Greet} from "../wailsjs/go/main/App";
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import SendIcon from '@mui/icons-material/Send';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';

function App() {
    const [resultText, setResultText] = useState("Please enter your name below 👇");
    const [name, setName] = useState('');
    const [meetings] = useState([
        'Sprint Planning',
        'Design Review',
        'Client Sync',
        'Retrospective',
    ]);
    const [selectedMeeting, setSelectedMeeting] = useState(meetings[0]);
    const [isRecording, setIsRecording] = useState(false);
    const updateName = (e) => setName(e.target.value);
    const updateResultText = (result) => setResultText(result);

    function greet() {
        Greet(name).then(updateResultText);
    }

    const handleMeetingChange = (e) => setSelectedMeeting(e.target.value);
    const handleRecordToggle = () => setIsRecording(r => !r);

    return (
        <div id="App" style={{ height: '100vh', width: '100vw', background: '#181818', fontFamily: 'Nunito, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif' }}>
            <HeaderBar
                meetings={meetings}
                selectedMeeting={selectedMeeting}
                onMeetingChange={handleMeetingChange}
                onRecordToggle={handleRecordToggle}
                isRecording={isRecording}
            />
            <div style={{ display: 'flex', flexDirection: 'row', height: 'calc(100vh - 56px)', background: '#181818' }}>
                {/* Left Panel: Transcript (full height) */}
                <div style={{ flex: 1, height: '100%', borderRight: '1px solid #222', boxSizing: 'border-box', background: '#20202a', display: 'flex', flexDirection: 'column' }}>
                    <TranscriptScreen />
                </div>
                {/* Center Panel: Prompt (top 50%) & Notes (bottom 50%) */}
                <div style={{ flex: 1, minWidth: 0, height: '100%', display: 'flex', flexDirection: 'column', background: '#23232f', overflow: 'hidden' }}>
                    <div style={{ flex: 1, minHeight: 0, borderBottom: '1px solid #292940', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', padding: 0, overflow: 'auto' }}>
                        <NotesSection />
                    </div>
                    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'center', padding: 0, overflow: 'auto' }}>
                        <PromptSection />
                    </div>
                </div>
                {/* Right Panel: Browser/VNC */}
                <div style={{ flex: 1, height: '100%', borderLeft: '1px solid #222', boxSizing: 'border-box', background: '#181818', display: 'flex', flexDirection: 'column' }}>
                    <NoVNC />
                </div>
            </div>
        </div>
    )
}

function HeaderBar({ meetings, selectedMeeting, onMeetingChange, onRecordToggle, isRecording }) {
    return (
        <div style={{
            width: '100%',
            height: 56,
            background: 'linear-gradient(90deg, #23232f 80%, #292940 100%)',
            borderBottom: '1.5px solid #292940',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 32px',
            boxSizing: 'border-box',
            fontFamily: 'Nunito, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif',
            zIndex: 100,
        }}>
            {/* Meeting Dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <span style={{ color: '#ffd700', fontWeight: 700, fontSize: 18, marginRight: 12 }}>Meeting:</span>
                <Select
                    value={selectedMeeting}
                    onChange={onMeetingChange}
                    variant="outlined"
                    size="small"
                    sx={{
                        minWidth: 180,
                        background: '#23232f',
                        color: '#ffd700',
                        '.MuiOutlinedInput-notchedOutline': { borderColor: '#292940' },
                        '.MuiSvgIcon-root': { color: '#ffd700' },
                        fontWeight: 600,
                        fontFamily: 'inherit',
                    }}
                >
                    {meetings.map((meeting, idx) => (
                        <MenuItem key={idx} value={meeting}>{meeting}</MenuItem>
                    ))}
                </Select>
            </div>
            {/* Record/Stop Button and Status */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                <button
                    onClick={onRecordToggle}
                    style={{
                        background: isRecording ? '#b71c1c' : 'linear-gradient(90deg, #ffd700 60%, #fffbe6 100%)',
                        color: isRecording ? '#fff' : '#23232f',
                        border: 'none',
                        borderRadius: 6,
                        padding: '8px 22px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        boxShadow: '0 1px 4px #0002',
                        fontSize: 16,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        transition: 'background 0.2s',
                        outline: isRecording ? '2px solid #ff5252' : 'none',
                    }}
                >
                    <FiberManualRecordIcon style={{ color: isRecording ? '#ff5252' : '#23232f', animation: isRecording ? 'flash 1s infinite' : 'none' }} />
                    {isRecording ? 'Stop' : 'Record'}
                </button>
                <span style={{
                    display: 'flex',
                    alignItems: 'center',
                    fontWeight: 700,
                    fontSize: 16,
                    color: isRecording ? '#ff5252' : '#4caf50',
                    animation: isRecording ? 'flash 1s infinite' : 'none',
                    gap: 8
                }}>
                    <span style={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        background: isRecording ? '#ff5252' : '#4caf50',
                        display: 'inline-block',
                        marginRight: 6,
                        boxShadow: isRecording ? '0 0 8px 2px #ff5252' : 'none',
                        animation: isRecording ? 'flash 1s infinite' : 'none',
                    }} />
                    {isRecording ? 'Recording...' : 'Idle'}
                </span>
                <style>{`
                    @keyframes flash {
                        0%, 100% { opacity: 1; }
                        50% { opacity: 0.3; }
                    }
                `}</style>
            </div>
        </div>
    );
}

function NoVNC(props) {
    // For demonstration, we'll use a hardcoded URL. Replace with dynamic value if needed.
    const currentUrl = "http://localhost:8000";
    return (
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: '#000' }}>
            <div style={{
                background: '#23232f',
                padding: '14px 20px 10px 20px',
                borderBottom: '1px solid #292940',
                display: 'flex',
                alignItems: 'center',
                minHeight: 56,
                boxSizing: 'border-box',
                gap: 12
            }}>
                <div style={{
                    background: '#181818',
                    border: '1.5px solid #444',
                    borderRadius: 8,
                    padding: '7px 16px',
                    color: '#fff',
                    fontSize: 16,
                    fontFamily: 'monospace',
                    width: '100%',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    userSelect: 'all',
                    cursor: 'default',
                    boxShadow: '0 1px 4px #0002',
                }}
                    title={currentUrl}
                >
                    {currentUrl}
                </div>
            </div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000' }}>
                <img
                    src="http://localhost:8000/stream"
                    alt="Live Browser Stream"
                    style={{
                        maxWidth: '100%',
                        maxHeight: '100%',
                        objectFit: 'contain',
                        display: 'block',
                        background: '#000'
                    }}
                />
            </div>
        </div>
    );
}

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
        <div
            style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}
            onMouseUp={handleMouseUp}
        >
            <h3 style={{marginTop:0}}>Transcript</h3>
            <div id="transcript-content" style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
                {transcript.map((line, idx) => (
                    <div
                        key={idx}
                        style={{
                            padding: '10px 16px',
                            borderRadius: 8,
                            marginBottom: 8,
                            userSelect: 'text',
                            background: selectedText && line.includes(selectedText) ? '#2a2a3a' : '#23232f',
                            boxShadow: '0 1px 4px #0004',
                            border: '1px solid #292940',
                            transition: 'background 0.2s, box-shadow 0.2s',
                            cursor: 'text',
                            position: 'relative',
                        }}
                    >
                        <span style={{ color: '#ffd700', fontWeight: line.startsWith('Alex:') ? 600 : 400 }}>
                            {line.split(':')[0] + ':'}
                        </span>
                        <span style={{ marginLeft: 8, color: '#fff' }}>
                            {line.split(':').slice(1).join(':')}
                        </span>
                    </div>
                ))}
            </div>
            {showReference && selectedText && (
                <div style={{ position: 'absolute', right: 24, bottom: 24, zIndex: 10, background: 'linear-gradient(135deg, #23232f 80%, #2a2a3a 100%)', padding: 18, borderRadius: 12, boxShadow: '0 4px 24px #000a', border: '1px solid #292940', minWidth: 320 }}>
                    <div style={{ marginBottom: 12, color: '#fff', fontSize: 15, lineHeight: 1.5 }}>
                        <span style={{ fontWeight: 600, color: '#ffd700' }}>Reference selected text:</span>
                        <div style={{ marginTop: 8, padding: '8px 12px', background: '#181820', borderRadius: 6, color: '#ffd700', fontFamily: 'inherit', fontSize: 16, wordBreak: 'break-word', border: '1px solid #292940' }}>{selectedText}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                        <button onClick={handleReference} style={{ background: 'linear-gradient(90deg, #ffd700 60%, #fffbe6 100%)', color: '#23232f', border: 'none', borderRadius: 6, padding: '8px 18px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 1px 4px #0002' }}>Reference</button>
                        <button onClick={handleClose} style={{ background: 'none', color: '#fff', border: '1px solid #292940', borderRadius: 6, padding: '8px 18px', fontWeight: 500, cursor: 'pointer' }}>Cancel</button>
                    </div>
                </div>
            )}
        </div>
    );
}

function PromptSection() {
    const [prompt, setPrompt] = useState("");
    const [messages, setMessages] = useState([
        { role: 'system', content: 'How can I help you today?' }
    ]);
    const inputRef = useRef(null);

    const handlePromptChange = (e) => setPrompt(e.target.value);
    const handlePromptSubmit = (e) => {
        e.preventDefault();
        if (!prompt.trim()) return;
        setMessages([...messages, { role: 'user', content: prompt }]);
        setPrompt("");
        setTimeout(() => {
            setMessages(msgs => [...msgs, { role: 'assistant', content: 'This is a sample response.' }]);
        }, 500);
    };

    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, []);

    return (
        <Box sx={{ width: '100%', maxWidth: 600, margin: 'auto', height: '100%', display: 'flex', flexDirection: 'column', background: '#23232f', borderRadius: 3, boxShadow: 3, p: 0, minHeight: 0 }}>
            <Box sx={{ flex: 1, overflowY: 'auto', p: 3, display: 'flex', flexDirection: 'column', gap: 2, minHeight: 0 }}>
                {messages.map((msg, idx) => (
                    <Box key={idx} sx={{
                        alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                        bgcolor: msg.role === 'user' ? '#ffd700' : '#292940',
                        color: msg.role === 'user' ? '#23232f' : '#fff',
                        px: 2, py: 1.5, borderRadius: 2, maxWidth: '80%',
                        fontFamily: 'inherit', fontSize: 16, boxShadow: 1
                    }}>
                        {msg.content}
                    </Box>
                ))}
            </Box>
            <Box component="form" onSubmit={handlePromptSubmit} sx={{ display: 'flex', alignItems: 'center', p: 2, borderTop: '1px solid #292940', bgcolor: '#23232f', position: 'sticky', bottom: 0, zIndex: 2, gap: 2 }}>
                <TextField
                    inputRef={inputRef}
                    value={prompt}
                    onChange={handlePromptChange}
                    placeholder="Type your message..."
                    variant="outlined"
                    multiline
                    minRows={1}
                    maxRows={4}
                    sx={{ bgcolor: '#fff', borderRadius: 2, width: 320 }}
                />
                <Button type="submit" variant="contained" color="primary" sx={{ minWidth: 48, minHeight: 48, borderRadius: 2, p: 0 }}>
                    <SendIcon />
                </Button>
            </Box>
        </Box>
    );
}

function NotesSection() {
    const [note, setNote] = useState("# Example Notes\n- You can use **Markdown** here!\n- Add your meeting notes, todos, or references.");
    return (
        <Paper elevation={2} style={{ flex: 1, overflowY: 'auto', background: '#23232f', color: '#fff', padding: 16, fontFamily: 'monospace', fontSize: 15, borderTop: '1px solid #292940', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{marginTop:0, color:'#ffd700'}}>Notes</h3>
            <TextField
                multiline
                minRows={6}
                maxRows={16}
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="Type your notes here..."
                variant="outlined"
                fullWidth
                InputProps={{
                    style: {
                        background: '#20202a',
                        color: '#fff',
                        fontFamily: 'monospace',
                        fontSize: 15,
                        borderRadius: 8,
                        marginBottom: 16
                    }
                }}
            />
        </Paper>
    );
}

export default App
