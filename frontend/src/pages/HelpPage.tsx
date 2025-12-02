import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  HelpCircle,
  MessageCircle,
  Phone,
  Mail,
  Clock,
  Users,
  Calendar,
  CreditCard,
  Shield,
  ChevronDown,
  ChevronUp,
  Search,
  FileText,
  Star,
} from "lucide-react";

const HelpPage: React.FC = () => {
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);

  const faqs = [
    {
      question: "How do I find the right tutor for me?",
      answer:
        "Use our advanced search and filtering system to find tutors by subject, availability, rating, and price. You can also read reviews from other students to help make your decision.",
    },
    {
      question: "How do I book a tutoring session?",
      answer:
        "Once you find a tutor you like, click 'Book Now' to see their availability. Select a time slot that works for you, add any notes, and confirm your booking. You'll receive instant confirmation.",
    },
    {
      question: "What if I need to cancel or reschedule a session?",
      answer:
        "You can cancel or reschedule sessions up to 24 hours in advance through your dashboard. Cancellations within 24 hours may incur fees depending on the tutor's policy.",
    },
    {
      question: "How does payment work?",
      answer:
        "Payment is processed securely after each completed session. We support multiple payment methods including credit cards, debit cards, and digital wallets. Tutors are paid after the session is confirmed as completed.",
    },
    {
      question: "What subjects are available?",
      answer:
        "We offer tutoring in a wide range of subjects including Math, Science, English, History, Languages, Computer Science, and Test Preparation. Our tutors are experts in their respective fields.",
    },
    {
      question: "How are tutors verified?",
      answer:
        "All tutors undergo a comprehensive verification process including background checks, credential verification, and reference checks. We also monitor tutor performance through student reviews and ratings.",
    },
    {
      question: "Can I request a specific tutor?",
      answer:
        "Yes! You can search for specific tutors by name or browse by subject area. Once you find a tutor you like, you can book sessions directly with them.",
    },
    {
      question: "What if I'm not satisfied with my session?",
      answer:
        "Your satisfaction is our priority. If you're not happy with a session, please contact our support team within 24 hours. We'll work with you to find a solution, which may include a refund or session with a different tutor.",
    },
  ];

  const toggleFAQ = (index: number) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-50 to-secondary-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-secondary-900 mb-6">
              Help & Support
            </h1>
            <p className="text-xl text-secondary-600 mb-8 max-w-3xl mx-auto">
              Find answers to common questions and get the help you need to make
              the most of TutorLink.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/browse" className="btn-primary text-lg px-8 py-3">
                Find a Tutor
              </Link>
              <Link to="/register" className="btn-secondary text-lg px-8 py-3">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Search Section */}
      <section className="py-12 bg-white border-b border-secondary-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-secondary-900 mb-2">
              Search for Help
            </h2>
            <p className="text-secondary-600">
              Can't find what you're looking for? Try searching our help center.
            </p>
          </div>
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search for help topics..."
              className="w-full pl-12 pr-4 py-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-secondary-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-secondary-600">
              Find quick answers to common questions about TutorLink
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="border border-secondary-200 rounded-lg overflow-hidden"
              >
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-secondary-50 transition-colors"
                >
                  <span className="font-medium text-secondary-900">
                    {faq.question}
                  </span>
                  {openFAQ === index ? (
                    <ChevronUp className="h-5 w-5 text-secondary-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-secondary-400" />
                  )}
                </button>
                {openFAQ === index && (
                  <div className="px-6 pb-4 border-t border-secondary-200 bg-secondary-50">
                    <p className="text-secondary-600 pt-4">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Support Options Section */}
      <section className="py-20 bg-secondary-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-secondary-900 mb-4">
              Need More Help?
            </h2>
            <p className="text-xl text-secondary-600 max-w-3xl mx-auto">
              Our support team is here to help you succeed. Choose the option
              that works best for you.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="card text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-secondary-900 mb-2">
                Live Chat
              </h3>
              <p className="text-secondary-600 mb-4">
                Get instant help from our support team during business hours.
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-center space-x-2 text-sm text-secondary-600">
                  <Clock className="h-4 w-4" />
                  <span>Mon-Fri: 9AM - 6PM EST</span>
                </div>
                <button className="btn-primary w-full">Start Chat</button>
              </div>
            </div>

            <div className="card text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-secondary-900 mb-2">
                Email Support
              </h3>
              <p className="text-secondary-600 mb-4">
                Send us your questions and we'll respond within 24 hours.
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-center space-x-2 text-sm text-secondary-600">
                  <Clock className="h-4 w-4" />
                  <span>Response: Within 24 hours</span>
                </div>
                <button className="btn-primary w-full">Send Email</button>
              </div>
            </div>

            <div className="card text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Phone className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-secondary-900 mb-2">
                Phone Support
              </h3>
              <p className="text-secondary-600 mb-4">
                Speak directly with our support specialists for urgent issues.
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-center space-x-2 text-sm text-secondary-600">
                  <Clock className="h-4 w-4" />
                  <span>Mon-Fri: 9AM - 6PM EST</span>
                </div>
                <button className="btn-primary w-full">Call Now</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Getting Started Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-secondary-900 mb-4">
              Getting Started Guide
            </h2>
            <p className="text-xl text-secondary-600">
              New to TutorLink? Here's how to get started in 3 easy steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-lg font-bold">
                1
              </div>
              <h3 className="text-lg font-semibold text-secondary-900 mb-2">
                Create Your Account
              </h3>
              <p className="text-secondary-600">
                Sign up for free and tell us about your learning goals and
                preferences.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-lg font-bold">
                2
              </div>
              <h3 className="text-lg font-semibold text-secondary-900 mb-2">
                Find Your Tutor
              </h3>
              <p className="text-secondary-600">
                Browse our verified tutors, read reviews, and book a session
                that fits your schedule.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-lg font-bold">
                3
              </div>
              <h3 className="text-lg font-semibold text-secondary-900 mb-2">
                Start Learning
              </h3>
              <p className="text-secondary-600">
                Meet your tutor online and begin your personalized learning
                journey.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 bg-secondary-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-secondary-900 mb-4">
              Still Need Help?
            </h2>
            <p className="text-xl text-secondary-600">
              Contact us directly and we'll get back to you as soon as possible
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="card">
              <h3 className="text-lg font-semibold text-secondary-900 mb-4">
                Contact Information
              </h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Mail className="h-5 w-5 text-secondary-400" />
                  <span className="text-secondary-600">
                    support@tutorlink.com
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone className="h-5 w-5 text-secondary-400" />
                  <span className="text-secondary-600">1-800-TUTORLINK</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Clock className="h-5 w-5 text-secondary-400" />
                  <span className="text-secondary-600">
                    Mon-Fri: 9AM - 6PM EST
                  </span>
                </div>
              </div>
            </div>

            <div className="card">
              <h3 className="text-lg font-semibold text-secondary-900 mb-4">
                Business Hours
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-secondary-600">Monday - Friday</span>
                  <span className="text-secondary-900 font-medium">
                    9:00 AM - 6:00 PM EST
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary-600">Saturday</span>
                  <span className="text-secondary-900 font-medium">
                    10:00 AM - 4:00 PM EST
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary-600">Sunday</span>
                  <span className="text-secondary-900 font-medium">Closed</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HelpPage;
