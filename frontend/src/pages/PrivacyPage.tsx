import React from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  Shield,
  Eye,
  Lock,
  Users,
  Database,
  Mail,
  Cookie,
  FileText,
  Calendar,
} from "lucide-react";

const PrivacyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-50 to-secondary-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-secondary-900 mb-6">
              Privacy Policy
            </h1>
            <p className="text-xl text-secondary-600 mb-8 max-w-3xl mx-auto">
              Your privacy is important to us. Learn how we collect, use, and
              protect your personal information.
            </p>
            <div className="text-sm text-secondary-500">
              Last updated: January 2025
            </div>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="prose prose-lg max-w-none">
            <h2 className="text-2xl font-bold text-secondary-900 mb-4">
              Introduction
            </h2>
            <p className="text-secondary-600 mb-6">
              TutorLink ("we," "our," or "us") is committed to protecting your
              privacy. This Privacy Policy explains how we collect, use,
              disclose, and safeguard your information when you use our tutoring
              platform and services.
            </p>

            <h2 className="text-2xl font-bold text-secondary-900 mb-4">
              Information We Collect
            </h2>

            <h3 className="text-xl font-semibold text-secondary-900 mb-3">
              Personal Information
            </h3>
            <p className="text-secondary-600 mb-4">
              When you register for an account, we collect:
            </p>
            <ul className="list-disc list-inside text-secondary-600 mb-6 space-y-1">
              <li>Name (first and last)</li>
              <li>Email address</li>
              <li>Phone number (optional)</li>
              <li>Profile information based on your role (student/tutor)</li>
              <li>
                Payment information (processed securely by third-party
                providers)
              </li>
            </ul>

            <h3 className="text-xl font-semibold text-secondary-900 mb-3">
              Usage Information
            </h3>
            <p className="text-secondary-600 mb-4">
              We automatically collect certain information about your use of our
              services:
            </p>
            <ul className="list-disc list-inside text-secondary-600 mb-6 space-y-1">
              <li>Session data and booking history</li>
              <li>Communication logs between tutors and students</li>
              <li>Performance metrics and progress tracking</li>
              <li>Device and browser information</li>
              <li>IP address and location data</li>
            </ul>

            <h2 className="text-2xl font-bold text-secondary-900 mb-4">
              How We Use Your Information
            </h2>
            <p className="text-secondary-600 mb-4">
              We use the information we collect to:
            </p>
            <ul className="list-disc list-inside text-secondary-600 mb-6 space-y-1">
              <li>Provide and maintain our tutoring services</li>
              <li>Process payments and manage billing</li>
              <li>Match students with appropriate tutors</li>
              <li>Improve our platform and user experience</li>
              <li>Send important notifications and updates</li>
              <li>Prevent fraud and ensure platform security</li>
              <li>Comply with legal obligations</li>
            </ul>

            <h2 className="text-2xl font-bold text-secondary-900 mb-4">
              Information Sharing
            </h2>
            <p className="text-secondary-600 mb-4">
              We do not sell your personal information. We may share your
              information in the following circumstances:
            </p>
            <ul className="list-disc list-inside text-secondary-600 mb-6 space-y-1">
              <li>
                With tutors you book sessions with (limited to necessary
                information)
              </li>
              <li>With service providers who help us operate our platform</li>
              <li>When required by law or to protect our rights</li>
              <li>In connection with a business transfer or acquisition</li>
              <li>With your explicit consent</li>
            </ul>

            <h2 className="text-2xl font-bold text-secondary-900 mb-4">
              Data Security
            </h2>
            <p className="text-secondary-600 mb-4">
              We implement appropriate technical and organizational measures to
              protect your personal information:
            </p>
            <ul className="list-disc list-inside text-secondary-600 mb-6 space-y-1">
              <li>Encryption of data in transit and at rest</li>
              <li>Secure payment processing through certified providers</li>
              <li>Regular security audits and updates</li>
              <li>Access controls and employee training</li>
              <li>Incident response procedures</li>
            </ul>

            <h2 className="text-2xl font-bold text-secondary-900 mb-4">
              Your Rights and Choices
            </h2>
            <p className="text-secondary-600 mb-4">
              Depending on your location, you may have the following rights:
            </p>
            <ul className="list-disc list-inside text-secondary-600 mb-6 space-y-1">
              <li>Access your personal information</li>
              <li>Correct inaccurate information</li>
              <li>Delete your account and data</li>
              <li>Export your data</li>
              <li>Object to or restrict certain processing</li>
              <li>Withdraw consent at any time</li>
            </ul>

            <h2 className="text-2xl font-bold text-secondary-900 mb-4">
              Cookies and Tracking
            </h2>
            <p className="text-secondary-600 mb-4">
              We use cookies and similar technologies to enhance your
              experience:
            </p>
            <ul className="list-disc list-inside text-secondary-600 mb-6 space-y-1">
              <li>Essential cookies for platform functionality</li>
              <li>Analytics cookies to improve our services</li>
              <li>Preference cookies to remember your settings</li>
              <li>Marketing cookies (with your consent)</li>
            </ul>

            <h2 className="text-2xl font-bold text-secondary-900 mb-4">
              Children's Privacy
            </h2>
            <p className="text-secondary-600 mb-4">
              TutorLink is designed for users aged 13 and older. We do not
              knowingly collect personal information from children under 13. If
              we become aware that we have collected such information, we will
              take steps to delete it immediately.
            </p>

            <h2 className="text-2xl font-bold text-secondary-900 mb-4">
              Third-Party Services
            </h2>
            <p className="text-secondary-600 mb-4">
              Our platform integrates with third-party services for:
            </p>
            <ul className="list-disc list-inside text-secondary-600 mb-6 space-y-1">
              <li>Payment processing (Stripe, PayPal)</li>
              <li>Video conferencing (Zoom, Google Meet)</li>
              <li>Communication tools (email, messaging)</li>
              <li>Analytics and performance monitoring</li>
            </ul>

            <h2 className="text-2xl font-bold text-secondary-900 mb-4">
              Data Retention
            </h2>
            <p className="text-secondary-600 mb-4">
              We retain your personal information for as long as necessary to
              provide our services and comply with legal obligations. You can
              request deletion of your data at any time.
            </p>

            <h2 className="text-2xl font-bold text-secondary-900 mb-4">
              International Data Transfers
            </h2>
            <p className="text-secondary-600 mb-4">
              Your information may be transferred to and processed in countries
              other than your own. We ensure appropriate safeguards are in place
              to protect your data during such transfers.
            </p>

            <h2 className="text-2xl font-bold text-secondary-900 mb-4">
              Changes to This Policy
            </h2>
            <p className="text-secondary-600 mb-4">
              We may update this Privacy Policy from time to time. We will
              notify you of any material changes by email or through our
              platform. Your continued use of our services constitutes
              acceptance of the updated policy.
            </p>

            <h2 className="text-2xl font-bold text-secondary-900 mb-4">
              Contact Us
            </h2>
            <p className="text-secondary-600 mb-4">
              If you have any questions about this Privacy Policy or our data
              practices, please contact us:
            </p>
            <div className="bg-secondary-50 p-4 rounded-lg">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-secondary-400" />
                  <span className="text-secondary-600">
                    privacy@tutorlink.com
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <BookOpen className="h-4 w-4 text-secondary-400" />
                  <span className="text-secondary-600">
                    TutorLink Privacy Team
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-secondary-600">
                    123 Education Street, Learning City, LC 12345
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Start Learning?
          </h2>
          <p className="text-xl text-primary-100 mb-8">
            Join TutorLink today and experience personalized learning with
            expert tutors.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="bg-white text-primary-600 hover:bg-secondary-50 font-medium text-lg px-8 py-3 rounded-lg transition-colors duration-200"
            >
              Get Started
            </Link>
            <Link
              to="/help"
              className="border-2 border-white text-white hover:bg-white hover:text-primary-600 font-medium text-lg px-8 py-3 rounded-lg transition-colors duration-200"
            >
              Need Help?
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PrivacyPage;
