import React from 'react';
import { X, Users, Image as ImageIcon, FileText, Link, Search } from 'lucide-react';
import { ParsedChat, Attachment } from '../../types/chat';

interface ConversationInfoProps {
  chat: ParsedChat;
  onClose: () => void;
  onJumpToMessage: (messageId: string) => void;
}

export function ConversationInfo({ chat, onClose, onJumpToMessage }: ConversationInfoProps) {
  // Aggregate media (images/videos)
  const mediaItems: Array<{ messageId: string; timestamp: string; attachment: Attachment }> = [];
  const docs: Array<{ messageId: string; timestamp: string; attachment: Attachment }> = [];
  
  chat.messages.forEach(msg => {
    if (msg.attachments && msg.attachments.length > 0) {
      msg.attachments.forEach(att => {
        if (att.type === 'image' || att.type === 'video') {
          mediaItems.push({ messageId: msg.id, timestamp: msg.timestamp, attachment: att });
        } else if (att.type === 'document' || att.type === 'audio') {
          docs.push({ messageId: msg.id, timestamp: msg.timestamp, attachment: att });
        }
      });
    }
  });

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-[#111b21] border-l border-slate-200 dark:border-[#222e35] w-80 shrink-0 shadow-xl overflow-hidden transition-colors">
      {/* Header */}
      <div className="flex items-center gap-3 h-[60px] px-4 border-b border-slate-200 dark:border-[#222e35] bg-white dark:bg-[#202c33] shrink-0">
        <button 
          onClick={onClose} 
          className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-[#2a3942] text-slate-600 dark:text-[#8696a0] hover:text-slate-900 dark:hover:text-[#e9edef] transition-colors"
          title="Close conversation info"
        >
          <X size={20} />
        </button>
        <h2 className="font-semibold text-slate-800 dark:text-[#e9edef]">Conversation Info</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        
        {/* Overview Card */}
        <div className="bg-white dark:bg-[#202c33] p-4 rounded-2xl shadow-xs border border-slate-100 dark:border-[#2a3942] flex flex-col items-center text-center">
           <div className="h-16 w-16 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center text-2xl font-bold mb-3">
             {chat.title ? chat.title.charAt(0).toUpperCase() : (chat.participants.length > 0 ? chat.participants[0].name.charAt(0).toUpperCase() : '?')}
           </div>
           <h3 className="text-lg font-semibold text-slate-900 dark:text-[#e9edef] break-words w-full px-2">
             {chat.title || 'WhatsApp Chat'}
           </h3>
           <p className="text-sm text-slate-500 dark:text-[#8696a0] mt-1">{chat.participants.length} Participants</p>
           
           <div className="flex gap-4 mt-4 w-full justify-center">
              <div className="flex flex-col items-center">
                 <span className="text-sm font-semibold text-slate-800 dark:text-[#e9edef]">{chat.messageCount.toLocaleString()}</span>
                 <span className="text-xs text-slate-500 dark:text-[#8696a0]">Messages</span>
              </div>
              <div className="flex flex-col items-center border-l border-r border-slate-100 dark:border-[#2a3942] px-4">
                 <span className="text-sm font-semibold text-slate-800 dark:text-[#e9edef]">{chat.mediaCount.toLocaleString()}</span>
                 <span className="text-xs text-slate-500 dark:text-[#8696a0]">Media</span>
              </div>
              <div className="flex flex-col items-center">
                 <span className="text-sm font-semibold text-slate-800 dark:text-[#e9edef]">{chat.links?.length || 0}</span>
                 <span className="text-xs text-slate-500 dark:text-[#8696a0]">Links</span>
              </div>
           </div>
        </div>

        {/* Participants */}
        <div>
          <div className="flex items-center gap-2 mb-2 px-1">
            <Users size={16} className="text-slate-500 dark:text-[#8696a0]" />
            <h4 className="text-sm font-semibold text-slate-700 dark:text-[#e9edef]">Participants</h4>
          </div>
          <div className="bg-white dark:bg-[#202c33] rounded-2xl shadow-xs border border-slate-100 dark:border-[#2a3942] divide-y divide-slate-100 dark:divide-[#2a3942] overflow-hidden">
             {chat.participants.map(p => (
               <div key={p.id} className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                     <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-[#111b21] text-slate-600 dark:text-[#e9edef] flex items-center justify-center text-xs font-bold shrink-0">
                       {p.name.charAt(0).toUpperCase()}
                     </div>
                     <span className="text-sm font-medium text-slate-800 dark:text-[#e9edef] truncate max-w-[120px]">{p.name}</span>
                  </div>
                  <span className="text-xs text-slate-400 dark:text-[#8696a0]">{p.messageCount.toLocaleString()} msgs</span>
               </div>
             ))}
          </div>
        </div>

        {/* Media Grid */}
        {mediaItems.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2 px-1">
              <div className="flex items-center gap-2">
                <ImageIcon size={16} className="text-slate-500 dark:text-[#8696a0]" />
                <h4 className="text-sm font-semibold text-slate-700 dark:text-[#e9edef]">Media</h4>
              </div>
              <span className="text-xs text-slate-400 dark:text-[#8696a0]">{mediaItems.length}</span>
            </div>
            <div className="bg-white dark:bg-[#202c33] rounded-2xl shadow-xs border border-slate-100 dark:border-[#2a3942] p-2">
               <div className="grid grid-cols-3 gap-1.5">
                 {mediaItems.slice(0, 9).map((item, idx) => {
                   const att = item.attachment;
                   return (
                    <div 
                      key={idx} 
                      className="aspect-square bg-slate-100 dark:bg-[#111b21] rounded-xl flex items-center justify-center cursor-pointer overflow-hidden group relative border border-slate-200/50 dark:border-transparent"
                      onClick={() => onJumpToMessage(item.messageId)}
                      title="View in conversation"
                    >
                       {att.mediaUrl ? (
                         att.type === 'video' ? (
                           <div className="w-full h-full bg-black relative flex items-center justify-center">
                              <span className="text-white text-[10px] font-medium z-10 bg-black/60 px-1.5 py-0.5 rounded">Video</span>
                           </div>
                         ) : (
                           <img src={att.mediaUrl} alt="" className="w-full h-full object-cover group-hover:opacity-80 transition-opacity" />
                         )
                       ) : (
                         <ImageIcon size={16} className="text-slate-400" />
                       )}
                       <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                         <Search size={16} className="text-white opacity-0 group-hover:opacity-100" />
                       </div>
                    </div>
                   );
                 })}
               </div>
               {mediaItems.length > 9 && (
                 <div className="text-center mt-2.5 pb-1">
                   <span className="text-xs text-slate-500 dark:text-[#8696a0] font-medium">+ {mediaItems.length - 9} more in chat</span>
                 </div>
               )}
            </div>
          </div>
        )}

        {/* Documents */}
        {docs.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2 px-1">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-slate-500 dark:text-[#8696a0]" />
                <h4 className="text-sm font-semibold text-slate-700 dark:text-[#e9edef]">Documents</h4>
              </div>
              <span className="text-xs text-slate-400 dark:text-[#8696a0]">{docs.length}</span>
            </div>
            <div className="bg-white dark:bg-[#202c33] rounded-2xl shadow-xs border border-slate-100 dark:border-[#2a3942] divide-y divide-slate-100 dark:divide-[#2a3942] max-h-64 overflow-y-auto overflow-hidden">
               {docs.map((item, idx) => {
                 const att = item.attachment;
                 return (
                   <div 
                     key={idx} 
                     className="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-[#2a3942]/60 cursor-pointer transition-colors"
                     onClick={() => onJumpToMessage(item.messageId)}
                   >
                     <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400">
                       <FileText size={20} />
                     </div>
                     <div className="min-w-0 flex-1">
                       <p className="truncate text-sm font-medium text-slate-800 dark:text-[#e9edef]">{att.fileName || 'Document'}</p>
                       <p className="text-xs text-slate-500 dark:text-[#8696a0]">
                         {att.mediaSize ? `${(att.mediaSize / 1024 / 1024).toFixed(2)} MB` : 'Unknown size'} • {new Date(item.timestamp).toLocaleDateString()}
                       </p>
                     </div>
                   </div>
                 );
               })}
            </div>
          </div>
        )}

        {/* Links */}
        {chat.links && chat.links.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2 px-1">
              <div className="flex items-center gap-2">
                <Link size={16} className="text-slate-500 dark:text-[#8696a0]" />
                <h4 className="text-sm font-semibold text-slate-700 dark:text-[#e9edef]">Links</h4>
              </div>
              <span className="text-xs text-slate-400 dark:text-[#8696a0]">{chat.links.length}</span>
            </div>
            <div className="bg-white dark:bg-[#202c33] rounded-2xl shadow-xs border border-slate-100 dark:border-[#2a3942] divide-y divide-slate-100 dark:divide-[#2a3942] max-h-64 overflow-y-auto overflow-hidden">
               {chat.links.map((link, idx) => (
                 <div key={idx} className="p-3 flex flex-col gap-1 hover:bg-slate-50 dark:hover:bg-[#2a3942]/60 transition-colors group">
                    <a 
                      href={link.url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline truncate"
                    >
                      {link.url}
                    </a>
                    <p className="text-[10px] text-slate-500 dark:text-[#8696a0] italic line-clamp-1">{link.textContext}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[9px] text-slate-400 dark:text-[#8696a0] font-medium uppercase">{link.senderName || 'System'}</span>
                      <button 
                        onClick={() => onJumpToMessage(link.messageId)}
                        className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        Jump to message
                      </button>
                    </div>
                 </div>
               ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
