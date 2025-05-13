'use client';

import { Note } from '@/types';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/Button';
import { sanitizeString } from '@/lib/security';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/Tooltip";

interface NoteCardProps {
  note: Note;
  onDelete: (id: string) => void;
}

export const NoteCard = ({ note, onDelete }: NoteCardProps) => {
  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this note?')) {
      onDelete(note.id);
    }
  };

  // Format the date for display
  const formattedDate = formatDistanceToNow(new Date(note.updated_at * 1000), {
    addSuffix: true,
  });

  // Determine if the content is short enough to display in the card
  const isShortContent = note.content.length < 300;

  // Determine sensitivity badge color based on score
  const getSensitivityColor = (score: number) => {
    if (score >= 70) return "bg-destructive/90 text-destructive-foreground";
    if (score >= 40) return "bg-warning/90 text-warning-foreground";
    return "bg-success/80 text-success-foreground";
  };

  // Get sensitivity badge text based on score
  const getSensitivityText = (score: number) => {
    if (score >= 70) return "High";
    if (score >= 40) return "Medium";
    return "Low";
  };

  // Get icon for sensitivity level
  const getSensitivityIcon = (score: number) => {
    if (score >= 70) {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      );
    } else if (score >= 40) {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    } else {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      );
    }
  };
  
  // Get sensitivity score safely
  const sensitivityScore = note.sensitivity?.sensitivity_score || 0;

  return (
    <Link href={`/notes/${note.id}`}>
      <div className="bg-gradient-to-br from-background via-background to-background/80 backdrop-blur-sm border border-border/50 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 h-full flex flex-col relative overflow-hidden group card-hover-effect">
        {/* Top indicator bar showing encryption/sensitivity status with gradient */}
        <div className={`h-1.5 w-full ${
          note.is_encrypted 
            ? 'bg-gradient-to-r from-primary to-primary/70' 
            : sensitivityScore >= 70 
            ? 'bg-gradient-to-r from-destructive to-destructive/80'
            : sensitivityScore >= 40
            ? 'bg-gradient-to-r from-warning to-warning/80'
            : 'bg-gradient-to-r from-success to-success/80'
        }`}></div>
        
        <div className="p-6 flex-1 flex flex-col">
          <div className="flex justify-between items-start mb-4">
            <div className="flex flex-col space-y-1">
              <h3 className="text-xl font-semibold text-foreground line-clamp-1 group-hover:text-gradient transition-all duration-300">
                {sanitizeString(note.title)}
              </h3>
            </div>
            
            {note.is_encrypted && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 backdrop-blur-sm text-primary border border-primary/30 shadow-sm">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-3.5 w-3.5 mr-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
                <span className="sr-only">Note is encrypted</span>
                Encrypted
              </span>
            )}
          </div>
          
          {/* Content preview */}
          <div className="flex-1 mt-2 text-sm text-muted-foreground overflow-hidden">
            {note.is_encrypted ? (
              <div className="flex items-center h-full py-4 px-4 rounded-lg bg-gradient-to-br from-primary/5 to-primary/15 border border-primary/20 backdrop-blur-sm">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-5 w-5 mr-3 text-primary" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" 
                  />
                </svg>
                <span>Content is encrypted and requires a password to view</span>
              </div>
            ) : (
              <p className={`line-clamp-${isShortContent ? '4' : '3'} leading-relaxed`}>
                {sanitizeString(note.content)}
              </p>
            )}
          </div>
          
          {/* Footer with date and actions */}
          <div className="mt-5 pt-4 border-t border-border/50 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1.5 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {formattedDate}
              </span>
              
              {/* Sensitivity score indicator */}
              {note.sensitivity && (
                <TooltipProvider delayDuration={100}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center cursor-pointer transition-transform hover:scale-105">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full inline-flex items-center shadow-sm ${getSensitivityColor(sensitivityScore)}`}>
                          {getSensitivityIcon(sensitivityScore)}
                          <span>{getSensitivityText(sensitivityScore)}</span>
                          <span className="ml-1 opacity-75 text-[10px]">{sensitivityScore}</span>
                        </span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent 
                      align="center"
                      side="top" 
                      alignOffset={0}
                      className="max-w-[280px] bg-background/95 backdrop-blur-md p-3 rounded-lg border border-border shadow-xl z-50"
                      sideOffset={10}
                      avoidCollisions={false}
                      collisionPadding={20}
                    >
                      <div className="space-y-2">
                        <p className="font-medium text-[10px] uppercase tracking-wider opacity-70 text-center">Sensitivity Analysis</p>
                        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${getSensitivityColor(sensitivityScore)}`} 
                            style={{ width: `${sensitivityScore}%` }}
                          />
                        </div>
                        <p className="text-[9px] text-foreground/90 leading-tight whitespace-normal break-words">{note.sensitivity.explanation}</p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            
            <div 
              onClick={(e) => e.stopPropagation()} 
              className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-1 group-hover:translate-y-0"
            >
              <Button 
                onClick={handleDelete} 
                variant="danger" 
                size="sm" 
                className="rounded-lg shadow-sm"
                aria-label="Delete note"
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-4 w-4 mr-1" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" 
                  />
                </svg>
                Delete
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}; 