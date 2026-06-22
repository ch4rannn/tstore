import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Send, Image, Paperclip, ArrowLeft, Check, CheckCheck } from 'lucide-react';
import { useGetChatsQuery, useGetChatMessagesQuery, useSendMessageMutation } from '../../services/api';
import { timeAgo } from '../../constants';
import { Link } from 'react-router-dom';

export default function ChatPage() {
  const { chatId } = useParams();
  const { user } = useSelector((s) => s.auth);
  const { data: chatsData } = useGetChatsQuery();
  const chats = chatsData?.chats || [];

  return (
    <div className="max-w-7xl mx-auto animate-fadeIn" style={{ height: 'calc(100vh - 64px - 64px)' }}>
      <div className="flex h-full bg-white rounded-t-2xl overflow-hidden shadow-sm mx-4 mt-4">
        {/* Left Panel — Chat List */}
        <div className={`${chatId ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-80 lg:w-96 border-r border-[var(--color-border-light)]`}>
          <div className="p-4 border-b border-[var(--color-border-light)]">
            <h2 className="text-lg font-bold">Messages</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {chats.length === 0 ? (
              <div className="text-center py-20 px-4">
                <p className="text-4xl mb-3">💬</p>
                <p className="text-sm text-[var(--color-text-muted)]">No messages yet</p>
                <p className="text-xs text-[var(--color-text-muted)] mt-1">Start a conversation from a product page</p>
              </div>
            ) : (
              chats.map((chat) => (
                <Link
                  key={chat.id}
                  to={`/chat/${chat.id}`}
                  className={`flex items-center gap-3 px-4 py-3 border-b border-[var(--color-border-light)] hover:bg-[var(--color-bg)] transition-colors ${chatId === chat.id ? 'bg-[var(--color-primary)]/5 border-l-2 border-l-[var(--color-primary)]' : ''}`}
                >
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-light)] flex items-center justify-center text-white font-semibold shrink-0">
                    {chat.other_name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm truncate">{chat.other_name}</span>
                      <span className="text-[10px] text-[var(--color-text-muted)] shrink-0">{chat.last_message_at ? timeAgo(chat.last_message_at) : ''}</span>
                    </div>
                    <p className="text-xs text-[var(--color-text-muted)] truncate">{chat.last_message || 'Start chatting...'}</p>
                    {chat.product_title && (
                      <span className="text-[10px] text-[var(--color-primary)] bg-[var(--color-primary)]/5 px-2 py-0.5 rounded mt-0.5 inline-block truncate max-w-full">{chat.product_title}</span>
                    )}
                  </div>
                  {chat.unread_count > 0 && (
                    <span className="w-5 h-5 rounded-full bg-[var(--color-primary)] text-white text-[10px] flex items-center justify-center font-bold shrink-0">{chat.unread_count}</span>
                  )}
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Right Panel — Messages */}
        <div className={`${chatId ? 'flex' : 'hidden md:flex'} flex-col flex-1`}>
          {chatId ? (
            <ChatThread chatId={chatId} userId={user?.id} chats={chats} />
          ) : (
            <div className="flex-1 flex items-center justify-center text-center px-4">
              <div>
                <p className="text-5xl mb-4">💬</p>
                <h3 className="text-lg font-bold mb-2">Select a conversation</h3>
                <p className="text-sm text-[var(--color-text-muted)]">Choose a chat from the left to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ChatThread({ chatId, userId, chats }) {
  const { data, isLoading } = useGetChatMessagesQuery({ chatId });
  const [sendMessage, { isLoading: sending }] = useSendMessageMutation();
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);
  const chat = chats.find((c) => c.id === chatId);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [data?.messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    try {
      await sendMessage({ chatId, content: newMessage.trim() }).unwrap();
      setNewMessage('');
    } catch {}
  };

  const messages = data?.messages || [];

  return (
    <>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--color-border-light)]">
        <Link to="/chat" className="md:hidden">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-light)] flex items-center justify-center text-white font-semibold text-sm">
          {chat?.other_name?.charAt(0)?.toUpperCase() || '?'}
        </div>
        <div>
          <p className="font-semibold text-sm">{chat?.other_name || 'Chat'}</p>
          {chat?.product_title && <p className="text-[10px] text-[var(--color-text-muted)]">Re: {chat.product_title}</p>}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-10"><div className="spinner-dark" style={{ width: 24, height: 24 }} /></div>
        ) : messages.length === 0 ? (
          <div className="text-center py-10 text-sm text-[var(--color-text-muted)]">No messages yet. Say hello! 👋</div>
        ) : (
          messages.map((msg) => {
            const isMine = msg.sender_id === userId;
            return (
              <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${isMine ? 'bg-[var(--color-primary)] text-white rounded-br-md' : 'bg-[var(--color-bg)] text-[var(--color-text)] rounded-bl-md'}`}>
                  {msg.type === 'image' && msg.media_url && (
                    <img src={msg.media_url} alt="" className="rounded-lg mb-2 max-w-full" />
                  )}
                  {msg.content && <p className="whitespace-pre-wrap">{msg.content}</p>}
                  <div className={`flex items-center gap-1 mt-1 ${isMine ? 'justify-end' : ''}`}>
                    <span className={`text-[10px] ${isMine ? 'text-white/60' : 'text-[var(--color-text-muted)]'}`}>{timeAgo(msg.created_at)}</span>
                    {isMine && (
                      msg.status === 'read' ? <CheckCheck className="w-3 h-3 text-blue-300" />
                      : msg.status === 'delivered' ? <CheckCheck className="w-3 h-3 text-white/60" />
                      : <Check className="w-3 h-3 text-white/60" />
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form onSubmit={handleSend} className="flex items-center gap-2 px-4 py-3 border-t border-[var(--color-border-light)]">
        <button type="button" className="btn-ghost btn-icon shrink-0">
          <Paperclip className="w-5 h-5" />
        </button>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="input py-2.5 bg-[var(--color-bg)] border-transparent flex-1"
        />
        <button type="submit" disabled={!newMessage.trim() || sending} className="btn-primary btn-icon shrink-0 rounded-xl">
          <Send className="w-4 h-4" />
        </button>
      </form>
    </>
  );
}
