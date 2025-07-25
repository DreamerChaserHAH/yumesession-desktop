// Cynhyrchwyd y ffeil hon yn awtomatig. PEIDIWCH Â MODIWL
// This file is automatically generated. DO NOT EDIT
import {main} from '../models';
import {time} from '../models';

export function CheckGraniteInstallation():Promise<boolean>;

export function CheckLocalOllamaInstallation():Promise<boolean>;

export function CloseMarkdownAgentWebSocket():Promise<void>;

export function CloseWebSocketFrontend():Promise<void>;

export function CreateAIChatMessage(arg1:number,arg2:string,arg3:string):Promise<main.AIChatMessage>;

export function CreateKnowledgeBaseItem(arg1:string,arg2:string,arg3:string,arg4:string):Promise<main.KnowledgeBase>;

export function CreateMeetingNotes(arg1:number,arg2:string):Promise<main.MeetingNotes>;

export function CreateTranscriptionMessage(arg1:string,arg2:number,arg3:string,arg4:string,arg5:string,arg6:string,arg7:time.Time):Promise<main.TranscriptionRecord>;

export function CreateWorkspace(arg1:string,arg2:string):Promise<main.Workspace>;

export function DeleteAIChatMessage(arg1:number):Promise<void>;

export function DeleteKnowledgeBaseItem(arg1:number):Promise<void>;

export function DeleteMeetingNotes(arg1:number):Promise<void>;

export function DeleteMeetingNotesByWorkspace(arg1:number):Promise<void>;

export function DeleteTranscriptionMessage(arg1:number):Promise<void>;

export function DeleteTranscriptionMessagesByWorkspace(arg1:number):Promise<void>;

export function DeleteWorkspace(arg1:number):Promise<void>;

export function DisconnectWebSocket():Promise<void>;

export function DownloadGraniteModel():Promise<void>;

export function GetAIChatMessageByID(arg1:number):Promise<main.AIChatMessage>;

export function GetAIChatMessagesByWorkspace(arg1:number):Promise<Array<main.AIChatMessage>>;

export function GetAllAIChatMessages():Promise<Array<main.AIChatMessage>>;

export function GetAllKnowledgeBaseItems():Promise<Array<main.KnowledgeBase>>;

export function GetAllWorkspaces():Promise<Array<main.Workspace>>;

export function GetKnowledgeBaseItemByID(arg1:number):Promise<main.KnowledgeBase>;

export function GetKnowledgeBaseItemByUniqueFileName(arg1:string):Promise<main.KnowledgeBase>;

export function GetKnowledgeBaseItemsByType(arg1:string):Promise<Array<main.KnowledgeBase>>;

export function GetMeetingNotesByID(arg1:number):Promise<main.MeetingNotes>;

export function GetMeetingNotesByWorkspace(arg1:number):Promise<Array<main.MeetingNotes>>;

export function GetTranscriptionMessageByID(arg1:number):Promise<main.TranscriptionRecord>;

export function GetTranscriptionMessageByMessageID(arg1:string):Promise<main.TranscriptionRecord>;

export function GetTranscriptionMessagesByDateRange(arg1:number,arg2:time.Time,arg3:time.Time):Promise<Array<main.TranscriptionRecord>>;

export function GetTranscriptionMessagesByWorkspace(arg1:number):Promise<Array<main.TranscriptionRecord>>;

export function GetTranscriptionServerStatus():Promise<Record<string, any>>;

export function GetWorkspaceByID(arg1:number):Promise<main.Workspace>;

export function Greet(arg1:string):Promise<string>;

export function HealthCheckForFrontend():Promise<string>;

export function InitializeMarkdownAgentWebSocket():Promise<void>;

export function InitializeTranscriptionServer():Promise<void>;

export function InitializeWebSocket():Promise<void>;

export function InitializeWebSocketFrontend():Promise<void>;

export function IsMarkdownAgentWebSocketConnected():Promise<boolean>;

export function IsOllamaRunning():Promise<boolean>;

export function MoveFilesToYumesession(arg1:Array<string>):Promise<Array<string>>;

export function OpenAndGetPDFData(arg1:string):Promise<Array<number>>;

export function OpenMultipleFilesDialog():Promise<Array<string>>;

export function RestartTranscriptionServer():Promise<void>;

export function SearchKnowledgeBaseItems(arg1:string):Promise<Array<main.KnowledgeBase>>;

export function SearchMeetingNotes(arg1:number,arg2:string):Promise<Array<main.MeetingNotes>>;

export function SendChatMessage(arg1:number,arg2:string,arg3:string):Promise<void>;

export function SendChatWithSystemPrompt(arg1:number,arg2:string,arg3:string):Promise<void>;

export function SendMarkdownAgentMessage(arg1:string):Promise<void>;

export function SendMeetingNotesRequest(arg1:Array<string>,arg2:string):Promise<void>;

export function SendSimpleChatMessage(arg1:number,arg2:string):Promise<void>;

export function SendTestTranscription(arg1:string,arg2:string):Promise<void>;

export function StartOllamaServer():Promise<void>;

export function StopTranscriptionServer():Promise<void>;

export function SummarizeDocumentForFrontend(arg1:string):Promise<string>;

export function UpdateAIChatMessage(arg1:number,arg2:number,arg3:string,arg4:string):Promise<main.AIChatMessage>;

export function UpdateKnowledgeBaseItem(arg1:number,arg2:string,arg3:string,arg4:string,arg5:string):Promise<main.KnowledgeBase>;

export function UpdateMeetingNotes(arg1:number,arg2:string):Promise<main.MeetingNotes>;

export function UpdateTranscriptionMessage(arg1:string,arg2:string,arg3:string,arg4:time.Time):Promise<main.TranscriptionRecord>;

export function UpdateWorkspace(arg1:number,arg2:string,arg3:string):Promise<main.Workspace>;

export function UpdateWorkspaceLastOpen(arg1:number):Promise<void>;
