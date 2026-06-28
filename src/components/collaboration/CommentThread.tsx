"use client";

import { useState } from "react";
import { format } from "date-fns";
import { api } from "@/lib/api/client";

interface Author {
  id: string;
  firstName: string;
  lastName: string;
  rank: string;
}

interface Comment {
  id: string;
  content: string;
  status: "OPEN" | "RESOLVED" | "ACKNOWLEDGED";
  sectionKey?: string | null;
  author: Author;
  replies?: Comment[];
  createdAt: string;
  resolvedAt?: string | null;
}

interface CommentThreadProps {
  evaluationId: string;
  comments: Comment[];
  currentUserId: string;
  onUpdate: () => void;
}

function CommentBubble({
  comment,
  currentUserId,
  evaluationId,
  onUpdate,
}: {
  comment: Comment;
  currentUserId: string;
  evaluationId: string;
  onUpdate: () => void;
}) {
  const [replyText, setReplyText] = useState("");
  const [showReply, setShowReply] = useState(false);
  const [loading, setLoading] = useState(false);

  const isOwn = comment.author.id === currentUserId;
  const isResolved = comment.status === "RESOLVED";

  async function submitReply() {
    if (!replyText.trim()) return;
    setLoading(true);
    try {
      await api.post(`/evaluations/${evaluationId}/comments`, {
        content: replyText,
        parentId: comment.id,
      });
      setReplyText("");
      setShowReply(false);
      onUpdate();
    } finally {
      setLoading(false);
    }
  }

  async function resolve() {
    setLoading(true);
    try {
      await api.patch(`/evaluations/${evaluationId}/comments/${comment.id}`, { status: "RESOLVED" });
      onUpdate();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={`rounded-sm border p-3 ${isResolved ? "opacity-60 border-border/50" : "border-border"}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <p className="text-xs font-medium text-muted-foreground mb-1">
            {comment.author.rank} {comment.author.lastName} · {format(new Date(comment.createdAt), "d MMM HH:mm")}
            {comment.sectionKey && <span className="ml-2 text-[10px] uppercase tracking-wide bg-muted px-1 rounded">{comment.sectionKey}</span>}
          </p>
          <p className="text-sm">{comment.content}</p>
        </div>
        {!isResolved && isOwn && (
          <button onClick={resolve} disabled={loading} className="text-[10px] text-green-700 hover:underline shrink-0">
            Resolve
          </button>
        )}
        {isResolved && <span className="text-[10px] text-green-600 shrink-0">✓ Resolved</span>}
      </div>

      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-2 ml-4 border-l-2 border-border pl-3 space-y-2">
          {comment.replies.map((r) => (
            <div key={r.id} className="text-sm">
              <p className="text-xs text-muted-foreground">
                {r.author.rank} {r.author.lastName} · {format(new Date(r.createdAt), "d MMM HH:mm")}
              </p>
              <p>{r.content}</p>
            </div>
          ))}
        </div>
      )}

      {!isResolved && (
        <div className="mt-2">
          {showReply ? (
            <div className="flex gap-2">
              <input
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Reply…"
                className="flex-1 rounded-sm border border-input bg-background px-2 py-1 text-sm"
              />
              <button
                onClick={submitReply}
                disabled={loading || !replyText.trim()}
                className="px-2 py-1 text-xs rounded-sm bg-primary text-primary-foreground disabled:opacity-50"
              >
                Send
              </button>
              <button onClick={() => setShowReply(false)} className="text-xs text-muted-foreground">Cancel</button>
            </div>
          ) : (
            <button onClick={() => setShowReply(true)} className="text-xs text-blue-600 hover:underline">
              Reply
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function CommentThread({ evaluationId, comments, currentUserId, onUpdate }: CommentThreadProps) {
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);

  async function submitComment() {
    if (!newComment.trim()) return;
    setLoading(true);
    try {
      await api.post(`/evaluations/${evaluationId}/comments`, { content: newComment });
      setNewComment("");
      onUpdate();
    } finally {
      setLoading(false);
    }
  }

  const open = comments.filter((c) => c.status !== "RESOLVED");
  const resolved = comments.filter((c) => c.status === "RESOLVED");

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {open.map((c) => (
          <CommentBubble
            key={c.id}
            comment={c}
            currentUserId={currentUserId}
            evaluationId={evaluationId}
            onUpdate={onUpdate}
          />
        ))}
        {open.length === 0 && (
          <p className="text-sm text-muted-foreground">No open comments.</p>
        )}
      </div>

      {resolved.length > 0 && (
        <details className="text-sm">
          <summary className="cursor-pointer text-muted-foreground text-xs">
            {resolved.length} resolved
          </summary>
          <div className="mt-2 space-y-2">
            {resolved.map((c) => (
              <CommentBubble
                key={c.id}
                comment={c}
                currentUserId={currentUserId}
                evaluationId={evaluationId}
                onUpdate={onUpdate}
              />
            ))}
          </div>
        </details>
      )}

      <div className="flex gap-2 pt-2 border-t border-border">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment or request informal review…"
          rows={2}
          className="flex-1 rounded-sm border border-input bg-background px-3 py-2 text-sm resize-none"
        />
        <button
          onClick={submitComment}
          disabled={loading || !newComment.trim()}
          className="self-end px-3 py-2 rounded-sm text-sm bg-primary text-primary-foreground disabled:opacity-50"
        >
          Comment
        </button>
      </div>
    </div>
  );
}
