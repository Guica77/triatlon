'use client';

import * as React from 'react';
import { Send, User } from 'lucide-react';
import { AnimatedButton } from '@/components/ui/animated-button';
import { addWorkoutComment } from '@/app/(app)/coach/athlete/[id]/actions'; // We will add this server action
import { format } from 'date-fns';

export interface WorkoutComment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles: {
    first_name: string;
    last_name: string;
    role: string;
  };
}

interface WorkoutCommentsProps {
  workoutId: string;
  athleteId: string;
  currentUserId: string;
  initialComments: WorkoutComment[];
}

export function WorkoutComments({ workoutId, athleteId, currentUserId, initialComments }: WorkoutCommentsProps) {
  const [comments, setComments] = React.useState<WorkoutComment[]>(initialComments);
  const [newComment, setNewComment] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await addWorkoutComment(workoutId, athleteId, newComment);
      if (res.data) {
        setComments([...comments, res.data]);
        setNewComment('');
      } else if (res.error) {
        alert(res.error);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-[300px] border border-zinc-200 rounded-xl bg-white overflow-hidden shadow-sm">
      <div className="p-3 border-b border-zinc-100 bg-zinc-50">
        <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Comentarios</h4>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {comments.length === 0 ? (
          <div className="h-full flex items-center justify-center text-center text-zinc-400">
            <p className="text-xs font-medium">No hay comentarios en esta sesión.<br/>Escribe algo para empezar.</p>
          </div>
        ) : (
          comments.map(comment => {
            const isMe = comment.user_id === currentUserId;
            const isCoach = comment.profiles.role === 'coach';
            
            return (
              <div key={comment.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <span className="text-[9px] text-zinc-400 font-bold mb-1 ml-1 mr-1">
                  {comment.profiles.first_name} {isCoach ? '(Coach)' : ''} • {format(new Date(comment.created_at), 'HH:mm')}
                </span>
                <div 
                  className={`px-3 py-2 rounded-2xl max-w-[85%] text-sm shadow-sm ${
                    isMe 
                      ? 'bg-cyan-600 text-white rounded-br-none' 
                      : isCoach
                        ? 'bg-zinc-100 text-zinc-800 rounded-bl-none border border-zinc-200'
                        : 'bg-zinc-800 text-white rounded-bl-none'
                  }`}
                >
                  {comment.content}
                </div>
              </div>
            );
          })
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-3 bg-zinc-50 border-t border-zinc-100 flex gap-2 items-center">
        <input 
          type="text" 
          value={newComment}
          onChange={e => setNewComment(e.target.value)}
          placeholder="Añade un comentario..."
          className="flex-1 bg-white border border-zinc-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
          disabled={isSubmitting}
        />
        <AnimatedButton 
          type="submit"
          disabled={isSubmitting || !newComment.trim()}
          className="w-10 h-10 rounded-full !bg-cyan-600 !text-white flex items-center justify-center flex-shrink-0 disabled:opacity-50"
        >
          <Send className="w-4 h-4 ml-0.5" />
        </AnimatedButton>
      </form>
    </div>
  );
}
