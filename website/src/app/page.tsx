import Link from "next/link";

const features = [
  {
    icon: "🥗",
    title: "Food Planner",
    description:
      "Plan your weekly meals and generate shopping lists with ease.",
  },
  {
    icon: "📅",
    title: "Day Planner",
    description:
      "Organize your day with time blocks. Schedule tasks and activities with an intuitive visual planner.",
  },
  {
    icon: "💰",
    title: "Finances",
    description:
      "Track your spending with awareness. Log expenses by category, view spending breakdowns, and manage recurring subscriptions.",
  },
  {
    icon: "✓",
    title: "Habits",
    description:
      "Build positive routines by tracking daily habits. Watch your streaks grow and celebrate your consistency.",
  },
  {
    icon: "📝",
    title: "Notes",
    description:
      "Capture thoughts, ideas, and reflections. Quick notes for anything you want to remember.",
  },
  {
    icon: "🎯",
    title: "Priorities",
    description:
      "Focus on what matters most each week. Track your top priorities and visualize your progress over time.",
  },
];

const howToUse = [
  {
    step: "1",
    title: "Create Your Account",
    description:
      "Sign up with your email to get started. Your data syncs across all your devices.",
  },
  {
    step: "2",
    title: "Choose Your Features",
    description:
      "Toggle on the features you want to use from the Profile tab. Start with one or use them all.",
  },
  {
    step: "3",
    title: "Build Your Routine",
    description:
      "Add habits to track, plan your meals, schedule your day, and set your weekly priorities.",
  },
  {
    step: "4",
    title: "Stay Consistent",
    description:
      "Check in daily to log your habits, update your planner, and watch your progress grow over time.",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      {/* Header */}
      <header className="px-6 py-8 max-w-5xl mx-auto">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🌱</span>
            <span className="text-2xl font-semibold text-gray-800 tracking-tight">
              Eudaimonia!
            </span>
          </div>
          <Link
            href="#support"
            className="text-teal-600 hover:text-teal-700 font-medium transition-colors"
          >
            Support
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="px-6 py-16 max-w-5xl mx-auto text-center">
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
          Your companion for a<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-emerald-500">
            balanced life
          </span>
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10 leading-relaxed">
          Eudaimonia! helps you build healthy habits, plan your days, track your
          spending, manage your priorities, and live with intention. Everything
          you need for personal growth, beautifully organized.
        </p>
        <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm px-6 py-3 rounded-full shadow-sm border border-gray-100">
          <span className="text-gray-500">Available on</span>
          <span className="font-semibold text-gray-800">iOS</span>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-6 py-16 max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-4">
          Everything you need
        </h2>
        <p className="text-gray-600 text-center mb-12 max-w-xl mx-auto">
          Six powerful tools, one simple app. Toggle features on or off to
          customize your experience.
        </p>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
            >
              <span className="text-4xl mb-4 block">{feature.icon}</span>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* How to Use Section */}
      <section className="px-6 py-16 max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-4">
          How to use Eudaimonia!
        </h2>
        <p className="text-gray-600 text-center mb-12 max-w-xl mx-auto">
          Getting started is simple. Here&apos;s how to make the most of the
          app.
        </p>

        <div className="grid md:grid-cols-2 gap-6">
          {howToUse.map((item) => (
            <div
              key={item.step}
              className="flex gap-4 bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
            >
              <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-full flex items-center justify-center text-white font-bold">
                {item.step}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {item.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Tips Section */}
      <section className="px-6 py-16 max-w-5xl mx-auto">
        <div className="bg-gradient-to-r from-teal-500 to-emerald-500 rounded-3xl p-8 md:p-12 text-white">
          <h2 className="text-2xl md:text-3xl font-bold mb-6">Pro Tips</h2>
          <ul className="space-y-4">
            <li className="flex items-start gap-3">
              <span className="text-xl">💡</span>
              <span>
                Start small—focus on tracking just 2-3 habits at first, then add
                more as they become routine.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-xl">📱</span>
              <span>
                Add the Habits widget to your home screen for quick access to
                your daily check-ins.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-xl">🎯</span>
              <span>
                Set your weekly priorities every Sunday to start each week with
                intention.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-xl">🥗</span>
              <span>
                Plan your meals at the start of each week to save time and eat
                healthier.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-xl">💰</span>
              <span>
                Log expenses as you spend to stay aware of your financial
                habits. Review your spending breakdown weekly and monthly.
              </span>
            </li>
          </ul>
        </div>
      </section>

      {/* Support Section */}
      <section id="support" className="px-6 py-16 max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-4">
          Support
        </h2>
        <p className="text-gray-600 text-center mb-8 max-w-xl mx-auto">
          We&apos;re here to help! If you have any questions, feedback, or run
          into any issues, please don&apos;t hesitate to reach out.
        </p>

        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 max-w-xl mx-auto text-center">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Contact Us
          </h3>
          <p className="text-gray-600 mb-6">
            For support inquiries, bug reports, or feature requests, please
            email us at:
          </p>
          <a
            href="mailto:shguru110@gmail.com"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-teal-500 to-emerald-500 text-white px-6 py-3 rounded-full font-medium hover:opacity-90 transition-opacity"
          >
            <span>📧</span>
            shguru110@gmail.com
          </a>
          <p className="text-sm text-gray-500 mt-6">
            We typically respond within 24-48 hours.
          </p>
        </div>
      </section>

      {/* Privacy Section */}
      <section className="px-6 py-16 max-w-5xl mx-auto">
        <div className="bg-gray-50 rounded-2xl p-8 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Privacy & Data
          </h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            Your privacy matters to us. Eudaimonia! stores your data securely
            and never shares your personal information with third parties. All
            data is encrypted and stored safely.
          </p>
          <p className="text-gray-600 leading-relaxed mb-4">
            You can delete your account and all associated data at any time from
            within the app settings.
          </p>
          <Link
            href="/privacy"
            className="text-teal-600 hover:text-teal-700 font-medium transition-colors"
          >
            Read our full Privacy Policy →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-12 border-t border-gray-100">
        <div className="max-w-5xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="text-2xl">🌱</span>
            <span className="text-xl font-semibold text-gray-800">
              Eudaimonia!
            </span>
          </div>
          <div className="flex items-center justify-center gap-4 mb-4">
            <Link
              href="/privacy"
              className="text-gray-500 hover:text-teal-600 text-sm transition-colors"
            >
              Privacy Policy
            </Link>
            <span className="text-gray-300">•</span>
            <Link
              href="#support"
              className="text-gray-500 hover:text-teal-600 text-sm transition-colors"
            >
              Support
            </Link>
          </div>
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} Eudaimonia! All rights reserved.
          </p>
          <p className="text-gray-400 text-sm mt-2">
            Built with ♥ for a balanced life
          </p>
        </div>
      </footer>
    </div>
  );
}
