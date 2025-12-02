import React from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  Users,
  Award,
  Target,
  Heart,
  Shield,
  Zap,
  Globe,
  CheckCircle,
  Star,
  Calendar,
} from "lucide-react";

const AboutPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-50 to-secondary-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-secondary-900 mb-6">
              About TutorLink
            </h1>
            <p className="text-xl text-secondary-600 mb-8 max-w-3xl mx-auto">
              We're revolutionizing education by connecting students with expert
              tutors through our AI-powered platform, making quality education
              accessible to everyone.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register" className="btn-primary text-lg px-8 py-3">
                Get Started
              </Link>
              <Link to="/browse" className="btn-secondary text-lg px-8 py-3">
                Find Tutors
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-secondary-900 mb-4">
              Our Mission
            </h2>
            <p className="text-xl text-secondary-600 max-w-3xl mx-auto">
              To democratize access to quality education by leveraging
              technology and human expertise to create personalized learning
              experiences that help every student reach their full potential.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="card text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-secondary-900 mb-2">
                Accessibility
              </h3>
              <p className="text-secondary-600">
                Making quality tutoring available to students regardless of
                their location, background, or financial situation.
              </p>
            </div>

            <div className="card text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-secondary-900 mb-2">
                Quality
              </h3>
              <p className="text-secondary-600">
                Ensuring every tutor meets our high standards through rigorous
                verification and continuous quality assessment.
              </p>
            </div>

            <div className="card text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-secondary-900 mb-2">
                Personalization
              </h3>
              <p className="text-secondary-600">
                Using AI and data insights to match students with tutors who
                best fit their learning style and goals.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-secondary-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-secondary-900 mb-4">
              How TutorLink Works
            </h2>
            <p className="text-xl text-secondary-600 max-w-3xl mx-auto">
              Our platform makes finding the right tutor simple and effective
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-lg font-bold">
                1
              </div>
              <h3 className="text-lg font-semibold text-secondary-900 mb-2">
                Find Your Tutor
              </h3>
              <p className="text-secondary-600">
                Browse our verified tutors, read reviews, and compare profiles
                to find the perfect match for your needs.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-lg font-bold">
                2
              </div>
              <h3 className="text-lg font-semibold text-secondary-900 mb-2">
                Book a Session
              </h3>
              <p className="text-secondary-600">
                Schedule sessions that fit your availability with real-time
                booking and instant confirmation.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-lg font-bold">
                3
              </div>
              <h3 className="text-lg font-semibold text-secondary-900 mb-2">
                Learn & Improve
              </h3>
              <p className="text-secondary-600">
                Get personalized instruction, track your progress, and achieve
                your academic goals with expert guidance.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-lg font-bold">
                4
              </div>
              <h3 className="text-lg font-semibold text-secondary-900 mb-2">
                Leave a Review
              </h3>
              <p className="text-secondary-600">
                Help other students by sharing your experience and rating your
                tutor to maintain our quality standards.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-secondary-900 mb-6">
                Why Choose TutorLink?
              </h2>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-secondary-900">
                      Verified Tutors
                    </h4>
                    <p className="text-secondary-600">
                      All tutors undergo background checks and credential
                      verification
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-secondary-900">
                      AI-Powered Matching
                    </h4>
                    <p className="text-secondary-600">
                      Smart algorithms help find the best tutor for your
                      learning style
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-secondary-900">
                      Flexible Scheduling
                    </h4>
                    <p className="text-secondary-600">
                      Book sessions that fit your schedule with real-time
                      availability
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-secondary-900">
                      Secure Payments
                    </h4>
                    <p className="text-secondary-600">
                      Protected transactions with multiple payment options
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-secondary-900">
                      Progress Tracking
                    </h4>
                    <p className="text-secondary-600">
                      Monitor your learning journey with detailed analytics
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="bg-gradient-to-br from-primary-100 to-secondary-100 rounded-2xl p-8">
                <div className="grid grid-cols-2 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary-600 mb-2">
                      500+
                    </div>
                    <div className="text-sm text-secondary-600">
                      Verified Tutors
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary-600 mb-2">
                      10K+
                    </div>
                    <div className="text-sm text-secondary-600">
                      Sessions Completed
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary-600 mb-2">
                      4.9★
                    </div>
                    <div className="text-sm text-secondary-600">
                      Average Rating
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary-600 mb-2">
                      95%
                    </div>
                    <div className="text-sm text-secondary-600">
                      Success Rate
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 bg-secondary-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-secondary-900 mb-4">
              Our Team
            </h2>
            <p className="text-xl text-secondary-600 max-w-3xl mx-auto">
              Meet the passionate team behind TutorLink, dedicated to
              transforming education
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="card text-center">
              <div className="w-20 h-20 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-xl">JD</span>
              </div>
              <h3 className="text-lg font-semibold text-secondary-900 mb-1">
                Dr. Jane Doe
              </h3>
              <p className="text-primary-600 mb-2">CEO & Founder</p>
              <p className="text-sm text-secondary-600">
                Former educator with 15+ years experience in educational
                technology
              </p>
            </div>

            <div className="card text-center">
              <div className="w-20 h-20 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-xl">MS</span>
              </div>
              <h3 className="text-lg font-semibold text-secondary-900 mb-1">
                Michael Smith
              </h3>
              <p className="text-primary-600 mb-2">CTO</p>
              <p className="text-sm text-secondary-600">
                AI and machine learning expert focused on personalized learning
              </p>
            </div>

            <div className="card text-center">
              <div className="w-20 h-20 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-xl">SJ</span>
              </div>
              <h3 className="text-lg font-semibold text-secondary-900 mb-1">
                Sarah Johnson
              </h3>
              <p className="text-primary-600 mb-2">Head of Education</p>
              <p className="text-sm text-secondary-600">
                Curriculum specialist ensuring quality tutoring standards
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Start Your Learning Journey?
          </h2>
          <p className="text-xl text-primary-100 mb-8">
            Join thousands of students who have achieved their academic goals
            with TutorLink.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="bg-white text-primary-600 hover:bg-secondary-50 font-medium text-lg px-8 py-3 rounded-lg transition-colors duration-200"
            >
              Get Started Today
            </Link>
            <Link
              to="/browse"
              className="border-2 border-white text-white hover:bg-white hover:text-primary-600 font-medium text-lg px-8 py-3 rounded-lg transition-colors duration-200"
            >
              Browse Tutors
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
