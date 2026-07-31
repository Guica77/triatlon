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
    <div className="flex flex-col h-[300px] border border-border-default rounded-xl bg-surface-card overflow-hidden shadow-card">
      <div className="p-3 border-b border-border-subtle bg-surface-hover">
        <h4 className="text-xs font-bold uppercase tracking-wider text-text-secondary">Comentarios</h4>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {comments.length === 0 ? (
          <div className="h-full flex items-center justify-center text-center text-text-muted">
            <p className="text-xs font-medium">No hay comentarios en esta sesión.<br/>Escribe algo para empezar.</p>
          </div>
        ) : (
          comments.map(comment => {
            const isMe = comment.user_id === currentUserId;
            const isCoach = comment.profiles.role === 'coach';

            return (
              <div key={comment.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <span className="text-[9px] text-text-muted font-bold mb-1 ml-1 mr-1">
                  {comment.profiles.first_name} {isCoach ? '(Coach)' : ''} • {format(new Date(comment.created_at), 'HH:mm')}
                </span>
                <div
                  className={`px-3 py-2 rounded-2xl max-w-[85%] text-sm shadow-card ${
                    isMe
                      ? 'bg-swim text-white rounded-br-none'
                      : isCoach
                        ? 'bg-surface-hover text-text-primary rounded-bl-none border border-border-default'
                        : 'bg-surface-elevated text-text-primary rounded-bl-none'
                  }`}
                >
                  {comment.content}
                </div>
              </div>
            );
          })
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-3 bg-surface-hover border-t border-border-subtle flex gap-2 items-center">
        <input
          type="text"
          value={newComment}
          onChange={e => setNewComment(e.target.value)}
          placeholder="Añade un comentario..."
          className="flex-1 bg-surface-elevated border border-border-default rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-swim/20"
          disabled={isSubmitting}
        />
        <AnimatedButton
          type="submit"
          disabled={isSubmitting || !newComment.trim()}
          className="w-10 h-10 rounded-full !bg-swim !text-white flex items-center justify-center flex-shrink-0 disabled:opacity-50"
        >
          <Send className="w-4 h-4 ml-0.5" />
        </AnimatedButton>
      </form>
    </div>
  );
}
