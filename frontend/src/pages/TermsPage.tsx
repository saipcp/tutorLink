import React from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  FileText,
  Scale,
  Shield,
  CreditCard,
  Users,
  Calendar,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";

const TermsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-50 to-secondary-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-secondary-900 mb-6">
              Terms of Service
            </h1>
            <p className="text-xl text-secondary-600 mb-8 max-w-3xl mx-auto">
              Please read these terms carefully before using TutorLink. By using
              our services, you agree to be bound by these terms.
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
              Agreement to Terms
            </h2>
            <p className="text-secondary-600 mb-6">
              By accessing or using TutorLink ("we," "us," or "our"), you agree
              to be bound by these Terms of Service ("Terms"). If you disagree
              with any part of these terms, you may not access our services.
            </p>

            <h2 className="text-2xl font-bold text-secondary-900 mb-4">
              Description of Service
            </h2>
            <p className="text-secondary-600 mb-4">
              TutorLink is an online platform that connects students with
              qualified tutors for educational services. We provide:
            </p>
            <ul className="list-disc list-inside text-secondary-600 mb-6 space-y-1">
              <li>Tutor discovery and booking services</li>
              <li>Secure payment processing</li>
              <li>Communication tools between students and tutors</li>
              <li>Progress tracking and analytics</li>
              <li>Review and rating system</li>
            </ul>

            <h2 className="text-2xl font-bold text-secondary-900 mb-4">
              User Accounts and Registration
            </h2>

            <h3 className="text-xl font-semibold text-secondary-900 mb-3">
              Account Creation
            </h3>
            <p className="text-secondary-600 mb-4">
              To use our services, you must create an account and provide
              accurate, complete, and current information. You are responsible
              for maintaining the confidentiality of your account credentials.
            </p>

            <h3 className="text-xl font-semibold text-secondary-900 mb-3">
              User Roles
            </h3>
            <p className="text-secondary-600 mb-4">
              Our platform supports three types of users:
            </p>
            <ul className="list-disc list-inside text-secondary-600 mb-6 space-y-1">
              <li>
                <strong>Students:</strong> Users seeking tutoring services
              </li>
              <li>
                <strong>Tutors:</strong> Verified educators providing services
              </li>
              <li>
                <strong>Administrators:</strong> Platform management personnel
              </li>
            </ul>

            <h2 className="text-2xl font-bold text-secondary-900 mb-4">
              Tutor Requirements and Standards
            </h2>
            <p className="text-secondary-600 mb-4">
              Tutors on our platform must:
            </p>
            <ul className="list-disc list-inside text-secondary-600 mb-6 space-y-1">
              <li>Be at least 18 years old</li>
              <li>Possess relevant qualifications or experience</li>
              <li>Pass background checks and verification</li>
              <li>Maintain professional conduct during sessions</li>
              <li>Comply with our code of conduct</li>
              <li>Provide accurate availability information</li>
            </ul>

            <h2 className="text-2xl font-bold text-secondary-900 mb-4">
              Booking and Payment Terms
            </h2>

            <h3 className="text-xl font-semibold text-secondary-900 mb-3">
              Session Booking
            </h3>
            <p className="text-secondary-600 mb-4">
              When you book a tutoring session:
            </p>
            <ul className="list-disc list-inside text-secondary-600 mb-6 space-y-1">
              <li>You agree to pay the tutor's specified rate</li>
              <li>Payment is held until the session is completed</li>
              <li>
                You must attend the scheduled session or provide 24-hour notice
                for cancellation
              </li>
              <li>Late cancellations may incur fees</li>
            </ul>

            <h3 className="text-xl font-semibold text-secondary-900 mb-3">
              Payment Processing
            </h3>
            <p className="text-secondary-600 mb-4">
              We use secure third-party payment processors. By using our
              services, you agree to:
            </p>
            <ul className="list-disc list-inside text-secondary-600 mb-6 space-y-1">
              <li>Pay all fees and charges associated with your account</li>
              <li>Provide valid payment information</li>
              <li>Accept responsibility for all charges incurred</li>
            </ul>

            <h2 className="text-2xl font-bold text-secondary-900 mb-4">
              Cancellation and Refund Policy
            </h2>
            <p className="text-secondary-600 mb-4">
              <strong>Student Cancellations:</strong> You may cancel sessions up
              to 24 hours in advance for a full refund. Cancellations within 24
              hours may be subject to cancellation fees.
            </p>
            <p className="text-secondary-600 mb-4">
              <strong>Tutor Cancellations:</strong> If a tutor cancels a
              session, students will receive a full refund regardless of timing.
            </p>
            <p className="text-secondary-600 mb-4">
              <strong>Technical Issues:</strong> Refunds will be provided for
              sessions affected by platform technical issues.
            </p>

            <h2 className="text-2xl font-bold text-secondary-900 mb-4">
              User Conduct and Responsibilities
            </h2>

            <h3 className="text-xl font-semibold text-secondary-900 mb-3">
              Prohibited Activities
            </h3>
            <p className="text-secondary-600 mb-4">You agree not to:</p>
            <ul className="list-disc list-inside text-secondary-600 mb-6 space-y-1">
              <li>Use the platform for illegal purposes</li>
              <li>Harass, abuse, or harm other users</li>
              <li>Share inappropriate or offensive content</li>
              <li>Violate intellectual property rights</li>
              <li>Attempt to circumvent platform security</li>
              <li>Provide false or misleading information</li>
            </ul>

            <h3 className="text-xl font-semibold text-secondary-900 mb-3">
              Content Guidelines
            </h3>
            <p className="text-secondary-600 mb-4">
              All content shared on our platform must be:
            </p>
            <ul className="list-disc list-inside text-secondary-600 mb-6 space-y-1">
              <li>Appropriate for educational purposes</li>
              <li>Respectful and professional</li>
              <li>Free from hate speech or discrimination</li>
              <li>Compliant with applicable laws</li>
            </ul>

            <h2 className="text-2xl font-bold text-secondary-900 mb-4">
              Intellectual Property
            </h2>
            <p className="text-secondary-600 mb-4">
              The TutorLink platform, including all software, content, and
              trademarks, is owned by TutorLink or its licensors. You may not
              copy, modify, or distribute our intellectual property without
              permission.
            </p>

            <h2 className="text-2xl font-bold text-secondary-900 mb-4">
              Disclaimers and Limitations
            </h2>

            <h3 className="text-xl font-semibold text-secondary-900 mb-3">
              Service Disclaimers
            </h3>
            <p className="text-secondary-600 mb-4">
              Our services are provided "as is" without warranties of any kind.
              We do not guarantee:
            </p>
            <ul className="list-disc list-inside text-secondary-600 mb-6 space-y-1">
              <li>Specific learning outcomes or results</li>
              <li>Availability of particular tutors or time slots</li>
              <li>
                Quality of tutoring services beyond our verification process
              </li>
              <li>Uninterrupted access to our platform</li>
            </ul>

            <h3 className="text-xl font-semibold text-secondary-900 mb-3">
              Liability Limitations
            </h3>
            <p className="text-secondary-600 mb-4">
              TutorLink's liability for any claims related to our services is
              limited to the amount you paid for the specific service in
              question. We are not liable for indirect, incidental, or
              consequential damages.
            </p>

            <h2 className="text-2xl font-bold text-secondary-900 mb-4">
              Account Termination
            </h2>
            <p className="text-secondary-600 mb-4">
              We reserve the right to terminate or suspend your account at any
              time for violations of these terms, illegal activity, or other
              misconduct. Upon termination:
            </p>
            <ul className="list-disc list-inside text-secondary-600 mb-6 space-y-1">
              <li>Your access to the platform will be revoked</li>
              <li>Outstanding payments may still be processed</li>
              <li>You may request data export before account deletion</li>
            </ul>

            <h2 className="text-2xl font-bold text-secondary-900 mb-4">
              Dispute Resolution
            </h2>
            <p className="text-secondary-600 mb-4">
              Any disputes arising from these terms or your use of our services
              will be resolved through binding arbitration in accordance with
              the rules of the American Arbitration Association.
            </p>

            <h2 className="text-2xl font-bold text-secondary-900 mb-4">
              Governing Law
            </h2>
            <p className="text-secondary-600 mb-4">
              These terms are governed by the laws of the State of Delaware,
              United States, without regard to conflict of law principles.
            </p>

            <h2 className="text-2xl font-bold text-secondary-900 mb-4">
              Changes to Terms
            </h2>
            <p className="text-secondary-600 mb-4">
              We may update these terms from time to time. We will notify users
              of material changes via email or platform notification. Your
              continued use of our services constitutes acceptance of the
              updated terms.
            </p>

            <h2 className="text-2xl font-bold text-secondary-900 mb-4">
              Contact Information
            </h2>
            <p className="text-secondary-600 mb-4">
              If you have questions about these Terms of Service, please contact
              us:
            </p>
            <div className="bg-secondary-50 p-4 rounded-lg">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <BookOpen className="h-4 w-4 text-secondary-400" />
                  <span className="text-secondary-600">
                    TutorLink Legal Team
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-secondary-600">
                    legal@tutorlink.com
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-secondary-600">
                    123 Education Street, Learning City, LC 12345
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-8">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-blue-900 mb-1">
                    Important Notice
                  </h4>
                  <p className="text-blue-800 text-sm">
                    These terms constitute a legally binding agreement. By using
                    TutorLink, you acknowledge that you have read, understood,
                    and agree to be bound by these terms. If you do not agree
                    with these terms, please do not use our services.
                  </p>
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
            Join TutorLink and connect with expert tutors today.
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

export default TermsPage;
