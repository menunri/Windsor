import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MessageSquare, Loader2, Send, ArrowLeft, UserPlus } from 'lucide-react';
import { PageLoader } from '../components/LoadingSpinner';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import api from '../services/api';

export default function PostsPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newPostContent, setNewPostContent] = useState('');
  const [creating, setCreating] = useState(false);
  const [expandedPost, setExpandedPost] = useState(null);
  const [postComments, setPostComments] = useState({});
  const [newComment, setNewComment] = useState({});
  const [addingComment, setAddingComment] = useState({});
  const { user } = useAuth();
  const navigate = useNavigate();
  const { success, error: showError } = useToast();

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await api.get('/posts');
      if (response.data.success) {
        setPosts(response.data.data.posts);
      }
    } catch (error) {
      console.error('Failed to fetch posts:', error);
      showError('Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;

    setCreating(true);
    try {
      const response = await api.post('/posts', { content: newPostContent });
      if (response.data.success) {
        setPosts([response.data.data, ...posts]);
        setNewPostContent('');
        success('Post created');
      }
    } catch (error) {
      showError('Failed to create post');
    } finally {
      setCreating(false);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      await api.delete(`/posts/${postId}`);
      setPosts(posts.filter(p => p.id !== postId));
      success('Post deleted');
    } catch (error) {
      showError('Failed to delete post');
    }
  };

  const fetchPostComments = async (postId) => {
    if (postComments[postId]) return;

    try {
      const response = await api.get(`/posts/${postId}`);
      if (response.data.success) {
        setPostComments(prev => ({ ...prev, [postId]: response.data.data.comments || [] }));
      }
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    }
  };

  const togglePost = async (postId) => {
    if (expandedPost === postId) {
      setExpandedPost(null);
    } else {
      setExpandedPost(postId);
      await fetchPostComments(postId);
    }
  };

  const handleAddComment = async (e, postId) => {
    e.preventDefault();
    const content = newComment[postId];
    if (!content?.trim()) return;

    setAddingComment(prev => ({ ...prev, [postId]: true }));
    try {
      const response = await api.post('/comments', { postId, content });
      if (response.data.success) {
        setPostComments(prev => ({
          ...prev,
          [postId]: [...(prev[postId] || []), response.data.data]
        }));
        setNewComment(prev => ({ ...prev, [postId]: '' }));
        // Update comment count on post
        setPosts(posts.map(p => 
          p.id === postId ? { ...p, commentCount: p.commentCount + 1 } : p
        ));
        success('Comment added');
      }
    } catch (error) {
      showError('Failed to add comment');
    } finally {
      setAddingComment(prev => ({ ...prev, [postId]: false }));
    }
  };

  const handleDeleteComment = async (commentId, postId) => {
    if (!confirm('Delete this comment?')) return;

    try {
      await api.delete(`/comments/${commentId}`);
      setPostComments(prev => ({
        ...prev,
        [postId]: prev[postId].filter(c => c.id !== commentId)
      }));
      // Update comment count on post
      setPosts(posts.map(p => 
        p.id === postId ? { ...p, commentCount: Math.max(0, p.commentCount - 1) } : p
      ));
      success('Comment deleted');
    } catch (error) {
      showError('Failed to delete comment');
    }
  };

  const handleMessageUser = async (authorId, authorName) => {
    if (!user) {
      navigate('/login')
      return
    }

    if (authorId === user.id) {
      showError('You cannot message yourself')
      return
    }

    try {
      const response = await api.post('/threads', {
        recipientId: authorId,
        initialMessage: `Hi ${authorName}, I saw your post on Windsor and wanted to connect.`
      })
      if (response.data.success) {
        navigate(`/threads/${response.data.data.threadId}`)
      }
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to start conversation')
    }
  }

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-neutral-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-neutral-900">Posts</h1>
          <p className="text-neutral-500">Community discussions</p>
        </div>

        {/* Create Post Form */}
        <form onSubmit={handleCreatePost} className="mb-6">
          <div className="bg-white rounded-xl shadow-card p-4">
            <textarea
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              placeholder="What's on your mind?"
              className="w-full p-3 border border-neutral-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
              rows="3"
            />
            <div className="flex justify-end mt-3">
              <button
                type="submit"
                disabled={creating || !newPostContent.trim()}
                className="btn btn-primary flex items-center gap-2"
              >
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Post
              </button>
            </div>
          </div>
        </form>

        {/* Posts List */}
        {loading ? (
          <PageLoader />
        ) : posts.length > 0 ? (
          <div className="space-y-4">
            {posts.map((post) => (
              <div key={post.id} className="bg-white rounded-xl shadow-card p-4">
                {/* Post Header */}
                <div className="flex items-start gap-3 mb-3">
                  <div className="avatar avatar-md bg-primary-100 text-primary-700">
                    {post.author?.firstName?.[0]}{post.author?.lastName?.[0]}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-neutral-900">
                          {post.author?.firstName} {post.author?.lastName}
                        </h3>
                        {user?.id !== post.author?.id && (
                          <button
                            onClick={() => handleMessageUser(post.author?.id, `${post.author?.firstName} ${post.author?.lastName}`)}
                            className="p-1 hover:bg-primary-50 rounded-full transition-colors"
                            title="Message this user"
                          >
                            <MessageSquare className="w-4 h-4 text-primary-600" />
                          </button>
                        )}
                      </div>
                      <span className="text-xs text-neutral-400">
                        {formatTime(post.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Post Content */}
                <p className="text-neutral-800 whitespace-pre-wrap mb-4">{post.content}</p>

                {/* Post Actions */}
                <div className="flex items-center gap-4 border-t border-neutral-100 pt-3">
                  <button
                    onClick={() => togglePost(post.id)}
                    className="flex items-center gap-2 text-sm text-neutral-500 hover:text-primary-600 transition-colors"
                  >
                    <MessageSquare className="w-4 h-4" />
                    {post.commentCount || 0} comments
                  </button>
                  {user?.id === post.author?.id && (
                    <button
                      onClick={() => handleDeletePost(post.id)}
                      className="text-sm text-neutral-400 hover:text-red-500 transition-colors"
                    >
                      Delete
                    </button>
                  )}
                </div>

                {/* Expanded Comments Section */}
                {expandedPost === post.id && (
                  <div className="mt-4 border-t border-neutral-100 pt-4">
                    {/* Comments List */}
                    {(postComments[post.id] || []).length > 0 ? (
                      <div className="space-y-3 mb-4">
                        {postComments[post.id].map((comment) => (
                          <div key={comment.id} className="flex gap-3 pl-4 border-l-2 border-neutral-100">
                            <div className="avatar avatar-sm bg-neutral-100 text-neutral-600">
                              {comment.author?.firstName?.[0]}{comment.author?.lastName?.[0]}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm text-neutral-900">
                                  {comment.author?.firstName} {comment.author?.lastName}
                                </span>
                                <span className="text-xs text-neutral-400">
                                  {formatTime(comment.createdAt)}
                                </span>
                              </div>
                              <p className="text-sm text-neutral-700">{comment.content}</p>
                              {user?.id === comment.author?.id && (
                                <button
                                  onClick={() => handleDeleteComment(comment.id, post.id)}
                                  className="text-xs text-neutral-400 hover:text-red-500 mt-1"
                                >
                                  Delete
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-neutral-400 mb-4">No comments yet. Be the first!</p>
                    )}

                    {/* Add Comment Form */}
                    <form onSubmit={(e) => handleAddComment(e, post.id)} className="flex gap-3">
                      <input
                        type="text"
                        value={newComment[post.id] || ''}
                        onChange={(e) => setNewComment(prev => ({ ...prev, [post.id]: e.target.value }))}
                        placeholder="Write a comment..."
                        className="flex-1 input input-sm"
                      />
                      <button
                        type="submit"
                        disabled={addingComment[post.id] || !newComment[post.id]?.trim()}
                        className="btn btn-primary btn-sm"
                      >
                        {addingComment[post.id] ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      </button>
                    </form>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-xl">
            <div className="w-16 h-16 mx-auto mb-4 bg-neutral-100 rounded-full flex items-center justify-center">
              <MessageSquare className="w-8 h-8 text-neutral-400" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">
              No posts yet
            </h3>
            <p className="text-neutral-500">
              Be the first to start a discussion!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}