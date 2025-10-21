import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInAnonymously, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, doc, setDoc, addDoc, collection, onSnapshot, query, serverTimestamp, getDocs, orderBy } from 'firebase/firestore';

// --- Firebase Configuration ---
// These global variables are provided by the environment where the app is hosted.
const appId = typeof __app_id !== 'undefined' ? __app_id : 'wisp-messenger-app-dev';
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {
    // FALLBACK CONFIG FOR LOCAL DEVELOPMENT - REPLACE WITH YOURS
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- SVG Icons & Logo ---
const WispLogo = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20Z" fill="currentColor" fillOpacity="0.1"/>
        <path d="M9.5 8C8.67 8 8 8.67 8 9.5C8 10.33 8.67 11 9.5 11C10.33 11 11 10.33 11 9.5C11 8.67 10.33 8 9.5 8ZM14.5 8C13.67 8 13 8.67 13 9.5C13 10.33 13.67 11 14.5 11C15.33 11 16 10.33 16 9.5C16 8.67 15.33 8 14.5 8Z" fill="currentColor"/>
        <path d="M12 14C10.33 14 9 15.33 9 17H15C15 15.33 13.67 14 12 14Z" fill="currentColor"/>
    </svg>
);

const SendIcon = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
    </svg>
);

const SparklesIcon = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path fillRule="evenodd" d="M9.315 7.584C12.195 3.883 16.695 1.5 21.75 1.5a.75.75 0 01.75.75c0 5.056-2.383 9.555-6.084 12.436A6.75 6.75 0 019.75 22.5a.75.75 0 01-.75-.75v-7.192A6.75 6.75 0 019.315 7.584zM12 15a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5A.75.75 0 0112 15zm-2.25-.75a.75.75 0 00-1.5 0v5.25a.75.75 0 001.5 0v-5.25zM15 6.75a.75.75 0 00-1.5 0v1.5a.75.75 0 001.5 0v-1.5z" clipRule="evenodd" />
        <path d="M3 9.75a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5A.75.75 0 013 9.75zM4.5 12a.75.75 0 00-1.5 0v1.5a.75.75 0 001.5 0v-1.5zM7.5 3.75A.75.75 0 018.25 3h1.5a.75.75 0 010 1.5h-1.5A.75.75 0 017.5 3.75z" />
    </svg>
);

const ChartBarIcon = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
);

const LifebuoyIcon = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-2.625 7.5a.75.75 0 00-1.5 0v.19l-1.08 3.243a.75.75 0 00.28 1.03l3.242 1.08.19 0a.75.75 0 000-1.5l-.19-.064-2.18-.727 1.08-3.243zm1.08 3.243a.75.75 0 00-1.03-.28l-3.243-1.08a.75.75 0 00-.82.433 9.003 9.003 0 00-.28 3.932.75.75 0 00.434.82l3.242 1.08a.75.75 0 001.031-.28l1.08-3.243a.75.75 0 00-.434-.82zM12 12.75a.75.75 0 00-.75.75v3a.75.75 0 001.5 0v-3a.75.75 0 00-.75-.75zm3.243 1.08a.75.75 0 00-.28-1.03l-3.243-1.08a.75.75 0 00-1.03.28l-1.08 3.243a.75.75 0 00.82.433c1.32.44 2.723.44 4.042 0a.75.75 0 00.82-.434l-1.08-3.242zm1.08-3.242a.75.75 0 00-.434-.82l-1.08-3.242a.75.75 0 00-1.03.28L12 9.75v-.19a.75.75 0 00-1.5 0v.19l1.08 3.242a.75.75 0 001.03.28l3.242-1.08a.75.75 0 00.434-.82z" clipRule="evenodd" />
    </svg>
);

const XMarkIcon = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z" clipRule="evenodd" />
    </svg>
);

// --- Helper Components ---

const Spinner = () => (
    <div className="flex items-center justify-center h-full w-full">
        <div className="w-12 h-12 border-4 border-slate-300 border-t-violet-500 rounded-full animate-spin"></div>
    </div>
);

// --- Main Application Components ---
const UserList = ({ users, currentUserId, onSelectUser, selectedUserId, onViewChange }) => {
    return (
        <div className="flex flex-col bg-slate-800/80 border-r border-slate-700/50 h-full">
            <div className="p-4 border-b border-slate-700/50">
                <h2 className="text-lg font-semibold text-white">Contacts</h2>
                <p className="text-xs text-slate-400">Select a user to start a conversation</p>
            </div>
            <div className="flex-grow overflow-y-auto">
                {users.length > 1 ? (
                    users.filter(user => user.id !== currentUserId).map(user => (
                        <button
                            key={user.id}
                            onClick={() => {
                                onSelectUser(user);
                                onViewChange('chat');
                            }}
                            className={`w-full text-left p-4 flex items-center gap-3 transition-colors duration-200 ${selectedUserId === user.id ? 'bg-violet-500/20' : 'hover:bg-slate-700/50'}`}
                        >
                            <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center font-bold text-violet-300">
                                {user.id.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                                <h3 className="font-semibold text-slate-200">User</h3>
                                <p className="text-xs text-slate-400 truncate w-48">{user.id}</p>
                            </div>
                        </button>
                    ))
                ) : (
                     <div className="p-4 text-center text-slate-400">
                        <p>Waiting for other users to join...</p>
                        <p className="mt-4 text-xs">Share your User ID with a friend so they can find you!</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const ChatWindow = ({ selectedUser, currentUserId, db }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [smartReplies, setSmartReplies] = useState([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };
    
    // Gemini API Calls
    const callGeminiAPI = async (payload, retries = 3, delay = 1000) => {
        const apiKey = ""; // Leave blank
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

        for (let i = 0; i < retries; i++) {
            try {
                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                if (!response.ok) {
                    const errorBody = await response.text();
                    console.error(`API Error Response: ${errorBody}`);
                    throw new Error(`API request failed with status ${response.status}`);
                }
                return await response.json();
            } catch (error) {
                console.error(`Attempt ${i + 1} failed:`, error);
                if (i === retries - 1) throw error;
                await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
            }
        }
    };
    
    const fetchSmartReplies = async (lastMessage) => {
        if (!lastMessage) return;
        setIsGenerating(true);
        const prompt = `Based on the last message received ("${lastMessage}"), generate three concise, one-tap replies. The replies should be relevant and natural for a chat conversation. Return them as a JSON array of strings. For example: ["Sounds good!", "I'm not sure.", "Let me check."]\n\nMessage: "${lastMessage}"`;
        const payload = {
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json" }
        };
        try {
            const result = await callGeminiAPI(payload);
            const repliesText = result?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (repliesText) {
                const replies = JSON.parse(repliesText);
                setSmartReplies(Array.isArray(replies) ? replies.slice(0, 3) : []);
            }
        } catch (error) {
            console.error("Error fetching smart replies:", error);
            setSmartReplies([]);
        } finally {
            setIsGenerating(false);
        }
    };
    
    const handleMagicCompose = async (tone) => {
        if (!newMessage.trim() || isGenerating) return;
        setIsGenerating(true);
        const prompt = `Rewrite the following message to sound more ${tone}, while keeping the core meaning. Keep it concise. Message: "${newMessage}"`;
        const payload = { contents: [{ parts: [{ text: prompt }] }] };

        try {
             const result = await callGeminiAPI(payload);
             const polishedText = result?.candidates?.[0]?.content?.parts?.[0]?.text;

             if (polishedText) {
                 setNewMessage(polishedText.trim());
             }
        } catch(error) {
            console.error("Error with Magic Compose:", error);
        } finally {
             setIsGenerating(false);
        }
    };
    
    useEffect(scrollToBottom, [messages]);

    useEffect(() => {
        if (!selectedUser) return;

        setLoading(true);
        setMessages([]);
        setSmartReplies([]);

        const chatId = [currentUserId, selectedUser.id].sort().join('_');
        const messagesQuery = query(collection(db, `artifacts/${appId}/public/data/chats/${chatId}/messages`), orderBy('timestamp', 'asc'));

        const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
            const fetchedMessages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setMessages(fetchedMessages);
            setLoading(false);

            const lastMessage = fetchedMessages[fetchedMessages.length - 1];
            if (lastMessage && lastMessage.senderId !== currentUserId) {
                fetchSmartReplies(lastMessage.text);
            } else {
                 setSmartReplies([]);
            }
        }, (error) => {
            console.error("Error fetching messages:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [selectedUser, currentUserId, db, appId]);
    
    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        const chatId = [currentUserId, selectedUser.id].sort().join('_');
        const messagesColRef = collection(db, `artifacts/${appId}/public/data/chats/${chatId}/messages`);
        
        await addDoc(messagesColRef, {
            text: newMessage,
            senderId: currentUserId,
            recipientId: selectedUser.id,
            timestamp: serverTimestamp()
        });

        setNewMessage('');
        setSmartReplies([]);
    };

    const handleSmartReplyClick = (reply) => {
        setNewMessage(reply);
        // We can auto-send or just populate the input. Populating is safer.
    }
    
    if (!selectedUser) {
        return (
            <div className="flex-grow flex flex-col items-center justify-center text-slate-400 bg-slate-900 h-full">
                <WispLogo className="h-24 w-24 text-slate-600 mb-4" />
                <h2 className="text-2xl font-bold text-slate-300">Welcome to Wisp</h2>
                <p className="text-slate-400 mt-2">"Just a wisp away."</p>
                <p className="mt-8">Select a contact from the left to start chatting.</p>
            </div>
        );
    }
    
    return (
        <div className="flex-grow flex flex-col bg-slate-900 h-full">
            <header className="flex-shrink-0 p-4 border-b border-slate-700/50 flex items-center gap-3 bg-slate-800/50">
                <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center font-bold text-violet-300">
                    {selectedUser.id.substring(0, 2).toUpperCase()}
                </div>
                <div>
                    <h2 className="font-semibold text-white">User</h2>
                    <p className="text-xs text-slate-400 truncate">{selectedUser.id}</p>
                </div>
            </header>

            <div className="flex-grow p-4 md:p-6 overflow-y-auto">
                {loading ? <Spinner /> : (
                    <div className="space-y-4">
                        {messages.map(msg => (
                            <div key={msg.id} className={`flex ${msg.senderId === currentUserId ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-xs md:max-w-md lg:max-w-2xl px-4 py-2 rounded-2xl ${msg.senderId === currentUserId ? 'bg-violet-600 text-white rounded-br-lg' : 'bg-slate-700 text-slate-200 rounded-bl-lg'}`}>
                                    <p>{msg.text}</p>
                                </div>
                            </div>
                        ))}
                         <div ref={messagesEndRef} />
                    </div>
                )}
            </div>

            <div className="p-4 bg-slate-800/80 border-t border-slate-700/50 flex-shrink-0">
                 {smartReplies.length > 0 && (
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                        {smartReplies.map((reply, i) => (
                            <button key={i} onClick={() => handleSmartReplyClick(reply)} className="text-sm bg-slate-700/80 text-violet-300 py-1.5 px-3 rounded-full hover:bg-slate-600 transition-colors">
                                {reply}
                            </button>
                        ))}
                    </div>
                 )}

                <form onSubmit={handleSendMessage} className="flex items-center gap-2 md:gap-4">
                    <div className="relative group">
                        <button type="button" onClick={() => handleMagicCompose('casual')} className="p-2 text-slate-400 hover:text-violet-400 transition-colors" aria-label="Magic compose">
                            <SparklesIcon className="h-5 w-5" />
                        </button>
                    </div>
                    
                    <input
                        type="text"
                        value={isGenerating && !smartReplies.length ? "✨ Wisp is thinking..." : newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        disabled={isGenerating && !smartReplies.length}
                        className="flex-grow bg-slate-700/50 border border-slate-600 rounded-full py-2 px-4 text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-shadow disabled:bg-slate-800"
                        aria-label="Message input"
                    />
                    <button type="submit" className="bg-violet-600 text-white rounded-full p-2.5 hover:bg-violet-500 transition-colors disabled:bg-slate-500 disabled:cursor-not-allowed" disabled={!newMessage.trim() || isGenerating} aria-label="Send message">
                        <SendIcon className="h-5 w-5" />
                    </button>
                </form>
            </div>
        </div>
    );
};


const SupportModal = ({ isOpen, onClose, currentUserId }) => {
    const [message, setMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [isSent, setIsSent] = useState(false);
    
    // !!! IMPORTANT: Replace this with your own Discord Webhook URL from the guide
    const DISCORD_WEBHOOK_URL = "YOUR_DISCORD_WEBHOOK_URL_HERE";

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!message.trim() || DISCORD_WEBHOOK_URL === "YOUR_DISCORD_WEBHOOK_URL_HERE") {
            if (DISCORD_WEBHOOK_URL === "YOUR_DISCORD_WEBHOOK_URL_HERE") {
                 alert("Support feature is not configured. Please see the Discord Setup Guide.");
            }
            return;
        }
        setIsSending(true);

        const payload = {
            embeds: [{
                title: "New Wisp Support Ticket",
                description: message,
                color: 10181046, // Purple color
                fields: [{
                    name: "From User ID",
                    value: `\`${currentUserId}\``,
                    inline: true
                }],
                timestamp: new Date().toISOString()
            }]
        };

        try {
            const response = await fetch(DISCORD_WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (response.ok) {
                setIsSent(true);
                setMessage('');
                setTimeout(() => {
                    onClose();
                    setIsSent(false);
                }, 2000);
            } else {
                 throw new Error(`Request failed with status: ${response.status}`);
            }
        } catch (error) {
            console.error("Failed to send support ticket:", error);
            alert("Sorry, there was an issue sending your support ticket. Please try again later.");
        } finally {
            setIsSending(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-labelledby="support-modal-title">
            <div className="bg-slate-800 rounded-lg shadow-2xl w-full max-w-md border border-slate-700">
                <div className="flex justify-between items-center p-4 border-b border-slate-700">
                    <h2 id="support-modal-title" className="text-lg font-semibold text-white">Contact Support</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors" aria-label="Close support modal">
                        <XMarkIcon className="h-6 w-6" />
                    </button>
                </div>
                <div className="p-6">
                    {isSent ? (
                        <div className="text-center text-green-400">
                            <h3 className="text-lg font-semibold">Thank You!</h3>
                            <p>Your message has been sent successfully.</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit}>
                            <label htmlFor="support-message" className="text-sm text-slate-400 mb-4 block">
                                Please describe your issue below. Our support team will review it. Please include your User ID if you are reporting an issue with another user.
                            </label>
                            <textarea
                                id="support-message"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="How can we help?"
                                rows="5"
                                className="w-full bg-slate-700/50 border border-slate-600 rounded-md p-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-shadow"
                                required
                            ></textarea>
                            <button 
                                type="submit" 
                                disabled={isSending || !message.trim()}
                                className="w-full mt-4 bg-violet-600 text-white rounded-md py-2.5 font-semibold hover:bg-violet-500 transition-colors disabled:bg-slate-500 disabled:cursor-not-allowed flex items-center justify-center"
                            >
                                {isSending ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'Send Message'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

const Dashboard = ({ allUsers, db }) => {
    const [totalMessages, setTotalMessages] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // NOTE: This client-side calculation is for demonstration purposes and is NOT scalable.
        // For a production app, use Firebase Cloud Functions to create and maintain
        // a dedicated 'stats' document to avoid reading all message documents on the client.
        const fetchMessagesCount = async () => {
            setLoading(true);
            try {
                const chatsColRef = collection(db, `artifacts/${appId}/public/data/chats`);
                const snapshot = await getDocs(chatsColRef);
                let count = 0;
                for (const chatDoc of snapshot.docs) {
                    const messagesColRef = collection(db, chatDoc.ref.path, 'messages');
                    const messagesSnapshot = await getDocs(messagesColRef);
                    count += messagesSnapshot.size;
                }
                setTotalMessages(count);
            } catch (error) {
                console.error("Error fetching message count:", error);
            } finally {
                setLoading(false);
            }
        };
        if (db && appId) {
            fetchMessagesCount();
        }
    }, [db, appId]);

    return (
        <div className="p-6 md:p-8 bg-slate-900 h-full overflow-y-auto">
            <h1 className="text-3xl font-bold text-white mb-6">Wisp Dashboard</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-800/80 p-6 rounded-lg border border-slate-700">
                    <h2 className="text-lg font-semibold text-violet-300">Total Users</h2>
                    <p className="text-4xl font-bold text-white mt-2">{allUsers.length}</p>
                </div>
                <div className="bg-slate-800/80 p-6 rounded-lg border border-slate-700">
                    <h2 className="text-lg font-semibold text-violet-300">Total Messages Sent</h2>
                    {loading ? <div className="h-10 mt-2 w-16 bg-slate-700 rounded animate-pulse"></div> : <p className="text-4xl font-bold text-white mt-2">{totalMessages}</p>}
                </div>
            </div>
        </div>
    );
};

// Main App Component
function App() {
    const [user, setUser] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [allUsers, setAllUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [currentView, setCurrentView] = useState('chat');
    const [isSupportOpen, setIsSupportOpen] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                const userDocRef = doc(db, `artifacts/${appId}/public/data/users`, currentUser.uid);
                await setDoc(userDocRef, { id: currentUser.uid, lastSeen: serverTimestamp() }, { merge: true });
            } else {
                 try {
                    if (initialAuthToken) {
                        await signInWithCustomToken(auth, initialAuthToken);
                    } else {
                        await signInAnonymously(auth);
                    }
                } catch (error) {
                    console.error("Authentication Error:", error);
                }
            }
            setIsAuthReady(true);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (!isAuthReady) return;
        
        const usersQuery = query(collection(db, `artifacts/${appId}/public/data/users`));
        const unsubscribe = onSnapshot(usersQuery, (snapshot) => {
            const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setAllUsers(usersData);
        }, (error) => {
            console.error("Error fetching users:", error);
        });

        return () => unsubscribe();
    }, [isAuthReady]);

    if (!isAuthReady || !user) {
        return (
            <div className="bg-slate-900 text-white h-screen w-screen flex flex-col items-center justify-center">
                <div className="flex items-center gap-4 mb-4">
                    <WispLogo className="h-12 w-12 text-violet-400"/>
                    <h1 className="text-4xl font-bold tracking-tighter">wisp</h1>
                </div>
                <Spinner />
                <p className="mt-4 text-slate-400">Connecting securely...</p>
            </div>
        );
    }

    const MainContent = () => {
        if (currentView === 'dashboard') {
            return <Dashboard allUsers={allUsers} db={db} />;
        }
        return <ChatWindow selectedUser={selectedUser} currentUserId={user.uid} db={db} />;
    };
    
    return (
        <div className="h-screen w-screen bg-slate-900 text-white font-sans flex flex-col antialiased">
            <SupportModal isOpen={isSupportOpen} onClose={() => setIsSupportOpen(false)} currentUserId={user.uid} />
            <header className="flex items-center justify-between p-3 border-b border-slate-700/50 bg-slate-900/50 backdrop-blur-sm flex-shrink-0">
                <div className="flex items-center gap-3">
                    <button onClick={() => setCurrentView('chat')} className="flex items-center gap-3">
                        <WispLogo className="h-8 w-8 text-violet-400" />
                        <h1 className="text-xl font-bold">wisp</h1>
                    </button>
                    <div className="h-6 w-px bg-slate-700"></div>
                    <button onClick={() => setCurrentView('dashboard')} className={`p-2 rounded-md ${currentView === 'dashboard' ? 'bg-violet-500/20 text-violet-300' : 'text-slate-400 hover:bg-slate-700/50'}`} aria-label="Open dashboard">
                        <ChartBarIcon className="h-5 w-5" />
                    </button>
                    <button onClick={() => setIsSupportOpen(true)} className="p-2 rounded-md text-slate-400 hover:bg-slate-700/50" aria-label="Open support">
                        <LifebuoyIcon className="h-5 w-5" />
                    </button>
                </div>
                <div className="text-right">
                    <p className="text-xs text-slate-400">Your User ID (Share to connect)</p>
                    <p className="font-mono text-sm text-violet-300 bg-slate-800 px-2 py-1 rounded-md">{user.uid}</p>
                </div>
            </header>
            
            <div className="flex-grow flex overflow-hidden">
                <div className="w-full md:w-1/3 lg:w-1/4 xl:w-1/5 flex-shrink-0">
                    <UserList
                        users={allUsers}
                        currentUserId={user.uid}
                        onSelectUser={setSelectedUser}
                        selectedUserId={selectedUser?.id}
                        onViewChange={setCurrentView}
                    />
                </div>
                <div className="flex-grow flex flex-col">
                    <MainContent />
                </div>
            </div>
        </div>
    );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

