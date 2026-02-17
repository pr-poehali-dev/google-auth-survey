import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import Icon from "@/components/ui/icon";
import API from "@/config/api";

interface User {
  id: number;
  name: string;
  avatar: string;
  email: string;
}

interface Author {
  id: number;
  name: string;
  avatar: string;
}

interface Answer {
  id: number;
  author: Author;
  body: string;
  votes: number;
  user_vote: number;
  created_at: string;
}

interface Question {
  id: number;
  author: Author;
  title: string;
  body: string;
  votes: number;
  user_vote: number;
  answers?: Answer[];
  answer_count?: number;
  tags: string[];
  created_at: string;
}

const formatTime = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "только что";
  if (mins < 60) return `${mins} мин. назад`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} ч. назад`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} дн. назад`;
  return new Date(iso).toLocaleDateString("ru");
};

const GoogleIcon = ({ className = "" }: { className?: string }) => (
  <svg className={`w-5 h-5 ${className}`} viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

const VoteButtons = ({
  votes, userVote, onVoteUp, onVoteDown, size = "md",
}: {
  votes: number; userVote: number; onVoteUp: () => void; onVoteDown: () => void; size?: "md" | "lg";
}) => {
  const iconSize = size === "lg" ? 22 : 20;
  const textSize = size === "lg" ? "text-2xl" : "text-lg";
  const padding = size === "lg" ? "p-1.5" : "p-1";
  return (
    <div className="flex flex-col items-center gap-1 pt-1">
      <button
        className={`${padding} rounded-lg transition-colors ${userVote === 1 ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-primary hover:bg-primary/5"}`}
        onClick={(e) => { e.stopPropagation(); onVoteUp(); }}
      >
        <Icon name="ChevronUp" size={iconSize} />
      </button>
      <span className={`${textSize} font-bold ${votes > 0 ? "text-primary" : votes < 0 ? "text-accent" : "text-muted-foreground"}`}>
        {votes}
      </span>
      <button
        className={`${padding} rounded-lg transition-colors ${userVote === -1 ? "text-accent bg-accent/10" : "text-muted-foreground hover:text-accent hover:bg-accent/5"}`}
        onClick={(e) => { e.stopPropagation(); onVoteDown(); }}
      >
        <Icon name="ChevronDown" size={iconSize} />
      </button>
    </div>
  );
};

const Index = () => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem("askvote_user");
    return saved ? JSON.parse(saved) : null;
  });
  const [questions, setQuestions] = useState<Question[]>([]);
  const [openQuestion, setOpenQuestion] = useState<Question | null>(null);
  const [newAnswer, setNewAnswer] = useState("");
  const [newQuestionTitle, setNewQuestionTitle] = useState("");
  const [newQuestionText, setNewQuestionText] = useState("");
  const [newQuestionTags, setNewQuestionTags] = useState("");
  const [askDialogOpen, setAskDialogOpen] = useState(false);
  const [sortBy, setSortBy] = useState<"votes" | "new">("votes");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const loadQuestions = useCallback(async () => {
    try {
      const uid = user?.id || "";
      const res = await fetch(`${API.questions}?sort=${sortBy}&user_id=${uid}`);
      const data = await res.json();
      setQuestions(data.questions || []);
    } catch (e) {
      console.error("Failed to load questions", e);
    } finally {
      setLoading(false);
    }
  }, [sortBy, user?.id]);

  const loadQuestion = useCallback(async (id: number) => {
    try {
      const uid = user?.id || "";
      const res = await fetch(`${API.questions}?id=${id}&user_id=${uid}`);
      const data = await res.json();
      setOpenQuestion(data.question || null);
    } catch (e) {
      console.error("Failed to load question", e);
    }
  }, [user?.id]);

  useEffect(() => { loadQuestions(); }, [loadQuestions]);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    document.head.appendChild(script);
    return () => { document.head.removeChild(script); };
  }, []);

  const handleGoogleLogin = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    if (!w.google) {
      console.error("Google SDK not loaded");
      return;
    }
    w.google.accounts.id.initialize({
      client_id: localStorage.getItem("google_client_id") || "",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      callback: async (response: any) => {
        try {
          const res = await fetch(API.googleAuth, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token: response.credential }),
          });
          const data = await res.json();
          if (data.user) {
            setUser(data.user);
            localStorage.setItem("askvote_user", JSON.stringify(data.user));
          }
        } catch (e) {
          console.error("Auth failed", e);
        }
      },
    });
    w.google.accounts.id.prompt();
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("askvote_user");
  };

  const handleVote = async (targetType: "question" | "answer", targetId: number, value: 1 | -1) => {
    if (!user) return;
    try {
      const res = await fetch(API.votes, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id, target_type: targetType, target_id: targetId, value }),
      });
      const data = await res.json();

      if (openQuestion) {
        if (targetType === "question" && targetId === openQuestion.id) {
          setOpenQuestion((prev) => prev ? { ...prev, votes: data.total_votes, user_vote: data.user_vote } : null);
        } else if (targetType === "answer") {
          setOpenQuestion((prev) => prev ? {
            ...prev,
            answers: prev.answers?.map((a) => a.id === targetId ? { ...a, votes: data.total_votes, user_vote: data.user_vote } : a),
          } : null);
        }
      }

      setQuestions((prev) =>
        prev.map((q) => q.id === targetId && targetType === "question" ? { ...q, votes: data.total_votes, user_vote: data.user_vote } : q)
      );
    } catch (e) {
      console.error("Vote failed", e);
    }
  };

  const handleAddAnswer = async () => {
    if (!user || !newAnswer.trim() || !openQuestion || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch(API.answers, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id, question_id: openQuestion.id, body: newAnswer }),
      });
      const data = await res.json();
      if (data.answer) {
        setOpenQuestion((prev) => prev ? { ...prev, answers: [...(prev.answers || []), data.answer] } : null);
        setNewAnswer("");
      }
    } catch (e) {
      console.error("Add answer failed", e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddQuestion = async () => {
    if (!user || !newQuestionTitle.trim() || submitting) return;
    setSubmitting(true);
    const tags = newQuestionTags.split(",").map((t) => t.trim()).filter(Boolean);
    try {
      const res = await fetch(API.questions, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id, title: newQuestionTitle, body: newQuestionText, tags: tags.length ? tags : ["общее"] }),
      });
      if (res.ok) {
        setNewQuestionTitle("");
        setNewQuestionText("");
        setNewQuestionTags("");
        setAskDialogOpen(false);
        loadQuestions();
      }
    } catch (e) {
      console.error("Add question failed", e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 glass border-b">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <button className="flex items-center gap-2" onClick={() => { setOpenQuestion(null); loadQuestions(); }}>
            <div className="w-9 h-9 rounded-xl gradient-bg flex items-center justify-center">
              <Icon name="MessageCircleQuestion" size={20} className="text-white" />
            </div>
            <span className="text-xl font-bold gradient-text">AskVote</span>
          </button>

          {user ? (
            <div className="flex items-center gap-3">
              <Dialog open={askDialogOpen} onOpenChange={setAskDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gradient-bg text-white border-0 font-semibold rounded-xl hover:opacity-90 transition-opacity">
                    <Icon name="Plus" size={18} className="mr-1.5" />
                    Задать вопрос
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg rounded-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-bold">Новый вопрос</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-2">
                    <Input placeholder="Заголовок вопроса" value={newQuestionTitle} onChange={(e) => setNewQuestionTitle(e.target.value)} className="rounded-xl border-border/60 focus:border-primary" />
                    <Textarea placeholder="Подробное описание..." value={newQuestionText} onChange={(e) => setNewQuestionText(e.target.value)} className="min-h-[100px] rounded-xl border-border/60 focus:border-primary" />
                    <Input placeholder="Теги через запятую" value={newQuestionTags} onChange={(e) => setNewQuestionTags(e.target.value)} className="rounded-xl border-border/60 focus:border-primary" />
                    <Button onClick={handleAddQuestion} disabled={!newQuestionTitle.trim() || submitting} className="w-full gradient-bg text-white border-0 font-semibold rounded-xl hover:opacity-90 transition-opacity">
                      {submitting ? "Публикуем..." : "Опубликовать"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              <button onClick={handleLogout} className="flex items-center gap-2 hover:opacity-70 transition-opacity">
                <Avatar className="h-9 w-9 border-2 border-primary/20">
                  <AvatarImage src={user.avatar} />
                  <AvatarFallback className="gradient-bg text-white text-sm font-bold">{user.name[0]}</AvatarFallback>
                </Avatar>
              </button>
            </div>
          ) : (
            <Button onClick={handleGoogleLogin} variant="outline" className="rounded-xl font-semibold border-border/60 hover:border-primary/40 hover:bg-primary/5">
              <GoogleIcon className="mr-2" />
              Войти через Google
            </Button>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {!openQuestion ? (
          <>
            <div className="mb-8 animate-fade-in">
              <h1 className="text-4xl sm:text-5xl font-extrabold mb-3 leading-tight">
                Спрашивай. Отвечай. <span className="gradient-text">Голосуй.</span>
              </h1>
              <p className="text-muted-foreground text-lg max-w-xl">Задавайте вопросы, делитесь знаниями и голосуйте за лучшие ответы</p>
            </div>

            <div className="flex items-center gap-2 mb-6">
              <Button variant={sortBy === "votes" ? "default" : "ghost"} size="sm" onClick={() => setSortBy("votes")} className={`rounded-xl font-medium ${sortBy === "votes" ? "gradient-bg text-white border-0" : ""}`}>
                <Icon name="TrendingUp" size={16} className="mr-1.5" />Популярные
              </Button>
              <Button variant={sortBy === "new" ? "default" : "ghost"} size="sm" onClick={() => setSortBy("new")} className={`rounded-xl font-medium ${sortBy === "new" ? "gradient-bg text-white border-0" : ""}`}>
                <Icon name="Clock" size={16} className="mr-1.5" />Новые
              </Button>
            </div>

            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="p-5 rounded-2xl border-border/40 animate-pulse">
                    <div className="flex gap-4">
                      <div className="w-8 h-20 bg-muted rounded-lg" />
                      <div className="flex-1 space-y-3">
                        <div className="h-5 bg-muted rounded w-3/4" />
                        <div className="h-4 bg-muted rounded w-full" />
                        <div className="h-3 bg-muted rounded w-1/3" />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : questions.length === 0 ? (
              <Card className="p-12 text-center rounded-2xl border-dashed border-border/60 bg-muted/20 animate-fade-in">
                <Icon name="MessageCircleQuestion" size={48} className="text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">Пока нет вопросов</h3>
                <p className="text-muted-foreground mb-4">Станьте первым — задайте свой вопрос!</p>
                {user ? (
                  <Button onClick={() => setAskDialogOpen(true)} className="gradient-bg text-white border-0 font-semibold rounded-xl">
                    <Icon name="Plus" size={18} className="mr-1.5" />Задать вопрос
                  </Button>
                ) : (
                  <Button onClick={handleGoogleLogin} variant="outline" className="rounded-xl font-semibold">
                    <GoogleIcon className="mr-2" />Войти, чтобы спросить
                  </Button>
                )}
              </Card>
            ) : (
              <div className="space-y-4">
                {questions.map((q, i) => (
                  <Card key={q.id} className="p-5 rounded-2xl border-border/40 hover-lift cursor-pointer animate-slide-up bg-card" style={{ animationDelay: `${0.05 + i * 0.06}s`, opacity: 0 }} onClick={() => loadQuestion(q.id)}>
                    <div className="flex gap-4">
                      <VoteButtons votes={q.votes} userVote={q.user_vote} onVoteUp={() => handleVote("question", q.id, 1)} onVoteDown={() => handleVote("question", q.id, -1)} />
                      <div className="flex-1 min-w-0">
                        <h2 className="text-lg font-bold mb-1.5 text-foreground leading-snug">{q.title}</h2>
                        <p className="text-muted-foreground text-sm mb-3 line-clamp-2">{q.body}</p>
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            {q.tags.map((tag) => (
                              <Badge key={tag} variant="secondary" className="rounded-lg text-xs font-medium px-2.5 py-0.5">{tag}</Badge>
                            ))}
                          </div>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1"><Icon name="MessageSquare" size={14} />{q.answer_count || 0}</span>
                            <div className="flex items-center gap-1.5">
                              <Avatar className="h-5 w-5"><AvatarImage src={q.author.avatar} /><AvatarFallback className="text-[10px] bg-muted font-bold">{q.author.name[0]}</AvatarFallback></Avatar>
                              <span>{q.author.name}</span>
                            </div>
                            <span>{formatTime(q.created_at)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {!user && questions.length > 0 && (
              <div className="mt-12 text-center animate-fade-in" style={{ animationDelay: "0.4s", opacity: 0 }}>
                <Card className="p-8 rounded-2xl gradient-bg-soft border-primary/10">
                  <Icon name="Sparkles" size={32} className="text-primary mx-auto mb-3" />
                  <h3 className="text-xl font-bold mb-2">Присоединяйтесь к обсуждению</h3>
                  <p className="text-muted-foreground mb-4">Войдите через Google, чтобы задавать вопросы и голосовать</p>
                  <Button onClick={handleGoogleLogin} className="gradient-bg text-white border-0 font-semibold rounded-xl hover:opacity-90 transition-opacity">
                    <GoogleIcon className="mr-2" />Войти через Google
                  </Button>
                </Card>
              </div>
            )}
          </>
        ) : (
          <div className="animate-fade-in">
            <button onClick={() => { setOpenQuestion(null); setNewAnswer(""); loadQuestions(); }} className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground font-medium mb-6 transition-colors">
              <Icon name="ArrowLeft" size={18} />Назад к вопросам
            </button>

            <Card className="p-6 rounded-2xl border-border/40 mb-6">
              <div className="flex gap-4">
                <VoteButtons votes={openQuestion.votes} userVote={openQuestion.user_vote} size="lg" onVoteUp={() => handleVote("question", openQuestion.id, 1)} onVoteDown={() => handleVote("question", openQuestion.id, -1)} />
                <div className="flex-1">
                  <h1 className="text-2xl font-bold mb-3">{openQuestion.title}</h1>
                  <p className="text-foreground/80 mb-4 leading-relaxed">{openQuestion.body}</p>
                  <div className="flex items-center gap-3 flex-wrap">
                    {openQuestion.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="rounded-lg text-xs font-medium px-2.5 py-0.5">{tag}</Badge>
                    ))}
                    <span className="text-sm text-muted-foreground ml-auto flex items-center gap-1.5">
                      <Avatar className="h-5 w-5"><AvatarImage src={openQuestion.author.avatar} /><AvatarFallback className="text-[10px] bg-muted font-bold">{openQuestion.author.name[0]}</AvatarFallback></Avatar>
                      {openQuestion.author.name} · {formatTime(openQuestion.created_at)}
                    </span>
                  </div>
                </div>
              </div>
            </Card>

            <div className="mb-6">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Icon name="MessageSquare" size={20} className="text-primary" />
                {(openQuestion.answers || []).length}{" "}
                {(() => { const c = (openQuestion.answers || []).length; if (c === 1) return "ответ"; if (c > 1 && c < 5) return "ответа"; return "ответов"; })()}
              </h2>

              {(openQuestion.answers || []).length === 0 && (
                <Card className="p-8 text-center rounded-2xl border-dashed border-border/60 bg-muted/30">
                  <Icon name="MessageCircle" size={36} className="text-muted-foreground/40 mx-auto mb-3" />
                  <p className="text-muted-foreground font-medium">Пока нет ответов. Будьте первым!</p>
                </Card>
              )}

              <div className="space-y-3">
                {(openQuestion.answers || []).map((answer, i) => (
                  <Card key={answer.id} className="p-5 rounded-2xl border-border/40 animate-slide-up" style={{ animationDelay: `${i * 0.08}s`, opacity: 0 }}>
                    <div className="flex gap-4">
                      <VoteButtons votes={answer.votes} userVote={answer.user_vote} onVoteUp={() => handleVote("answer", answer.id, 1)} onVoteDown={() => handleVote("answer", answer.id, -1)} />
                      <div className="flex-1">
                        <p className="text-foreground/90 leading-relaxed mb-3">{answer.body}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Avatar className="h-5 w-5"><AvatarImage src={answer.author.avatar} /><AvatarFallback className="text-[10px] bg-muted font-bold">{answer.author.name[0]}</AvatarFallback></Avatar>
                          <span className="font-medium">{answer.author.name}</span>
                          <span>·</span>
                          <span>{formatTime(answer.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {user ? (
              <Card className="p-5 rounded-2xl border-border/40">
                <h3 className="font-bold mb-3">Ваш ответ</h3>
                <Textarea placeholder="Поделитесь своими знаниями..." value={newAnswer} onChange={(e) => setNewAnswer(e.target.value)} className="min-h-[100px] rounded-xl border-border/60 focus:border-primary mb-3" />
                <Button onClick={handleAddAnswer} disabled={!newAnswer.trim() || submitting} className="gradient-bg text-white border-0 font-semibold rounded-xl hover:opacity-90 transition-opacity">
                  <Icon name="Send" size={16} className="mr-1.5" />{submitting ? "Отправляем..." : "Отправить ответ"}
                </Button>
              </Card>
            ) : (
              <Card className="p-5 rounded-2xl text-center gradient-bg-soft border-primary/10">
                <p className="text-muted-foreground mb-3 font-medium">Войдите, чтобы оставить ответ</p>
                <Button onClick={handleGoogleLogin} variant="outline" className="rounded-xl font-semibold">
                  <GoogleIcon className="mr-2" />Войти через Google
                </Button>
              </Card>
            )}
          </div>
        )}
      </main>

      <footer className="border-t border-border/40 mt-16">
        <div className="max-w-4xl mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          AskVote © 2026 · Платформа вопросов и ответов
        </div>
      </footer>
    </div>
  );
};

export default Index;