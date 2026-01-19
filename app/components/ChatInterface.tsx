'use client';

import { useState } from 'react';
import { Search, MoreVertical, Phone, Video, Paperclip, Mic, Send, Check, CheckCheck } from 'lucide-react';

export default function ChatInterface() {
    const [selectedUser, setSelectedUser] = useState(0);
    const [message, setMessage] = useState('');

    const users = [
        { id: 0, name: 'Alice Johnson', avatar: 'https://i.pravatar.cc/150?u=1', status: 'online', lastMessage: 'Is the property still available?', time: '10:42 AM', unread: 2 },
        { id: 1, name: 'Michael Smith', avatar: 'https://i.pravatar.cc/150?u=2', status: 'offline', lastMessage: 'Thank you for the information.', time: 'Yesterday', unread: 0 },
        { id: 2, name: 'Sarah Wilson', avatar: 'https://i.pravatar.cc/150?u=3', status: 'online', lastMessage: 'Can we schedule a viewing?', time: 'Tue', unread: 1 },
        { id: 3, name: 'David Brown', avatar: 'https://i.pravatar.cc/150?u=4', status: 'offline', lastMessage: 'I will get back to you soon.', time: 'Mon', unread: 0 },
    ];

    const messages = [
        { id: 1, sender: 'them', text: 'Hi! I saw your listing for the downtown apartment.', time: '10:30 AM' },
        { id: 2, sender: 'me', text: 'Hello! Yes, it is currently available.', time: '10:32 AM', status: 'read' },
        { id: 3, sender: 'them', text: 'Great! Is it possible to visit it this weekend?', time: '10:33 AM' },
        { id: 4, sender: 'them', text: 'I am available on Saturday afternoon.', time: '10:33 AM' },
        { id: 5, sender: 'me', text: 'Saturday works for me. How does 2 PM sound?', time: '10:35 AM', status: 'delivered' },
        { id: 6, sender: 'them', text: '2 PM is perfect. See you then!', time: '10:42 AM' },
    ];

    return (
        <div className="flex h-[85vh] max-h-[700px] bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mt-6">
            {/* Sidebar */}
            <div className="w-80 border-r border-slate-200 flex flex-col">
                {/* User Header */}
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                    <img src="https://i.pravatar.cc/150?u=0" alt="My Profile" className="w-10 h-10 rounded-full cursor-pointer" />
                    <div className="flex gap-4 text-slate-500">
                        <MoreVertical className="w-6 h-6 cursor-pointer hover:text-slate-700" />
                    </div>
                </div>

                {/* Search */}
                <div className="p-3">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search or start new chat"
                            className="w-full bg-slate-100 text-slate-900 pl-10 pr-4 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    </div>
                </div>

                {/* Chat List */}
                <div className="flex-1 overflow-y-auto">
                    {users.map((user) => (
                        <div
                            key={user.id}
                            onClick={() => setSelectedUser(user.id)}
                            className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-slate-50 transition-colors ${selectedUser === user.id ? 'bg-slate-100' : ''}`}
                        >
                            <img src={user.avatar} alt={user.name} className="w-12 h-12 rounded-full object-cover" />
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-baseline mb-1">
                                    <h3 className="font-semibold text-slate-900 truncate">{user.name}</h3>
                                    <span className={`text-xs ${user.unread > 0 ? 'text-green-500 font-bold' : 'text-slate-400'}`}>{user.time}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <p className="text-sm text-slate-500 truncate">{user.lastMessage}</p>
                                    {user.unread > 0 && (
                                        <div className="w-5 h-5 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                                            {user.unread}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col bg-[#efeae2] relative">
                {/* Chat Header */}
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center z-10">
                    <div className="flex items-center gap-4">
                        <img src={users[0].avatar} alt={users[0].name} className="w-10 h-10 rounded-full object-cover" />
                        <div>
                            <h3 className="font-bold text-slate-900">{users[0].name}</h3>
                            <p className="text-xs text-slate-500">Online</p>
                        </div>
                    </div>
                    <div className="flex gap-6 text-slate-500">
                        <Video className="w-6 h-6 cursor-pointer hover:text-slate-700" />
                        <Phone className="w-6 h-6 cursor-pointer hover:text-slate-700" />
                        <Search className="w-6 h-6 cursor-pointer hover:text-slate-700" />
                        <MoreVertical className="w-6 h-6 cursor-pointer hover:text-slate-700" />
                    </div>
                </div>

                {/* Messages Background Pattern Overlay */}
                <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")' }}></div>

                {/* Messages List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 z-0">
                    {messages.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[70%] rounded-lg p-3 relative shadow-sm ${msg.sender === 'me' ? 'bg-[#d9fdd3] rounded-tr-none' : 'bg-white rounded-tl-none'}`}>
                                <p className="text-slate-900 text-sm leading-relaxed mb-1">{msg.text}</p>
                                <div className="flex items-center justify-end gap-1">
                                    <span className="text-[10px] text-slate-500">{msg.time}</span>
                                    {msg.sender === 'me' && (
                                        <span className={msg.status === 'read' ? 'text-blue-500' : 'text-slate-400'}>
                                            <CheckCheck className="w-3 h-3" />
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Input Area */}
                <div className="p-3 bg-slate-50 border-t border-slate-200 z-10">
                    <div className="flex items-center gap-3">
                        <button className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
                            <MoreVertical className="w-6 h-6 rotate-90" />
                        </button>
                        <button className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
                            <Paperclip className="w-6 h-6" />
                        </button>
                        <input
                            type="text"
                            placeholder="Type a message"
                            className="flex-1 bg-white border-none focus:ring-1 focus:ring-slate-300 rounded-lg px-4 py-3 text-slate-900 placeholder:text-slate-400"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                        />
                        {message ? (
                            <button className="p-3 bg-green-500 hover:bg-green-600 text-white rounded-full transition-colors shadow-sm">
                                <Send className="w-5 h-5 ml-0.5" />
                            </button>
                        ) : (
                            <button className="p-3 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
                                <Mic className="w-6 h-6" />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
