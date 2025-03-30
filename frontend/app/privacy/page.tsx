'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';

export default function PrivacyPolicyPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Link
        href="/"
        className="flex items-center text-blue-600 hover:underline mb-6"
      >
        <ArrowLeft size={16} className="mr-1" />
        Return to Home
      </Link>

      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>

      <Card>
        <CardContent className="p-6 md:p-8">
          <div className="prose max-w-none">
            <p className="lead text-lg text-gray-600 mb-8">
              The Women in Tech Networking Platform (&quot;Platform&quot;)
              values and protects your privacy. This Privacy Policy explains
              what information we collect, how we use it, and your rights
              regarding your data.
            </p>

            <h2
              className="text-2xl font-bold mt-8 mb-4"
              id="information-collected"
            >
              1. Information We Collect
            </h2>
            <p>We may collect the following personal information:</p>
            <ul className="list-disc pl-6 mb-4">
              <li className="mb-2">
                <strong>Account Information:</strong> Name, email address,
                password
              </li>
              <li className="mb-2">
                <strong>Professional Information:</strong> Expertise,
                profession, seniority level, country
              </li>
              <li className="mb-2">
                <strong>Profile Content:</strong> Bio, profile picture, tags
              </li>
              <li className="mb-2">
                <strong>Communication Data:</strong> Messages, event
                participation
              </li>
              <li className="mb-2">
                <strong>Usage Data:</strong> Login times, features used
              </li>
              <li className="mb-2">
                <strong>Device Information:</strong> IP address, browser type
              </li>
            </ul>

            <h2 className="text-2xl font-bold mt-8 mb-4" id="information-use">
              2. How We Use Your Information
            </h2>
            <p>We use the collected information for the following purposes:</p>
            <ul className="list-disc pl-6 mb-4">
              <li className="mb-2">
                Providing and personalizing platform services
              </li>
              <li className="mb-2">Matching mentors with mentees</li>
              <li className="mb-2">
                Facilitating event discovery and participation
              </li>
              <li className="mb-2">Enabling communication between users</li>
              <li className="mb-2">Improving the platform and fixing bugs</li>
              <li className="mb-2">Security and fraud prevention</li>
            </ul>

            <h2 className="text-2xl font-bold mt-8 mb-4" id="legal-basis">
              3. Legal Basis for Processing
            </h2>
            <p>
              We process your personal information based on the following legal
              grounds:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li className="mb-2">
                <strong>Consent:</strong> When explicitly provided
              </li>
              <li className="mb-2">
                <strong>Legitimate Interests:</strong> Platform functionality,
                security, etc.
              </li>
              <li className="mb-2">
                <strong>Contractual Necessity:</strong> To provide the service
              </li>
            </ul>

            <h2
              className="text-2xl font-bold mt-8 mb-4"
              id="information-sharing"
            >
              4. Information Sharing
            </h2>
            <p>We may share your information in the following cases:</p>
            <ul className="list-disc pl-6 mb-4">
              <li className="mb-2">
                <strong>With Other Platform Users:</strong> According to your
                profile visibility settings
              </li>
              <li className="mb-2">
                <strong>Service Providers:</strong> Hosting, database
                management, etc.
              </li>
              <li className="mb-2">
                <strong>Legal Requirements:</strong> Court orders, legal
                proceedings, etc.
              </li>
            </ul>
            <p>
              We do not disclose personal data to third parties for marketing
              purposes.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4" id="user-rights">
              5. User Rights
            </h2>
            <p>You have the following rights:</p>
            <ul className="list-disc pl-6 mb-4">
              <li className="mb-2">Access to your personal data</li>
              <li className="mb-2">Correction of inaccurate data</li>
              <li className="mb-2">
                Right to deletion (right to be forgotten)
              </li>
              <li className="mb-2">Data portability</li>
              <li className="mb-2">Withdrawal of consent</li>
            </ul>
            <p>
              To exercise these rights, please contact us at{' '}
              <a
                href="mailto:privacy@witnetwork.com"
                className="text-blue-600 hover:underline"
              >
                privacy@witnetwork.com
              </a>
              .
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4" id="data-security">
              6. Data Security
            </h2>
            <p>
              We implement the following security measures to protect your
              personal information:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li className="mb-2">Encryption of all data</li>
              <li className="mb-2">Server security practices</li>
              <li className="mb-2">Regular security assessments</li>
              <li className="mb-2">Limited employee access to data</li>
            </ul>

            <h2 className="text-2xl font-bold mt-8 mb-4" id="data-retention">
              7. Data Retention
            </h2>
            <p>We retain data for the following periods:</p>
            <ul className="list-disc pl-6 mb-4">
              <li className="mb-2">
                <strong>Account Information:</strong> As long as your account is
                active
              </li>
              <li className="mb-2">
                <strong>Messages and Communications:</strong> Until account
                deletion
              </li>
              <li className="mb-2">
                <strong>Usage Data:</strong> Up to 2 years
              </li>
            </ul>
            <p>
              When an account is deleted, related data is deleted within 90
              days.
            </p>

            <h2
              className="text-2xl font-bold mt-8 mb-4"
              id="international-transfers"
            >
              8. International Data Transfers
            </h2>
            <p>
              While our servers are primarily located in South Korea, data may
              be transferred to other countries for international service
              provision. Such transfers are made with appropriate safeguards.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4" id="children-privacy">
              9. Children&apos;s Privacy
            </h2>
            <p>
              Our platform is intended for users 18 years and older. If you are
              under 18, you may not use the platform. If we discover data from
              users under 18 on the platform, it will be promptly deleted.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4" id="policy-changes">
              10. Changes to Privacy Policy
            </h2>
            <p>
              We may periodically update this Privacy Policy. If we make
              significant changes, we will notify you through the platform or by
              sending a direct notification. The latest version is always
              available on this page.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4" id="contact">
              11. Contact Information
            </h2>
            <p>
              If you have any questions about this Privacy Policy, please
              contact us:
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
              Last Updated: Mar 30, 2025
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
