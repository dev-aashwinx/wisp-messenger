import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, onSnapshot, addDoc, query, where, getDocs, serverTimestamp, orderBy } from 'firebase/firestore';

// --- GLOBALLY PROVIDED VARIABLES ---
// These would be provided by the environment where this code is run.
// For local development, you'll need to replace them with your actual Firebase config.
const __app_id = typeof __app_id !== 'undefined' ? __app_id : 'default-messaging-app';
const __firebase_config = typeof __firebase_config !== 'undefined' ? __firebase_config : JSON.stringify({
    apiKey: "YOUR_API_KEY", // Replace with your Firebase config
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
});

// --- GEMINI API KEY ---
// IMPORTANT: If you want to use the Gemini features, you need to get an API key from 
// Google AI Studio and paste it here. Otherwise, leave it as an empty string.
const GEMINI_API_KEY = "";

// --- FIREBASE INITIALIZATION ---
const firebaseConfig = JSON.parse(__firebase_config);
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- HELPER FUNCTIONS & MOCK DATA ---
const mockContacts = [
    { id: 'contact-1', name: 'Ava Williams', avatar: 'https://placehold.co/100x100/E6D4FF/6B21A8?text=AW', online: true },
    { id: 'contact-2', name: 'Anthony Garcia', avatar: 'https://placehold.co/100x100/D1FAE5/065F46?text=AG', online: false },
    { id: 'contact-3', name: 'Aidan Thomas', avatar: 'https://placehold.co/100x100/FEF3C7/92400E?text=AT', online: true },
    { id: 'contact-4', name: 'Abigail White', avatar: 'https://placehold.co/100x100/FEE2E2/991B1B?text=AW', online: false },
    { id: 'contact-5', name: 'Alex Hill', avatar: 'https://placehold.co/100x100/DBEAFE/1E40AF?text=AH', online: true },
    { id: 'contact-6', name: 'Ryan Reynolds', avatar: 'https://placehold.co/100x100/fde047/b45309?text=RR', online: true, typing: true, lastMessage: 'Typing...', time: 'Now' },
    { id: 'contact-7', name: 'Lenny Kravitz', avatar: 'https://placehold.co/100x100/dbeafe/1e3a8a?text=LK', online: true, lastMessage: 'Typing...', time: 'Now' },
    { id: 'contact-8', name: 'Emilia Clarke', avatar: 'https://placehold.co/100x100/fce7f3/9d2667?text=EC', online: false, lastMessage: 'Typing...', time: 'Today, 10:00' },
];

const mockChats = [
    { id: 'chat-1', name: 'Ryan Reynolds', avatar: mockContacts[5].avatar, lastMessage: "Let's catch up tomorrow!", time: 'Now', unread: 2 },
    { id: 'chat-2', name: 'The Three Musketeers', avatar: 'https://placehold.co/100x100/fbcfe8/9d2667?text=3M', isGroup: true, lastMessage: "Sofia: Sounds good! See you then.", time: 'Yesterday', unread: 0 },
    { id: 'chat-3', name: 'Babe ❤️', avatar: 'https://placehold.co/100x100/fecaca/991b1b?text=B', lastMessage: "I'll be there in 5.", time: 'Yesterday', unread: 0 },
    { id: 'chat-4', name: 'Emilia Clarke', avatar: mockContacts[7].avatar, lastMessage: "Great, thanks for the update!", time: 'Today, 10:00', unread: 0 },
];

// --- SVG ICONS ---
// Using inline SVGs to avoid external dependencies and match the design.
const SearchIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>;
const PaperclipIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.59a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>;
const MicIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>;
const SendIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>;
const BackIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>;
const PhoneIcon = ({ className = "w-6 h-6" }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>;
const VideoIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>;
const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>;
const CheckIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="20 6 9 17 4 12"></polyline></svg>;
const MenuIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg>;
const SmileIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M8 14s1.5 2 4 2 4-2 4-2"></path><line x1="9" y1="9" x2="9.01" y2="9"></line><line x1="15" y1="9" x2="15.01" y2="9"></line></svg>;
const ChevronRightIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>;
const BellIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>;
const LockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>;
const DatabaseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path></svg>;
const SettingsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>;
const LogoutIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>;
const MagicIcon = ({ className = "w-6 h-6" }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 3L13.65 8.35L19 10L13.65 11.65L12 17L10.35 11.65L5 10L10.35 8.35L12 3Z" /><path d="M5 3L6.05 6.1L9 7.15L6.05 8.2L5 11.25L3.95 8.2L1 7.15L3.95 6.1L5 3Z" /><path d="M19 13L17.95 16.1L15 17.15L17.95 18.2L19 21.25L20.05 18.2L23 17.15L20.05 16.1L19 13Z" /></svg>;

// --- COMPONENT: BottomNavBar ---
const BottomNavBar = ({ active, setView }) => {
    const navItems = [
        { name: 'Contacts', view: 'contacts', icon: UserIcon },
        { name: 'Chats', view: 'chatList', icon: MessageSquareIcon },
        { name: 'Settings', view: 'settings', icon: SettingsIcon },
    ];
    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-sm border-t border-gray-200 shadow-lg">
            <div className="flex justify-around max-w-md mx-auto">
                {navItems.map(({ name, view, icon: Icon }) => (
                    <button key={name} onClick={() => setView(view)} className={`flex flex-col items-center justify-center p-3 w-full transition-all duration-200 ${active === view ? 'text-blue-600 scale-110' : 'text-gray-500'}`}>
                        <Icon active={active === view} />
                        <span className="text-xs mt-1">{name}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

const UserIcon = ({ active }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>;
const MessageSquareIcon = ({ active }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>;

// --- SCREEN: WelcomeScreen ---
const WelcomeScreen = ({ setView }) => (
    <div className="flex flex-col items-center justify-center h-full text-center bg-gray-50 p-8">
         <div className="w-48 h-48 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-8 shadow-2xl">
            <svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
        </div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome to Fastest and</h1>
        <h2 className="text-3xl font-bold text-gray-800 mb-4">Secure Messaging app.</h2>
        <p className="text-gray-500 mb-12">A simple and friendly messaging experience.</p>
        <button onClick={() => setView('auth')} className="w-full max-w-sm py-4 bg-blue-600 text-white rounded-xl font-semibold shadow-lg hover:bg-blue-700 transition duration-300">
            Start Messaging
        </button>
        <p className="text-xs text-gray-400 mt-4">Terms & Privacy Policy</p>
    </div>
);

// --- SCREEN: AuthScreen ---
const AuthScreen = ({ onAuthSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    
    const handleLogin = async () => {
        setLoading(true);
        setError('');
        try {
            const token = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;
            if (token) {
                await signInWithCustomToken(auth, token);
            } else {
                await signInAnonymously(auth);
            }
            // The onAuthStateChanged listener in App will handle navigation.
            onAuthSuccess();
        } catch (err) {
            console.error("Authentication failed:", err);
            setError("Authentication failed. Please check your Firebase configuration.");
        }
        setLoading(false);
    };
    
    return (
        <div className="flex flex-col items-center h-full bg-gray-50 p-8 pt-20">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-6 shadow-xl">
                 <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Enter Your Credentials</h1>
            <p className="text-gray-500 mb-8">Sign in to continue to the app.</p>
            <div className="w-full max-w-sm">
                <input
                    type="text"
                    placeholder="Username or Email"
                    className="w-full px-4 py-3 mb-4 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                    type="password"
                    placeholder="Password"
                    className="w-full px-4 py-3 mb-6 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                 {error && <p className="text-red-500 text-sm text-center mb-4">{error}</p>}
                <button 
                    onClick={handleLogin} 
                    disabled={loading}
                    className="w-full py-4 bg-blue-600 text-white rounded-xl font-semibold shadow-lg hover:bg-blue-700 transition duration-300 disabled:bg-blue-300 flex items-center justify-center"
                >
                    {loading ? (
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    ) : 'Continue'}
                </button>
                <button className="w-full mt-4 text-sm text-blue-600 font-semibold">
                    Forgot your password?
                </button>
            </div>
        </div>
    );
};


// --- SCREEN: ChatListScreen ---
const ChatListScreen = ({ setView, setCurrentChat, user }) => {
    const [activeTab, setActiveTab] = useState('All');
    
    // In a real app, this would be dynamic from user's data
    const tabs = ['All', 'Family', 'Friends', 'Groups'];

    return (
        <div className="h-full bg-white pb-20">
            <div className="p-4 pt-8">
                <div className="flex justify-between items-center mb-6">
                     <h1 className="text-3xl font-bold text-gray-800">Chats</h1>
                     <button className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                         <EditIcon />
                     </button>
                </div>
                <div className="relative mb-4">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <SearchIcon />
                    </div>
                    <input type="text" placeholder="Search here" className="w-full bg-gray-100 rounded-lg py-3 pl-10 pr-4 border border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none"/>
                </div>
                <div className="flex space-x-2 mb-4">
                    {tabs.map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${activeTab === tab ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                            {tab}
                        </button>
                    ))}
                </div>
            </div>
            
             <div className="px-4 mb-4">
                <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg" role="alert">
                    <p className="font-bold">You have 12 unread messages</p>
                    <p className="text-sm">Check them out and reply to your friends!</p>
                </div>
            </div>

            <div className="space-y-1">
                {mockChats.map(chat => (
                    <div key={chat.id} onClick={() => setCurrentChat(chat)} className="flex items-center p-4 hover:bg-gray-50 cursor-pointer">
                        <img src={chat.avatar} alt={chat.name} className="w-14 h-14 rounded-full mr-4"/>
                        <div className="flex-grow">
                            <p className="font-semibold text-gray-800">{chat.name}</p>
                            <p className="text-sm text-gray-500 truncate">{chat.lastMessage}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-gray-400 mb-1">{chat.time}</p>
                            {chat.unread > 0 && (
                                <span className="text-xs bg-blue-600 text-white font-bold rounded-full w-5 h-5 flex items-center justify-center">{chat.unread}</span>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- SCREEN: ChatScreen ---
const ChatScreen = ({ chat, setCurrentChat }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef(null);
    const [selectedMessage, setSelectedMessage] = useState(null);

    // Gemini API states
    const [smartReplies, setSmartReplies] = useState([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [magicSuggestions, setMagicSuggestions] = useState(null);


    // Mock messages for UI display
    const initialMessages = [
        { id: 1, text: "Hey, how are you?", sender: 'other', time: "10:00 AM" },
        { id: 2, text: "I'm good, thanks! How about you? Wanna hang out this weekend?", sender: 'me', time: "10:01 AM" },
        { id: 3, text: "Sounds fun! What are you thinking?", sender: 'other', time: "10:01 AM" },
        { id: 4, text: "Let's grab a coffee and then maybe catch a movie.", sender: 'me', time: "10:02 AM" },
        { id: 5, text: "Perfect! I'm in.", sender: 'other', time: "10:03 AM" },
        { id: 6, type: 'audio', src: '#', duration: '0:15', sender: 'me', time: "10:05 AM" }
    ];

    // --- Gemini API Helper Function ---
    const callGeminiAPI = async (prompt, schema, retries = 3, delay = 1000) => {
        if (!GEMINI_API_KEY) {
            console.error("Gemini API key is missing.");
            return null;
        }
        setIsGenerating(true);
        const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${GEMINI_API_KEY}`;
        
        const payload = {
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: schema ? {
                responseMimeType: "application/json",
                responseSchema: schema,
            } : {}
        };

        for (let i = 0; i < retries; i++) {
            try {
                const response = await fetch(API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) {
                    throw new Error(`API request failed with status ${response.status}`);
                }
                
                const result = await response.json();
                const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
                setIsGenerating(false);
                return text ? JSON.parse(text) : null;

            } catch (error) {
                console.error(`Attempt ${i + 1} failed:`, error);
                if (i === retries - 1) {
                    setIsGenerating(false);
                    return null;
                }
                await new Promise(res => setTimeout(res, delay * Math.pow(2, i)));
            }
        }
    };
    
    const generateSmartReplies = async (lastMessageText) => {
        setSmartReplies([]);
        const prompt = `You are a helpful assistant suggesting replies in a casual chat conversation. Based on the last message which is "${lastMessageText}", provide three distinct, short, and natural-sounding replies. Provide the output in a JSON array of strings.`;
        const schema = { type: "ARRAY", items: { type: "STRING" } };
        const replies = await callGeminiAPI(prompt, schema);
        if (replies && Array.isArray(replies)) {
            setSmartReplies(replies);
        }
    };

    const handleMagicCompose = async () => {
        if (!newMessage.trim()) return;
        const prompt = `You are a writing assistant. Rewrite the following message in three different tones: formal, casual, and witty. Message: "${newMessage}". Provide the output as a JSON object with keys "formal", "casual", and "witty".`;
        const schema = { type: "OBJECT", properties: { "formal": { "type": "STRING" }, "casual": { "type": "STRING" }, "witty": { "type": "STRING" } } };
        const suggestions = await callGeminiAPI(prompt, schema);
        if (suggestions) {
            setMagicSuggestions(suggestions);
        }
    };


    useEffect(() => {
        setMessages(initialMessages);
        const lastMessage = initialMessages.filter(m => m.sender === 'other').pop();
        if (lastMessage?.text) {
            generateSmartReplies(lastMessage.text);
        }
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = (text) => {
        const messageText = text || newMessage;
        if (messageText.trim()) {
            const newMsg = { id: Date.now(), text: messageText, sender: 'me', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
            setMessages(prev => [...prev, newMsg]);
            setNewMessage('');
            setSmartReplies([]); // Clear replies after sending

            // Simulate a reply to generate new smart replies
            setTimeout(() => {
                const mockReply = { id: Date.now() + 1, text: "That's interesting! Tell me more.", sender: 'other', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
                setMessages(prev => [...prev, mockReply]);
                generateSmartReplies(mockReply.text);
            }, 1500);
        }
    };
    
    const MessageContextMenu = () => (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setSelectedMessage(null)}>
            <div className="bg-white rounded-xl shadow-xl w-64 p-2" onClick={e => e.stopPropagation()}>
                <button className="w-full text-left px-4 py-2 rounded-lg hover:bg-gray-100">Reply</button>
                <button className="w-full text-left px-4 py-2 rounded-lg hover:bg-gray-100">Forward</button>
                <button className="w-full text-left px-4 py-2 text-red-500 rounded-lg hover:bg-red-50">Delete</button>
                <div className="border-t my-1"></div>
                <button onClick={() => setSelectedMessage(null)} className="w-full text-left px-4 py-2 rounded-lg hover:bg-gray-100">Cancel</button>
            </div>
        </div>
    );
    
    const MagicComposeModal = () => (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setMagicSuggestions(null)}>
            <div className="bg-white rounded-xl shadow-xl w-11/12 max-w-sm p-4" onClick={e => e.stopPropagation()}>
                <h3 className="font-bold text-lg mb-4">✨ Magic Compose</h3>
                <div className="space-y-3">
                    {Object.entries(magicSuggestions).map(([tone, text]) => (
                        <div key={tone} onClick={() => { setNewMessage(text); setMagicSuggestions(null); }} className="p-3 border rounded-lg hover:bg-gray-100 cursor-pointer">
                            <p className="font-semibold capitalize text-blue-600">{tone}</p>
                            <p className="text-gray-700">{text}</p>
                        </div>
                    ))}
                </div>
                <button onClick={() => setMagicSuggestions(null)} className="w-full mt-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg">Cancel</button>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col h-full bg-gray-50">
            {selectedMessage && <MessageContextMenu />}
            {magicSuggestions && <MagicComposeModal />}
            <header className="flex items-center p-3 bg-white border-b sticky top-0 z-10">
                <button onClick={() => setCurrentChat(null)} className="p-2 mr-2 text-gray-600"><BackIcon /></button>
                <img src={chat.avatar} alt={chat.name} className="w-10 h-10 rounded-full mr-3"/>
                <div>
                    <h2 className="font-semibold text-gray-800">{chat.name}</h2>
                    <p className="text-xs text-green-500">Online</p>
                </div>
                <div className="ml-auto flex items-center space-x-4">
                    <button className="p-2 text-blue-600"><PhoneIcon /></button>
                    <button className="p-2 text-blue-600"><VideoIcon /></button>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => (
                    <div key={msg.id} onContextMenu={(e) => { e.preventDefault(); setSelectedMessage(msg); }} onClick={() => setSelectedMessage(msg)}>
                        {msg.type === 'audio' ? (
                            <div className={`flex items-center gap-2 max-w-xs p-2 rounded-xl ${msg.sender === 'me' ? 'ml-auto bg-blue-600 text-white' : 'bg-white text-gray-800'}`}>
                                <button className={`text-sm ${msg.sender === 'me' ? 'text-white' : 'text-blue-600'}`}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="0"><path d="M8 5v14l11-7z"></path></svg>
                                </button>
                                <div className="w-full h-1 bg-gray-300/50 rounded-full relative"><div className="absolute left-0 top-0 h-1 w-3/4 bg-white rounded-full"></div><div className="absolute left-3/4 top-1/2 -mt-1 h-2 w-2 bg-white rounded-full"></div></div>
                                <span className="text-xs">{msg.duration}</span>
                            </div>
                        ) : (
                            <div className={`max-w-xs px-4 py-2 rounded-xl ${msg.sender === 'me' ? 'ml-auto bg-blue-600 text-white' : 'bg-white text-gray-800 shadow-sm'}`}>
                                <p>{msg.text}</p>
                                <p className={`text-xs mt-1 text-right ${msg.sender === 'me' ? 'text-blue-200' : 'text-gray-400'}`}>{msg.time}</p>
                            </div>
                        )}
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </main>

            <footer className="p-3 bg-white border-t sticky bottom-0">
                 {smartReplies.length > 0 && (
                    <div className="flex gap-2 mb-2 overflow-x-auto pb-2">
                        {smartReplies.map((reply, i) => (
                            <button key={i} onClick={() => handleSendMessage(reply)} className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm font-medium whitespace-nowrap">
                                {reply}
                            </button>
                        ))}
                    </div>
                )}
                <div className="flex items-center bg-gray-100 rounded-xl">
                    <button className="p-3 text-gray-500"><SmileIcon /></button>
                     {newMessage.trim() && !isGenerating && (
                        <button onClick={handleMagicCompose} className="p-3 text-purple-600 animate-pulse">
                            <MagicIcon className="w-5 h-5" />
                        </button>
                    )}
                    <input 
                        type="text" 
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Type a message" 
                        className="flex-1 bg-transparent focus:outline-none text-gray-800"
                    />
                    <button className="p-3 text-gray-500"><PaperclipIcon /></button>
                    {newMessage ? (
                        <button onClick={() => handleSendMessage()} className="p-3 text-white bg-blue-600 rounded-lg m-1"><SendIcon /></button>
                    ) : (
                        <button className="p-3 text-gray-500"><MicIcon /></button>
                    )}
                </div>
            </footer>
        </div>
    );
};


// --- SCREEN: ContactsScreen ---
const ContactsScreen = ({ setView }) => {
    return (
        <div className="h-full bg-white pb-20">
            <div className="p-4 pt-8 sticky top-0 bg-white/80 backdrop-blur-sm z-10">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-gray-800">Contacts</h1>
                    <button className="text-blue-600 font-semibold">Edit</button>
                </div>
                 <div className="relative mb-2">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <SearchIcon />
                    </div>
                    <input type="text" placeholder="Search" className="w-full bg-gray-100 rounded-lg py-3 pl-10 pr-4 border border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none"/>
                </div>
            </div>
            <div className="px-4">
                 <div className="py-3 border-b border-gray-100">
                    <button className="w-full text-left text-blue-600 font-semibold">New Contact</button>
                </div>
                 <div className="py-3">
                    <button className="w-full text-left text-blue-600 font-semibold">Find People Nearby</button>
                </div>
            </div>
            
            <div className="mt-4">
                 {mockContacts.slice(0, 5).map(contact => (
                    <div key={contact.id} className="flex items-center p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100">
                        <img src={contact.avatar} alt={contact.name} className="w-12 h-12 rounded-full mr-4"/>
                        <div className="flex-grow">
                            <p className="font-semibold text-gray-800">{contact.name}</p>
                        </div>
                         {contact.online && <div className="w-2.5 h-2.5 bg-green-500 rounded-full"></div>}
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- SCREEN: CallingScreen ---
const CallingScreen = ({ setView }) => {
    return (
        <div className="h-full bg-gradient-to-b from-purple-900 to-blue-900 text-white flex flex-col items-center justify-between p-8">
            <div className="text-center mt-20">
                <img src="https://placehold.co/120x120/fde047/b45309?text=CR" alt="Charlotte Ritchie" className="w-32 h-32 rounded-full mx-auto mb-4 border-4 border-white/50" />
                <h1 className="text-3xl font-bold">Charlotte Ritchie</h1>
                <p className="text-gray-300 mt-2">Calling...</p>
            </div>
            <div className="flex justify-around w-full max-w-xs mb-10">
                <button className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform" onClick={() => setView('chatList')}>
                    <PhoneIcon className="w-8 h-8 text-white transform -rotate-45" />
                </button>
                 <button className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform">
                    <PhoneIcon className="w-8 h-8 text-white" />
                </button>
            </div>
        </div>
    );
};

// --- SCREEN: SettingsScreen ---
const SettingsScreen = ({ setView, user }) => {
    const settingsItems = [
        { icon: BellIcon, title: "Notifications and Sounds", color: 'bg-red-500' },
        { icon: LockIcon, title: "Privacy and Security", color: 'bg-yellow-500' },
        { icon: DatabaseIcon, title: "Data and Storage", color: 'bg-green-500' },
    ];
    
    return (
         <div className="h-full bg-gray-100 pb-20">
             <div className="p-4 pt-8 bg-white/80 backdrop-blur-sm">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold text-gray-800">Settings</h1>
                     <button className="text-blue-600 font-semibold">Edit</button>
                </div>
            </div>
            <div className="p-4">
                 <div className="flex items-center bg-white p-4 rounded-xl shadow-sm mb-6">
                    <img src={`https://placehold.co/100x100/DBEAFE/1E40AF?text=U`} alt="User" className="w-16 h-16 rounded-full mr-4" />
                    <div>
                        <p className="font-bold text-lg text-gray-800">Anonymous User</p>
                        <p className="text-sm text-gray-500 truncate">ID: {user?.uid}</p>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm">
                    {settingsItems.map((item, index) => (
                        <div key={item.title} className={`flex items-center p-4 ${index < settingsItems.length - 1 ? 'border-b border-gray-100' : ''}`}>
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-4 ${item.color}`}>
                                <item.icon className="w-5 h-5 text-white" />
                            </div>
                            <span className="flex-grow text-gray-800 font-medium">{item.title}</span>
                            <ChevronRightIcon />
                        </div>
                    ))}
                </div>
                
                 <div className="bg-white rounded-xl shadow-sm mt-6">
                    <button onClick={() => alert("Logout functionality not implemented.")} className="flex items-center p-4 w-full text-left">
                         <div className="w-8 h-8 rounded-lg flex items-center justify-center mr-4 bg-gray-500">
                             <LogoutIcon className="w-5 h-5 text-white" />
                        </div>
                        <span className="flex-grow text-red-500 font-medium">Logout</span>
                    </button>
                </div>

            </div>
         </div>
    );
}

// --- MAIN APP COMPONENT ---
export default function App() {
    const [view, setView] = useState('welcome'); // welcome, auth, chatList, contacts, settings, calling
    const [currentChat, setCurrentChat] = useState(null);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                setView('chatList');
            } else {
                setUser(null);
                setView('welcome');
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleAuthSuccess = () => {
       // The onAuthStateChanged listener will automatically set the view.
    };
    
    const renderView = () => {
        if (loading) {
            return <div className="flex h-full items-center justify-center">Loading...</div>
        }
        if (currentChat) {
            return <ChatScreen chat={currentChat} setCurrentChat={setCurrentChat} />;
        }
        switch (view) {
            case 'welcome':
                return <WelcomeScreen setView={setView} />;
            case 'auth':
                return <AuthScreen onAuthSuccess={handleAuthSuccess} />;
            case 'chatList':
                return <ChatListScreen setView={setView} setCurrentChat={setCurrentChat} user={user} />;
            case 'contacts':
                return <ContactsScreen setView={setView} />;
             case 'calling':
                return <CallingScreen setView={setView} />;
            case 'settings':
                return <SettingsScreen setView={setView} user={user} />;
            default:
                return <WelcomeScreen setView={setView} />;
        }
    };
    
    const showNavBar = !loading && user && !currentChat && ['chatList', 'contacts', 'settings'].includes(view);

    return (
        <div className="w-full h-full font-sans antialiased bg-white">
            <div className="max-w-md mx-auto h-full border-x border-gray-100 shadow-2xl flex flex-col relative">
                <main className="flex-1 overflow-y-auto">
                    {renderView()}
                </main>
                {showNavBar && <BottomNavBar active={view} setView={setView} />}
            </div>
        </div>
    );
}

