import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-blue-50 to-white py-20">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <span className="inline-block bg-blue-100 text-blue-700 text-sm font-medium px-4 py-1 rounded-full mb-6">
            Voice-first meeting practice
          </span>
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Master high-stakes meeting moments
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10">
            Practice daily standups and incident updates with realistic pressure,
            interruptions, and instant AI feedback. No signup required to start.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/app"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-lg py-4 px-8 rounded-full transition-colors shadow-lg hover:shadow-xl"
            >
              Try it now - Free
            </Link>
            <Link
              href="/pricing"
              className="bg-white hover:bg-gray-50 text-gray-800 font-semibold text-lg py-4 px-8 rounded-full border border-gray-300 transition-colors"
            >
              View pricing
            </Link>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            3 free simulations per week. No credit card required.
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            How it works
          </h2>
          <div className="grid md:grid-cols-4 gap-8">
            <StepCard
              number={1}
              title="Choose scenario"
              description="Select daily standup or incident update"
              icon="🎯"
            />
            <StepCard
              number={2}
              title="Record your response"
              description="Speak naturally under time pressure"
              icon="🎙️"
            />
            <StepCard
              number={3}
              title="Handle pressure"
              description="Respond to interruptions and follow-ups"
              icon="⚡"
            />
            <StepCard
              number={4}
              title="Get feedback"
              description="Scores, tips, and re-speak drills"
              icon="📊"
            />
          </div>
        </div>
      </section>

      {/* Scenarios */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Practice real meeting scenarios
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <ScenarioPreview
              icon="📊"
              title="Daily Standup"
              description="Practice delivering clear, concise updates. Learn to summarize your work, blockers, and plans in under 90 seconds while handling unexpected questions."
              skills={['Concise updates', 'Handling interruptions', 'Stating blockers']}
            />
            <ScenarioPreview
              icon="🚨"
              title="Incident Status Update"
              description="Practice communicating during outages. Learn to deliver calm, structured updates about impact, timeline, and next steps to stakeholders."
              skills={['Clear impact statements', 'Timeline communication', 'Action items']}
            />
          </div>
        </div>
      </section>

      {/* Scoring */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            AI-powered feedback
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon="✨"
              title="Clarity Score"
              description="How clear and understandable is your message? Get feedback on jargon, filler words, and message structure."
            />
            <FeatureCard
              icon="📐"
              title="Structure Score"
              description="Is your information well-organized? Learn to lead with the most important points and follow logical flow."
            />
            <FeatureCard
              icon="🎭"
              title="Tone Score"
              description="Is your tone professional and appropriate? Practice confident delivery without being defensive."
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-b from-white to-blue-50">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Start practicing in 30 seconds
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            No signup required. Complete your first simulation and get real feedback
            immediately.
          </p>
          <Link
            href="/app"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold text-lg py-4 px-10 rounded-full transition-colors shadow-lg"
          >
            Try it now - Free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🎯</span>
              <span className="text-white font-semibold">ConversationTutor</span>
            </div>
            <div className="flex gap-6">
              <Link href="/pricing" className="hover:text-white transition-colors">
                Pricing
              </Link>
              <Link href="/login" className="hover:text-white transition-colors">
                Sign in
              </Link>
              <Link href="/signup" className="hover:text-white transition-colors">
                Sign up
              </Link>
            </div>
          </div>
          <div className="text-center text-sm mt-8">
            © {new Date().getFullYear()} ConversationTutor AI. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

function StepCard({
  number,
  title,
  description,
  icon,
}: {
  number: number;
  title: string;
  description: string;
  icon: string;
}) {
  return (
    <div className="text-center">
      <div className="text-4xl mb-4">{icon}</div>
      <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-3 text-sm font-bold">
        {number}
      </div>
      <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 text-sm">{description}</p>
    </div>
  );
}

function ScenarioPreview({
  icon,
  title,
  description,
  skills,
}: {
  icon: string;
  title: string;
  description: string;
  skills: string[];
}) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-3xl">{icon}</span>
        <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
      </div>
      <p className="text-gray-600 mb-4">{description}</p>
      <div className="flex flex-wrap gap-2">
        {skills.map((skill) => (
          <span
            key={skill}
            className="bg-blue-50 text-blue-700 text-sm px-3 py-1 rounded-full"
          >
            {skill}
          </span>
        ))}
      </div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center p-6">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 text-sm">{description}</p>
    </div>
  );
}
