'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';

export default function TermsOfServicePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Link
        href="/"
        className="flex items-center text-blue-600 hover:underline mb-6"
      >
        <ArrowLeft size={16} className="mr-1" />
        Return to Home
      </Link>

      <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>

      <Card>
        <CardContent className="p-6 md:p-8">
          <div className="prose max-w-none">
            <p className="lead text-lg text-gray-600 mb-8">
              These Terms of Service (&quot;Terms&quot;) define the conditions
              for using the Women in Tech Networking Platform
              (&quot;Platform&quot;) and establish the rights, obligations, and
              responsibilities between users and the operator. By using the
              Platform, you agree to these Terms.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4" id="acceptance">
              1. Acceptance of Terms
            </h2>
            <p>
              By using the Platform, you agree to these Terms. These Terms may
              be modified at any time, and we may notify you of significant
              changes and request re-acceptance.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4" id="eligibility">
              2. Eligibility
            </h2>
            <p>To use the Platform, you must:</p>
            <ul className="list-disc pl-6 mb-4">
              <li className="mb-2">Be at least 18 years old</li>
              <li className="mb-2">
                Be a woman working in or interested in technology
              </li>
              <li className="mb-2">Agree to these Terms</li>
            </ul>

            <h2 className="text-2xl font-bold mt-8 mb-4" id="accounts">
              3. User Accounts
            </h2>
            <p>Responsibilities regarding user accounts:</p>
            <ul className="list-disc pl-6 mb-4">
              <li className="mb-2">
                You must provide accurate information when creating an account
              </li>
              <li className="mb-2">
                You must maintain the security of your account password
              </li>
              <li className="mb-2">Account sharing is prohibited</li>
              <li className="mb-2">
                You are responsible for all activities that occur under your
                account
              </li>
            </ul>
            <p>
              The operator may suspend or delete accounts in the following
              cases:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li className="mb-2">Violation of these Terms</li>
              <li className="mb-2">Extended inactivity</li>
              <li className="mb-2">User request</li>
              <li className="mb-2">Suspected illegal activity</li>
            </ul>

            <h2 className="text-2xl font-bold mt-8 mb-4" id="platform-rules">
              4. Platform Rules
            </h2>
            <p>All users must comply with the following rules:</p>
            <ul className="list-disc pl-6 mb-4">
              <li className="mb-2">Respect other users and be courteous</li>
              <li className="mb-2">
                Do not post illegal, violent, or discriminatory content
              </li>
              <li className="mb-2">
                Do not infringe on others&apos; intellectual property rights
              </li>
              <li className="mb-2">Do not post spam or advertising content</li>
              <li className="mb-2">
                Do not engage in activities that threaten platform security
              </li>
            </ul>
            <p>
              If violations are discovered, actions such as warnings, temporary
              account suspension, or permanent account deletion may be taken.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4" id="wit-focus">
              5. Women in Tech Focus
            </h2>
            <p>
              This Platform aims to provide a safe and inclusive environment for
              women working in technology. All users must respect this purpose
              and comply with the Platform&apos;s community guidelines.
            </p>
            <p className="mt-2">
              We focus on the unique challenges and opportunities women in tech
              face and create an environment to support them.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4" id="mentorship">
              6. Mentorship Guidelines
            </h2>
            <p>Expectations for mentorship relationships:</p>
            <ul className="list-disc pl-6 mb-4">
              <li className="mb-2">
                <strong>Mentor Responsibilities:</strong> Share knowledge and
                experience, communicate regularly, and provide constructive
                feedback
              </li>
              <li className="mb-2">
                <strong>Mentee Responsibilities:</strong> Participate actively,
                clarify goals, and keep commitments
              </li>
              <li className="mb-2">
                <strong>Mutual Respect:</strong> Respect each other&apos;s time
                and boundaries
              </li>
            </ul>
            <p>
              If issues arise in a mentorship relationship, try to resolve them
              through dialogue first, and if necessary, request mediation by
              contacting platform@witnetwork.com.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4" id="events">
              7. Event Participation
            </h2>
            <p>Rules for event participation and creation:</p>
            <ul className="list-disc pl-6 mb-4">
              <li className="mb-2">
                Event information must be provided accurately
              </li>
              <li className="mb-2">
                If you cannot attend after registration, cancel at least 24
                hours in advance
              </li>
              <li className="mb-2">
                Respect other participants and be courteous during events
              </li>
              <li className="mb-2">
                Event organizers are responsible for participant management
              </li>
            </ul>

            <h2 className="text-2xl font-bold mt-8 mb-4" id="content">
              8. Content Ownership
            </h2>
            <p>
              Intellectual property rights for content posted on the Platform
              (profile information, messages, comments, etc.) belong to the
              user. However, you grant the Platform a non-exclusive, worldwide,
              royalty-free license to display, distribute, and promote that
              content as needed.
            </p>
            <p className="mt-2">
              You must not post content that infringes on others&apos;
              intellectual property rights. If infringement is discovered, the
              content may be removed.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4" id="availability">
              9. Service Availability
            </h2>
            <p>
              We strive to provide Platform services without interruption, but
              the service may be temporarily suspended in the following cases:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li className="mb-2">Scheduled maintenance</li>
              <li className="mb-2">Emergency system updates</li>
              <li className="mb-2">Server errors or technical issues</li>
              <li className="mb-2">
                Natural disasters or force majeure situations
              </li>
            </ul>
            <p>
              We will notify you in advance for scheduled maintenance, but in
              emergencies, services may be suspended without prior notice.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4" id="liability">
              10. Limitation of Liability
            </h2>
            <p>
              To the maximum extent permitted by law, we are not responsible
              for:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li className="mb-2">Losses due to service interruptions</li>
              <li className="mb-2">Disputes between users</li>
              <li className="mb-2">Third-party services or linked websites</li>
              <li className="mb-2">Data loss or security breaches</li>
            </ul>
            <p>
              In no case will our total liability exceed the amount you paid to
              us (for free services, this is $0).
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4" id="dispute">
              11. Dispute Resolution
            </h2>
            <p>
              All disputes related to these Terms will be interpreted according
              to South Korean law, with exclusive jurisdiction in the Seoul
              Central District Court. Parties should attempt to resolve disputes
              through mediation before litigation.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4" id="termination">
              12. Termination
            </h2>
            <p>
              You may terminate this agreement at any time by requesting account
              deletion in your account settings. We may terminate the agreement
              after prior notice if you violate these Terms.
            </p>
            <p className="mt-2">
              Upon termination, your content will be handled according to our
              Privacy Policy.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4" id="third-party">
              13. Third-Party Links and Services
            </h2>
            <p>
              The Platform may include links to third-party websites or
              services. These links are provided for informational purposes
              only, and we have no control over and accept no responsibility for
              third-party content, services, or websites.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4" id="contact">
              14. Contact Information
            </h2>
            <p>
              If you have any questions about these Terms, please contact us:
            </p>
            <address className="not-italic mt-4 mb-8 p-4 bg-gray-50 rounded-md">
              <strong>Women in Tech Network</strong>
              <br />
              123 Teheran-ro, Gangnam-gu, Seoul, South Korea
              <br />
              Email:{' '}
              <a
                href="mailto:golee.dev@gmail.com"
                className="text-blue-600 hover:underline"
              >
                golee.dev@gmail.com
              </a>
            </address>

            <p className="text-sm text-gray-500 mt-8">
              Last Updated: March 30, 2025
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
