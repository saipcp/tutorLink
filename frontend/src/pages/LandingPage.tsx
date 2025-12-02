import React from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  Users,
  Calendar,
  Star,
  ArrowRight,
  CheckCircle,
} from "lucide-react";

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-50 to-secondary-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-secondary-900 mb-6">
              Find Your Perfect
              <span className="text-primary-600"> Tutor</span>
            </h1>
            <p className="text-xl text-secondary-600 mb-8 max-w-3xl mx-auto">
              Connect with expert tutors, plan your study sessions, and achieve
              your academic goals with our AI-powered tutoring platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register" className="btn-primary text-lg px-8 py-3">
                Get Started
              </Link>
              <Link to="/login" className="btn-secondary text-lg px-8 py-3">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-secondary-900 mb-4">
              Why Choose TutorLink?
            </h2>
            <p className="text-xl text-secondary-600 max-w-2xl mx-auto">
              Everything you need to succeed in your academic journey
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="card text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-secondary-900 mb-2">
                Expert Tutors
              </h3>
              <p className="text-secondary-600">
                Connect with qualified tutors in your subject area with verified
                credentials and reviews.
              </p>
            </div>

            <div className="card text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-secondary-900 mb-2">
                Easy Scheduling
              </h3>
              <p className="text-secondary-600">
                Book sessions that fit your schedule with real-time availability
                and instant confirmation.
              </p>
            </div>

            <div className="card text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-secondary-900 mb-2">
                Study Planner
              </h3>
              <p className="text-secondary-600">
                AI-powered study plans and task management to keep you on track
                with your goals.
              </p>
            </div>

            <div className="card text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-secondary-900 mb-2">
                Reviews & Ratings
              </h3>
              <p className="text-secondary-600">
                Read reviews and ratings from other students to find the perfect
                tutor match.
              </p>
            </div>

            <div className="card text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-secondary-900 mb-2">
                Progress Tracking
              </h3>
              <p className="text-secondary-600">
                Monitor your learning progress and celebrate achievements along
                the way.
              </p>
            </div>

            <div className="card text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ArrowRight className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-secondary-900 mb-2">
                Quick & Easy
              </h3>
              <p className="text-secondary-600">
                Simple booking process, secure payments, and seamless
                communication with tutors.
              </p>
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
            Join thousands of students who have achieved their academic goals
            with TutorLink.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="bg-white text-primary-600 hover:bg-secondary-50 font-medium text-lg px-8 py-3 rounded-lg transition-colors duration-200"
            >
              Start Learning Today
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

      {/* Footer */}
      <footer className="bg-secondary-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <BookOpen className="h-8 w-8 text-primary-400" />
              <span className="text-xl font-bold">TutorLink</span>
            </div>
            <div className="flex space-x-6 text-sm text-secondary-400">
              <Link to="/about" className="hover:text-white transition-colors">
                About
              </Link>
              <Link to="/help" className="hover:text-white transition-colors">
                Help
              </Link>
              <Link
                to="/privacy"
                className="hover:text-white transition-colors"
              >
                Privacy
              </Link>
              <Link to="/terms" className="hover:text-white transition-colors">
                Terms
              </Link>
            </div>
          </div>
          <div className="border-t border-secondary-800 mt-8 pt-8 text-center text-sm text-secondary-400">
            © 2025 TutorLink. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
