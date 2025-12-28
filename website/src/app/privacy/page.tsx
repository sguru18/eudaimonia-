import Link from "next/link";

export const metadata = {
  title: "Privacy Policy - Eudaimonia",
  description: "Privacy Policy for the Eudaimonia app",
};

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="px-6 py-6 bg-white border-b border-gray-100">
        <nav className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <span className="text-2xl">🌱</span>
            <span className="text-xl font-semibold text-gray-800">Eudaimonia</span>
          </Link>
          <Link
            href="/"
            className="text-teal-600 hover:text-teal-700 font-medium transition-colors"
          >
            ← Back to Home
          </Link>
        </nav>
      </header>

      {/* Content */}
      <main className="px-6 py-12 max-w-3xl mx-auto">
        <article className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
          <p className="text-gray-500 mb-8">Last Updated: December 28, 2024</p>

          <div className="prose prose-gray max-w-none">
            <p className="text-gray-600 leading-relaxed mb-6">
              This Privacy Policy describes how Eudaimonia (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) collects, uses, and protects your personal information when you use our mobile application (the &quot;App&quot;). By using the App, you agree to the collection and use of information in accordance with this policy.
            </p>

            <Section title="1. Information We Collect">
              <Subsection title="1.1 Account Information">
                <p>When you create an account, we collect:</p>
                <ul>
                  <li>Email address</li>
                  <li>Password (encrypted and securely stored)</li>
                </ul>
              </Subsection>

              <Subsection title="1.2 User-Generated Content">
                <p>We collect and store the content you create within the App, including but not limited to:</p>
                <ul>
                  <li>Habit tracking data</li>
                  <li>Notes and journal entries</li>
                  <li>Meal planning information</li>
                  <li>Daily planner entries</li>
                  <li>Priority lists and goals</li>
                </ul>
              </Subsection>

              <Subsection title="1.3 Usage Data">
                <p>We may collect limited technical information to improve App performance, including:</p>
                <ul>
                  <li>App crash reports</li>
                  <li>General usage statistics</li>
                </ul>
              </Subsection>
            </Section>

            <Section title="2. How We Use Your Information">
              <p>We use the information we collect solely for the following purposes:</p>
              <ul>
                <li>To provide and maintain the App&apos;s functionality</li>
                <li>To sync your data across your devices</li>
                <li>To authenticate your account</li>
                <li>To improve and optimize the App&apos;s performance</li>
                <li>To respond to your support inquiries</li>
              </ul>
            </Section>

            <Section title="3. Data Storage and Security">
              <Subsection title="3.1 Data Storage">
                <p>Your data is stored securely using industry-standard encryption protocols. We utilize Supabase, a secure cloud database service, to store your information.</p>
              </Subsection>

              <Subsection title="3.2 Security Measures">
                <p>We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. These measures include:</p>
                <ul>
                  <li>Encryption of data in transit and at rest</li>
                  <li>Secure authentication protocols</li>
                  <li>Regular security assessments</li>
                </ul>
              </Subsection>
            </Section>

            <Section title="4. Data Sharing and Disclosure">
              <p>We do not sell, trade, rent, or otherwise share your personal information with third parties for their marketing purposes.</p>
              <p>We may disclose your information only in the following limited circumstances:</p>
              <ul>
                <li>When required by law or to comply with legal process</li>
                <li>To protect our rights, privacy, safety, or property</li>
                <li>In connection with a merger, acquisition, or sale of assets (in which case, your data would remain subject to this Privacy Policy)</li>
              </ul>
            </Section>

            <Section title="5. Data Retention">
              <p>We retain your personal information for as long as your account remains active or as needed to provide you with the App&apos;s services. Upon account deletion, your data will be permanently removed from our systems within thirty (30) days.</p>
            </Section>

            <Section title="6. Your Rights and Choices">
              <Subsection title="6.1 Account Deletion">
                <p>You may delete your account at any time through the App&apos;s settings. Upon deletion, all associated personal data will be permanently removed from our servers.</p>
              </Subsection>

              <Subsection title="6.2 Data Access">
                <p>You may request access to the personal information we hold about you by contacting us at the email address provided below.</p>
              </Subsection>

              <Subsection title="6.3 Data Correction">
                <p>You may update or correct your account information directly within the App.</p>
              </Subsection>
            </Section>

            <Section title="7. Children's Privacy">
              <p>The App is not intended for use by children under the age of 13. We do not knowingly collect personal information from children under 13. If we become aware that we have collected personal information from a child under 13, we will take steps to delete such information promptly.</p>
            </Section>

            <Section title="8. International Data Transfers">
              <p>Your information may be transferred to and processed in countries other than your country of residence. These countries may have data protection laws that differ from your jurisdiction. By using the App, you consent to the transfer of your information to such countries.</p>
            </Section>

            <Section title="9. Third-Party Services">
              <p>The App may contain links to third-party websites or services. We are not responsible for the privacy practices of such third parties. We encourage you to review the privacy policies of any third-party services you access.</p>
            </Section>

            <Section title="10. Changes to This Privacy Policy">
              <p>We reserve the right to update or modify this Privacy Policy at any time. We will notify you of any material changes by posting the updated policy within the App or by other appropriate means. Your continued use of the App following any changes constitutes your acceptance of the revised Privacy Policy.</p>
            </Section>

            <Section title="11. Contact Us">
              <p>If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us at:</p>
              <p className="font-medium">
                Email:{" "}
                <a href="mailto:shguru110@gmail.com" className="text-teal-600 hover:text-teal-700">
                  shguru110@gmail.com
                </a>
              </p>
            </Section>

            <Section title="12. California Residents">
              <p>If you are a California resident, you may have additional rights under the California Consumer Privacy Act (CCPA), including the right to request disclosure of the categories and specific pieces of personal information we have collected about you.</p>
            </Section>

            <Section title="13. European Union Residents">
              <p>If you are located in the European Union, you may have additional rights under the General Data Protection Regulation (GDPR), including the right to access, rectify, port, and erase your personal data, as well as the right to object to or restrict certain processing activities.</p>
            </Section>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-100 text-center">
            <p className="text-gray-500 text-sm">
              By using Eudaimonia, you acknowledge that you have read and understood this Privacy Policy and agree to its terms.
            </p>
          </div>
        </article>
      </main>

      {/* Footer */}
      <footer className="px-6 py-8 border-t border-gray-100 bg-white">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} Eudaimonia. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">{title}</h2>
      <div className="text-gray-600 leading-relaxed space-y-3">{children}</div>
    </section>
  );
}

function Subsection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <h3 className="text-lg font-medium text-gray-800 mb-2">{title}</h3>
      <div className="text-gray-600 leading-relaxed space-y-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1">
        {children}
      </div>
    </div>
  );
}

