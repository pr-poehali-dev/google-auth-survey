import { useState } from "react";
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

interface User {
  name: string;
  avatar: string;
  email: string;
}

interface Answer {
  id: number;
  author: User;
  text: string;
  votes: number;
  voted: number;
  createdAt: string;
}

interface Question {
  id: number;
  author: User;
  title: string;
  text: string;
  votes: number;
  voted: number;
  answers: Answer[];
  tags: string[];
  createdAt: string;
}

const MOCK_USERS: User[] = [
  { name: "Алексей М.", avatar: "", email: "alex@gmail.com" },
  { name: "Мария К.", avatar: "", email: "maria@gmail.com" },
  { name: "Дмитрий С.", avatar: "", email: "dmitry@gmail.com" },
];

const INITIAL_QUESTIONS: Question[] = [
  {
    id: 1,
    author: MOCK_USERS[1],
    title: "Как выбрать первый язык программирования?",
    text: "Хочу начать изучать программирование, но не могу определиться с языком. Какой язык лучше всего подходит для новичка в 2026 году?",
    votes: 24,
    voted: 0,
    answers: [
      {
        id: 1,
        author: MOCK_USERS[0],
        text: "Python — отличный выбор для старта. Простой синтаксис, огромное сообщество и можно применять везде: от веб-разработки до Data Science.",
        votes: 18,
        voted: 0,
        createdAt: "2 часа назад",
      },
      {
        id: 2,
        author: MOCK_USERS[2],
        text: "Зависит от целей. Для веба — JavaScript, для мобилок — Kotlin/Swift, для общего развития — Python. Главное — начать!",
        votes: 12,
        voted: 0,
        createdAt: "1 час назад",
      },
    ],
    tags: ["программирование", "обучение"],
    createdAt: "3 часа назад",
  },
  {
    id: 2,
    author: MOCK_USERS[2],
    title: "Лучшие книги для саморазвития?",
    text: "Посоветуйте книги, которые реально изменили ваш подход к жизни или работе. Интересуют как бизнес-литература, так и психология.",
    votes: 31,
    voted: 0,
    answers: [
      {
        id: 3,
        author: MOCK_USERS[1],
        text: "«Атомные привычки» Джеймса Клира — простая, но мощная книга о том, как маленькие изменения приводят к большим результатам.",
        votes: 22,
        voted: 0,
        createdAt: "5 часов назад",
      },
    ],
    tags: ["книги", "саморазвитие"],
    createdAt: "6 часов назад",
  },
  {
    id: 3,
    author: MOCK_USERS[0],
    title: "Как организовать удалённую работу команды?",
    text: "Перевожу свою команду из 10 человек на удалёнку. Какие инструменты и практики помогут сохранить продуктивность?",
    votes: 15,
    voted: 0,
    answers: [],
    tags: ["работа", "управление"],
    createdAt: "1 день назад",
  },
];

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [questions, setQuestions] = useState<Question[]>(INITIAL_QUESTIONS);
  const [openQuestion, setOpenQuestion] = useState<number | null>(null);
  const [newAnswer, setNewAnswer] = useState("");
  const [newQuestionTitle, setNewQuestionTitle] = useState("");
  const [newQuestionText, setNewQuestionText] = useState("");
  const [newQuestionTags, setNewQuestionTags] = useState("");
  const [askDialogOpen, setAskDialogOpen] = useState(false);
  const [sortBy, setSortBy] = useState<"votes" | "new">("votes");

  const handleGoogleLogin = () => {
    setUser({
      name: "Вы",
      avatar: "",
      email: "user@gmail.com",
    });
  };

  const handleLogout = () => {
    setUser(null);
  };

  const handleVoteQuestion = (qId: number, dir: number) => {
    if (!user) return;
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== qId) return q;
        if (q.voted === dir) return { ...q, votes: q.votes - dir, voted: 0 };
        return { ...q, votes: q.votes - q.voted + dir, voted: dir };
      })
    );
  };

  const handleVoteAnswer = (qId: number, aId: number, dir: number) => {
    if (!user) return;
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== qId) return q;
        return {
          ...q,
          answers: q.answers.map((a) => {
            if (a.id !== aId) return a;
            if (a.voted === dir)
              return { ...a, votes: a.votes - dir, voted: 0 };
            return { ...a, votes: a.votes - a.voted + dir, voted: dir };
          }),
        };
      })
    );
  };

  const handleAddAnswer = (qId: number) => {
    if (!user || !newAnswer.trim()) return;
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== qId) return q;
        return {
          ...q,
          answers: [
            ...q.answers,
            {
              id: Date.now(),
              author: user,
              text: newAnswer,
              votes: 0,
              voted: 0,
              createdAt: "только что",
            },
          ],
        };
      })
    );
    setNewAnswer("");
  };

  const handleAddQuestion = () => {
    if (!user || !newQuestionTitle.trim()) return;
    const tags = newQuestionTags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    setQuestions((prev) => [
      {
        id: Date.now(),
        author: user,
        title: newQuestionTitle,
        text: newQuestionText,
        votes: 0,
        voted: 0,
        answers: [],
        tags: tags.length ? tags : ["общее"],
        createdAt: "только что",
      },
      ...prev,
    ]);
    setNewQuestionTitle("");
    setNewQuestionText("");
    setNewQuestionTags("");
    setAskDialogOpen(false);
  };

  const sortedQuestions = [...questions].sort((a, b) =>
    sortBy === "votes" ? b.votes - a.votes : b.id - a.id
  );

  const activeQuestion = questions.find((q) => q.id === openQuestion);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 glass border-b">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl gradient-bg flex items-center justify-center">
              <Icon name="MessageCircleQuestion" size={20} className="text-white" />
            </div>
            <span className="text-xl font-bold gradient-text">AskVote</span>
          </div>

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
                    <Input
                      placeholder="Заголовок вопроса"
                      value={newQuestionTitle}
                      onChange={(e) => setNewQuestionTitle(e.target.value)}
                      className="rounded-xl border-border/60 focus:border-primary"
                    />
                    <Textarea
                      placeholder="Подробное описание..."
                      value={newQuestionText}
                      onChange={(e) => setNewQuestionText(e.target.value)}
                      className="min-h-[100px] rounded-xl border-border/60 focus:border-primary"
                    />
                    <Input
                      placeholder="Теги через запятую"
                      value={newQuestionTags}
                      onChange={(e) => setNewQuestionTags(e.target.value)}
                      className="rounded-xl border-border/60 focus:border-primary"
                    />
                    <Button
                      onClick={handleAddQuestion}
                      disabled={!newQuestionTitle.trim()}
                      className="w-full gradient-bg text-white border-0 font-semibold rounded-xl hover:opacity-90 transition-opacity"
                    >
                      Опубликовать
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <button
                onClick={handleLogout}
                className="flex items-center gap-2 hover:opacity-70 transition-opacity"
              >
                <Avatar className="h-9 w-9 border-2 border-primary/20">
                  <AvatarImage src="" />
                  <AvatarFallback className="gradient-bg text-white text-sm font-bold">
                    {user.name[0]}
                  </AvatarFallback>
                </Avatar>
              </button>
            </div>
          ) : (
            <Button
              onClick={handleGoogleLogin}
              variant="outline"
              className="rounded-xl font-semibold border-border/60 hover:border-primary/40 hover:bg-primary/5"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
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
                Спрашивай. Отвечай.{" "}
                <span className="gradient-text">Голосуй.</span>
              </h1>
              <p className="text-muted-foreground text-lg max-w-xl">
                Задавайте вопросы, делитесь знаниями и голосуйте за лучшие ответы
              </p>
            </div>

            <div className="flex items-center gap-2 mb-6" style={{ animationDelay: "0.1s" }}>
              <Button
                variant={sortBy === "votes" ? "default" : "ghost"}
                size="sm"
                onClick={() => setSortBy("votes")}
                className={`rounded-xl font-medium ${sortBy === "votes" ? "gradient-bg text-white border-0" : ""}`}
              >
                <Icon name="TrendingUp" size={16} className="mr-1.5" />
                Популярные
              </Button>
              <Button
                variant={sortBy === "new" ? "default" : "ghost"}
                size="sm"
                onClick={() => setSortBy("new")}
                className={`rounded-xl font-medium ${sortBy === "new" ? "gradient-bg text-white border-0" : ""}`}
              >
                <Icon name="Clock" size={16} className="mr-1.5" />
                Новые
              </Button>
            </div>

            <div className="space-y-4">
              {sortedQuestions.map((q, i) => (
                <Card
                  key={q.id}
                  className="p-5 rounded-2xl border-border/40 hover-lift cursor-pointer animate-slide-up bg-card"
                  style={{ animationDelay: `${0.1 + i * 0.08}s`, opacity: 0 }}
                  onClick={() => setOpenQuestion(q.id)}
                >
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center gap-1 pt-1">
                      <button
                        className={`p-1 rounded-lg transition-colors ${q.voted === 1 ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-primary hover:bg-primary/5"}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleVoteQuestion(q.id, 1);
                        }}
                      >
                        <Icon name="ChevronUp" size={20} />
                      </button>
                      <span className={`text-lg font-bold ${q.votes > 0 ? "text-primary" : "text-muted-foreground"}`}>
                        {q.votes}
                      </span>
                      <button
                        className={`p-1 rounded-lg transition-colors ${q.voted === -1 ? "text-accent bg-accent/10" : "text-muted-foreground hover:text-accent hover:bg-accent/5"}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleVoteQuestion(q.id, -1);
                        }}
                      >
                        <Icon name="ChevronDown" size={20} />
                      </button>
                    </div>

                    <div className="flex-1 min-w-0">
                      <h2 className="text-lg font-bold mb-1.5 text-foreground leading-snug">
                        {q.title}
                      </h2>
                      <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                        {q.text}
                      </p>

                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          {q.tags.map((tag) => (
                            <Badge
                              key={tag}
                              variant="secondary"
                              className="rounded-lg text-xs font-medium px-2.5 py-0.5"
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>

                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Icon name="MessageSquare" size={14} />
                            {q.answers.length}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <Avatar className="h-5 w-5">
                              <AvatarFallback className="text-[10px] bg-muted font-bold">
                                {q.author.name[0]}
                              </AvatarFallback>
                            </Avatar>
                            <span>{q.author.name}</span>
                          </div>
                          <span>{q.createdAt}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {!user && (
              <div className="mt-12 text-center animate-fade-in" style={{ animationDelay: "0.4s", opacity: 0 }}>
                <Card className="p-8 rounded-2xl gradient-bg-soft border-primary/10">
                  <Icon name="Sparkles" size={32} className="text-primary mx-auto mb-3" />
                  <h3 className="text-xl font-bold mb-2">Присоединяйтесь к обсуждению</h3>
                  <p className="text-muted-foreground mb-4">
                    Войдите через Google, чтобы задавать вопросы и голосовать
                  </p>
                  <Button
                    onClick={handleGoogleLogin}
                    className="gradient-bg text-white border-0 font-semibold rounded-xl hover:opacity-90 transition-opacity"
                  >
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Войти через Google
                  </Button>
                </Card>
              </div>
            )}
          </>
        ) : (
          activeQuestion && (
            <div className="animate-fade-in">
              <button
                onClick={() => {
                  setOpenQuestion(null);
                  setNewAnswer("");
                }}
                className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground font-medium mb-6 transition-colors"
              >
                <Icon name="ArrowLeft" size={18} />
                Назад к вопросам
              </button>

              <Card className="p-6 rounded-2xl border-border/40 mb-6">
                <div className="flex gap-4">
                  <div className="flex flex-col items-center gap-1">
                    <button
                      className={`p-1.5 rounded-lg transition-colors ${activeQuestion.voted === 1 ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-primary hover:bg-primary/5"}`}
                      onClick={() => handleVoteQuestion(activeQuestion.id, 1)}
                    >
                      <Icon name="ChevronUp" size={22} />
                    </button>
                    <span className={`text-2xl font-bold ${activeQuestion.votes > 0 ? "text-primary" : "text-muted-foreground"}`}>
                      {activeQuestion.votes}
                    </span>
                    <button
                      className={`p-1.5 rounded-lg transition-colors ${activeQuestion.voted === -1 ? "text-accent bg-accent/10" : "text-muted-foreground hover:text-accent hover:bg-accent/5"}`}
                      onClick={() => handleVoteQuestion(activeQuestion.id, -1)}
                    >
                      <Icon name="ChevronDown" size={22} />
                    </button>
                  </div>

                  <div className="flex-1">
                    <h1 className="text-2xl font-bold mb-3">{activeQuestion.title}</h1>
                    <p className="text-foreground/80 mb-4 leading-relaxed">
                      {activeQuestion.text}
                    </p>
                    <div className="flex items-center gap-3 flex-wrap">
                      {activeQuestion.tags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="rounded-lg text-xs font-medium px-2.5 py-0.5"
                        >
                          {tag}
                        </Badge>
                      ))}
                      <span className="text-sm text-muted-foreground ml-auto">
                        {activeQuestion.author.name} · {activeQuestion.createdAt}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>

              <div className="mb-6">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Icon name="MessageSquare" size={20} className="text-primary" />
                  {activeQuestion.answers.length}{" "}
                  {activeQuestion.answers.length === 1 ? "ответ" : activeQuestion.answers.length > 1 && activeQuestion.answers.length < 5 ? "ответа" : "ответов"}
                </h2>

                {activeQuestion.answers.length === 0 && (
                  <Card className="p-8 text-center rounded-2xl border-dashed border-border/60 bg-muted/30">
                    <Icon name="MessageCircle" size={36} className="text-muted-foreground/40 mx-auto mb-3" />
                    <p className="text-muted-foreground font-medium">
                      Пока нет ответов. Будьте первым!
                    </p>
                  </Card>
                )}

                <div className="space-y-3">
                  {activeQuestion.answers
                    .sort((a, b) => b.votes - a.votes)
                    .map((answer, i) => (
                      <Card
                        key={answer.id}
                        className="p-5 rounded-2xl border-border/40 animate-slide-up"
                        style={{ animationDelay: `${i * 0.08}s`, opacity: 0 }}
                      >
                        <div className="flex gap-4">
                          <div className="flex flex-col items-center gap-1">
                            <button
                              className={`p-1 rounded-lg transition-colors ${answer.voted === 1 ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-primary hover:bg-primary/5"}`}
                              onClick={() =>
                                handleVoteAnswer(activeQuestion.id, answer.id, 1)
                              }
                            >
                              <Icon name="ChevronUp" size={18} />
                            </button>
                            <span className={`text-base font-bold ${answer.votes > 0 ? "text-primary" : "text-muted-foreground"}`}>
                              {answer.votes}
                            </span>
                            <button
                              className={`p-1 rounded-lg transition-colors ${answer.voted === -1 ? "text-accent bg-accent/10" : "text-muted-foreground hover:text-accent hover:bg-accent/5"}`}
                              onClick={() =>
                                handleVoteAnswer(activeQuestion.id, answer.id, -1)
                              }
                            >
                              <Icon name="ChevronDown" size={18} />
                            </button>
                          </div>
                          <div className="flex-1">
                            <p className="text-foreground/90 leading-relaxed mb-3">
                              {answer.text}
                            </p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Avatar className="h-5 w-5">
                                <AvatarFallback className="text-[10px] bg-muted font-bold">
                                  {answer.author.name[0]}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium">{answer.author.name}</span>
                              <span>·</span>
                              <span>{answer.createdAt}</span>
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
                  <Textarea
                    placeholder="Поделитесь своими знаниями..."
                    value={newAnswer}
                    onChange={(e) => setNewAnswer(e.target.value)}
                    className="min-h-[100px] rounded-xl border-border/60 focus:border-primary mb-3"
                  />
                  <Button
                    onClick={() => handleAddAnswer(activeQuestion.id)}
                    disabled={!newAnswer.trim()}
                    className="gradient-bg text-white border-0 font-semibold rounded-xl hover:opacity-90 transition-opacity"
                  >
                    <Icon name="Send" size={16} className="mr-1.5" />
                    Отправить ответ
                  </Button>
                </Card>
              ) : (
                <Card className="p-5 rounded-2xl text-center gradient-bg-soft border-primary/10">
                  <p className="text-muted-foreground mb-3 font-medium">
                    Войдите, чтобы оставить ответ
                  </p>
                  <Button
                    onClick={handleGoogleLogin}
                    variant="outline"
                    className="rounded-xl font-semibold"
                  >
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Войти через Google
                  </Button>
                </Card>
              )}
            </div>
          )
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
