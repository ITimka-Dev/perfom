import { Button } from "@/components/ui/button";
import Header from "@/components/layout/Header";
import FarmZoneCard from "@/components/farm/FarmZoneCard";
import AchievementCard from "@/components/achievements/AchievementCard";
import { ArrowRight, Target, Users, Trophy, Sparkles } from "lucide-react";
import heroImage from "@/assets/hero-farm.jpg";
import zonePhysics from "@/assets/zone-physics.png";
import zoneBiology from "@/assets/zone-biology.png";
import zoneChemistry from "@/assets/zone-chemistry.png";
import zoneMath from "@/assets/zone-math.png";
import zoneIT from "@/assets/zone-it.png";

const Index = () => {
  const zones = [
    {
      title: "Физика",
      description: "Изучай законы природы через практику",
      icon: zonePhysics,
      level: 3,
      progress: 65,
      tasksCompleted: 13,
      totalTasks: 20,
    },
    {
      title: "Биология",
      description: "Познай тайны живой природы",
      icon: zoneBiology,
      level: 2,
      progress: 40,
      tasksCompleted: 8,
      totalTasks: 20,
    },
    {
      title: "Химия",
      description: "Открой мир молекул и реакций",
      icon: zoneChemistry,
      level: 1,
      progress: 20,
      tasksCompleted: 4,
      totalTasks: 20,
      isLocked: true,
    },
    {
      title: "Математика",
      description: "Реши задачи и построй модели",
      icon: zoneMath,
      level: 2,
      progress: 50,
      tasksCompleted: 10,
      totalTasks: 20,
    },
    {
      title: "IT & Программирование",
      description: "Автоматизируй свою ферму",
      icon: zoneIT,
      level: 1,
      progress: 15,
      tasksCompleted: 3,
      totalTasks: 20,
      isLocked: true,
    },
  ];

  const achievements = [
    {
      title: "Первые шаги",
      description: "Завершите первое задание",
      rarity: "common" as const,
      isUnlocked: true,
      icon: "star" as const,
    },
    {
      title: "Агророкстар",
      description: "Достигни уровня 10 в любой зоне",
      rarity: "rare" as const,
      isUnlocked: false,
      icon: "trophy" as const,
    },
    {
      title: "Неудача — тоже опыт",
      description: "Повтори задание 3 раза подряд",
      rarity: "common" as const,
      isUnlocked: true,
      icon: "zap" as const,
    },
    {
      title: "Фермер на Python",
      description: "Напиши скрипт автоматизации",
      rarity: "epic" as const,
      isUnlocked: false,
      icon: "trophy" as const,
    },
  ];

  const features = [
    {
      icon: Target,
      title: "Практические задания",
      description: "Выполняй реальные лабораторные работы и получай опыт",
    },
    {
      icon: Trophy,
      title: "Система достижений",
      description: "Собирай уникальные ачивки и показывай свои успехи",
    },
    {
      icon: Users,
      title: "Соревнования",
      description: "Участвуй в челленджах и командных миссиях",
    },
    {
      icon: Sparkles,
      title: "Портфолио",
      description: "Создавай профессиональное портфолио для вузов",
    },
  ];

  return (
    <div className="min-h-screen">
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10" />
        <div className="container relative py-20 md:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-block">
                <span className="px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
                  Образовательная платформа
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                Развивай свою{" "}
                <span className="gradient-text">цифровую ферму</span> через науку
              </h1>
              <p className="text-lg text-muted-foreground max-w-xl">
                Образовательная платформа с геймификацией для агроклассов. Выполняй задания по физике, биологии, химии, математике и IT. Получай ачивки, строй портфолио и развивай навыки будущего.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="text-base">
                  Начать путешествие
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button size="lg" variant="outline" className="text-base">
                  Узнать больше
                </Button>
              </div>
              <div className="flex items-center gap-6 pt-4">
                <div>
                  <p className="text-2xl font-bold text-primary">1000+</p>
                  <p className="text-sm text-muted-foreground">Активных учеников</p>
                </div>
                <div className="h-12 w-px bg-border" />
                <div>
                  <p className="text-2xl font-bold text-secondary">50+</p>
                  <p className="text-sm text-muted-foreground">Школ по России</p>
                </div>
                <div className="h-12 w-px bg-border" />
                <div>
                  <p className="text-2xl font-bold text-accent">200+</p>
                  <p className="text-sm text-muted-foreground">Заданий</p>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 glow-effect rounded-2xl" />
              <img
                src={heroImage}
                alt="Умная ферма"
                className="rounded-2xl shadow-2xl w-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-muted/30">
        <div className="container">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Почему <span className="gradient-text">Умная ферма</span>?
            </h2>
            <p className="text-lg text-muted-foreground">
              Современный подход к обучению через геймификацию и практику
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="p-6 rounded-xl bg-card border card-hover"
              >
                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Zones Section */}
      <section id="zones" className="py-20">
        <div className="container">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Зоны развития фермы
            </h2>
            <p className="text-lg text-muted-foreground">
              Каждая зона — это отдельный предмет с уникальными заданиями и испытаниями
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {zones.map((zone, index) => (
              <FarmZoneCard key={index} {...zone} />
            ))}
          </div>
        </div>
      </section>

      {/* Achievements Section */}
      <section id="achievements" className="py-20 bg-muted/30">
        <div className="container">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Система достижений
            </h2>
            <p className="text-lg text-muted-foreground">
              Получай уникальные ачивки за успехи и даже за забавные моменты
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
            {achievements.map((achievement, index) => (
              <AchievementCard key={index} {...achievement} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary to-secondary opacity-10" />
        <div className="container relative">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold">
              Готов начать свое агро-приключение?
            </h2>
            <p className="text-lg text-muted-foreground">
              Присоединяйся к тысячам школьников, которые уже развивают свои навыки через игру
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button size="lg" className="text-base">
                Создать аккаунт
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" className="text-base">
                Связаться с нами
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t">
        <div className="container">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <span className="text-white font-bold">🌱</span>
              </div>
              <span className="text-lg font-bold">Умная ферма</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2025 Умная ферма. Образовательная платформа для агроклассов
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
