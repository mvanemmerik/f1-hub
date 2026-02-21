// ─────────────────────────────────────────────────────────────────────────────
// CommentSection.jsx  —  Real-time comments for a race
//
// LESSON: This component demonstrates Firestore's real-time capability.
// We use onSnapshot (via subscribeToComments) so new comments from ANY user
// appear instantly without refreshing the page.
//
// The useEffect cleanup is critical — when the component unmounts (user
// navigates away), we call the unsubscribe function to stop the listener
// and avoid memory leaks / unnecessary reads.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { subscribeToComments, addComment } from '../firebase/firestore';
import { signInWithGoogle } from '../firebase/auth';

export default function CommentSection({ raceId }) {
  const { user }              = useAuth();
  const [comments, setComments] = useState([]);
  const [text, setText]         = useState('');
  const [posting, setPosting]   = useState(false);
  const bottomRef               = useRef(null);

  // Subscribe to real-time comments for this race
  useEffect(() => {
    // subscribeToComments returns an unsubscribe fn — return it for cleanup
    const unsubscribe = subscribeToComments(raceId, setComments);
    return unsubscribe;
  }, [raceId]);

  // Auto-scroll to bottom when new comments arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!text.trim() || !user) return;
    setPosting(true);
    try {
      await addComment(raceId, user.uid, user.displayName, user.photoURL, text.trim());
      setText('');
    } finally {
      setPosting(false);
    }
  }

  function formatTime(timestamp) {
    if (!timestamp) return '';
    return new Date(timestamp.seconds * 1000).toLocaleString();
  }

  return (
    <div className="comment-section">
      <h3 className="section-title">Fan Comments</h3>

      {/* Comment list */}
      <div className="comment-list">
        {comments.length === 0 && (
          <p className="empty-state">No comments yet. Be the first!</p>
        )}
        {comments.map(c => (
          <div key={c.id} className="comment">
            <img src={c.photoURL} alt={c.displayName} className="avatar-sm" />
            <div className="comment-body">
              <div className="comment-header">
                <span className="comment-author">{c.displayName}</span>
                <span className="comment-time">{formatTime(c.createdAt)}</span>
              </div>
              <p className="comment-text">{c.text}</p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Post comment form */}
      {user ? (
        <form onSubmit={handleSubmit} className="comment-form">
          <img src={user.photoURL} alt={user.displayName} className="avatar-sm" />
          <input
            type="text"
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Share your thoughts on this race..."
            className="comment-input"
            maxLength={500}
          />
          <button
            type="submit"
            className="btn-primary"
            disabled={posting || !text.trim()}
          >
            {posting ? 'Posting...' : 'Post'}
          </button>
        </form>
      ) : (
        <div className="comment-signin">
          <p>Sign in to join the conversation</p>
          <button className="btn-primary" onClick={signInWithGoogle}>
            Sign in with Google
          </button>
        </div>
      )}
    </div>
  );
}
