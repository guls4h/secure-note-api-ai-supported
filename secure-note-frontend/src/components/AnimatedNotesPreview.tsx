'use client';

import { useState, useEffect } from 'react';

// Sample generic notes data with titles and content
const SAMPLE_NOTES = [
  {
    title: 'Weekly Team Meeting Notes',
    content: 'Discussed project timeline, assigned new tasks to team members, and reviewed client feedback. Key action items: Update roadmap by Friday, schedule follow-up call with client, and prepare demo for next sprint review.'
  },
  {
    title: 'Travel Planning Checklist',
    content: 'Flight booked for June 15th, hotel reservation confirmed for 5 nights. Need to: purchase travel insurance, exchange currency, pack camera equipment, and print all important documents. Remember to notify bank about international travel.'
  },
  {
    title: 'Recipe: Homemade Pasta',
    content: '2 cups flour, 3 eggs, pinch of salt. Mix ingredients, knead for 10 minutes, rest for 30 minutes. Roll thin, cut into desired shape. Cook in salted water for 2-3 minutes. Serve with favorite sauce and fresh herbs.'
  },
  {
    title: 'Book Recommendations',
    content: 'Fiction: "The Midnight Library" by Matt Haig, "Project Hail Mary" by Andy Weir. Non-fiction: "Atomic Habits" by James Clear, "Thinking, Fast and Slow" by Daniel Kahneman. Ask Sarah for her recommendations on historical fiction.'
  },
  {
    title: 'Workout Routine',
    content: 'Monday: Upper body (bench press, rows, shoulder press), Wednesday: Lower body (squats, lunges, deadlifts), Friday: Full body HIIT. Aim for 20 minutes of cardio on off days. Remember to stretch after each session.'
  }
];

const AnimatedNotesPreview = () => {
  const [activeNoteIndex, setActiveNoteIndex] = useState(0);
  const [displayedTitle, setDisplayedTitle] = useState('');
  const [displayedContent, setDisplayedContent] = useState('');
  const [isTypingTitle, setIsTypingTitle] = useState(true);
  const [isTypingContent, setIsTypingContent] = useState(false);
  const [cursorVisible, setCursorVisible] = useState(true);

  // Function to animate typing of title and content
  useEffect(() => {
    // Blink cursor
    const cursorInterval = setInterval(() => {
      setCursorVisible(prev => !prev);
    }, 530);

    return () => clearInterval(cursorInterval);
  }, []);

  // Title typing animation
  useEffect(() => {
    if (!isTypingTitle) return;
    
    const currentNote = SAMPLE_NOTES[activeNoteIndex];
    
    if (displayedTitle.length < currentNote.title.length) {
      const timeout = setTimeout(() => {
        setDisplayedTitle(currentNote.title.slice(0, displayedTitle.length + 1));
      }, 100 + Math.random() * 50); // Randomize typing speed slightly
      
      return () => clearTimeout(timeout);
    } else {
      setIsTypingTitle(false);
      setIsTypingContent(true);
    }
  }, [displayedTitle, isTypingTitle, activeNoteIndex]);

  // Content typing animation
  useEffect(() => {
    if (!isTypingContent) return;
    
    const currentNote = SAMPLE_NOTES[activeNoteIndex];
    
    if (displayedContent.length < currentNote.content.length) {
      const timeout = setTimeout(() => {
        setDisplayedContent(currentNote.content.slice(0, displayedContent.length + 1));
      }, 30 + Math.random() * 40); // Faster typing for content
      
      return () => clearTimeout(timeout);
    } else {
      // Pause before starting the next note
      const pauseTimeout = setTimeout(() => {
        // Move to next note
        const nextIndex = (activeNoteIndex + 1) % SAMPLE_NOTES.length;
        setActiveNoteIndex(nextIndex);
        setDisplayedTitle('');
        setDisplayedContent('');
        setIsTypingTitle(true);
        setIsTypingContent(false);
      }, 5000); // Pause 5 seconds when done typing
      
      return () => clearTimeout(pauseTimeout);
    }
  }, [displayedContent, isTypingContent, activeNoteIndex]);

  return (
    <div className="h-[300px] md:h-[400px] w-full rounded-lg p-4 flex flex-col bg-gradient-to-br from-accent/80 to-accent/30 overflow-hidden">
      <div className="mb-4 flex items-center justify-between border-b border-border/30 pb-3">
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-primary/80 mr-2"></div>
          <span className="font-medium text-accent-foreground">
            {displayedTitle}{isTypingTitle && cursorVisible ? '|' : ''}
          </span>
        </div>
        <div className="flex space-x-2">
          <div className="w-6 h-6 rounded-full bg-accent/40 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-foreground/70" viewBox="0 0 20 20" fill="currentColor">
              <path d="M5 8h10a1 1 0 100-2H5a1 1 0 000 2zm10 2H5a1 1 0 000 2h10a1 1 0 100-2zm-6 4H5a1 1 0 000 2h4a1 1 0 100-2z" />
            </svg>
          </div>
          <div className="w-6 h-6 rounded-full bg-accent/40 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-foreground/70" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 5a2 2 0 012-2h8a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm2-2h8a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V5a2 2 0 012-2z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto font-normal text-accent-foreground/90 leading-relaxed">
        <p>
          {displayedContent}{isTypingContent && cursorVisible ? '|' : ''}
        </p>
      </div>
      
      <div className="mt-auto pt-3 border-t border-border/30 flex justify-between items-center">
        <div className="flex items-center text-xs text-accent-foreground/70">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          End-to-end encrypted
        </div>
        <div className="text-xs text-accent-foreground/70">
          Last edited just now
        </div>
      </div>
    </div>
  );
};

export default AnimatedNotesPreview; 